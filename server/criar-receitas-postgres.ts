import { pool } from "./db-postgres.js";

async function executar() {
  try {
    await pool.query(`
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

    const resultado = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("Estrutura PostgreSQL criada com sucesso.");
    console.table(resultado.rows);
  } catch (error) {
    console.error("Erro ao criar estrutura PostgreSQL:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void executar();