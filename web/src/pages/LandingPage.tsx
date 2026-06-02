import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-matriz text-clareza">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-20 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pulso rounded-lg flex items-center justify-center">
            <span className="text-matriz font-black text-lg">N</span>
          </div>
          <span className="text-xl font-bold">Na Rota</span>
        </div>
        <button
          onClick={() => navigate('/cadastro')}
          className="bg-pulso text-matriz font-bold px-6 py-2.5 rounded-lg hover:brightness-110 transition"
        >
          Começar agora
        </button>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-20 py-20 md:py-32 text-center max-w-4xl mx-auto">
        <div className="inline-block bg-pulso/10 border border-pulso/30 rounded-full px-4 py-1.5 mb-6">
          <span className="text-pulso text-sm font-semibold">✨ Gestão completa por R$69,90/mês</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
          Gerencie suas <span className="text-pulso">expedições</span> de forma inteligente
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Controle pedidos, despachantes, excursões e clientes em um só lugar. 
          Acompanhe tudo em tempo real direto do celular.
        </p>
        <button
          onClick={() => navigate('/cadastro')}
          className="bg-pulso text-matriz font-bold text-lg px-10 py-4 rounded-xl hover:brightness-110 transition shadow-lg shadow-pulso/30"
        >
          Criar minha conta →
        </button>
      </section>

      {/* Features */}
      <section className="px-6 md:px-20 py-20 bg-[#0F1F2E]">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          Tudo que você precisa para <span className="text-pulso">crescer</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {icon: '📦', title: 'Gestão de Pedidos', desc: 'Crie, acompanhe e gerencie todos os pedidos com timeline em tempo real e fotos.'},
            {icon: '🚚', title: 'Despachantes', desc: 'Atribua pedidos, acompanhe desempenho e veja quem está disponível.'},
            {icon: '👥', title: 'Clientes', desc: 'Cadastro completo com endereço, documentos e histórico de pedidos.'},
            {icon: '🗺️', title: 'Excursões', desc: 'Organize setores, vagas e responsáveis de cada excursão.'},
            {icon: '📈', title: 'Relatórios', desc: 'Taxa de entrega, tempo médio, ranking de despachantes e mais.'},
            {icon: '📱', title: 'App Mobile', desc: 'Seus clientes e despachantes acessam pelo celular com login próprio.'},
          ].map(f => (
            <div key={f.title} className="bg-[#162433] border border-[#1E3448] rounded-2xl p-8">
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 md:px-20 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Plano simples, sem surpresas</h2>
        <p className="text-gray-400 mb-12">Tudo incluso. Sem taxa de setup. Cancele quando quiser.</p>
        <div className="max-w-md mx-auto bg-[#162433] border border-[#1E3448] rounded-3xl p-10">
          <div className="bg-pulso/10 border border-pulso/30 rounded-full px-4 py-1 inline-block mb-6">
            <span className="text-pulso text-sm font-semibold">Plano Mensal</span>
          </div>
          <div className="mb-6">
            <span className="text-5xl font-black text-pulso">R$69</span>
            <span className="text-2xl font-bold text-pulso">,90</span>
            <span className="text-gray-400 text-lg">/mês</span>
          </div>
          <ul className="text-left space-y-3 mb-8">
            {[
              'Pedidos ilimitados',
              'Despachantes ilimitados',
              'Clientes ilimitados',
              'App para clientes e despachantes',
              'Relatórios completos',
              'Suporte via WhatsApp',
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <span className="text-pulso">✓</span>
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/cadastro')}
            className="w-full bg-pulso text-matriz font-bold text-lg py-4 rounded-xl hover:brightness-110 transition"
          >
            Começar agora
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-20 py-10 border-t border-[#1E3448] text-center">
        <p className="text-gray-500 text-sm">© 2025 Na Rota Transportes. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
