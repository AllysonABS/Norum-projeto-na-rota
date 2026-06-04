function parseUTC(date: string): Date {
  // O banco retorna timestamps sem timezone indicator
  // Forcamos interpretacao como UTC adicionando Z
  const d = date.includes('Z') || date.includes('+') ? date : date.replace(' ', 'T') + 'Z';
  return new Date(d);
}

export function formatHora(date: string | null): string {
  if (!date) return '';
  return parseUTC(date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'});
}

export function formatData(date: string | null): string {
  if (!date) return '';
  return parseUTC(date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo'});
}

export function formatDataMesAno(date: string | null): string {
  if (!date) return '—';
  return parseUTC(date).toLocaleDateString('pt-BR', {month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo'});
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
