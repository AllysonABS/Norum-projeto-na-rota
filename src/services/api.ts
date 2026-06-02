// Para teste local, troque para seu IP local
// Para produção no VPS: http://76.13.70.131:3001
const API_URL = 'http://192.168.15.16:3001';

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
  cidade?: string;
  estado?: string;
  cep?: string;
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

// === EXCURSÕES ===

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
