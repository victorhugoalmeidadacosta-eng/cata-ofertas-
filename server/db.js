const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("Falta a variavel DATABASE_URL (veja o passo a passo do Render).");
  process.exit(1);
}

const precisaSSL = !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: precisaSSL ? { rejectUnauthorized: false } : false
});

const query = (texto, params) => pool.query(texto, params);

async function iniciarBanco() {
  await query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      whatsapp TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      papel TEXT NOT NULL DEFAULT 'cliente',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS parceiras (
      codigo TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      cidade TEXT,
      pix TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE SEQUENCE IF NOT EXISTS seq_venda START 1;
    CREATE SEQUENCE IF NOT EXISTS seq_interesse START 1;
    CREATE TABLE IF NOT EXISTS solicitacoes (
      id TEXT PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id),
      nome TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      cidade TEXT,
      produto TEXT NOT NULL,
      categoria TEXT,
      estado TEXT,
      valor NUMERIC(12,2) NOT NULL DEFAULT 0,
      descricao TEXT,
      parceira TEXT,
      comissao NUMERIC(12,2) NOT NULL DEFAULT 0,
      comissao_paga BOOLEAN NOT NULL DEFAULT false,
      foto TEXT,
      aprovacao TEXT NOT NULL DEFAULT 'pendente',
      status TEXT NOT NULL DEFAULT 'recebido',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS interesses (
      id TEXT PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id),
      nome TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      produto_id INTEGER,
      produto TEXT NOT NULL,
      valor NUMERIC(12,2) NOT NULL DEFAULT 0,
      obs TEXT,
      parceira TEXT,
      comissao NUMERIC(12,2) NOT NULL DEFAULT 0,
      comissao_paga BOOLEAN NOT NULL DEFAULT false,
      status TEXT NOT NULL DEFAULT 'novo',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await query("ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS foto TEXT");
}

module.exports = { pool, query, iniciarBanco };
