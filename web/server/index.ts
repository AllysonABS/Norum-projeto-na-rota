import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import cluster from 'cluster';
import os from 'os';
import nodemailer from 'nodemailer';

// === CLUSTER MODE ===
const NUM_WORKERS = parseInt(process.env.WORKERS || '') || Math.min(os.cpus().length, 4);

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  console.log(`[CLUSTER] Primary ${process.pid} starting ${NUM_WORKERS} workers`);
  for (let i = 0; i < NUM_WORKERS; i++) cluster.fork();
  cluster.on('exit', (worker) => {
    console.log(`[CLUSTER] Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  startServer();
}

function startServer() {

// R2 (Cloudflare) config
if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  console.warn('R2 env vars não configuradas. Upload de fotos desabilitado.');
}
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});
const R2_BUCKET = process.env.R2_BUCKET || '';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 10 * 1024 * 1024},
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Envie apenas imagens (JPEG, PNG, WebP).'));
    }
  },
});

// Inicializa Firebase Admin (via variável de ambiente)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  console.warn('FIREBASE_SERVICE_ACCOUNT não definida, push notifications desabilitadas.');
}

// === RATE LIMITING (in-memory, simples) ===
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT || '200'); // req/min por IP

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return next();
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Muitas requisições. Tente novamente em breve.' });
  }
  next();
}

// Limpa map a cada 5min pra não vazar memória
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 300000);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET não definido. Defina no .env');
  process.exit(1);
}
const JWT_EXPIRES_IN = '7d';

type TokenPayload = { id: string; tipo: 'empresa' | 'despachante' | 'cliente' };

function gerarToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN });
}

// Middleware de autenticação
function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET!) as TokenPayload;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// === SANITIZAÇÃO DE INPUT ===
function sanitize(value: any): any {
  if (typeof value !== 'string') return value;
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function sanitizeObj(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    sanitized[key] = sanitize(val);
  }
  return sanitized;
}

function sanitizeBody(req: express.Request, _res: express.Response, next: express.NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObj(req.body);
  }
  next();
}

// === VALIDAÇÕES ===
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(digits[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(digits[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(digits[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(digits[10]);
}

function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const pesos1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const pesos2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  let soma = 0;
  for (let i = 0; i < 12; i++) soma += parseInt(digits[i]) * pesos1[i];
  let resto = soma % 11;
  if (parseInt(digits[12]) !== (resto < 2 ? 0 : 11 - resto)) return false;
  soma = 0;
  for (let i = 0; i < 13; i++) soma += parseInt(digits[i]) * pesos2[i];
  resto = soma % 11;
  return parseInt(digits[13]) === (resto < 2 ? 0 : 11 - resto);
}

function isStrongPassword(senha: string): {valid: boolean; message?: string} {
  if (senha.length < 8) return {valid: false, message: 'A senha deve ter no mínimo 8 caracteres.'};
  if (!/[A-Z]/.test(senha)) return {valid: false, message: 'A senha deve conter ao menos uma letra maiúscula.'};
  if (!/[0-9]/.test(senha)) return {valid: false, message: 'A senha deve conter ao menos um número.'};
  return {valid: true};
}

// === RATE LIMIT POR DOCUMENTO (anti brute-force login) ===
const loginAttemptMap = new Map<string, { count: number; blockedUntil: number }>();
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_DURATION = 300000; // 5 minutos

function loginRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const doc = req.body?.doc || req.body?.cnpj || req.body?.cpf || '';
  if (!doc) return next();
  const now = Date.now();
  const entry = loginAttemptMap.get(doc);
  if (entry && now < entry.blockedUntil) {
    const minutos = Math.ceil((entry.blockedUntil - now) / 60000);
    return res.status(429).json({error: `Conta temporariamente bloqueada. Tente novamente em ${minutos} min.`});
  }
  if (entry && now >= entry.blockedUntil) {
    loginAttemptMap.delete(doc);
  }
  next();
}

function registrarLoginFalho(doc: string) {
  const entry = loginAttemptMap.get(doc) || { count: 0, blockedUntil: 0 };
  entry.count++;
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + LOGIN_BLOCK_DURATION;
  }
  loginAttemptMap.set(doc, entry);
}

function limparLoginAttempt(doc: string) {
  loginAttemptMap.delete(doc);
}

// Limpa entries velhas a cada 10min
setInterval(() => {
  const now = Date.now();
  for (const [doc, entry] of loginAttemptMap) {
    if (now >= entry.blockedUntil && entry.blockedUntil > 0) loginAttemptMap.delete(doc);
  }
}, 600000);

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'https://narota.norum.app').split(',');

const app = express();
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sem origin (mobile apps, curl em dev)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeBody);
app.use(rateLimiter);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true',
  max: parseInt(process.env.DB_POOL_MAX || '30'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Cadastro de empresa
app.post('/api/cadastro', async (req, res) => {
  try {
    const { nome_empresa, cnpj, nome_responsavel, email, telefone, senha, endereco, cidade, estado, cep } = req.body;

    if (!nome_empresa || !cnpj || !nome_responsavel || !email || !telefone || !senha) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos.' });
    }
    if (!isValidCnpj(cnpj)) {
      return res.status(400).json({ error: 'CNPJ inválido.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }
    const senhaCheck = isStrongPassword(senha);
    if (!senhaCheck.valid) {
      return res.status(400).json({ error: senhaCheck.message });
    }

    // Verificar duplicidade
    const existe = await pool.query('SELECT id FROM empresas WHERE email = $1 OR cnpj = $2', [email, cnpj]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'E-mail ou CNPJ já cadastrado.' });
    }

    // Hash da senha
    const senha_hash = await bcrypt.hash(senha, 10);

    // Calcular vencimento (30 dias)
    const data_vencimento = new Date();
    data_vencimento.setDate(data_vencimento.getDate() + 30);

    // Inserir empresa
    const result = await pool.query(
      `INSERT INTO empresas (nome_empresa, cnpj, nome_responsavel, email, telefone, senha_hash, endereco, cidade, estado, cep, data_vencimento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, email`,
      [nome_empresa, cnpj, nome_responsavel, email, telefone, senha_hash, endereco, cidade, estado, cep, data_vencimento]
    );

    const empresaId = result.rows[0].id;

    // Criar assinatura
    await pool.query(
      `INSERT INTO assinaturas (empresa_id, data_vencimento) VALUES ($1, $2)`,
      [empresaId, data_vencimento]
    );

    res.status(201).json({ success: true, empresa_id: empresaId });
  } catch (err: any) {
    console.error('Erro no cadastro:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Login unificado (tenta empresa, despachante e cliente em sequencia rapida)
app.post('/api/login-unificado', loginRateLimit, async (req, res) => {
  try {
    const {doc, senha} = req.body;
    if (!doc || !senha) return res.status(400).json({error: 'Documento e senha obrigat\u00f3rios.'});

    // Tenta empresa
    const empRes = await pool.query('SELECT * FROM empresas WHERE cnpj = $1 AND ativa = true', [doc]);
    if (empRes.rows.length > 0) {
      const empresa = empRes.rows[0];
      if (await bcrypt.compare(senha, empresa.senha_hash)) {
        limparLoginAttempt(doc);
        const token = gerarToken({ id: empresa.id, tipo: 'empresa' });
        return res.json({
          success: true, tipo: 'empresa', token,
          empresa: {
            id: empresa.id, nome_empresa: empresa.nome_empresa, cnpj: empresa.cnpj,
            nome_responsavel: empresa.nome_responsavel, email: empresa.email,
            telefone: empresa.telefone, endereco: empresa.endereco || '',
            cidade: empresa.cidade || '', estado: empresa.estado || '',
            cep: empresa.cep || '', status_assinatura: empresa.status_assinatura,
          },
        });
      }
    }

    // Tenta despachante
    const despRes = await pool.query('SELECT * FROM despachantes WHERE cpf=$1', [doc]);
    if (despRes.rows.length > 0) {
      const desp = despRes.rows[0];
      if (await bcrypt.compare(senha, desp.senha_hash)) {
        limparLoginAttempt(doc);
        const empresas = await pool.query(
          `SELECT e.id, e.nome_empresa FROM despachante_empresa de JOIN empresas e ON e.id = de.empresa_id
           WHERE de.despachante_id=$1 AND de.ativo=true`, [desp.id]
        );
        if (empresas.rows.length > 0) {
          const token = gerarToken({ id: desp.id, tipo: 'despachante' });
          return res.json({
            success: true, tipo: 'despachante', token,
            despachante: { id: desp.id, nome: desp.nome, cpf: desp.cpf, telefone: desp.telefone || '', empresas: empresas.rows },
          });
        }
      }
    }

    // Tenta cliente
    const cliRes = await pool.query('SELECT * FROM clientes WHERE cpf = $1 AND ativo = true', [doc]);
    if (cliRes.rows.length > 0) {
      const cliente = cliRes.rows[0];
      if (await bcrypt.compare(senha, cliente.senha_hash)) {
        limparLoginAttempt(doc);
        const token = gerarToken({ id: cliente.id, tipo: 'cliente' });
        return res.json({
          success: true, tipo: 'cliente', token,
          cliente: {
            id: cliente.id, nome: cliente.nome, cpf: cliente.cpf, cnpj: cliente.cnpj || '',
            email: cliente.email, telefone: cliente.telefone, data_nascimento: cliente.data_nascimento || '',
            endereco: cliente.endereco || '', numero: cliente.numero || '', bairro: cliente.bairro || '', complemento: cliente.complemento || '', cidade: cliente.cidade || '', estado: cliente.estado || '', cep: cliente.cep || '',
            data_cadastro: cliente.data_cadastro || '',
          },
        });
      }
    }

    registrarLoginFalho(doc);
    res.status(401).json({success: false, error: 'Credenciais inv\u00e1lidas.'});
  } catch (err: any) {
    console.error('Erro no login unificado:', err.message);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Login (para o app mobile usar)
app.post('/api/login', async (req, res) => {
  try {
    const { cnpj, senha } = req.body;
    if (!cnpj || !senha) {
      return res.status(400).json({ error: 'CPF/CNPJ e senha são obrigatórios.' });
    }

    const result = await pool.query('SELECT * FROM empresas WHERE cnpj = $1 AND ativa = true', [cnpj]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const empresa = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, empresa.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Verificar assinatura
    if (empresa.status_assinatura !== 'ativa') {
      return res.status(403).json({ error: 'Assinatura inativa.' });
    }

    const token = gerarToken({ id: empresa.id, tipo: 'empresa' });
    res.json({
      success: true, token,
      empresa: {
        id: empresa.id,
        nome_empresa: empresa.nome_empresa,
        cnpj: empresa.cnpj,
        nome_responsavel: empresa.nome_responsavel,
        email: empresa.email,
        telefone: empresa.telefone,
        endereco: empresa.endereco || '',
        cidade: empresa.cidade || '',
        estado: empresa.estado || '',
        cep: empresa.cep || '',
        status_assinatura: empresa.status_assinatura,
      },
    });
  } catch (err: any) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

const PORT = parseInt(process.env.PORT || '3001');

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Buscar dados da empresa
app.get('/api/empresa/:id', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const result = await pool.query(
      'SELECT id, nome_empresa, cnpj, nome_responsavel, email, telefone, endereco, cidade, estado, cep, horario_funcionamento, status_assinatura FROM empresas WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Empresa n\u00e3o encontrada.'});
    }
    res.json({success: true, empresa: result.rows[0]});
  } catch (err: any) {
    console.error('Erro ao buscar empresa:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Atualizar dados da empresa
app.put('/api/empresa/:id', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const user = (req as any).user as TokenPayload;
    if (user.tipo !== 'empresa' || user.id !== id) {
      return res.status(403).json({error: 'Sem permissão.'});
    }
    const {nome_empresa, telefone, email, endereco, cidade, estado, cep, horario_funcionamento} = req.body;
    await pool.query(
      `UPDATE empresas SET nome_empresa=$1, telefone=$2, email=$3, endereco=$4, cidade=$5, estado=$6, cep=$7, horario_funcionamento=$8 WHERE id=$9`,
      [nome_empresa, telefone, email, endereco, cidade, estado, cep, horario_funcionamento, id]
    );
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao atualizar empresa:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Atualizar dados do cliente
app.put('/api/cliente/:id', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const user = (req as any).user as TokenPayload;
    if (user.tipo !== 'cliente' || user.id !== id) {
      return res.status(403).json({error: 'Sem permissão.'});
    }
    const {nome, telefone, email, data_nascimento, endereco, numero, bairro, complemento, cidade, estado, cep} = req.body;
    await pool.query(
      `UPDATE clientes SET nome=$1, telefone=$2, email=$3, data_nascimento=$4, endereco=$5, numero=$6, bairro=$7, complemento=$8, cidade=$9, estado=$10, cep=$11 WHERE id=$12`,
      [nome, telefone, email, data_nascimento || null, endereco || null, numero || null, bairro || null, complemento || null, cidade || null, estado || null, cep || null, id]
    );
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao atualizar cliente:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Listar todas as lojas (para cliente buscar)
app.get('/api/lojas', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome_empresa, cidade, estado, horario_funcionamento, telefone FROM empresas WHERE ativa = true ORDER BY nome_empresa'
    );
    res.json({success: true, lojas: result.rows});
  } catch (err: any) {
    console.error('Erro ao listar lojas:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Listar lojas vinculadas ao cliente
app.get('/api/cliente/:id/lojas', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const result = await pool.query(
      `SELECT e.id, e.nome_empresa, e.cidade, e.estado, e.horario_funcionamento, e.telefone, ce.data_vinculo
       FROM cliente_empresa ce JOIN empresas e ON e.id = ce.empresa_id
       WHERE ce.cliente_id = $1 AND ce.status = 'ativo' ORDER BY ce.data_vinculo DESC`, [id]
    );
    res.json({success: true, lojas: result.rows});
  } catch (err: any) {
    console.error('Erro ao listar lojas do cliente:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Empresa cadastra cliente manualmente (vinculo sem conta no app)
app.post('/api/empresa/:empresaId/cadastrar-cliente', auth, async (req, res) => {
  try {
    const {empresaId} = req.params;
    const user = (req as any).user as TokenPayload;
    if (user.tipo !== 'empresa' || user.id !== empresaId) {
      return res.status(403).json({error: 'Sem permissão.'});
    }
    const {nome, cpf, cnpj, rg, telefone, email, data_nascimento, cep, endereco, cidade, estado, observacoes} = req.body;
    if (!nome || (!cpf && !cnpj)) {
      return res.status(400).json({error: 'Preencha o nome e pelo menos CPF ou CNPJ.'});
    }
    if (cpf) {
      const existe = await pool.query('SELECT id FROM cliente_empresa WHERE empresa_id=$1 AND cpf=$2', [empresaId, cpf]);
      if (existe.rows.length > 0) return res.status(409).json({error: 'Já existe um cliente com este CPF vinculado.'});
    }
    if (cnpj) {
      const existe = await pool.query('SELECT id FROM cliente_empresa WHERE empresa_id=$1 AND cnpj=$2', [empresaId, cnpj]);
      if (existe.rows.length > 0) return res.status(409).json({error: 'Já existe um cliente com este CNPJ vinculado.'});
    }
    let clienteId = null;
    if (cpf) {
      const c = await pool.query('SELECT id FROM clientes WHERE cpf=$1', [cpf]);
      if (c.rows.length > 0) clienteId = c.rows[0].id;
    }
    if (!clienteId && cnpj) {
      const c = await pool.query('SELECT id FROM clientes WHERE cnpj=$1', [cnpj]);
      if (c.rows.length > 0) clienteId = c.rows[0].id;
    }
    await pool.query(
      `INSERT INTO cliente_empresa (cliente_id, empresa_id, nome, cpf, cnpj, rg, telefone, email, data_nascimento, cep, endereco, cidade, estado, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [clienteId, empresaId, nome, cpf || null, cnpj || null, rg || null, telefone || null, email || null, data_nascimento || null, cep || null, endereco || null, cidade || null, estado || null, observacoes || null]
    );
    res.status(201).json({success: true});
  } catch (err: any) {
    console.error('Erro ao cadastrar cliente manual:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Vincular cliente a loja
app.post('/api/cliente/:clienteId/vincular/:empresaId', auth, async (req, res) => {
  try {
    const {clienteId, empresaId} = req.params;
    const user = (req as any).user as TokenPayload;
    if (user.tipo !== 'cliente' || user.id !== clienteId) {
      return res.status(403).json({error: 'Sem permissão.'});
    }
    const clienteRes = await pool.query('SELECT nome, cpf, cnpj FROM clientes WHERE id=$1', [clienteId]);
    if (clienteRes.rows.length === 0) return res.status(404).json({error: 'Cliente não encontrado.'});
    const {nome, cpf, cnpj} = clienteRes.rows[0];
    const bloqueado = await pool.query(
      `SELECT id FROM cliente_empresa WHERE empresa_id=$1 AND status='bloqueado'
       AND (cliente_id=$2 OR ($3::text IS NOT NULL AND cpf=$3) OR ($4::text IS NOT NULL AND cnpj=$4))`,
      [empresaId, clienteId, cpf, cnpj]
    );
    if (bloqueado.rows.length > 0) {
      return res.status(403).json({error: 'Você foi bloqueado por esta loja.'});
    }
    let vinculoExistente = null;
    if (cpf) {
      const v = await pool.query('SELECT id FROM cliente_empresa WHERE empresa_id=$1 AND cpf=$2 AND cliente_id IS NULL', [empresaId, cpf]);
      if (v.rows.length > 0) vinculoExistente = v.rows[0].id;
    }
    if (!vinculoExistente && cnpj) {
      const v = await pool.query('SELECT id FROM cliente_empresa WHERE empresa_id=$1 AND cnpj=$2 AND cliente_id IS NULL', [empresaId, cnpj]);
      if (v.rows.length > 0) vinculoExistente = v.rows[0].id;
    }
    if (vinculoExistente) {
      await pool.query('UPDATE cliente_empresa SET cliente_id=$1 WHERE id=$2', [clienteId, vinculoExistente]);
    } else {
      const direto = await pool.query('SELECT id FROM cliente_empresa WHERE cliente_id=$1 AND empresa_id=$2', [clienteId, empresaId]);
      if (direto.rows.length === 0) {
        await pool.query('INSERT INTO cliente_empresa (cliente_id, empresa_id) VALUES ($1, $2)', [clienteId, empresaId]);
      }
    }
    // Cria notificacao e envia push
    await pool.query(
      `INSERT INTO notificacoes (empresa_id, tipo, titulo, mensagem, dados)
       VALUES ($1, 'novo_vinculo', 'Novo cliente vinculado', $2, $3)`,
      [empresaId, `${nome} se vinculou à sua loja.`, JSON.stringify({cliente_id: clienteId, nome, cpf})]
    );
    // Envia push notification
    try {
      if (admin.apps.length > 0) {
        const tokens = await pool.query('SELECT token FROM empresa_fcm_tokens WHERE empresa_id=$1', [empresaId]);
        console.log(`[PUSH] Firebase ativo. Tokens encontrados: ${tokens.rows.length}`);
        if (tokens.rows.length > 0) {
          const result = await admin.messaging().sendEachForMulticast({
            tokens: tokens.rows.map((r: any) => r.token),
            notification: { title: 'Novo cliente vinculado', body: `${nome} se vinculou à sua loja.` },
            data: { tipo: 'novo_vinculo', cliente_id: clienteId },
          });
          console.log(`[PUSH] Enviado: ${result.successCount} sucesso, ${result.failureCount} falha`);
          result.responses.forEach((r: any, i: number) => {
            if (!r.success) console.log(`[PUSH] Falha token ${i}:`, r.error?.message);
          });
        }
      } else {
        console.log('[PUSH] Firebase NAO inicializado');
      }
    } catch (pushErr) { console.error('[PUSH] Erro:', pushErr); }
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao vincular:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Salvar FCM token da empresa
app.put('/api/empresa/:id/fcm-token', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const {token} = req.body;
    if (!token) return res.status(400).json({error: 'Token obrigatório.'});
    await pool.query(
      `INSERT INTO empresa_fcm_tokens (empresa_id, token) VALUES ($1, $2)
       ON CONFLICT (empresa_id, token) DO UPDATE SET atualizado_em = NOW()`,
      [id, token]
    );
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao salvar FCM token:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Listar notificacoes da empresa
app.get('/api/empresa/:id/notificacoes', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const result = await pool.query(
      'SELECT id, tipo, titulo, mensagem, dados, lida, criado_em FROM notificacoes WHERE empresa_id=$1 ORDER BY criado_em DESC LIMIT 50',
      [id]
    );
    res.json({success: true, notificacoes: result.rows});
  } catch (err: any) {
    console.error('Erro ao listar notificacoes:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Contar notificacoes nao lidas
app.get('/api/empresa/:id/notificacoes/nao-lidas', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const result = await pool.query(
      'SELECT COUNT(*)::int as total FROM notificacoes WHERE empresa_id=$1 AND lida=false',
      [id]
    );
    res.json({success: true, total: result.rows[0].total});
  } catch (err: any) {
    console.error('Erro ao contar notificacoes:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Marcar notificacoes como lidas
app.put('/api/empresa/:id/notificacoes/marcar-lidas', auth, async (req, res) => {
  try {
    const {id} = req.params;
    await pool.query('UPDATE notificacoes SET lida=true WHERE empresa_id=$1 AND lida=false', [id]);
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao marcar lidas:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Desvincular cliente de loja
app.delete('/api/cliente/:clienteId/desvincular/:empresaId', auth, async (req, res) => {
  try {
    const {clienteId, empresaId} = req.params;
    const user = (req as any).user as TokenPayload;
    if (user.tipo !== 'cliente' || user.id !== clienteId) {
      return res.status(403).json({error: 'Sem permissão.'});
    }
    await pool.query(
      'DELETE FROM cliente_empresa WHERE cliente_id = $1 AND empresa_id = $2',
      [clienteId, empresaId]
    );
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao desvincular:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Listar clientes vinculados a uma empresa
app.get('/api/empresa/:id/clientes', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const result = await pool.query(
      `SELECT ce.id as vinculo_id, ce.status, ce.nome, ce.cpf, ce.cnpj, ce.rg, ce.telefone, ce.email,
              ce.data_nascimento, ce.cep, ce.endereco, ce.cidade, ce.estado, ce.observacoes, ce.data_vinculo,
              c.id as cliente_id, c.nome as cliente_nome, c.cpf as cliente_cpf, c.email as cliente_email, c.telefone as cliente_telefone
       FROM cliente_empresa ce JOIN clientes c ON c.id = ce.cliente_id
       WHERE ce.empresa_id = $1 ORDER BY ce.data_vinculo DESC`, [id]
    );
    const clientes = result.rows.map(r => ({
      vinculo_id: r.vinculo_id, cliente_id: r.cliente_id, status: r.status,
      nome: r.nome || r.cliente_nome,
      cpf: r.cpf || r.cliente_cpf,
      cnpj: r.cnpj || '',
      rg: r.rg || '',
      telefone: r.telefone || r.cliente_telefone,
      email: r.email || r.cliente_email,
      data_nascimento: r.data_nascimento || '',
      cep: r.cep || '', endereco: r.endereco || '',
      cidade: r.cidade || '', estado: r.estado || '',
      observacoes: r.observacoes || '', data_vinculo: r.data_vinculo,
    }));
    res.json({success: true, clientes});
  } catch (err: any) {
    console.error('Erro ao listar clientes da empresa:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Atualizar dados do cliente (visão lojista - salva no vínculo)
app.put('/api/empresa/vinculo/:vinculoId', auth, async (req, res) => {
  try {
    const {vinculoId} = req.params;
    const {nome, cpf, cnpj, rg, telefone, email, data_nascimento, cep, endereco, cidade, estado, observacoes} = req.body;
    await pool.query(
      `UPDATE cliente_empresa SET nome=$1, cpf=$2, cnpj=$3, rg=$4, telefone=$5, email=$6,
       data_nascimento=$7, cep=$8, endereco=$9, cidade=$10, estado=$11, observacoes=$12 WHERE id=$13`,
      [nome, cpf, cnpj, rg, telefone, email, data_nascimento, cep, endereco, cidade, estado, observacoes, vinculoId]
    );
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao atualizar vinculo:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Bloquear cliente (não pode se vincular novamente)
app.put('/api/empresa/vinculo/:vinculoId/bloquear', auth, async (req, res) => {
  try {
    const {vinculoId} = req.params;
    await pool.query('UPDATE cliente_empresa SET status=$1 WHERE id=$2', ['bloqueado', vinculoId]);
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao bloquear:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Excluir vinculo (cliente pode se vincular novamente)
app.delete('/api/empresa/vinculo/:vinculoId', auth, async (req, res) => {
  try {
    const {vinculoId} = req.params;
    await pool.query('DELETE FROM cliente_empresa WHERE id=$1', [vinculoId]);
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao excluir vinculo:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// === DESPACHANTES ===

// Listar despachantes da empresa
app.get('/api/empresa/:id/despachantes', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const result = await pool.query(
      `SELECT d.id, d.nome, d.cpf, d.telefone, de.ativo
       FROM despachante_empresa de JOIN despachantes d ON d.id = de.despachante_id
       WHERE de.empresa_id=$1 ORDER BY de.data_vinculo DESC`, [id]
    );
    res.json({success: true, despachantes: result.rows});
  } catch (err: any) {
    console.error('Erro ao listar despachantes:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Cadastrar despachante (cria conta + vincula à empresa)
app.post('/api/empresa/:id/despachantes', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const user = (req as any).user as TokenPayload;
    if (user.tipo !== 'empresa' || user.id !== id) {
      return res.status(403).json({error: 'Sem permissão.'});
    }
    const {nome, cpf, telefone, senha} = req.body;
    if (!nome || !cpf || !senha) {
      return res.status(400).json({error: 'Preencha nome, CPF e senha.'});
    }
    const cpfLimpo = cpf.replace(/\D/g, '');
    // Verifica se já existe despachante com esse CPF
    let despachanteId: string;
    const existe = await pool.query('SELECT id FROM despachantes WHERE cpf=$1', [cpfLimpo]);
    if (existe.rows.length > 0) {
      despachanteId = existe.rows[0].id;
      // Verifica se já está vinculado a esta empresa
      const vinculo = await pool.query('SELECT id FROM despachante_empresa WHERE despachante_id=$1 AND empresa_id=$2', [despachanteId, id]);
      if (vinculo.rows.length > 0) return res.status(409).json({error: 'Este despachante j\u00e1 est\u00e1 vinculado a sua empresa.'});
    } else {
      // Cria conta do despachante
      const senha_hash = await bcrypt.hash(senha, 10);
      const result = await pool.query(
        'INSERT INTO despachantes (nome, cpf, telefone, senha_hash) VALUES ($1,$2,$3,$4) RETURNING id',
        [nome, cpfLimpo, telefone || null, senha_hash]
      );
      despachanteId = result.rows[0].id;
    }
    // Cria vínculo
    await pool.query('INSERT INTO despachante_empresa (despachante_id, empresa_id) VALUES ($1,$2)', [despachanteId, id]);
    res.status(201).json({success: true, id: despachanteId});
  } catch (err: any) {
    console.error('Erro ao cadastrar despachante:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Atualizar despachante
app.put('/api/despachantes/:despachanteId', auth, async (req, res) => {
  try {
    const {despachanteId} = req.params;
    const {nome, cpf, telefone, senha} = req.body;
    const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '';
    if (senha) {
      const senha_hash = await bcrypt.hash(senha, 10);
      await pool.query('UPDATE despachantes SET nome=$1, cpf=$2, telefone=$3, senha_hash=$4 WHERE id=$5', [nome, cpfLimpo, telefone || null, senha_hash, despachanteId]);
    } else {
      await pool.query('UPDATE despachantes SET nome=$1, cpf=$2, telefone=$3 WHERE id=$4', [nome, cpfLimpo, telefone || null, despachanteId]);
    }
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao atualizar despachante:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Ativar/Desativar despachante (no vínculo com a empresa)
app.put('/api/empresa/:empresaId/despachantes/:despachanteId/toggle', auth, async (req, res) => {
  try {
    const {empresaId, despachanteId} = req.params;
    const user = (req as any).user as TokenPayload;
    if (user.tipo !== 'empresa' || user.id !== empresaId) {
      return res.status(403).json({error: 'Sem permissão.'});
    }
    await pool.query('UPDATE despachante_empresa SET ativo = NOT ativo WHERE despachante_id=$1 AND empresa_id=$2', [despachanteId, empresaId]);
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao toggle despachante:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Excluir vínculo do despachante com a empresa
app.delete('/api/empresa/:empresaId/despachantes/:despachanteId', auth, async (req, res) => {
  try {
    const {empresaId, despachanteId} = req.params;
    const user = (req as any).user as TokenPayload;
    if (user.tipo !== 'empresa' || user.id !== empresaId) {
      return res.status(403).json({error: 'Sem permissão.'});
    }
    await pool.query('DELETE FROM despachante_empresa WHERE despachante_id=$1 AND empresa_id=$2', [despachanteId, empresaId]);
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao excluir despachante:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Login despachante
app.post('/api/login-despachante', async (req, res) => {
  try {
    const {cpf, senha} = req.body;
    if (!cpf || !senha) return res.status(400).json({error: 'CPF e senha s\u00e3o obrigat\u00f3rios.'});
    const result = await pool.query('SELECT * FROM despachantes WHERE cpf=$1', [cpf]);
    if (result.rows.length === 0) return res.status(401).json({error: 'Credenciais inv\u00e1lidas.'});
    const desp = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, desp.senha_hash);
    if (!senhaValida) return res.status(401).json({error: 'Credenciais inv\u00e1lidas.'});
    const empresas = await pool.query(
      `SELECT e.id, e.nome_empresa FROM despachante_empresa de JOIN empresas e ON e.id = de.empresa_id
       WHERE de.despachante_id=$1 AND de.ativo=true`, [desp.id]
    );
    if (empresas.rows.length === 0) return res.status(403).json({error: 'Nenhuma empresa ativa vinculada.'});
    const token = gerarToken({ id: desp.id, tipo: 'despachante' });
    res.json({
      success: true, token,
      despachante: {
        id: desp.id, nome: desp.nome, cpf: desp.cpf, telefone: desp.telefone || '',
        empresas: empresas.rows,
      },
    });
  } catch (err: any) {
    console.error('Erro no login despachante:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// === PEDIDOS ===

// Criar pedido
app.post('/api/empresa/:empresaId/pedidos', auth, async (req, res) => {
  try {
    const {empresaId} = req.params;
    const user = (req as any).user as TokenPayload;
    if (user.tipo !== 'empresa' || user.id !== empresaId) {
      return res.status(403).json({error: 'Sem permissão.'});
    }
    const {cliente_id, despachante_id, excursao_id, cliente_nome, despachante_nome, excursao_nome, volumes, descricao} = req.body;
    if (!cliente_nome || !despachante_nome || !excursao_nome) {
      return res.status(400).json({error: 'Preencha cliente, despachante e excurs\u00e3o.'});
    }
    const result = await pool.query(
      `INSERT INTO pedidos (empresa_id, cliente_id, despachante_id, excursao_id, cliente_nome, despachante_nome, excursao_nome, volumes, descricao)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [empresaId, cliente_id || null, despachante_id || null, excursao_id || null, cliente_nome, despachante_nome, excursao_nome, volumes || 1, descricao || null]
    );
    const pedidoId = result.rows[0].id;
    // Busca o numero sequencial
    const numRes = await pool.query('SELECT numero FROM pedidos WHERE id=$1', [pedidoId]);
    const numeroPedido = numRes.rows[0].numero;
    // Cria etapas padr\u00e3o
    const etapas = ['Pedido recebido na empresa', 'Coleta realizada', 'Em rota para excurs\u00e3o', 'Entregue na excurs\u00e3o'];
    for (let i = 0; i < etapas.length; i++) {
      const concluida = i === 0;
      const hora = i === 0 ? new Date() : null;
      await pool.query(
        'INSERT INTO pedido_etapas (pedido_id, nome, concluida, hora, ordem) VALUES ($1,$2,$3,$4,$5)',
        [pedidoId, etapas[i], concluida, hora, i]
      );
    }
    // Notifica o cliente se tiver id
    if (cliente_id) {
      const empresaNome = await pool.query('SELECT nome_empresa FROM empresas WHERE id=$1', [empresaId]);
      const nomeEmp = empresaNome.rows[0]?.nome_empresa || 'Uma empresa';
      // Envia push pro cliente
      try {
        if (admin.apps.length > 0) {
          const tokens = await pool.query('SELECT token FROM cliente_fcm_tokens WHERE cliente_id=$1', [cliente_id]);
          if (tokens.rows.length > 0) {
            await admin.messaging().sendEachForMulticast({
              tokens: tokens.rows.map((r: any) => r.token),
              notification: { title: 'Novo pedido criado', body: `${nomeEmp} criou o pedido #${numeroPedido} para voc\u00ea.` },
              data: { tipo: 'novo_pedido', pedido_id: pedidoId },
            });
          }
        }
      } catch (pushErr) { console.error('[PUSH] Erro cliente:', pushErr); }
    }
    res.status(201).json({success: true, pedido_id: pedidoId, numero: numeroPedido});
  } catch (err: any) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Salvar FCM token do cliente
app.put('/api/cliente/:id/fcm-token', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const {token} = req.body;
    if (!token) return res.status(400).json({error: 'Token obrigat\u00f3rio.'});
    await pool.query(
      `INSERT INTO cliente_fcm_tokens (cliente_id, token) VALUES ($1, $2)
       ON CONFLICT (cliente_id, token) DO UPDATE SET atualizado_em = NOW()`,
      [id, token]
    );
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao salvar FCM token cliente:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Listar pedidos da empresa
app.get('/api/empresa/:empresaId/pedidos', auth, async (req, res) => {
  try {
    const {empresaId} = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await pool.query(
      `SELECT p.*, 
        (SELECT json_agg(e ORDER BY e.ordem) FROM pedido_etapas e WHERE e.pedido_id = p.id) as etapas,
        (SELECT json_agg(f ORDER BY f.criado_em) FROM pedido_fotos f WHERE f.pedido_id = p.id) as fotos
       FROM pedidos p WHERE p.empresa_id=$1 ORDER BY p.criado_em DESC LIMIT $2 OFFSET $3`,
      [empresaId, limit, offset]
    );
    res.json({success: true, pedidos: result.rows});
  } catch (err: any) {
    console.error('Erro ao listar pedidos:', err.message);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Listar pedidos do cliente
app.get('/api/cliente/:clienteId/pedidos', auth, async (req, res) => {
  try {
    const {clienteId} = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await pool.query(
      `SELECT p.*,
        (SELECT json_agg(e ORDER BY e.ordem) FROM pedido_etapas e WHERE e.pedido_id = p.id) as etapas,
        (SELECT json_agg(f ORDER BY f.criado_em) FROM pedido_fotos f WHERE f.pedido_id = p.id) as fotos,
        emp.nome_empresa
       FROM pedidos p JOIN empresas emp ON emp.id = p.empresa_id
       WHERE p.cliente_id=$1 ORDER BY p.criado_em DESC LIMIT $2 OFFSET $3`,
      [clienteId, limit, offset]
    );
    res.json({success: true, pedidos: result.rows});
  } catch (err: any) {
    console.error('Erro ao listar pedidos do cliente:', err.message);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Listar pedidos do despachante
app.get('/api/despachante/:despachanteId/pedidos', auth, async (req, res) => {
  try {
    const {despachanteId} = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await pool.query(
      `SELECT p.*,
        (SELECT json_agg(e ORDER BY e.ordem) FROM pedido_etapas e WHERE e.pedido_id = p.id) as etapas,
        (SELECT json_agg(f ORDER BY f.criado_em) FROM pedido_fotos f WHERE f.pedido_id = p.id) as fotos,
        emp.nome_empresa
       FROM pedidos p JOIN empresas emp ON emp.id = p.empresa_id
       WHERE p.despachante_id=$1 ORDER BY p.criado_em DESC LIMIT $2 OFFSET $3`,
      [despachanteId, limit, offset]
    );
    res.json({success: true, pedidos: result.rows});
  } catch (err: any) {
    console.error('Erro ao listar pedidos do despachante:', err.message);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Atualizar status do pedido
app.put('/api/pedidos/:pedidoId/status', auth, async (req, res) => {
  try {
    const {pedidoId} = req.params;
    const {status} = req.body;
    await pool.query('UPDATE pedidos SET status=$1, atualizado_em=NOW() WHERE id=$2', [status, pedidoId]);
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Concluir etapa do pedido por ID
app.put('/api/pedidos/:pedidoId/etapas/:etapaId/concluir', auth, async (req, res) => {
  try {
    const {pedidoId, etapaId} = req.params;
    await pool.query('UPDATE pedido_etapas SET concluida=true, hora=NOW() WHERE id=$1 AND pedido_id=$2', [etapaId, pedidoId]);
    const total = await pool.query('SELECT COUNT(*)::int as total FROM pedido_etapas WHERE pedido_id=$1', [pedidoId]);
    const concluidas = await pool.query('SELECT COUNT(*)::int as total FROM pedido_etapas WHERE pedido_id=$1 AND concluida=true', [pedidoId]);
    if (concluidas.rows[0].total >= total.rows[0].total) {
      await pool.query('UPDATE pedidos SET status=$1, atualizado_em=NOW() WHERE id=$2', ['entregue', pedidoId]);
    } else if (concluidas.rows[0].total > 1) {
      await pool.query('UPDATE pedidos SET status=$1, atualizado_em=NOW() WHERE id=$2', ['em_transito', pedidoId]);
    }
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao concluir etapa:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Concluir etapas por tipo (coleta ou entrega)
app.put('/api/pedidos/:pedidoId/concluir-etapas', auth, async (req, res) => {
  try {
    const {pedidoId} = req.params;
    const {tipo} = req.body; // 'coleta' ou 'entrega'
    if (tipo === 'coleta') {
      // Marca "Coleta realizada" e "Em rota para excurs\u00e3o"
      await pool.query(
        `UPDATE pedido_etapas SET concluida=true, hora=NOW() WHERE pedido_id=$1 AND nome IN ('Coleta realizada', 'Em rota para excurs\u00e3o') AND concluida=false`,
        [pedidoId]
      );
      await pool.query('UPDATE pedidos SET status=$1, atualizado_em=NOW() WHERE id=$2', ['em_transito', pedidoId]);
    } else if (tipo === 'entrega') {
      // Marca todas as etapas restantes
      await pool.query(
        'UPDATE pedido_etapas SET concluida=true, hora=NOW() WHERE pedido_id=$1 AND concluida=false',
        [pedidoId]
      );
      await pool.query('UPDATE pedidos SET status=$1, atualizado_em=NOW() WHERE id=$2', ['entregue', pedidoId]);
    }
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao concluir etapas:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// === PRESIGNED URL - Client faz upload DIRETO pro R2 (não passa pelo server) ===
app.post('/api/pedidos/:pedidoId/upload-url', auth, async (req, res) => {
  try {
    const {pedidoId} = req.params;
    const {etapa, contentType, ext} = req.body;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (contentType && !allowedTypes.includes(contentType)) {
      return res.status(400).json({error: 'Tipo de arquivo não permitido.'});
    }
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
    if (ext && !allowedExts.includes(ext.toLowerCase())) {
      return res.status(400).json({error: 'Extensão de arquivo não permitida.'});
    }

    const pedidoRes = await pool.query('SELECT empresa_id, cliente_nome FROM pedidos WHERE id=$1', [pedidoId]);
    if (pedidoRes.rows.length === 0) return res.status(404).json({error: 'Pedido não encontrado.'});
    const {empresa_id, cliente_nome} = pedidoRes.rows[0];
    const clienteSlug = (cliente_nome || 'sem-cliente').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    const key = `${empresa_id}/${clienteSlug}/${pedidoId}/${crypto.randomUUID()}.${ext || 'jpg'}`;
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType || 'image/jpeg',
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
    const publicUrl = `${R2_PUBLIC_URL}/${key}`;

    // Já salva a referência no DB (foto aparece quando upload concluir)
    await pool.query(
      'INSERT INTO pedido_fotos (pedido_id, url, etapa) VALUES ($1, $2, $3)',
      [pedidoId, publicUrl, etapa || 'geral']
    );

    res.json({ success: true, uploadUrl, publicUrl });
  } catch (err: any) {
    console.error('Erro ao gerar URL de upload:', err);
    res.status(500).json({error: 'Erro ao gerar URL.'});
  }
});

// Upload de foto do pedido (fallback - mantém compatibilidade)
app.post('/api/pedidos/:pedidoId/fotos', auth, upload.single('foto'), async (req, res) => {
  try {
    const {pedidoId} = req.params;
    const etapa = req.body.etapa || 'geral';
    const file = req.file;
    if (!file) return res.status(400).json({error: 'Nenhuma foto enviada.'});

    const pedidoRes = await pool.query('SELECT empresa_id, cliente_nome FROM pedidos WHERE id=$1', [pedidoId]);
    if (pedidoRes.rows.length === 0) return res.status(404).json({error: 'Pedido não encontrado.'});
    const {empresa_id, cliente_nome} = pedidoRes.rows[0];
    const clienteSlug = (cliente_nome || 'sem-cliente').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    const ext = file.originalname.split('.').pop() || 'jpg';
    const key = `${empresa_id}/${clienteSlug}/${pedidoId}/${crypto.randomUUID()}.${ext}`;

    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const url = `${R2_PUBLIC_URL}/${key}`;
    await pool.query(
      'INSERT INTO pedido_fotos (pedido_id, url, etapa) VALUES ($1, $2, $3)',
      [pedidoId, url, etapa]
    );
    res.status(201).json({success: true, url});
  } catch (err: any) {
    console.error('Erro ao fazer upload:', err);
    res.status(500).json({error: 'Erro ao enviar foto.'});
  }
});

// Salvar observação do pedido (despachante)
app.put('/api/pedidos/:pedidoId/observacao', auth, async (req, res) => {
  try {
    const {pedidoId} = req.params;
    const {observacao} = req.body;
    await pool.query('UPDATE pedidos SET observacao=$1, atualizado_em=NOW() WHERE id=$2', [observacao || null, pedidoId]);
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao salvar observa\u00e7\u00e3o:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// === EXCURSÕES ===

// Listar excursões da empresa
app.get('/api/empresa/:id/excursoes', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const result = await pool.query(
      'SELECT id, nome, setor, vaga, responsavel, telefone FROM excursoes WHERE empresa_id=$1 ORDER BY data_cadastro DESC', [id]
    );
    res.json({success: true, excursoes: result.rows});
  } catch (err: any) {
    console.error('Erro ao listar excursões:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Cadastrar excursão
app.post('/api/empresa/:id/excursoes', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const user = (req as any).user as TokenPayload;
    if (user.tipo !== 'empresa' || user.id !== id) {
      return res.status(403).json({error: 'Sem permissão.'});
    }
    const {nome, setor, vaga, responsavel, telefone} = req.body;
    if (!nome || !setor || !vaga || !responsavel) {
      return res.status(400).json({error: 'Preencha todos os campos obrigatórios.'});
    }
    const result = await pool.query(
      'INSERT INTO excursoes (empresa_id, nome, setor, vaga, responsavel, telefone) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [id, nome, setor, vaga, responsavel, telefone || null]
    );
    res.status(201).json({success: true, id: result.rows[0].id});
  } catch (err: any) {
    console.error('Erro ao cadastrar excursão:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Atualizar excursão
app.put('/api/excursoes/:excursaoId', auth, async (req, res) => {
  try {
    const {excursaoId} = req.params;
    const {nome, setor, vaga, responsavel, telefone} = req.body;
    await pool.query(
      'UPDATE excursoes SET nome=$1, setor=$2, vaga=$3, responsavel=$4, telefone=$5 WHERE id=$6',
      [nome, setor, vaga, responsavel, telefone || null, excursaoId]
    );
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao atualizar excursão:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Excluir excursão
app.delete('/api/excursoes/:excursaoId', auth, async (req, res) => {
  try {
    const {excursaoId} = req.params;
    await pool.query('DELETE FROM excursoes WHERE id=$1', [excursaoId]);
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao excluir excursão:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Alterar senha do cliente
app.put('/api/cliente/:id/alterar-senha', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const user = (req as any).user as TokenPayload;
    if (user.tipo !== 'cliente' || user.id !== id) {
      return res.status(403).json({error: 'Sem permissão.'});
    }
    const {senha_atual, nova_senha} = req.body;
    if (!senha_atual || !nova_senha) return res.status(400).json({error: 'Preencha todos os campos.'});
    if (nova_senha.length < 6) return res.status(400).json({error: 'A nova senha deve ter no m\u00ednimo 6 caracteres.'});
    const result = await pool.query('SELECT senha_hash FROM clientes WHERE id=$1', [id]);
    if (result.rows.length === 0) return res.status(404).json({error: 'Cliente n\u00e3o encontrado.'});
    const valida = await bcrypt.compare(senha_atual, result.rows[0].senha_hash);
    if (!valida) return res.status(401).json({error: 'Senha atual incorreta.'});
    const nova_hash = await bcrypt.hash(nova_senha, 10);
    await pool.query('UPDATE clientes SET senha_hash=$1 WHERE id=$2', [nova_hash, id]);
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao alterar senha:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Cadastro de cliente
app.post('/api/cadastro-cliente', async (req, res) => {
  try {
    const {nome, cpf, cnpj, email, telefone, data_nascimento, endereco, cidade, estado, cep, senha} = req.body;
    if (!nome || !cpf || !email || !telefone || !senha) {
      return res.status(400).json({error: 'Campos obrigatórios não preenchidos.'});
    }
    if (!isValidCpf(cpf)) {
      return res.status(400).json({error: 'CPF inválido.'});
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({error: 'E-mail inválido.'});
    }
    if (cnpj && !isValidCnpj(cnpj)) {
      return res.status(400).json({error: 'CNPJ inválido.'});
    }
    const senhaCheck = isStrongPassword(senha);
    if (!senhaCheck.valid) {
      return res.status(400).json({error: senhaCheck.message});
    }
    const existe = await pool.query('SELECT id FROM clientes WHERE cpf = $1 OR email = $2', [cpf, email]);
    if (existe.rows.length > 0) {
      return res.status(409).json({error: 'CPF ou e-mail já cadastrado.'});
    }
    const senha_hash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      `INSERT INTO clientes (nome, cpf, cnpj, email, telefone, data_nascimento, endereco, cidade, estado, cep, senha_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [nome, cpf, cnpj || null, email, telefone, data_nascimento || null, endereco || null, cidade || null, estado || null, cep || null, senha_hash]
    );
    res.status(201).json({success: true, cliente_id: result.rows[0].id});
  } catch (err: any) {
    console.error('Erro no cadastro cliente:', err.message);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Login de cliente
app.post('/api/login-cliente', async (req, res) => {
  try {
    const {cpf, senha} = req.body;
    if (!cpf || !senha) {
      return res.status(400).json({error: 'CPF e senha são obrigatórios.'});
    }
    const result = await pool.query('SELECT * FROM clientes WHERE cpf = $1 AND ativo = true', [cpf]);
    if (result.rows.length === 0) {
      return res.status(401).json({error: 'Credenciais inválidas.'});
    }
    const cliente = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, cliente.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({error: 'Credenciais inválidas.'});
    }
    const token = gerarToken({ id: cliente.id, tipo: 'cliente' });
    res.json({
      success: true, token,
      cliente: {
        id: cliente.id, nome: cliente.nome, cpf: cliente.cpf, cnpj: cliente.cnpj || '',
        email: cliente.email, telefone: cliente.telefone, data_nascimento: cliente.data_nascimento || '',
        endereco: cliente.endereco || '', numero: cliente.numero || '', bairro: cliente.bairro || '', complemento: cliente.complemento || '', cidade: cliente.cidade || '', estado: cliente.estado || '', cep: cliente.cep || '',
        data_cadastro: cliente.data_cadastro || '',
      },
    });
  } catch (err: any) {
    console.error('Erro no login cliente:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// === RECUPERAÇÃO DE SENHA ===

const smtpTransporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
}) : null;

const RESET_CODE_EXPIRY_MIN = 10;

const resetRateMap = new Map<string, { count: number; resetAt: number }>();
function resetRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = resetRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    resetRateMap.set(ip, { count: 1, resetAt: now + 60000 });
    return next();
  }
  entry.count++;
  if (entry.count > 3) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde 1 minuto.' });
  }
  next();
}

app.post('/api/recuperar-senha/solicitar', resetRateLimit, async (req, res) => {
  try {
    const {doc} = req.body;
    if (!doc) return res.status(400).json({error: 'Informe o CPF ou CNPJ.'});

    let email: string | null = null;
    let tipo: string | null = null;
    let userId: string | null = null;

    const cli = await pool.query('SELECT id, email FROM clientes WHERE cpf=$1 AND ativo=true', [doc]);
    if (cli.rows.length > 0) { email = cli.rows[0].email; tipo = 'cliente'; userId = cli.rows[0].id; }

    if (!email) {
      const emp = await pool.query('SELECT id, email FROM empresas WHERE cnpj=$1 AND ativa=true', [doc]);
      if (emp.rows.length > 0) { email = emp.rows[0].email; tipo = 'empresa'; userId = emp.rows[0].id; }
    }

    if (!userId) {
      const desp = await pool.query('SELECT id FROM despachantes WHERE cpf=$1', [doc]);
      if (desp.rows.length > 0) { tipo = 'despachante'; userId = desp.rows[0].id; }
    }

    if (!userId || !tipo) {
      return res.json({success: true, message: 'Se o documento estiver cadastrado, você receberá um e-mail com o código.'});
    }

    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiraEm = new Date(Date.now() + RESET_CODE_EXPIRY_MIN * 60000);

    await pool.query(
      `INSERT INTO recuperacao_senha (user_id, tipo, codigo, expira_em, tentativas)
       VALUES ($1, $2, $3, $4, 0)
       ON CONFLICT (user_id, tipo) DO UPDATE SET codigo=$3, expira_em=$4, tentativas=0, usado=false`,
      [userId, tipo, codigo, expiraEm]
    );

    if (email && smtpTransporter) {
      const emailMasked = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      await smtpTransporter.sendMail({
        from: process.env.SMTP_FROM || '"Na Rota" <noreply@norum.app>',
        to: email,
        subject: 'Código de recuperação de senha - Na Rota',
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
            <h2 style="color:#0F2A3F">Recuperação de Senha</h2>
            <p>Seu código de verificação é:</p>
            <div style="background:#F3F4F6;padding:16px;border-radius:8px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#0F2A3F">
              ${codigo}
            </div>
            <p style="color:#6B7280;font-size:14px;margin-top:16px">Este código expira em ${RESET_CODE_EXPIRY_MIN} minutos.</p>
            <p style="color:#6B7280;font-size:14px">Se você não solicitou, ignore este e-mail.</p>
          </div>
        `,
      });
      console.log(`[RESET] Código enviado para ${emailMasked}`);
    } else {
      console.log(`[RESET] SMTP não configurado. Código: ${codigo} (user: ${userId})`);
    }

    const emailHint = email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : undefined;
    res.json({success: true, message: 'Se o documento estiver cadastrado, você receberá um e-mail com o código.', email_hint: emailHint});
  } catch (err: any) {
    console.error('Erro ao solicitar recuperação:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

app.post('/api/recuperar-senha/verificar', resetRateLimit, async (req, res) => {
  try {
    const {doc, codigo} = req.body;
    if (!doc || !codigo) return res.status(400).json({error: 'Informe o documento e o código.'});

    let tipo: string | null = null;
    let userId: string | null = null;

    const cli = await pool.query('SELECT id FROM clientes WHERE cpf=$1', [doc]);
    if (cli.rows.length > 0) { tipo = 'cliente'; userId = cli.rows[0].id; }
    if (!userId) {
      const emp = await pool.query('SELECT id FROM empresas WHERE cnpj=$1', [doc]);
      if (emp.rows.length > 0) { tipo = 'empresa'; userId = emp.rows[0].id; }
    }
    if (!userId) {
      const desp = await pool.query('SELECT id FROM despachantes WHERE cpf=$1', [doc]);
      if (desp.rows.length > 0) { tipo = 'despachante'; userId = desp.rows[0].id; }
    }

    if (!userId || !tipo) return res.status(400).json({error: 'Código inválido.'});

    const result = await pool.query(
      'SELECT * FROM recuperacao_senha WHERE user_id=$1 AND tipo=$2 AND usado=false',
      [userId, tipo]
    );
    if (result.rows.length === 0) return res.status(400).json({error: 'Código inválido ou expirado.'});

    const registro = result.rows[0];

    if (registro.tentativas >= 5) {
      return res.status(429).json({error: 'Muitas tentativas incorretas. Solicite um novo código.'});
    }
    if (new Date() > new Date(registro.expira_em)) {
      return res.status(400).json({error: 'Código expirado. Solicite um novo.'});
    }
    if (registro.codigo !== codigo) {
      await pool.query('UPDATE recuperacao_senha SET tentativas=tentativas+1 WHERE id=$1', [registro.id]);
      return res.status(400).json({error: 'Código incorreto.'});
    }

    const resetToken = jwt.sign({userId, tipo, purpose: 'reset'}, JWT_SECRET!, {expiresIn: '5m'});
    res.json({success: true, reset_token: resetToken});
  } catch (err: any) {
    console.error('Erro ao verificar código:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

app.post('/api/recuperar-senha/redefinir', async (req, res) => {
  try {
    const {reset_token, nova_senha} = req.body;
    if (!reset_token || !nova_senha) return res.status(400).json({error: 'Token e nova senha obrigatórios.'});
    if (nova_senha.length < 6) return res.status(400).json({error: 'A senha deve ter no mínimo 6 caracteres.'});

    let decoded: any;
    try {
      decoded = jwt.verify(reset_token, JWT_SECRET!);
    } catch {
      return res.status(400).json({error: 'Token inválido ou expirado. Solicite um novo código.'});
    }
    if (decoded.purpose !== 'reset') return res.status(400).json({error: 'Token inválido.'});

    const {userId, tipo} = decoded;
    const nova_hash = await bcrypt.hash(nova_senha, 10);

    if (tipo === 'cliente') {
      await pool.query('UPDATE clientes SET senha_hash=$1 WHERE id=$2', [nova_hash, userId]);
    } else if (tipo === 'empresa') {
      await pool.query('UPDATE empresas SET senha_hash=$1 WHERE id=$2', [nova_hash, userId]);
    } else if (tipo === 'despachante') {
      await pool.query('UPDATE despachantes SET senha_hash=$1 WHERE id=$2', [nova_hash, userId]);
    }

    await pool.query('UPDATE recuperacao_senha SET usado=true WHERE user_id=$1 AND tipo=$2', [userId, tipo]);
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao redefinir senha:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// SPA fallback - serve index.html for non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Worker ${process.pid}] API rodando em http://0.0.0.0:${PORT}`);
});

} // end startServer()
