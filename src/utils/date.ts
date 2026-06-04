const TZ = 'America/Sao_Paulo';

export function formatHora(date: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit', timeZone: TZ});
}

export function formatData(date: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', timeZone: TZ});
}

export function formatDataMesAno(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR', {month: 'short', year: 'numeric', timeZone: TZ});
}

export function tempoAtras(date: string): string {
  const agora = Date.now();
  const criado = new Date(date).getTime();
  const diff = agora - criado;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Agora';
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}
