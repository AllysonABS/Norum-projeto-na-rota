// Para teste local, troque para seu IP local
// Produção: https://narota.norum.app
const API_URL = 'https://narota.norum.app';

export type EmpresaData = {
  id: string;
  nome_empresa: string;
  cnpj: string;
  nome_responsavel: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  horario_funcionamento?: string;
  status_assinatura: string;
};

type LoginResponse = {
  success: boolean;
  empresa?: EmpresaData;
  error?: string;
};

export async function loginUnificado(doc: string, senha: string): Promise<{
  success: boolean; tipo?: 'empresa' | 'despachante' | 'cliente';
  empresa?: EmpresaData; despachante?: DespachanteData; cliente?: ClienteData; error?: string;
}> {
  try {
    const res = await fetch(`${API_URL}/api/login-unificado`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({doc, senha}),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function loginEmpresa(cnpj: string, senha: string): Promise<LoginResponse> {
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({cnpj, senha}),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function buscarEmpresa(id: string): Promise<{success: boolean; empresa?: EmpresaData; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${id}`);
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function atualizarEmpresa(id: string, dados: Partial<EmpresaData>): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dados),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export type ClienteData = {
  id: string;
  nome: string;
  cpf: string;
  cnpj?: string;
  email: string;
  telefone: string;
  data_nascimento?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  data_cadastro?: string;
};

export async function cadastrarCliente(dados: {
  nome: string; cpf: string; cnpj?: string; email: string; telefone: string;
  data_nascimento?: string; endereco?: string; cidade?: string; estado?: string; cep?: string; senha: string;
}): Promise<{success: boolean; cliente_id?: string; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/cadastro-cliente`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dados),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function atualizarCliente(id: string, dados: Partial<ClienteData>): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/cliente/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dados),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function alterarSenhaCliente(id: string, senha_atual: string, nova_senha: string): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/cliente/${id}/alterar-senha`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({senha_atual, nova_senha}),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function loginCliente(cpf: string, senha: string): Promise<{success: boolean; cliente?: ClienteData; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/login-cliente`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({cpf, senha}),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export type LojaData = {
  id: string;
  nome_empresa: string;
  cidade: string;
  estado: string;
  horario_funcionamento?: string;
  data_vinculo?: string;
};

export async function listarTodasLojas(): Promise<{success: boolean; lojas?: LojaData[]; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/lojas`);
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function listarMinhasLojas(clienteId: string): Promise<{success: boolean; lojas?: LojaData[]; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/cliente/${clienteId}/lojas`);
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function vincularLoja(clienteId: string, empresaId: string): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/cliente/${clienteId}/vincular/${empresaId}`, {method: 'POST'});
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function desvincularLoja(clienteId: string, empresaId: string): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/cliente/${clienteId}/desvincular/${empresaId}`, {method: 'DELETE'});
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function listarClientesEmpresa(empresaId: string): Promise<{success: boolean; clientes?: any[]; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/clientes`);
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function atualizarVinculoCliente(vinculoId: string, dados: any): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/vinculo/${vinculoId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dados),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function bloquearVinculoCliente(vinculoId: string): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/vinculo/${vinculoId}/bloquear`, {method: 'PUT'});
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function excluirVinculoCliente(vinculoId: string): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/vinculo/${vinculoId}`, {method: 'DELETE'});
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function cadastrarClienteManual(empresaId: string, dados: {
  nome: string; cpf?: string; cnpj?: string; rg?: string; telefone?: string; email?: string;
  data_nascimento?: string; cep?: string; endereco?: string; cidade?: string; estado?: string; observacoes?: string;
}): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/cadastrar-cliente`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dados),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

// === PEDIDOS ===

export type PedidoEtapa = {id: string; nome: string; concluida: boolean; hora: string | null; ordem: number};
export type PedidoFoto = {id: string; url: string; etapa: string; criado_em: string};

export type PedidoData = {
  id: string;
  numero?: number;
  empresa_id: string;
  cliente_id: string | null;
  despachante_id: string | null;
  excursao_id: string | null;
  cliente_nome: string;
  despachante_nome: string;
  excursao_nome: string;
  volumes: number;
  descricao: string | null;
  observacao?: string | null;
  status: 'aguardando' | 'em_transito' | 'entregue';
  criado_em: string;
  atualizado_em: string;
  etapas: PedidoEtapa[] | null;
  fotos: PedidoFoto[] | null;
  nome_empresa?: string;
};

export async function criarPedido(empresaId: string, dados: {
  cliente_id?: string; despachante_id?: string; excursao_id?: string;
  cliente_nome: string; despachante_nome: string; excursao_nome: string;
  volumes: number; descricao?: string;
}): Promise<{success: boolean; pedido_id?: string; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/pedidos`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dados),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function listarPedidosEmpresa(empresaId: string): Promise<{success: boolean; pedidos?: PedidoData[]; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/pedidos`);
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function listarPedidosCliente(clienteId: string): Promise<{success: boolean; pedidos?: PedidoData[]; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/cliente/${clienteId}/pedidos`);
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function listarPedidosDespachante(despachanteId: string): Promise<{success: boolean; pedidos?: PedidoData[]; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/despachante/${despachanteId}/pedidos`);
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function atualizarStatusPedido(pedidoId: string, status: string): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/pedidos/${pedidoId}/status`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status}),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function concluirEtapaPedido(pedidoId: string, tipo: string): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/pedidos/${pedidoId}/concluir-etapas`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({tipo}),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function uploadFotoPedido(pedidoId: string, uri: string, etapa: string): Promise<{success: boolean; url?: string; error?: string}> {
  try {
    const formData = new FormData();
    formData.append('foto', {uri, name: 'foto.jpg', type: 'image/jpeg'} as any);
    formData.append('etapa', etapa);
    const res = await fetch(`${API_URL}/api/pedidos/${pedidoId}/fotos`, {
      method: 'POST',
      body: formData,
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function salvarObservacaoPedido(pedidoId: string, observacao: string): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/pedidos/${pedidoId}/observacao`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({observacao}),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

// === NOTIFICAÇÕES ===

export type NotificacaoData = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  dados: any;
  lida: boolean;
  criado_em: string;
};

export async function listarNotificacoes(empresaId: string): Promise<{success: boolean; notificacoes?: NotificacaoData[]; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/notificacoes`);
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function contarNotificacoesNaoLidas(empresaId: string): Promise<{success: boolean; total?: number; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/notificacoes/nao-lidas`);
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function marcarNotificacoesLidas(empresaId: string): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/notificacoes/marcar-lidas`, {method: 'PUT'});
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

// === DESPACHANTES ===

export type DespachanteData = {
  id: string;
  nome: string;
  cpf: string;
  telefone?: string;
  ativo?: boolean;
  empresas?: {id: string; nome_empresa: string}[];
};

export async function listarDespachantes(empresaId: string): Promise<{success: boolean; despachantes?: DespachanteData[]; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/despachantes`);
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function cadastrarDespachante(empresaId: string, dados: {nome: string; cpf: string; telefone?: string; senha: string}): Promise<{success: boolean; id?: string; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/despachantes`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dados),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function atualizarDespachante(despachanteId: string, dados: {nome: string; cpf: string; telefone?: string; senha?: string}): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/despachantes/${despachanteId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dados),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function toggleDespachante(despachanteId: string, empresaId: string): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/despachantes/${despachanteId}/toggle`, {method: 'PUT'});
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function excluirDespachante(despachanteId: string, empresaId: string): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/despachantes/${despachanteId}`, {method: 'DELETE'});
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function loginDespachante(cpf: string, senha: string): Promise<{success: boolean; despachante?: DespachanteData; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/login-despachante`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({cpf, senha}),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

// === EXCURSÕES ===

export type ExcursaoData = {
  id: string;
  nome: string;
  setor: string;
  vaga: string;
  responsavel: string;
  telefone?: string;
};

export async function listarExcursoes(empresaId: string): Promise<{success: boolean; excursoes?: ExcursaoData[]; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/excursoes`);
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function cadastrarExcursao(empresaId: string, dados: Omit<ExcursaoData, 'id'>): Promise<{success: boolean; id?: string; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/empresa/${empresaId}/excursoes`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dados),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function atualizarExcursao(excursaoId: string, dados: Omit<ExcursaoData, 'id'>): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/excursoes/${excursaoId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dados),
    });
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}

export async function excluirExcursao(excursaoId: string): Promise<{success: boolean; error?: string}> {
  try {
    const res = await fetch(`${API_URL}/api/excursoes/${excursaoId}`, {method: 'DELETE'});
    return await res.json();
  } catch {
    return {success: false, error: 'Erro de conexão com o servidor.'};
  }
}
