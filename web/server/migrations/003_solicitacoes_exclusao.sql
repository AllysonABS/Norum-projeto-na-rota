-- Tabela para armazenar solicitações de exclusão de dados (LGPD)
CREATE TABLE IF NOT EXISTS solicitacoes_exclusao (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  documento VARCHAR(14) NOT NULL,
  email TEXT NOT NULL,
  motivo TEXT DEFAULT 'Não informado',
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluida')),
  criado_em TIMESTAMP DEFAULT NOW(),
  concluido_em TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exclusao_documento ON solicitacoes_exclusao(documento);
