-- Tabela para armazenar códigos de recuperação de senha
CREATE TABLE IF NOT EXISTS recuperacao_senha (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cliente', 'empresa', 'despachante')),
  codigo VARCHAR(6) NOT NULL,
  expira_em TIMESTAMP NOT NULL,
  tentativas INT DEFAULT 0,
  usado BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_recuperacao_user ON recuperacao_senha(user_id, tipo);
