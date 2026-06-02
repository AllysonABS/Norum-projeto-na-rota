import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CadastroPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({
    nome_empresa: '',
    cnpj: '',
    nome_responsavel: '',
    email: '',
    telefone: '',
    senha: '',
    confirmar_senha: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({...prev, [field]: value}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!form.nome_empresa || !form.cnpj || !form.email || !form.senha || !form.nome_responsavel || !form.telefone) {
      setErro('Preencha todos os campos obrigatórios.'); return;
    }
    if (form.senha !== form.confirmar_senha) {
      setErro('As senhas não coincidem.'); return;
    }
    if (form.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.'); return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/cadastro', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro ao cadastrar.'); setLoading(false); return; }
      setSucesso(true);
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    }
    setLoading(false);
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-matriz flex items-center justify-center px-6">
        <div className="bg-[#162433] border border-[#1E3448] rounded-3xl p-12 text-center max-w-md w-full">
          <span className="text-5xl mb-6 block">🎉</span>
          <h1 className="text-2xl font-bold text-clareza mb-4">Cadastro realizado!</h1>
          <p className="text-gray-400 mb-8">Sua conta foi criada com sucesso. Use seu e-mail e senha para acessar o aplicativo Na Rota.</p>
          <button onClick={() => navigate('/')} className="w-full bg-pulso text-matriz font-bold py-3 rounded-xl hover:brightness-110 transition">
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matriz py-10 px-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <button onClick={() => navigate('/')} className="text-pulso text-sm font-semibold mb-6 inline-block">← Voltar</button>
          <h1 className="text-3xl font-bold text-clareza mb-2">Criar sua conta</h1>
          <p className="text-gray-400">Preencha os dados da sua empresa para começar.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#162433] border border-[#1E3448] rounded-2xl p-8 space-y-5">
          <h2 className="text-pulso font-bold text-sm uppercase tracking-wider">Dados da Empresa</h2>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1">Nome da empresa *</label>
            <input type="text" value={form.nome_empresa} onChange={e => update('nome_empresa', e.target.value)}
              className="w-full h-12 bg-[#0F1F2E] border border-[#1E3448] rounded-lg px-4 text-clareza focus:border-pulso outline-none transition" />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1">CNPJ *</label>
            <input type="text" value={form.cnpj} onChange={e => update('cnpj', e.target.value)} placeholder="00.000.000/0001-00"
              className="w-full h-12 bg-[#0F1F2E] border border-[#1E3448] rounded-lg px-4 text-clareza focus:border-pulso outline-none transition" />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1">Nome do responsável *</label>
            <input type="text" value={form.nome_responsavel} onChange={e => update('nome_responsavel', e.target.value)}
              className="w-full h-12 bg-[#0F1F2E] border border-[#1E3448] rounded-lg px-4 text-clareza focus:border-pulso outline-none transition" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm font-medium block mb-1">E-mail *</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className="w-full h-12 bg-[#0F1F2E] border border-[#1E3448] rounded-lg px-4 text-clareza focus:border-pulso outline-none transition" />
            </div>
            <div>
              <label className="text-gray-400 text-sm font-medium block mb-1">Telefone *</label>
              <input type="text" value={form.telefone} onChange={e => update('telefone', e.target.value)} placeholder="(00) 00000-0000"
                className="w-full h-12 bg-[#0F1F2E] border border-[#1E3448] rounded-lg px-4 text-clareza focus:border-pulso outline-none transition" />
            </div>
          </div>

          <h2 className="text-pulso font-bold text-sm uppercase tracking-wider pt-4">Endereço</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-gray-400 text-sm font-medium block mb-1">Cidade</label>
              <input type="text" value={form.cidade} onChange={e => update('cidade', e.target.value)}
                className="w-full h-12 bg-[#0F1F2E] border border-[#1E3448] rounded-lg px-4 text-clareza focus:border-pulso outline-none transition" />
            </div>
            <div>
              <label className="text-gray-400 text-sm font-medium block mb-1">UF</label>
              <input type="text" value={form.estado} onChange={e => update('estado', e.target.value)} maxLength={2}
                className="w-full h-12 bg-[#0F1F2E] border border-[#1E3448] rounded-lg px-4 text-clareza focus:border-pulso outline-none transition uppercase" />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1">Endereço completo</label>
            <input type="text" value={form.endereco} onChange={e => update('endereco', e.target.value)}
              className="w-full h-12 bg-[#0F1F2E] border border-[#1E3448] rounded-lg px-4 text-clareza focus:border-pulso outline-none transition" />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1">CEP</label>
            <input type="text" value={form.cep} onChange={e => update('cep', e.target.value)} placeholder="00000-000"
              className="w-full h-12 bg-[#0F1F2E] border border-[#1E3448] rounded-lg px-4 text-clareza focus:border-pulso outline-none transition" />
          </div>

          <h2 className="text-pulso font-bold text-sm uppercase tracking-wider pt-4">Acesso</h2>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1">Senha *</label>
            <input type="password" value={form.senha} onChange={e => update('senha', e.target.value)} placeholder="Mínimo 6 caracteres"
              className="w-full h-12 bg-[#0F1F2E] border border-[#1E3448] rounded-lg px-4 text-clareza focus:border-pulso outline-none transition" />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium block mb-1">Confirmar senha *</label>
            <input type="password" value={form.confirmar_senha} onChange={e => update('confirmar_senha', e.target.value)}
              className="w-full h-12 bg-[#0F1F2E] border border-[#1E3448] rounded-lg px-4 text-clareza focus:border-pulso outline-none transition" />
          </div>

          {erro && <p className="text-red-400 text-sm">{erro}</p>}

          <div className="bg-[#0F1F2E] border border-[#1E3448] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-clareza font-semibold">Plano Mensal</p>
              <p className="text-gray-400 text-sm">Acesso completo ao sistema</p>
            </div>
            <p className="text-pulso font-black text-xl">R$69,90</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-pulso text-matriz font-bold text-lg rounded-xl hover:brightness-110 transition disabled:opacity-60"
          >
            {loading ? 'Cadastrando...' : 'Finalizar cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
}
