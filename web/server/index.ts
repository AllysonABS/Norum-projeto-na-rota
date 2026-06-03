import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

// Inicializa Firebase Admin
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const firebaseKeyPath = path.join(__dirname, 'firebase-service-account.json');

if (existsSync(firebaseKeyPath)) {
  const serviceAccount = JSON.parse(readFileSync(firebaseKeyPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  console.warn('Firebase service account not found, push notifications disabled.');
}

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true',
});

// Cadastro de empresa
app.post('/api/cadastro', async (req, res) => {
  try {
    const { nome_empresa, cnpj, nome_responsavel, email, telefone, senha, endereco, cidade, estado, cep } = req.body;

    // Validações
    if (!nome_empresa || !cnpj || !nome_responsavel || !email || !telefone || !senha) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos.' });
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
app.post('/api/login-unificado', async (req, res) => {
  try {
    const {doc, senha} = req.body;
    if (!doc || !senha) return res.status(400).json({error: 'Documento e senha obrigat\u00f3rios.'});

    // Tenta empresa
    const empRes = await pool.query('SELECT * FROM empresas WHERE cnpj = $1 AND ativa = true', [doc]);
    if (empRes.rows.length > 0) {
      const empresa = empRes.rows[0];
      if (await bcrypt.compare(senha, empresa.senha_hash)) {
        return res.json({
          success: true, tipo: 'empresa',
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
        const empresas = await pool.query(
          `SELECT e.id, e.nome_empresa FROM despachante_empresa de JOIN empresas e ON e.id = de.empresa_id
           WHERE de.despachante_id=$1 AND de.ativo=true`, [desp.id]
        );
        if (empresas.rows.length > 0) {
          return res.json({
            success: true, tipo: 'despachante',
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
        return res.json({
          success: true, tipo: 'cliente',
          cliente: {
            id: cliente.id, nome: cliente.nome, cpf: cliente.cpf, cnpj: cliente.cnpj || '',
            email: cliente.email, telefone: cliente.telefone, data_nascimento: cliente.data_nascimento || '',
            endereco: cliente.endereco || '', numero: cliente.numero || '', bairro: cliente.bairro || '', complemento: cliente.complemento || '', cidade: cliente.cidade || '', estado: cliente.estado || '', cep: cliente.cep || '',
            data_cadastro: cliente.data_cadastro || '',
          },
        });
      }
    }

    res.status(401).json({success: false, error: 'Credenciais inv\u00e1lidas.'});
  } catch (err: any) {
    console.error('Erro no login unificado:', err);
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

    res.json({
      success: true,
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
app.get('/api/empresa/:id', async (req, res) => {
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
app.put('/api/empresa/:id', async (req, res) => {
  try {
    const {id} = req.params;
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
app.put('/api/cliente/:id', async (req, res) => {
  try {
    const {id} = req.params;
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
app.get('/api/cliente/:id/lojas', async (req, res) => {
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
app.post('/api/empresa/:empresaId/cadastrar-cliente', async (req, res) => {
  try {
    const {empresaId} = req.params;
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
app.post('/api/cliente/:clienteId/vincular/:empresaId', async (req, res) => {
  try {
    const {clienteId, empresaId} = req.params;
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
app.put('/api/empresa/:id/fcm-token', async (req, res) => {
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
app.get('/api/empresa/:id/notificacoes', async (req, res) => {
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
app.get('/api/empresa/:id/notificacoes/nao-lidas', async (req, res) => {
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
app.put('/api/empresa/:id/notificacoes/marcar-lidas', async (req, res) => {
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
app.delete('/api/cliente/:clienteId/desvincular/:empresaId', async (req, res) => {
  try {
    const {clienteId, empresaId} = req.params;
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
app.get('/api/empresa/:id/clientes', async (req, res) => {
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
app.put('/api/empresa/vinculo/:vinculoId', async (req, res) => {
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
app.put('/api/empresa/vinculo/:vinculoId/bloquear', async (req, res) => {
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
app.delete('/api/empresa/vinculo/:vinculoId', async (req, res) => {
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
app.get('/api/empresa/:id/despachantes', async (req, res) => {
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
app.post('/api/empresa/:id/despachantes', async (req, res) => {
  try {
    const {id} = req.params;
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
app.put('/api/despachantes/:despachanteId', async (req, res) => {
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
app.put('/api/empresa/:empresaId/despachantes/:despachanteId/toggle', async (req, res) => {
  try {
    const {empresaId, despachanteId} = req.params;
    await pool.query('UPDATE despachante_empresa SET ativo = NOT ativo WHERE despachante_id=$1 AND empresa_id=$2', [despachanteId, empresaId]);
    res.json({success: true});
  } catch (err: any) {
    console.error('Erro ao toggle despachante:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Excluir vínculo do despachante com a empresa
app.delete('/api/empresa/:empresaId/despachantes/:despachanteId', async (req, res) => {
  try {
    const {empresaId, despachanteId} = req.params;
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
    // Busca empresas vinculadas (ativas)
    const empresas = await pool.query(
      `SELECT e.id, e.nome_empresa FROM despachante_empresa de JOIN empresas e ON e.id = de.empresa_id
       WHERE de.despachante_id=$1 AND de.ativo=true`, [desp.id]
    );
    if (empresas.rows.length === 0) return res.status(403).json({error: 'Nenhuma empresa ativa vinculada.'});
    res.json({
      success: true,
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
app.post('/api/empresa/:empresaId/pedidos', async (req, res) => {
  try {
    const {empresaId} = req.params;
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
    // Cria etapas padr\u00e3o
    const etapas = ['Pedido recebido', 'Coleta realizada', 'Em rota para excurs\u00e3o', 'Entregue na excurs\u00e3o'];
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
      // Busca tokens FCM do cliente (futuro) - por agora s\u00f3 cria notifica\u00e7\u00e3o in-app
      const empresaNome = await pool.query('SELECT nome_empresa FROM empresas WHERE id=$1', [empresaId]);
      const nomeEmp = empresaNome.rows[0]?.nome_empresa || 'Uma empresa';
      await pool.query(
        `INSERT INTO notificacoes (empresa_id, tipo, titulo, mensagem, dados)
         VALUES ($1, 'novo_pedido', 'Novo pedido criado', $2, $3)`,
        [empresaId, `Pedido criado para ${cliente_nome} por ${nomeEmp}.`, JSON.stringify({pedido_id: pedidoId, cliente_id})]
      );
    }
    res.status(201).json({success: true, pedido_id: pedidoId});
  } catch (err: any) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Listar pedidos da empresa
app.get('/api/empresa/:empresaId/pedidos', async (req, res) => {
  try {
    const {empresaId} = req.params;
    const result = await pool.query(
      `SELECT p.*, 
        (SELECT json_agg(e ORDER BY e.ordem) FROM pedido_etapas e WHERE e.pedido_id = p.id) as etapas,
        (SELECT json_agg(f ORDER BY f.criado_em) FROM pedido_fotos f WHERE f.pedido_id = p.id) as fotos
       FROM pedidos p WHERE p.empresa_id=$1 ORDER BY p.criado_em DESC`,
      [empresaId]
    );
    res.json({success: true, pedidos: result.rows});
  } catch (err: any) {
    console.error('Erro ao listar pedidos:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Listar pedidos do cliente
app.get('/api/cliente/:clienteId/pedidos', async (req, res) => {
  try {
    const {clienteId} = req.params;
    const result = await pool.query(
      `SELECT p.*,
        (SELECT json_agg(e ORDER BY e.ordem) FROM pedido_etapas e WHERE e.pedido_id = p.id) as etapas,
        (SELECT json_agg(f ORDER BY f.criado_em) FROM pedido_fotos f WHERE f.pedido_id = p.id) as fotos,
        emp.nome_empresa
       FROM pedidos p JOIN empresas emp ON emp.id = p.empresa_id
       WHERE p.cliente_id=$1 ORDER BY p.criado_em DESC`,
      [clienteId]
    );
    res.json({success: true, pedidos: result.rows});
  } catch (err: any) {
    console.error('Erro ao listar pedidos do cliente:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Listar pedidos do despachante
app.get('/api/despachante/:despachanteId/pedidos', async (req, res) => {
  try {
    const {despachanteId} = req.params;
    const result = await pool.query(
      `SELECT p.*,
        (SELECT json_agg(e ORDER BY e.ordem) FROM pedido_etapas e WHERE e.pedido_id = p.id) as etapas,
        (SELECT json_agg(f ORDER BY f.criado_em) FROM pedido_fotos f WHERE f.pedido_id = p.id) as fotos,
        emp.nome_empresa
       FROM pedidos p JOIN empresas emp ON emp.id = p.empresa_id
       WHERE p.despachante_id=$1 ORDER BY p.criado_em DESC`,
      [despachanteId]
    );
    res.json({success: true, pedidos: result.rows});
  } catch (err: any) {
    console.error('Erro ao listar pedidos do despachante:', err);
    res.status(500).json({error: 'Erro interno do servidor.'});
  }
});

// Atualizar status do pedido
app.put('/api/pedidos/:pedidoId/status', async (req, res) => {
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

// Concluir etapa do pedido
app.put('/api/pedidos/:pedidoId/etapas/:etapaId/concluir', async (req, res) => {
  try {
    const {pedidoId, etapaId} = req.params;
    await pool.query('UPDATE pedido_etapas SET concluida=true, hora=NOW() WHERE id=$1 AND pedido_id=$2', [etapaId, pedidoId]);
    // Verifica se todas as etapas foram conclu\u00eddas
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

// === EXCURSÕES ===

// Listar excursões da empresa
app.get('/api/empresa/:id/excursoes', async (req, res) => {
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
app.post('/api/empresa/:id/excursoes', async (req, res) => {
  try {
    const {id} = req.params;
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
app.put('/api/excursoes/:excursaoId', async (req, res) => {
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
app.delete('/api/excursoes/:excursaoId', async (req, res) => {
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
app.put('/api/cliente/:id/alterar-senha', async (req, res) => {
  try {
    const {id} = req.params;
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
    console.error('Erro no cadastro cliente:', err);
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
    res.json({
      success: true,
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

// SPA fallback - serve index.html for non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API rodando em http://0.0.0.0:${PORT}`);
});
