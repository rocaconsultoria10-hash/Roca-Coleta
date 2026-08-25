import "dotenv/config";
import { Pool } from "pg";

const DATABASE_URL =
  process.env.RAILWAY_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "RAILWAY_DATABASE_URL não configurada."
  );
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function executar() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id BIGINT PRIMARY KEY,
        "razaoSocial" TEXT NOT NULL DEFAULT '',
        "nomeFantasia" TEXT NOT NULL DEFAULT '',
        cnpj TEXT NOT NULL DEFAULT '',
        situacao TEXT NOT NULL DEFAULT 'ATIVA',
        "criadoEm" TEXT NOT NULL DEFAULT '',
        "atualizadoEm" TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id BIGSERIAL PRIMARY KEY,
        usuario TEXT NOT NULL,
        nome TEXT NOT NULL,
        senha TEXT NOT NULL,
        perfil TEXT NOT NULL,
        "empresaId" BIGINT NOT NULL DEFAULT 0,
        "empresaIds" TEXT NOT NULL DEFAULT '[]',
        situacao TEXT NOT NULL DEFAULT 'ATIVO'
      );

      CREATE TABLE IF NOT EXISTS produtos (
        id BIGSERIAL PRIMARY KEY,
        "empresaId" BIGINT NOT NULL,
        codigo TEXT NOT NULL DEFAULT '',
        "codigoBarras" TEXT NOT NULL DEFAULT '',
        descricao TEXT NOT NULL DEFAULT '',
        gramatura TEXT NOT NULL DEFAULT '',
        unidade TEXT NOT NULL DEFAULT '',
        departamento TEXT NOT NULL DEFAULT '',
        secao TEXT NOT NULL DEFAULT ''
      );

      CREATE INDEX IF NOT EXISTS idx_produtos_empresa
        ON produtos ("empresaId");

      CREATE INDEX IF NOT EXISTS idx_produtos_empresa_codigo
        ON produtos ("empresaId", codigo);

      CREATE INDEX IF NOT EXISTS idx_produtos_empresa_barras
        ON produtos ("empresaId", "codigoBarras");

      CREATE TABLE IF NOT EXISTS colaboradores (
        id BIGSERIAL PRIMARY KEY,
        "empresaId" BIGINT NOT NULL,
        matricula TEXT NOT NULL DEFAULT '',
        nome TEXT NOT NULL DEFAULT '',
        cargo TEXT NOT NULL DEFAULT '',
        setor TEXT NOT NULL DEFAULT '',
        empresa TEXT NOT NULL DEFAULT '',
        loja TEXT NOT NULL DEFAULT '',
        turno TEXT NOT NULL DEFAULT '',
        situacao TEXT NOT NULL DEFAULT 'ATIVO'
      );

      CREATE INDEX IF NOT EXISTS idx_colaboradores_empresa
        ON colaboradores ("empresaId");

      CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo
        ON colaboradores (cargo);

      CREATE TABLE IF NOT EXISTS maquinas (
        id BIGSERIAL PRIMARY KEY,
        codigo TEXT NOT NULL DEFAULT '',
        descricao TEXT NOT NULL DEFAULT '',
        tipo TEXT NOT NULL DEFAULT '',
        setor TEXT NOT NULL DEFAULT ''
      );

      CREATE INDEX IF NOT EXISTS idx_maquinas_descricao
        ON maquinas (descricao);

      CREATE TABLE IF NOT EXISTS receitas (
        id BIGINT PRIMARY KEY,
        "empresaId" BIGINT NOT NULL,
        "produtoId" BIGINT NOT NULL,

        "codigoProduto" TEXT NOT NULL DEFAULT '',
        "nomeProduto" TEXT NOT NULL DEFAULT '',
        "gramaturaProduto" TEXT NOT NULL DEFAULT '',
        departamento TEXT NOT NULL DEFAULT '',
        secao TEXT NOT NULL DEFAULT '',

        "dataColeta" TEXT NOT NULL DEFAULT '',
        "responsavelColeta" TEXT NOT NULL DEFAULT '',
        "estoqueCongelado" TEXT NOT NULL DEFAULT '',

        "validadeSugeridaDias" INTEGER,
        "validadeConservacao" TEXT NOT NULL DEFAULT '',
        "validadeMotivo" TEXT NOT NULL DEFAULT '',
        "validadeReferencias" JSONB NOT NULL DEFAULT '[]'::jsonb,

        "cargosEnvolvidos" JSONB NOT NULL DEFAULT '[]'::jsonb,
        maquinas JSONB NOT NULL DEFAULT '[]'::jsonb,
        ingredientes JSONB NOT NULL DEFAULT '[]'::jsonb,
        embalagens JSONB NOT NULL DEFAULT '[]'::jsonb,
        fotos JSONB NOT NULL DEFAULT '[]'::jsonb,

        "horaInicioProducao" TEXT NOT NULL DEFAULT '',
        "horaFinalProducao" TEXT NOT NULL DEFAULT '',
        "quantidadeProduzida" TEXT NOT NULL DEFAULT '',
        "unidadeMedidaProduto" TEXT NOT NULL DEFAULT '',
        "pesoTotalIngredientes" TEXT NOT NULL DEFAULT '',
        "pesoTotalProduzido" TEXT NOT NULL DEFAULT '',
        "unidadePesoProduzido" TEXT NOT NULL DEFAULT '',

        "modoPreparoProducao" TEXT NOT NULL DEFAULT '',
        "modoPreparoCliente" TEXT NOT NULL DEFAULT '',

        "criadoEm" TEXT NOT NULL DEFAULT '',
        "atualizadoEm" TEXT NOT NULL DEFAULT ''
      );

      CREATE INDEX IF NOT EXISTS idx_receitas_empresa
        ON receitas ("empresaId");

      CREATE INDEX IF NOT EXISTS idx_receitas_produto
        ON receitas ("produtoId");

      CREATE INDEX IF NOT EXISTS idx_receitas_empresa_produto
        ON receitas ("empresaId", "produtoId");
    `);

    console.log(
      "Estrutura Railway criada com sucesso."
    );
  } finally {
    await pool.end();
  }
}

void executar();