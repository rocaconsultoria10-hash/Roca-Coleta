import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const LOCAL_DATABASE_URL = process.env.DATABASE_URL;
const RAILWAY_DATABASE_URL = process.env.RAILWAY_DATABASE_URL;

if (!LOCAL_DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não configurada no .env. Ela deve apontar para o PostgreSQL local roca_coleta."
  );
}

if (!RAILWAY_DATABASE_URL) {
  throw new Error(
    "RAILWAY_DATABASE_URL não configurada no .env. Ela deve receber a DATABASE_PUBLIC_URL do Postgres do Railway."
  );
}

const origem = new Pool({
  connectionString: LOCAL_DATABASE_URL,
});

const destino = new Pool({
  connectionString: RAILWAY_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

type Registro = Record<string, unknown>;

async function criarEstruturaRailway() {
  await destino.query(`
    CREATE TABLE IF NOT EXISTS empresas (
      id BIGINT PRIMARY KEY,
      "razaoSocial" TEXT NOT NULL DEFAULT '',
      "nomeFantasia" TEXT NOT NULL DEFAULT '',
      cnpj TEXT NOT NULL DEFAULT '',
      situacao TEXT NOT NULL DEFAULT 'ATIVA',
      "criadoEm" TEXT NOT NULL DEFAULT '',
      "atualizadoEm" TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_empresas_situacao
      ON empresas (situacao);

    CREATE TABLE IF NOT EXISTS usuarios (
      id BIGSERIAL PRIMARY KEY,
      usuario TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      senha TEXT NOT NULL,
      perfil TEXT NOT NULL DEFAULT 'COLETOR',
      "empresaId" BIGINT NOT NULL DEFAULT 0,
      "empresaIds" TEXT NOT NULL DEFAULT '[]',
      situacao TEXT NOT NULL DEFAULT 'ATIVO'
    );

    CREATE INDEX IF NOT EXISTS idx_usuarios_usuario
      ON usuarios (usuario);

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
      ON colaboradores ("empresaId", cargo);

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
}

async function destinoEstaVazio(): Promise<boolean> {
  const resultado = await destino.query(`
    SELECT
      (SELECT COUNT(*)::int FROM empresas) AS empresas,
      (SELECT COUNT(*)::int FROM usuarios) AS usuarios,
      (SELECT COUNT(*)::int FROM produtos) AS produtos,
      (SELECT COUNT(*)::int FROM colaboradores) AS colaboradores,
      (SELECT COUNT(*)::int FROM maquinas) AS maquinas,
      (SELECT COUNT(*)::int FROM receitas) AS receitas
  `);

  const linha = resultado.rows[0];

  return Object.values(linha).every(
    (valor) => Number(valor) === 0
  );
}

function jsonValor(valor: unknown): string {
  if (typeof valor === "string") {
    try {
      JSON.parse(valor);
      return valor;
    } catch {
      return JSON.stringify([]);
    }
  }

  if (valor === null || valor === undefined) {
    return JSON.stringify([]);
  }

  return JSON.stringify(valor);
}

async function inserirEmLotes(
  tabela: string,
  colunas: string[],
  registros: Registro[],
  jsonbColunas: Set<string> = new Set(),
  tamanhoLote = 500
) {
  if (registros.length === 0) {
    return;
  }

  for (let inicio = 0; inicio < registros.length; inicio += tamanhoLote) {
    const lote = registros.slice(inicio, inicio + tamanhoLote);
    const valores: unknown[] = [];
    let parametro = 1;

    const grupos = lote.map((registro) => {
      const marcadores = colunas.map((coluna) => {
        const valor = registro[coluna];

        if (jsonbColunas.has(coluna)) {
          valores.push(jsonValor(valor));
          return `$${parametro++}::jsonb`;
        }

        valores.push(valor);
        return `$${parametro++}`;
      });

      return `(${marcadores.join(", ")})`;
    });

    const colunasSql = colunas
      .map((coluna) => `"${coluna}"`)
      .join(", ");

    await destino.query(
      `
        INSERT INTO "${tabela}" (${colunasSql})
        VALUES ${grupos.join(", ")}
        ON CONFLICT ("id") DO NOTHING
      `,
      valores
    );

    const fim = Math.min(inicio + tamanhoLote, registros.length);
    console.log(`${tabela}: ${fim}/${registros.length}`);
  }
}

async function copiarTabela(
  tabela: string,
  colunas: string[],
  jsonbColunas: Set<string> = new Set()
) {
  const colunasSql = colunas
    .map((coluna) => `"${coluna}"`)
    .join(", ");

  const resultado = await origem.query(
    `SELECT ${colunasSql} FROM "${tabela}" ORDER BY "id"`
  );

  await inserirEmLotes(
    tabela,
    colunas,
    resultado.rows,
    jsonbColunas
  );

  return resultado.rowCount ?? resultado.rows.length;
}

async function ajustarSequencia(tabela: string) {
  await destino.query(`
    SELECT setval(
      pg_get_serial_sequence('${tabela}', 'id'),
      COALESCE((SELECT MAX(id) FROM "${tabela}"), 1),
      (SELECT COUNT(*) > 0 FROM "${tabela}")
    )
  `);
}

async function contar(pool: pg.Pool) {
  const resultado = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM empresas) AS empresas,
      (SELECT COUNT(*)::int FROM usuarios) AS usuarios,
      (SELECT COUNT(*)::int FROM produtos) AS produtos,
      (SELECT COUNT(*)::int FROM colaboradores) AS colaboradores,
      (SELECT COUNT(*)::int FROM maquinas) AS maquinas,
      (SELECT COUNT(*)::int FROM receitas) AS receitas
  `);

  return resultado.rows[0];
}

async function executar() {
  try {
    console.log("1/5 - Testando conexões...");

    const local = await origem.query(
      "SELECT current_database() AS banco"
    );

    const railway = await destino.query(
      "SELECT current_database() AS banco"
    );

    console.log(`Origem local: ${local.rows[0].banco}`);
    console.log(`Destino Railway: ${railway.rows[0].banco}`);

    console.log("2/5 - Criando estrutura no Railway...");
    await criarEstruturaRailway();

    const vazio = await destinoEstaVazio();

    if (!vazio) {
      throw new Error(
        "A migração foi interrompida por segurança. O banco do Railway já contém dados. Este script não apaga nem sobrescreve dados existentes."
      );
    }

    console.log("3/5 - Copiando dados...");

    const empresas = await copiarTabela(
      "empresas",
      [
        "id",
        "razaoSocial",
        "nomeFantasia",
        "cnpj",
        "situacao",
        "criadoEm",
        "atualizadoEm",
      ]
    );

    const usuarios = await copiarTabela(
      "usuarios",
      [
        "id",
        "usuario",
        "nome",
        "senha",
        "perfil",
        "empresaId",
        "empresaIds",
        "situacao",
      ]
    );

    const produtos = await copiarTabela(
      "produtos",
      [
        "id",
        "empresaId",
        "codigo",
        "codigoBarras",
        "descricao",
        "gramatura",
        "unidade",
        "departamento",
        "secao",
      ]
    );

    const colaboradores = await copiarTabela(
      "colaboradores",
      [
        "id",
        "empresaId",
        "matricula",
        "nome",
        "cargo",
        "setor",
        "empresa",
        "loja",
        "turno",
        "situacao",
      ]
    );

    const maquinas = await copiarTabela(
      "maquinas",
      [
        "id",
        "codigo",
        "descricao",
        "tipo",
        "setor",
      ]
    );

    const receitas = await copiarTabela(
      "receitas",
      [
        "id",
        "empresaId",
        "produtoId",
        "codigoProduto",
        "nomeProduto",
        "gramaturaProduto",
        "departamento",
        "secao",
        "dataColeta",
        "responsavelColeta",
        "estoqueCongelado",
        "validadeSugeridaDias",
        "validadeConservacao",
        "validadeMotivo",
        "validadeReferencias",
        "cargosEnvolvidos",
        "maquinas",
        "ingredientes",
        "embalagens",
        "fotos",
        "horaInicioProducao",
        "horaFinalProducao",
        "quantidadeProduzida",
        "unidadeMedidaProduto",
        "pesoTotalIngredientes",
        "pesoTotalProduzido",
        "unidadePesoProduzido",
        "modoPreparoProducao",
        "modoPreparoCliente",
        "criadoEm",
        "atualizadoEm",
      ],
      new Set([
        "validadeReferencias",
        "cargosEnvolvidos",
        "maquinas",
        "ingredientes",
        "embalagens",
        "fotos",
      ])
    );

    await ajustarSequencia("usuarios");
    await ajustarSequencia("produtos");
    await ajustarSequencia("colaboradores");
    await ajustarSequencia("maquinas");

    console.log("4/5 - Conferindo quantidades...");

    const origemContagem = await contar(origem);
    const destinoContagem = await contar(destino);

    console.table([
      { tabela: "empresas", local: origemContagem.empresas, railway: destinoContagem.empresas },
      { tabela: "usuarios", local: origemContagem.usuarios, railway: destinoContagem.usuarios },
      { tabela: "produtos", local: origemContagem.produtos, railway: destinoContagem.produtos },
      { tabela: "colaboradores", local: origemContagem.colaboradores, railway: destinoContagem.colaboradores },
      { tabela: "maquinas", local: origemContagem.maquinas, railway: destinoContagem.maquinas },
      { tabela: "receitas", local: origemContagem.receitas, railway: destinoContagem.receitas },
    ]);

    const confere =
      Number(origemContagem.empresas) === Number(destinoContagem.empresas) &&
      Number(origemContagem.usuarios) === Number(destinoContagem.usuarios) &&
      Number(origemContagem.produtos) === Number(destinoContagem.produtos) &&
      Number(origemContagem.colaboradores) === Number(destinoContagem.colaboradores) &&
      Number(origemContagem.maquinas) === Number(destinoContagem.maquinas) &&
      Number(origemContagem.receitas) === Number(destinoContagem.receitas);

    if (!confere) {
      throw new Error(
        "As quantidades do banco local e do Railway não conferem."
      );
    }

    console.log("5/5 - Migração concluída com sucesso.");
    console.log({
      empresas,
      usuarios,
      produtos,
      colaboradores,
      maquinas,
      receitas,
    });
  } finally {
    await origem.end();
    await destino.end();
  }
}

void executar().catch((error) => {
  console.error("ERRO NA MIGRAÇÃO:");
  console.error(error);
  process.exitCode = 1;
});