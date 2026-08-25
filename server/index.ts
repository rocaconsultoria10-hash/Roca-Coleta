import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";

import { pool } from "./db-postgres.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

type ProdutoEntrada = {
  codigo?: unknown;
  codigoBarras?: unknown;
  descricao?: unknown;
  gramatura?: unknown;
  unidade?: unknown;
  departamento?: unknown;
  secao?: unknown;
};

function texto(valor: unknown): string {
  return String(valor ?? "").trim();
}

function numeroPositivo(valor: unknown): number | null {
  const numero = Number(valor);

  return Number.isFinite(numero) && numero > 0
    ? numero
    : null;
}

function listaJson(valor: unknown): unknown[] {
  return Array.isArray(valor)
    ? valor
    : [];
}

function empresaIdsDoBanco(valor: unknown): number[] {
  if (Array.isArray(valor)) {
    return valor
      .map(Number)
      .filter(
        (id) =>
          Number.isFinite(id) &&
          id > 0
      );
  }

  try {
    const parsed = JSON.parse(
      String(valor || "[]")
    );

    return Array.isArray(parsed)
      ? parsed
          .map(Number)
          .filter(
            (id) =>
              Number.isFinite(id) &&
              id > 0
          )
      : [];
  } catch {
    return [];
  }
}

app.get("/api/empresas", async (_req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id,
        "razaoSocial",
        "nomeFantasia",
        cnpj,
        situacao,
        "criadoEm",
        "atualizadoEm"
      FROM empresas
      ORDER BY
        LOWER("nomeFantasia"),
        LOWER("razaoSocial")
    `);

    return res.json({
      sucesso: true,
      dados: resultado.rows,
    });
  } catch (error) {
    console.error(
      "Erro ao listar empresas:",
      error
    );

    return res.status(500).json({
      erro:
        "Não foi possível listar as empresas.",
    });
  }
});

app.post("/api/empresas", async (req, res) => {
  try {
    const idRecebido = Number(
      req.body?.id
    );

    const id =
      Number.isFinite(idRecebido) &&
      idRecebido > 0
        ? idRecebido
        : Date.now();

    const razaoSocial = texto(
      req.body?.razaoSocial
    );

    const nomeFantasia = texto(
      req.body?.nomeFantasia
    );

    const cnpj = texto(
      req.body?.cnpj
    );

    const situacao =
      texto(req.body?.situacao) ||
      "ATIVA";

    const agora =
      new Date().toISOString();

    const criadoEm =
      texto(req.body?.criadoEm) ||
      agora;

    const atualizadoEm =
      texto(req.body?.atualizadoEm) ||
      agora;

    if (
      !razaoSocial &&
      !nomeFantasia
    ) {
      return res.status(400).json({
        erro: "Informe a empresa.",
      });
    }

    const existente =
      await pool.query(
        `
          SELECT id
          FROM empresas
          WHERE id = $1
          LIMIT 1
        `,
        [id]
      );

    if (
      existente.rowCount &&
      existente.rowCount > 0
    ) {
      return res.status(409).json({
        erro:
          "Empresa já cadastrada.",
      });
    }

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
        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7
        )
      `,
      [
        id,
        razaoSocial,
        nomeFantasia,
        cnpj,
        situacao,
        criadoEm,
        atualizadoEm,
      ]
    );

    return res.status(201).json({
      sucesso: true,
      dados: {
        id,
        razaoSocial,
        nomeFantasia,
        cnpj,
        situacao,
        criadoEm,
        atualizadoEm,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao cadastrar empresa:",
      error
    );

    return res.status(500).json({
      erro:
        "Não foi possível cadastrar a empresa.",
    });
  }
});

app.put(
  "/api/empresas/:id",
  async (req, res) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !Number.isFinite(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          erro: "Empresa inválida.",
        });
      }

      const atualResultado =
        await pool.query(
          `
            SELECT *
            FROM empresas
            WHERE id = $1
            LIMIT 1
          `,
          [id]
        );

      const atual =
        atualResultado.rows[0];

      if (!atual) {
        return res.status(404).json({
          erro:
            "Empresa não encontrada.",
        });
      }

      const razaoSocial =
        req.body?.razaoSocial !==
        undefined
          ? texto(
              req.body.razaoSocial
            )
          : String(
              atual.razaoSocial ?? ""
            );

      const nomeFantasia =
        req.body?.nomeFantasia !==
        undefined
          ? texto(
              req.body.nomeFantasia
            )
          : String(
              atual.nomeFantasia ?? ""
            );

      const cnpj =
        req.body?.cnpj !==
        undefined
          ? texto(req.body.cnpj)
          : String(
              atual.cnpj ?? ""
            );

      const situacao =
        req.body?.situacao !==
        undefined
          ? texto(
              req.body.situacao
            )
          : String(
              atual.situacao ??
                "ATIVA"
            );

      const atualizadoEm =
        new Date().toISOString();

      await pool.query(
        `
          UPDATE empresas
          SET
            "razaoSocial" = $1,
            "nomeFantasia" = $2,
            cnpj = $3,
            situacao = $4,
            "atualizadoEm" = $5
          WHERE id = $6
        `,
        [
          razaoSocial,
          nomeFantasia,
          cnpj,
          situacao,
          atualizadoEm,
          id,
        ]
      );

      return res.json({
        sucesso: true,
        dados: {
          id,
          razaoSocial,
          nomeFantasia,
          cnpj,
          situacao,
          criadoEm: String(
            atual.criadoEm ?? ""
          ),
          atualizadoEm,
        },
      });
    } catch (error) {
      console.error(
        "Erro ao atualizar empresa:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível atualizar a empresa.",
      });
    }
  }
);

app.delete(
  "/api/empresas/:id",
  async (req, res) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !Number.isFinite(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          erro: "Empresa inválida.",
        });
      }

      await pool.query(
        `
          DELETE FROM empresas
          WHERE id = $1
        `,
        [id]
      );

      return res.json({
        sucesso: true,
      });
    } catch (error) {
      console.error(
        "Erro ao remover empresa:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível remover a empresa.",
      });
    }
  }
);

app.get(
  "/api/usuarios",
  async (_req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT
            id,
            usuario,
            nome,
            senha,
            perfil,
            "empresaId",
            "empresaIds",
            situacao
          FROM usuarios
          ORDER BY LOWER(nome)
        `);

      return res.json({
        sucesso: true,
        dados: resultado.rows.map(
          (item) => ({
            ...item,
            empresaIds:
              empresaIdsDoBanco(
                item.empresaIds
              ),
          })
        ),
      });
    } catch (error) {
      console.error(
        "Erro ao listar usuários:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível listar os usuários.",
      });
    }
  }
);

app.post(
  "/api/usuarios",
  async (req, res) => {
    try {
      const usuario = texto(
        req.body?.usuario
      ).toLowerCase();

      const nome = texto(
        req.body?.nome
      );

      const senha = texto(
        req.body?.senha
      );

      const perfil =
        texto(req.body?.perfil) ||
        "COLETOR";

      const situacao =
        texto(req.body?.situacao) ||
        "ATIVO";

      const empresaIds =
        Array.isArray(
          req.body?.empresaIds
        )
          ? req.body.empresaIds
              .map(Number)
              .filter(
                (id: number) =>
                  Number.isFinite(id) &&
                  id > 0
              )
          : [];

      const empresaId =
        empresaIds[0] ??
        Number(
          req.body?.empresaId
        ) ??
        0;

      if (
        !usuario ||
        !nome ||
        !senha
      ) {
        return res.status(400).json({
          erro:
            "Nome, usuário e senha são obrigatórios.",
        });
      }

      const existe =
        await pool.query(
          `
            SELECT id
            FROM usuarios
            WHERE LOWER(usuario) =
              LOWER($1)
            LIMIT 1
          `,
          [usuario]
        );

      if (
        existe.rowCount &&
        existe.rowCount > 0
      ) {
        return res.status(409).json({
          erro:
            "Este usuário já está cadastrado.",
        });
      }

      const resultado =
        await pool.query(
          `
            INSERT INTO usuarios (
              usuario,
              nome,
              senha,
              perfil,
              "empresaId",
              "empresaIds",
              situacao
            )
            VALUES (
              $1, $2, $3, $4,
              $5, $6, $7
            )
            RETURNING id
          `,
          [
            usuario,
            nome,
            senha,
            perfil,
            empresaId,
            JSON.stringify(
              empresaIds
            ),
            situacao,
          ]
        );

      const id = Number(
        resultado.rows[0].id
      );

      return res
        .status(201)
        .json({
          sucesso: true,
          dados: {
            id,
            usuario,
            nome,
            senha,
            perfil,
            empresaId,
            empresaIds,
            situacao,
          },
        });
    } catch (error) {
      console.error(
        "Erro ao cadastrar usuário:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível cadastrar o usuário.",
      });
    }
  }
);

app.put(
  "/api/usuarios/:id",
  async (req, res) => {
    try {
      const id = Number(
        req.params.id
      );

      const usuario = texto(
        req.body?.usuario
      ).toLowerCase();

      const nome = texto(
        req.body?.nome
      );

      const senha = texto(
        req.body?.senha
      );

      const perfil =
        texto(req.body?.perfil) ||
        "COLETOR";

      const situacao =
        texto(req.body?.situacao) ||
        "ATIVO";

      const empresaIds =
        Array.isArray(
          req.body?.empresaIds
        )
          ? req.body.empresaIds
              .map(Number)
              .filter(
                (
                  empresaId: number
                ) =>
                  Number.isFinite(
                    empresaId
                  ) &&
                  empresaId > 0
              )
          : [];

      const empresaId =
        empresaIds[0] ??
        Number(
          req.body?.empresaId
        ) ??
        0;

      if (
        !Number.isFinite(id) ||
        id <= 0 ||
        !usuario ||
        !nome ||
        !senha
      ) {
        return res.status(400).json({
          erro:
            "Dados do usuário inválidos.",
        });
      }

      const resultado =
        await pool.query(
          `
            UPDATE usuarios
            SET
              usuario = $1,
              nome = $2,
              senha = $3,
              perfil = $4,
              "empresaId" = $5,
              "empresaIds" = $6,
              situacao = $7
            WHERE id = $8
          `,
          [
            usuario,
            nome,
            senha,
            perfil,
            empresaId,
            JSON.stringify(
              empresaIds
            ),
            situacao,
            id,
          ]
        );

      if (
        resultado.rowCount === 0
      ) {
        return res.status(404).json({
          erro:
            "Usuário não encontrado.",
        });
      }

      return res.json({
        sucesso: true,
        dados: {
          id,
          usuario,
          nome,
          senha,
          perfil,
          empresaId,
          empresaIds,
          situacao,
        },
      });
    } catch (error) {
      console.error(
        "Erro ao atualizar usuário:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível atualizar o usuário.",
      });
    }
  }
);

app.post(
  "/api/login",
  async (req, res) => {
    try {
      const usuario = texto(
        req.body?.usuario
      ).toLowerCase();

      const senha = texto(
        req.body?.senha
      );

      const resultado =
        await pool.query(
          `
            SELECT
              id,
              usuario,
              nome,
              senha,
              perfil,
              "empresaId",
              "empresaIds",
              situacao
            FROM usuarios
            WHERE
              LOWER(usuario) =
                LOWER($1)
              AND senha = $2
              AND situacao = 'ATIVO'
            LIMIT 1
          `,
          [usuario, senha]
        );

      const encontrado =
        resultado.rows[0];

      if (!encontrado) {
        return res.status(401).json({
          erro:
            "Usuário ou senha inválidos.",
        });
      }

      return res.json({
        sucesso: true,
        dados: {
          ...encontrado,
          empresaIds:
            empresaIdsDoBanco(
              encontrado.empresaIds
            ),
        },
      });
    } catch (error) {
      console.error(
        "Erro no login:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível realizar o login.",
      });
    }
  }
);

app.get(
  "/api/saude",
  async (_req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT
            current_database()
              AS banco,
            NOW() AS agora
        `);

      return res.json({
        sucesso: true,
        banco:
          resultado.rows[0]?.banco,
        agora:
          resultado.rows[0]?.agora,
      });
    } catch (error) {
      console.error(
        "Erro ao verificar banco:",
        error
      );

      return res.status(500).json({
        sucesso: false,
        erro:
          "PostgreSQL indisponível.",
      });
    }
  }
);

app.post(
  "/api/produtos/importar",
  async (req, res) => {
    const empresaId = Number(
      req.body?.empresaId
    );

    const produtos =
      req.body?.produtos;

    if (
      !Number.isFinite(
        empresaId
      ) ||
      empresaId <= 0
    ) {
      return res.status(400).json({
        erro:
          "Empresa não informada.",
      });
    }

    if (
      !Array.isArray(produtos)
    ) {
      return res.status(400).json({
        erro:
          "Lista de produtos não informada.",
      });
    }

    const cliente =
      await pool.connect();

    try {
      await cliente.query("BEGIN");

      await cliente.query(
        `
          DELETE FROM produtos
          WHERE "empresaId" = $1
        `,
        [empresaId]
      );

      let quantidade = 0;

      for (
        const produto
        of produtos as ProdutoEntrada[]
      ) {
        const codigo = texto(
          produto.codigo
        );

        const descricao = texto(
          produto.descricao
        );

        if (
          !codigo &&
          !descricao
        ) {
          continue;
        }

        await cliente.query(
          `
            INSERT INTO produtos (
              "empresaId",
              codigo,
              "codigoBarras",
              descricao,
              gramatura,
              unidade,
              departamento,
              secao
            )
            VALUES (
              $1, $2, $3, $4,
              $5, $6, $7, $8
            )
          `,
          [
            empresaId,
            codigo,
            texto(
              produto.codigoBarras
            ),
            descricao,
            texto(
              produto.gramatura
            ),
            texto(
              produto.unidade
            ),
            texto(
              produto.departamento
            ),
            texto(
              produto.secao
            ),
          ]
        );

        quantidade += 1;
      }

      await cliente.query(
        "COMMIT"
      );

      return res.json({
        sucesso: true,
        empresaId,
        quantidade,
      });
    } catch (error) {
      await cliente.query(
        "ROLLBACK"
      );

      console.error(
        "Erro ao importar produtos:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível gravar os produtos.",
      });
    } finally {
      cliente.release();
    }
  }
);

app.get(
  "/api/produtos",
  async (req, res) => {
    try {
      const empresaId = Number(
        req.query.empresaId
      );

      if (
        !Number.isFinite(
          empresaId
        ) ||
        empresaId <= 0
      ) {
        return res.status(400).json({
          erro:
            "Empresa não informada.",
        });
      }

      const resultado =
        await pool.query(
          `
            SELECT
              id,
              "empresaId",
              codigo,
              "codigoBarras",
              descricao,
              gramatura,
              unidade,
              departamento,
              secao
            FROM produtos
            WHERE "empresaId" = $1
            ORDER BY
              LOWER(descricao),
              codigo
          `,
          [empresaId]
        );

      return res.json({
        sucesso: true,
        dados: resultado.rows,
      });
    } catch (error) {
      console.error(
        "Erro ao listar produtos:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível listar os produtos.",
      });
    }
  }
);

app.get(
  "/api/produtos/buscar",
  async (req, res) => {
    try {
      const empresaId = Number(
        req.query.empresaId
      );

      const termo = texto(
        req.query.termo
      );

      if (
        !Number.isFinite(
          empresaId
        ) ||
        empresaId <= 0
      ) {
        return res.status(400).json({
          erro:
            "Empresa não informada.",
        });
      }

      if (!termo) {
        return res.json({
          sucesso: true,
          dados: [],
        });
      }

      const pesquisa =
        `%${termo}%`;

      const resultado =
        await pool.query(
          `
            SELECT
              id,
              "empresaId",
              codigo,
              "codigoBarras",
              descricao,
              gramatura,
              unidade,
              departamento,
              secao
            FROM produtos
            WHERE
              "empresaId" = $1
              AND (
                codigo ILIKE $2
                OR "codigoBarras"
                  ILIKE $2
                OR descricao ILIKE $2
              )
            ORDER BY
              LOWER(descricao),
              codigo
            LIMIT 50
          `,
          [
            empresaId,
            pesquisa,
          ]
        );

      return res.json({
        sucesso: true,
        dados: resultado.rows,
      });
    } catch (error) {
      console.error(
        "Erro ao buscar produtos:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível buscar os produtos.",
      });
    }
  }
);

app.get(
  "/api/produtos/codigo-barras/:codigo",
  async (req, res) => {
    try {
      const empresaId = Number(
        req.query.empresaId
      );

      const codigo = texto(
        req.params.codigo
      ).replace(/\D/g, "");

      if (
        !Number.isFinite(
          empresaId
        ) ||
        empresaId <= 0
      ) {
        return res.status(400).json({
          erro:
            "Empresa não informada.",
        });
      }

      if (!codigo) {
        return res.status(400).json({
          erro:
            "Código de barras não informado.",
        });
      }

      const resultado =
        await pool.query(
          `
            SELECT
              id,
              "empresaId",
              codigo,
              "codigoBarras",
              descricao,
              gramatura,
              unidade,
              departamento,
              secao
            FROM produtos
            WHERE
              "empresaId" = $1
              AND REPLACE(
                REPLACE(
                  REPLACE(
                    "codigoBarras",
                    ' ',
                    ''
                  ),
                  '-',
                  ''
                ),
                '.',
                ''
              ) = $2
            LIMIT 1
          `,
          [
            empresaId,
            codigo,
          ]
        );

      return res.json({
        sucesso: true,
        dados:
          resultado.rows[0] ??
          null,
      });
    } catch (error) {
      console.error(
        "Erro ao localizar código de barras:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível localizar o produto.",
      });
    }
  }
);

app.post(
  "/api/colaboradores/importar",
  async (req, res) => {
    const empresaId = Number(
      req.body?.empresaId
    );

    const colaboradores =
      req.body?.colaboradores;

    if (
      !Number.isFinite(
        empresaId
      ) ||
      empresaId <= 0
    ) {
      return res.status(400).json({
        erro:
          "Empresa não informada.",
      });
    }

    if (
      !Array.isArray(
        colaboradores
      )
    ) {
      return res.status(400).json({
        erro:
          "Lista de colaboradores não informada.",
      });
    }

    const cliente =
      await pool.connect();

    try {
      await cliente.query("BEGIN");

      await cliente.query(
        `
          DELETE
          FROM colaboradores
          WHERE "empresaId" = $1
        `,
        [empresaId]
      );

      let quantidade = 0;

      for (
        const item
        of colaboradores as Array<
          Record<string, unknown>
        >
      ) {
        const matricula =
          texto(item.matricula);

        const nome =
          texto(item.nome);

        const cargo =
          texto(item.cargo);

        if (
          !matricula &&
          !nome &&
          !cargo
        ) {
          continue;
        }

        await cliente.query(
          `
            INSERT INTO colaboradores (
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
            VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9
            )
          `,
          [
            empresaId,
            matricula,
            nome,
            cargo,
            texto(item.setor),
            texto(item.empresa),
            texto(item.loja),
            texto(item.turno),
            texto(item.situacao) ||
              "ATIVO",
          ]
        );

        quantidade += 1;
      }

      await cliente.query(
        "COMMIT"
      );

      return res.json({
        sucesso: true,
        empresaId,
        quantidade,
      });
    } catch (error) {
      await cliente.query(
        "ROLLBACK"
      );

      console.error(
        "Erro ao importar colaboradores:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível importar os colaboradores.",
      });
    } finally {
      cliente.release();
    }
  }
);

app.get(
  "/api/colaboradores",
  async (req, res) => {
    try {
      const empresaId = Number(
        req.query.empresaId
      );

      if (
        !Number.isFinite(
          empresaId
        ) ||
        empresaId <= 0
      ) {
        return res.status(400).json({
          erro:
            "Empresa não informada.",
        });
      }

      const resultado =
        await pool.query(
          `
            SELECT
              id,
              matricula,
              nome,
              cargo,
              setor,
              empresa,
              loja,
              turno,
              situacao
            FROM colaboradores
            WHERE "empresaId" = $1
            ORDER BY
              LOWER(cargo),
              LOWER(nome)
          `,
          [empresaId]
        );

      return res.json({
        sucesso: true,
        dados: resultado.rows,
      });
    } catch (error) {
      console.error(
        "Erro ao listar colaboradores:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível listar os colaboradores.",
      });
    }
  }
);

app.get(
  "/api/colaboradores/buscar",
  async (req, res) => {
    try {
      const empresaId = Number(
        req.query.empresaId
      );

      const termo = texto(
        req.query.termo
      );

      if (
        !Number.isFinite(
          empresaId
        ) ||
        empresaId <= 0
      ) {
        return res.status(400).json({
          erro:
            "Empresa não informada.",
        });
      }

      if (!termo) {
        return res.json({
          sucesso: true,
          dados: [],
        });
      }

      const pesquisa =
        `%${termo}%`;

      const resultado =
        await pool.query(
          `
            SELECT
              MIN(id) AS id,
              MIN(matricula)
                AS matricula,
              MIN(nome) AS nome,
              cargo,
              MIN(setor) AS setor,
              MIN(empresa) AS empresa,
              MIN(loja) AS loja,
              MIN(turno) AS turno,
              MIN(situacao)
                AS situacao
            FROM colaboradores
            WHERE
              "empresaId" = $1
              AND TRIM(cargo) <> ''
              AND cargo ILIKE $2
            GROUP BY
              LOWER(TRIM(cargo)),
              cargo
            ORDER BY LOWER(cargo)
            LIMIT 20
          `,
          [
            empresaId,
            pesquisa,
          ]
        );

      return res.json({
        sucesso: true,
        dados: resultado.rows,
      });
    } catch (error) {
      console.error(
        "Erro ao buscar cargos:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível buscar os cargos.",
      });
    }
  }
);

app.get(
  "/api/maquinas",
  async (_req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT
            id,
            codigo,
            descricao,
            tipo,
            setor
          FROM maquinas
          ORDER BY
            LOWER(descricao),
            codigo
        `);

      return res.json({
        sucesso: true,
        dados: resultado.rows,
      });
    } catch (error) {
      console.error(
        "Erro ao listar máquinas:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível listar as máquinas.",
      });
    }
  }
);

app.post(
  "/api/maquinas/importar",
  async (req, res) => {
    const maquinas =
      req.body?.maquinas;

    if (
      !Array.isArray(maquinas)
    ) {
      return res.status(400).json({
        erro:
          "Lista de máquinas não informada.",
      });
    }

    const cliente =
      await pool.connect();

    try {
      await cliente.query("BEGIN");

      await cliente.query(
        "DELETE FROM maquinas"
      );

      let quantidade = 0;

      for (
        const item
        of maquinas as Array<
          Record<string, unknown>
        >
      ) {
        const codigo =
          texto(item.codigo);

        const descricao =
          texto(item.descricao);

        if (
          !codigo &&
          !descricao
        ) {
          continue;
        }

        await cliente.query(
          `
            INSERT INTO maquinas (
              codigo,
              descricao,
              tipo,
              setor
            )
            VALUES (
              $1, $2, $3, $4
            )
          `,
          [
            codigo,
            descricao,
            texto(item.tipo),
            texto(item.setor),
          ]
        );

        quantidade += 1;
      }

      await cliente.query(
        "COMMIT"
      );

      return res.json({
        sucesso: true,
        quantidade,
      });
    } catch (error) {
      await cliente.query(
        "ROLLBACK"
      );

      console.error(
        "Erro ao importar máquinas:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível importar as máquinas.",
      });
    } finally {
      cliente.release();
    }
  }
);

app.get(
  "/api/maquinas/buscar",
  async (req, res) => {
    try {
      const termo = texto(
        req.query.termo
      );

      if (!termo) {
        return res.json({
          sucesso: true,
          dados: [],
        });
      }

      const pesquisa =
        `%${termo}%`;

      const resultado =
        await pool.query(
          `
            SELECT
              id,
              codigo,
              descricao,
              tipo,
              setor
            FROM maquinas
            WHERE
              codigo ILIKE $1
              OR descricao ILIKE $1
            ORDER BY
              LOWER(descricao),
              codigo
            LIMIT 50
          `,
          [pesquisa]
        );

      return res.json({
        sucesso: true,
        dados: resultado.rows,
      });
    } catch (error) {
      console.error(
        "Erro ao buscar máquinas:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível buscar as máquinas.",
      });
    }
  }
);


async function garantirTabelaEmbalagens() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS embalagens (
      id BIGINT PRIMARY KEY,
      codigo TEXT NOT NULL DEFAULT '',
      descricao TEXT NOT NULL DEFAULT '',
      categoria TEXT NOT NULL DEFAULT '',
      unidade TEXT NOT NULL DEFAULT '',
      capacidade TEXT NOT NULL DEFAULT '',
      "pesoEmbalagem" NUMERIC NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_embalagens_codigo
      ON embalagens (codigo);

    CREATE INDEX IF NOT EXISTS idx_embalagens_descricao
      ON embalagens (descricao);
  `);
}

app.get(
  "/api/embalagens",
  async (_req, res) => {
    try {
      await garantirTabelaEmbalagens();

      const resultado =
        await pool.query(`
          SELECT
            id,
            codigo,
            descricao,
            categoria,
            unidade,
            capacidade,
            "pesoEmbalagem"
          FROM embalagens
          ORDER BY
            LOWER(descricao),
            codigo
        `);

      return res.json({
        sucesso: true,
        dados: resultado.rows.map(
          (item) => ({
            ...item,
            id: Number(item.id),
            pesoEmbalagem: Number(
              item.pesoEmbalagem ?? 0
            ),
          })
        ),
      });
    } catch (error) {
      console.error(
        "Erro ao listar embalagens:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível listar as embalagens.",
      });
    }
  }
);

app.post(
  "/api/embalagens/importar",
  async (req, res) => {
    const embalagens =
      req.body?.embalagens;

    if (
      !Array.isArray(embalagens)
    ) {
      return res.status(400).json({
        erro:
          "Lista de embalagens não informada.",
      });
    }

    const cliente =
      await pool.connect();

    try {
      await garantirTabelaEmbalagens();

      await cliente.query("BEGIN");

      await cliente.query(
        "DELETE FROM embalagens"
      );

      let quantidade = 0;

      for (
        const item
        of embalagens as Array<
          Record<string, unknown>
        >
      ) {
        const idRecebido =
          Number(item.id);

        const id =
          Number.isFinite(idRecebido) &&
          idRecebido > 0
            ? idRecebido
            : Date.now() +
              quantidade;

        const codigo =
          texto(item.codigo);

        const descricao =
          texto(item.descricao);

        if (
          !codigo &&
          !descricao
        ) {
          continue;
        }

        const peso =
          Number(
            item.pesoEmbalagem
          );

        await cliente.query(
          `
            INSERT INTO embalagens (
              id,
              codigo,
              descricao,
              categoria,
              unidade,
              capacidade,
              "pesoEmbalagem"
            )
            VALUES (
              $1, $2, $3, $4,
              $5, $6, $7
            )
          `,
          [
            id,
            codigo,
            descricao,
            texto(item.categoria),
            texto(item.unidade),
            texto(item.capacidade),
            Number.isFinite(peso)
              ? peso
              : 0,
          ]
        );

        quantidade += 1;
      }

      await cliente.query(
        "COMMIT"
      );

      return res.json({
        sucesso: true,
        quantidade,
      });
    } catch (error) {
      await cliente.query(
        "ROLLBACK"
      );

      console.error(
        "Erro ao importar embalagens:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível importar as embalagens.",
      });
    } finally {
      cliente.release();
    }
  }
);

app.get(
  "/api/embalagens/buscar",
  async (req, res) => {
    try {
      await garantirTabelaEmbalagens();

      const termo = texto(
        req.query.termo
      );

      if (!termo) {
        return res.json({
          sucesso: true,
          dados: [],
        });
      }

      const pesquisa =
        `%${termo}%`;

      const resultado =
        await pool.query(
          `
            SELECT
              id,
              codigo,
              descricao,
              categoria,
              unidade,
              capacidade,
              "pesoEmbalagem"
            FROM embalagens
            WHERE
              codigo ILIKE $1
              OR descricao ILIKE $1
            ORDER BY
              LOWER(descricao),
              codigo
            LIMIT 20
          `,
          [pesquisa]
        );

      return res.json({
        sucesso: true,
        dados: resultado.rows.map(
          (item) => ({
            ...item,
            id: Number(item.id),
            pesoEmbalagem: Number(
              item.pesoEmbalagem ?? 0
            ),
          })
        ),
      });
    } catch (error) {
      console.error(
        "Erro ao buscar embalagens:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível buscar as embalagens.",
      });
    }
  }
);

app.get(
  "/api/receitas",
  async (req, res) => {
    try {
      const empresaId =
        numeroPositivo(
          req.query.empresaId
        );

      const produtoId =
        numeroPositivo(
          req.query.produtoId
        );

      const filtros: string[] = [];
      const parametros: unknown[] =
        [];

      if (empresaId) {
        parametros.push(
          empresaId
        );

        filtros.push(
          `"empresaId" = $${parametros.length}`
        );
      }

      if (produtoId) {
        parametros.push(
          produtoId
        );

        filtros.push(
          `"produtoId" = $${parametros.length}`
        );
      }

      const where =
        filtros.length > 0
          ? `WHERE ${filtros.join(
              " AND "
            )}`
          : "";

      const resultado =
        await pool.query(
          `
            SELECT *
            FROM receitas
            ${where}
            ORDER BY
              "atualizadoEm" DESC
          `,
          parametros
        );

      return res.json({
        sucesso: true,
        dados: resultado.rows,
      });
    } catch (error) {
      console.error(
        "Erro ao listar receitas:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível listar as fichas técnicas.",
      });
    }
  }
);

app.get(
  "/api/receitas/:id",
  async (req, res) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !Number.isFinite(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          erro:
            "Ficha técnica inválida.",
        });
      }

      const resultado =
        await pool.query(
          `
            SELECT *
            FROM receitas
            WHERE id = $1
            LIMIT 1
          `,
          [id]
        );

      const receita =
        resultado.rows[0];

      if (!receita) {
        return res.status(404).json({
          erro:
            "Ficha técnica não encontrada.",
        });
      }

      return res.json({
        sucesso: true,
        dados: receita,
      });
    } catch (error) {
      console.error(
        "Erro ao buscar receita:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível carregar a ficha técnica.",
      });
    }
  }
);

app.post(
  "/api/receitas",
  async (req, res) => {
    try {
      const id =
        numeroPositivo(
          req.body?.id
        ) ?? Date.now();

      const empresaId =
        numeroPositivo(
          req.body?.empresaId
        );

      const produtoId =
        numeroPositivo(
          req.body?.produtoId
        );

      if (!empresaId) {
        return res.status(400).json({
          erro:
            "Empresa não informada na ficha técnica.",
        });
      }

      if (!produtoId) {
        return res.status(400).json({
          erro:
            "Produto não informado na ficha técnica.",
        });
      }

      const agora =
        new Date().toISOString();

      const criadoEm =
        texto(req.body?.criadoEm) ||
        agora;

      const atualizadoEm =
        texto(
          req.body?.atualizadoEm
        ) || agora;

      const validadeSugeridaDias =
        req.body
          ?.validadeSugeridaDias ===
        null
          ? null
          : Number.isFinite(
              Number(
                req.body
                  ?.validadeSugeridaDias
              )
            )
          ? Number(
              req.body
                ?.validadeSugeridaDias
            )
          : null;

      const valores = [
        id,
        empresaId,
        produtoId,
        texto(
          req.body?.codigoProduto
        ),
        texto(
          req.body?.nomeProduto
        ),
        texto(
          req.body?.gramaturaProduto
        ),
        texto(
          req.body?.departamento
        ),
        texto(req.body?.secao),
        texto(
          req.body?.dataColeta
        ),
        texto(
          req.body?.responsavelColeta
        ),
        texto(
          req.body?.estoqueCongelado
        ),
        validadeSugeridaDias,
        texto(
          req.body
            ?.validadeConservacao
        ),
        texto(
          req.body?.validadeMotivo
        ),
        JSON.stringify(
          listaJson(
            req.body
              ?.validadeReferencias
          )
        ),
        JSON.stringify(
          listaJson(
            req.body
              ?.cargosEnvolvidos
          )
        ),
        JSON.stringify(
          listaJson(
            req.body?.maquinas
          )
        ),
        JSON.stringify(
          listaJson(
            req.body?.ingredientes
          )
        ),
        JSON.stringify(
          listaJson(
            req.body?.embalagens
          )
        ),
        JSON.stringify(
          listaJson(
            req.body?.fotos
          )
        ),
        texto(
          req.body
            ?.horaInicioProducao
        ),
        texto(
          req.body
            ?.horaFinalProducao
        ),
        texto(
          req.body
            ?.quantidadeProduzida
        ),
        texto(
          req.body
            ?.unidadeMedidaProduto
        ),
        texto(
          req.body
            ?.pesoTotalIngredientes
        ),
        texto(
          req.body
            ?.pesoTotalProduzido
        ),
        texto(
          req.body
            ?.unidadePesoProduzido
        ),
        texto(
          req.body
            ?.modoPreparoProducao
        ),
        texto(
          req.body
            ?.modoPreparoCliente
        ),
        criadoEm,
        atualizadoEm,
      ];

      const resultado =
        await pool.query(
          `
            INSERT INTO receitas (
              id,
              "empresaId",
              "produtoId",
              "codigoProduto",
              "nomeProduto",
              "gramaturaProduto",
              departamento,
              secao,
              "dataColeta",
              "responsavelColeta",
              "estoqueCongelado",
              "validadeSugeridaDias",
              "validadeConservacao",
              "validadeMotivo",
              "validadeReferencias",
              "cargosEnvolvidos",
              maquinas,
              ingredientes,
              embalagens,
              fotos,
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
              "atualizadoEm"
            )
            VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9, $10,
              $11, $12, $13, $14,
              $15::jsonb, $16::jsonb,
              $17::jsonb, $18::jsonb,
              $19::jsonb, $20::jsonb,
              $21, $22, $23, $24,
              $25, $26, $27, $28,
              $29, $30, $31
            )
            ON CONFLICT (id)
            DO UPDATE SET
              "empresaId" =
                EXCLUDED."empresaId",
              "produtoId" =
                EXCLUDED."produtoId",
              "codigoProduto" =
                EXCLUDED."codigoProduto",
              "nomeProduto" =
                EXCLUDED."nomeProduto",
              "gramaturaProduto" =
                EXCLUDED."gramaturaProduto",
              departamento =
                EXCLUDED.departamento,
              secao =
                EXCLUDED.secao,
              "dataColeta" =
                EXCLUDED."dataColeta",
              "responsavelColeta" =
                EXCLUDED."responsavelColeta",
              "estoqueCongelado" =
                EXCLUDED."estoqueCongelado",
              "validadeSugeridaDias" =
                EXCLUDED."validadeSugeridaDias",
              "validadeConservacao" =
                EXCLUDED."validadeConservacao",
              "validadeMotivo" =
                EXCLUDED."validadeMotivo",
              "validadeReferencias" =
                EXCLUDED."validadeReferencias",
              "cargosEnvolvidos" =
                EXCLUDED."cargosEnvolvidos",
              maquinas =
                EXCLUDED.maquinas,
              ingredientes =
                EXCLUDED.ingredientes,
              embalagens =
                EXCLUDED.embalagens,
              fotos =
                EXCLUDED.fotos,
              "horaInicioProducao" =
                EXCLUDED."horaInicioProducao",
              "horaFinalProducao" =
                EXCLUDED."horaFinalProducao",
              "quantidadeProduzida" =
                EXCLUDED."quantidadeProduzida",
              "unidadeMedidaProduto" =
                EXCLUDED."unidadeMedidaProduto",
              "pesoTotalIngredientes" =
                EXCLUDED."pesoTotalIngredientes",
              "pesoTotalProduzido" =
                EXCLUDED."pesoTotalProduzido",
              "unidadePesoProduzido" =
                EXCLUDED."unidadePesoProduzido",
              "modoPreparoProducao" =
                EXCLUDED."modoPreparoProducao",
              "modoPreparoCliente" =
                EXCLUDED."modoPreparoCliente",
              "atualizadoEm" =
                EXCLUDED."atualizadoEm"
            RETURNING *
          `,
          valores
        );

      return res.status(201).json({
        sucesso: true,
        dados: resultado.rows[0],
      });
    } catch (error) {
      console.error(
        "Erro ao salvar receita:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível salvar a ficha técnica.",
      });
    }
  }
);

app.delete(
  "/api/receitas/:id",
  async (req, res) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !Number.isFinite(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          erro:
            "Ficha técnica inválida.",
        });
      }

      const resultado =
        await pool.query(
          `
            DELETE FROM receitas
            WHERE id = $1
          `,
          [id]
        );

      if (
        resultado.rowCount === 0
      ) {
        return res.status(404).json({
          erro:
            "Ficha técnica não encontrada.",
        });
      }

      return res.json({
        sucesso: true,
      });
    } catch (error) {
      console.error(
        "Erro ao remover receita:",
        error
      );

      return res.status(500).json({
        erro:
          "Não foi possível remover a ficha técnica.",
      });
    }
  }
);

app.post(
  "/api/ia/ajustar-modo-preparo",
  async (req, res) => {
    try {
      const {
        tipo,
        texto: textoModoPreparo,
        produto,
        ingredientes,
      } = req.body;

      if (
        !textoModoPreparo ||
        !String(
          textoModoPreparo
        ).trim()
      ) {
        return res.status(400).json({
          erro:
            "Texto do modo de preparo não informado.",
        });
      }

      if (
        !process.env.GEMINI_API_KEY
      ) {
        return res.status(500).json({
          erro:
            "Chave GEMINI_API_KEY não configurada.",
        });
      }

      const contextoProduto =
        produto
          ? `
PRODUTO:
Código: ${produto.codigo || "-"}
Descrição: ${produto.descricao || "-"}
Departamento: ${produto.departamento || "-"}
Seção: ${produto.secao || "-"}
`
          : "";

      const contextoIngredientes =
        Array.isArray(
          ingredientes
        )
          ? ingredientes
              .map(
                (ingrediente) =>
                  `- ${ingrediente.identificacao} | ${ingrediente.quantidade} ${ingrediente.unidade} | ${ingrediente.modulo}`
              )
              .join("\n")
          : "";

      const instrucao = `
Você é um assistente técnico especializado em elaboração de fichas técnicas de produção própria para padaria, confeitaria, açougue, hortifruti e fatiamento de frios.

Sua tarefa é transformar o relato do usuário em um modo de preparo técnico, claro e padronizado.

REGRAS OBRIGATÓRIAS:

1. Não invente informações.
2. Não invente tempos.
3. Não invente temperaturas.
4. Não invente quantidades.
5. Não invente equipamentos.
6. Não invente ingredientes.
7. Use somente informações fornecidas pelo usuário e pelos dados da receita.
8. Corrija português, pontuação e termos técnicos.
9. Organize o processo em fases numeradas.
10. Crie somente as fases realmente identificadas no relato.
11. Preserve todos os tempos, temperaturas, quantidades e procedimentos informados.
12. Quando houver cobertura, recheio ou acabamento, separe essa etapa da produção da massa.
13. Use linguagem técnica apropriada para ficha técnica profissional.
14. Não explique o que foi corrigido.
15. Retorne somente o modo de preparo final.

TIPO:
${
  tipo === "CLIENTE"
    ? "Instrução para cliente ou revenda"
    : "Processo interno de produção"
}

${contextoProduto}

INGREDIENTES:
${contextoIngredientes || "Não informado"}

RELATO ORIGINAL:
${textoModoPreparo}
`;

      const resposta = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "x-goog-api-key":
              process.env
                .GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      instrucao,
                  },
                ],
              },
            ],
          }),
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        console.error(
          "Erro Gemini:",
          dados
        );

        return res.status(500).json({
          erro:
            dados?.error
              ?.message ||
            "Erro ao processar o texto com Gemini.",
        });
      }

      const textoAjustado =
        dados?.candidates?.[0]
          ?.content?.parts
          ?.map(
            (
              parte: {
                text?: string;
              }
            ) =>
              parte.text || ""
          )
          .join("")
          .trim();

      if (!textoAjustado) {
        return res.status(500).json({
          erro:
            "A IA não retornou texto ajustado.",
        });
      }

      return res.json({
        textoAjustado,
      });
    } catch (error) {
      console.error(
        "Erro ao ajustar modo de preparo:",
        error
      );

      return res.status(500).json({
        erro:
          "Erro ao processar o texto com IA.",
      });
    }
  }
);

app.post(
  "/api/ia/sugerir-validade",
  async (req, res) => {
    try {
      const {
        produto,
        ingredientes,
        modoPreparoProducao,
        modoPreparoCliente,
        estoqueCongelado,
      } = req.body;

      if (!produto) {
        return res.status(400).json({
          erro:
            "Produto não informado.",
        });
      }

      if (
        !Array.isArray(
          ingredientes
        ) ||
        ingredientes.length === 0
      ) {
        return res.status(400).json({
          erro:
            "Ingredientes não informados.",
        });
      }

      if (
        !process.env.GEMINI_API_KEY
      ) {
        return res.status(500).json({
          erro:
            "Chave GEMINI_API_KEY não configurada.",
        });
      }

      const contextoIngredientes =
        ingredientes
          .map(
            (ingrediente) =>
              `- ${ingrediente.identificacao || "-"} | ${
                ingrediente.quantidade ||
                "-"
              } ${
                ingrediente.unidade ||
                "-"
              } | ${
                ingrediente.modulo ||
                "-"
              }`
          )
          .join("\n");

      const instrucao = `
Você é um assistente técnico de apoio à elaboração de fichas técnicas de alimentos de produção própria.

Sua tarefa é gerar uma RECOMENDAÇÃO ESTIMADA DE PRAZO DE VALIDADE para a receita informada.

A recomendação não deve utilizar uma tabela fixa baseada apenas na categoria do produto.

Analise a receita como um todo.

CONSIDERE OBRIGATORIAMENTE:

1. Tipo do produto.
2. Departamento e seção.
3. Todos os ingredientes informados.
4. Ingredientes de maior perecibilidade.
5. Presença de leite e derivados.
6. Ovos.
7. Carnes, aves, pescados ou derivados, quando houver.
8. Frutas frescas, quando houver.
9. Cremes, recheios, ganaches, caldas e coberturas.
10. Quantidade de umidade provável do alimento.
11. Processo de cocção informado.
12. Temperaturas informadas.
13. Tempo de exposição ou descanso informado.
14. Manipulação posterior à cocção.
15. Processo de montagem.
16. Necessidade de refrigeração.
17. Congelamento, quando informado.
18. Forma de conservação indicada no relato.
19. Risco microbiológico provável.
20. Características do produto final.

CRITÉRIO DA RECOMENDAÇÃO:

- Utilize referências técnicas aplicáveis a produtos semelhantes.
- Considere faixas de validade normalmente utilizadas para produtos com características equivalentes.
- Quando houver mais de uma referência ou faixa tecnicamente aplicável, utilize uma recomendação média conservadora.
- O ingrediente, etapa ou condição mais perecível deve limitar a recomendação.
- Priorize segurança alimentar.
- Não aumente artificialmente a validade apenas porque algum ingrediente individual possui validade longa.
- Produto assado com recheio ou cobertura perecível deve ser avaliado pelo conjunto final do produto.
- A condição de conservação deve estar diretamente associada ao número de dias recomendado.

REGRAS:

1. Não invente ingredientes.
2. Não invente processos.
3. Não invente temperaturas.
4. Não invente informações ausentes.
5. Não apresente a recomendação como resultado de ensaio laboratorial.
6. Não afirme que o prazo está oficialmente validado.
7. Retorne uma estimativa técnica para apoio à ficha.
8. Utilize recomendação conservadora quando houver dúvida.
9. Se não houver informação suficiente para uma estimativa responsável, retorne dias como null.
10. Explique de forma curta o motivo da recomendação.
11. Informe as referências técnicas consideradas.
12. Considere como referência principal as orientações da ANVISA para determinação de prazo de validade de alimentos.
13. A recomendação deverá ser posteriormente validada pelo estabelecimento conforme suas condições reais de processo, armazenamento e controle.

PRODUTO:
Código: ${produto.codigo || "-"}
Descrição: ${produto.descricao || "-"}
Departamento: ${produto.departamento || "-"}
Seção: ${produto.secao || "-"}

ESTOQUE CONGELADO:
${estoqueCongelado || "Não informado"}

INGREDIENTES:
${contextoIngredientes}

MODO DE PREPARO DA PRODUÇÃO:
${modoPreparoProducao || "Não informado"}

MODO DE PREPARO PARA CLIENTE OU REVENDA:
${modoPreparoCliente || "Não informado"}

RETORNE SOMENTE JSON VÁLIDO EXATAMENTE NESTE FORMATO:

{
  "dias": 3,
  "conservacao": "Refrigerada",
  "motivo": "Texto curto explicando os fatores que determinaram a recomendação.",
  "referencias": [
    "ANVISA — Guia para Determinação de Prazos de Validade de Alimentos"
  ]
}

Se não for possível recomendar:

{
  "dias": null,
  "conservacao": "A definir",
  "motivo": "Explique quais informações impedem uma recomendação responsável.",
  "referencias": [
    "ANVISA — Guia para Determinação de Prazos de Validade de Alimentos"
  ]
}

Não use markdown.
Não escreva nenhum texto fora do JSON.
`;

      const resposta = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "x-goog-api-key":
              process.env
                .GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      instrucao,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType:
                "application/json",
            },
          }),
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        console.error(
          "Erro Gemini validade:",
          dados
        );

        return res.status(500).json({
          erro:
            dados?.error
              ?.message ||
            "Erro ao gerar recomendação de validade.",
        });
      }

      const textoResposta =
        dados?.candidates?.[0]
          ?.content?.parts
          ?.map(
            (
              parte: {
                text?: string;
              }
            ) =>
              parte.text || ""
          )
          .join("")
          .trim();

      if (!textoResposta) {
        return res.status(500).json({
          erro:
            "A IA não retornou recomendação de validade.",
        });
      }

      const recomendacao =
        JSON.parse(textoResposta);

      const dias =
        recomendacao.dias ===
        null
          ? null
          : Number(
              recomendacao.dias
            );

      if (
        dias !== null &&
        (!Number.isFinite(dias) ||
          dias <= 0)
      ) {
        return res.status(500).json({
          erro:
            "A IA retornou um prazo de validade inválido.",
        });
      }

      return res.json({
        dias,

        conservacao: String(
          recomendacao.conservacao ||
            "A definir"
        ).trim(),

        motivo: String(
          recomendacao.motivo || ""
        ).trim(),

        referencias:
          Array.isArray(
            recomendacao.referencias
          )
            ? recomendacao.referencias.map(
                (
                  referencia: unknown
                ) =>
                  String(
                    referencia
                  )
              )
            : [
                "ANVISA — Guia para Determinação de Prazos de Validade de Alimentos",
              ],
      });
    } catch (error) {
      console.error(
        "Erro ao sugerir validade:",
        error
      );

      return res.status(500).json({
        erro:
          "Erro ao gerar recomendação de validade.",
      });
    }
  }
);

const distPath = path.resolve("dist");

app.use(express.static(distPath));

app.get(/^(?!\/api).*/, (_req, res) => {
  return res.sendFile(
    path.join(distPath, "index.html")
  );
});

const PORT =
  Number(process.env.PORT) ||
  3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Servidor Roca Coleta rodando na porta ${PORT}`
  );
});