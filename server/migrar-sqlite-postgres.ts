import "dotenv/config";
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "./db-postgres.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bancoSqlitePath = path.join(
  __dirname,
  "data",
  "roca-coleta.db"
);

const sqlite = new Database(
  bancoSqlitePath,
  {
    readonly: true,
  }
);

async function migrarEmpresas() {
  const registros = sqlite
    .prepare(`
      SELECT
        id,
        razaoSocial,
        nomeFantasia,
        cnpj,
        situacao,
        criadoEm,
        atualizadoEm
      FROM empresas
      ORDER BY id
    `)
    .all() as Array<Record<string, unknown>>;

  for (const item of registros) {
    await pool.query(
      `
        INSERT INTO empresas (
          id,
          "razaoSocial",
          "nomeFantasia",
          cnpj,
          situacao,
          "criadoEm",
          "atualizadoEm"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id)
        DO UPDATE SET
          "razaoSocial" = EXCLUDED."razaoSocial",
          "nomeFantasia" = EXCLUDED."nomeFantasia",
          cnpj = EXCLUDED.cnpj,
          situacao = EXCLUDED.situacao,
          "criadoEm" = EXCLUDED."criadoEm",
          "atualizadoEm" = EXCLUDED."atualizadoEm"
      `,
      [
        item.id,
        item.razaoSocial,
        item.nomeFantasia,
        item.cnpj,
        item.situacao,
        item.criadoEm,
        item.atualizadoEm,
      ]
    );
  }

  return registros.length;
}

async function migrarUsuarios() {
  const registros = sqlite
    .prepare(`
      SELECT
        id,
        usuario,
        nome,
        senha,
        perfil,
        empresaId,
        empresaIds,
        situacao
      FROM usuarios
      ORDER BY id
    `)
    .all() as Array<Record<string, unknown>>;

  for (const item of registros) {
    await pool.query(
      `
        INSERT INTO usuarios (
          id,
          usuario,
          nome,
          senha,
          perfil,
          "empresaId",
          "empresaIds",
          situacao
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id)
        DO UPDATE SET
          usuario = EXCLUDED.usuario,
          nome = EXCLUDED.nome,
          senha = EXCLUDED.senha,
          perfil = EXCLUDED.perfil,
          "empresaId" = EXCLUDED."empresaId",
          "empresaIds" = EXCLUDED."empresaIds",
          situacao = EXCLUDED.situacao
      `,
      [
        item.id,
        item.usuario,
        item.nome,
        item.senha,
        item.perfil,
        item.empresaId,
        item.empresaIds,
        item.situacao,
      ]
    );
  }

  await pool.query(`
    SELECT setval(
      pg_get_serial_sequence('usuarios', 'id'),
      COALESCE((SELECT MAX(id) FROM usuarios), 1),
      true
    )
  `);

  return registros.length;
}

async function migrarProdutos() {
  const registros = sqlite
    .prepare(`
      SELECT
        id,
        empresaId,
        codigo,
        codigoBarras,
        descricao,
        gramatura,
        unidade,
        departamento,
        secao
      FROM produtos
      ORDER BY id
    `)
    .all() as Array<Record<string, unknown>>;

  for (const item of registros) {
    await pool.query(
      `
        INSERT INTO produtos (
          id,
          "empresaId",
          codigo,
          "codigoBarras",
          descricao,
          gramatura,
          unidade,
          departamento,
          secao
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id)
        DO UPDATE SET
          "empresaId" = EXCLUDED."empresaId",
          codigo = EXCLUDED.codigo,
          "codigoBarras" = EXCLUDED."codigoBarras",
          descricao = EXCLUDED.descricao,
          gramatura = EXCLUDED.gramatura,
          unidade = EXCLUDED.unidade,
          departamento = EXCLUDED.departamento,
          secao = EXCLUDED.secao
      `,
      [
        item.id,
        item.empresaId,
        item.codigo,
        item.codigoBarras,
        item.descricao,
        item.gramatura,
        item.unidade,
        item.departamento,
        item.secao,
      ]
    );
  }

  await pool.query(`
    SELECT setval(
      pg_get_serial_sequence('produtos', 'id'),
      COALESCE((SELECT MAX(id) FROM produtos), 1),
      true
    )
  `);

  return registros.length;
}

async function migrarColaboradores() {
  const registros = sqlite
    .prepare(`
      SELECT
        id,
        empresaId,
        matricula,
        nome,
        cargo,
        setor,
        empresa,
        loja,
        turno,
        situacao
      FROM colaboradores
      ORDER BY id
    `)
    .all() as Array<Record<string, unknown>>;

  for (const item of registros) {
    await pool.query(
      `
        INSERT INTO colaboradores (
          id,
          "empresaId",
          matricula,
          nome,
          cargo,
          setor,
          empresa,
          loja,
          turno,
          situacao
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id)
        DO UPDATE SET
          "empresaId" = EXCLUDED."empresaId",
          matricula = EXCLUDED.matricula,
          nome = EXCLUDED.nome,
          cargo = EXCLUDED.cargo,
          setor = EXCLUDED.setor,
          empresa = EXCLUDED.empresa,
          loja = EXCLUDED.loja,
          turno = EXCLUDED.turno,
          situacao = EXCLUDED.situacao
      `,
      [
        item.id,
        item.empresaId,
        item.matricula,
        item.nome,
        item.cargo,
        item.setor,
        item.empresa,
        item.loja,
        item.turno,
        item.situacao,
      ]
    );
  }

  await pool.query(`
    SELECT setval(
      pg_get_serial_sequence(
        'colaboradores',
        'id'
      ),
      COALESCE(
        (
          SELECT MAX(id)
          FROM colaboradores
        ),
        1
      ),
      true
    )
  `);

  return registros.length;
}

async function migrarMaquinas() {
  const registros = sqlite
    .prepare(`
      SELECT
        id,
        codigo,
        descricao,
        tipo,
        setor
      FROM maquinas
      ORDER BY id
    `)
    .all() as Array<Record<string, unknown>>;

  for (const item of registros) {
    await pool.query(
      `
        INSERT INTO maquinas (
          id,
          codigo,
          descricao,
          tipo,
          setor
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id)
        DO UPDATE SET
          codigo = EXCLUDED.codigo,
          descricao = EXCLUDED.descricao,
          tipo = EXCLUDED.tipo,
          setor = EXCLUDED.setor
      `,
      [
        item.id,
        item.codigo,
        item.descricao,
        item.tipo,
        item.setor,
      ]
    );
  }

  await pool.query(`
    SELECT setval(
      pg_get_serial_sequence('maquinas', 'id'),
      COALESCE((SELECT MAX(id) FROM maquinas), 1),
      true
    )
  `);

  return registros.length;
}

async function executar() {
  const cliente = await pool.connect();

  try {
    console.log(
      "Iniciando migração SQLite → PostgreSQL..."
    );

    await cliente.query("BEGIN");

    const empresas =
      await migrarEmpresas();

    const usuarios =
      await migrarUsuarios();

    const produtos =
      await migrarProdutos();

    const colaboradores =
      await migrarColaboradores();

    const maquinas =
      await migrarMaquinas();

    await cliente.query("COMMIT");

    console.log(
      "Migração concluída com sucesso."
    );

    console.table([
      {
        tabela: "empresas",
        quantidade: empresas,
      },
      {
        tabela: "usuarios",
        quantidade: usuarios,
      },
      {
        tabela: "produtos",
        quantidade: produtos,
      },
      {
        tabela: "colaboradores",
        quantidade: colaboradores,
      },
      {
        tabela: "maquinas",
        quantidade: maquinas,
      },
    ]);
  } catch (error) {
    await cliente.query("ROLLBACK");

    console.error(
      "Erro na migração SQLite → PostgreSQL:",
      error
    );

    process.exitCode = 1;
  } finally {
    cliente.release();
    sqlite.close();
    await pool.end();
  }
}

void executar();