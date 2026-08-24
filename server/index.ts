import "dotenv/config";
import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");

fs.mkdirSync(dataDir, { recursive: true });

const bancoPath = path.join(dataDir, "roca-coleta.db");
const db = new Database(bancoPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresaId INTEGER NOT NULL,
    codigo TEXT NOT NULL DEFAULT '',
    codigoBarras TEXT NOT NULL DEFAULT '',
    descricao TEXT NOT NULL DEFAULT '',
    gramatura TEXT NOT NULL DEFAULT '',
    unidade TEXT NOT NULL DEFAULT '',
    departamento TEXT NOT NULL DEFAULT '',
    secao TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_produtos_empresa
    ON produtos (empresaId);

  CREATE INDEX IF NOT EXISTS idx_produtos_empresa_codigo
    ON produtos (empresaId, codigo);

  CREATE INDEX IF NOT EXISTS idx_produtos_empresa_barras
    ON produtos (empresaId, codigoBarras);


  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL UNIQUE COLLATE NOCASE,
    nome TEXT NOT NULL,
    senha TEXT NOT NULL,
    perfil TEXT NOT NULL DEFAULT 'COLETOR',
    empresaId INTEGER NOT NULL DEFAULT 0,
    empresaIds TEXT NOT NULL DEFAULT '[]',
    situacao TEXT NOT NULL DEFAULT 'ATIVO'
  );

  CREATE INDEX IF NOT EXISTS idx_usuarios_usuario
    ON usuarios (usuario);


  CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY,
    razaoSocial TEXT NOT NULL DEFAULT '',
    nomeFantasia TEXT NOT NULL DEFAULT '',
    cnpj TEXT NOT NULL DEFAULT '',
    situacao TEXT NOT NULL DEFAULT 'ATIVA',
    criadoEm TEXT NOT NULL DEFAULT '',
    atualizadoEm TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_empresas_situacao
    ON empresas (situacao);

  CREATE TABLE IF NOT EXISTS colaboradores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresaId INTEGER NOT NULL,
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
    ON colaboradores (empresaId);

  CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo
    ON colaboradores (empresaId, cargo);

  CREATE TABLE IF NOT EXISTS maquinas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL DEFAULT '',
    descricao TEXT NOT NULL DEFAULT '',
    tipo TEXT NOT NULL DEFAULT '',
    setor TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_maquinas_descricao
    ON maquinas (descricao);
`);

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



app.get("/api/empresas", (_req, res) => {
  try {
    const empresas = db.prepare(`
      SELECT
        id,
        razaoSocial,
        nomeFantasia,
        cnpj,
        situacao,
        criadoEm,
        atualizadoEm
      FROM empresas
      ORDER BY nomeFantasia COLLATE NOCASE, razaoSocial COLLATE NOCASE
    `).all();

    return res.json({
      sucesso: true,
      dados: empresas,
    });
  } catch (error) {
    console.error("Erro ao listar empresas:", error);

    return res.status(500).json({
      erro: "Não foi possível listar as empresas.",
    });
  }
});

app.post("/api/empresas", (req, res) => {
  try {
    const idRecebido = Number(req.body?.id);
    const id =
      Number.isFinite(idRecebido) && idRecebido > 0
        ? idRecebido
        : Date.now();

    const razaoSocial = texto(req.body?.razaoSocial);
    const nomeFantasia = texto(req.body?.nomeFantasia);
    const cnpj = texto(req.body?.cnpj);
    const situacao = texto(req.body?.situacao) || "ATIVA";
    const agora = new Date().toISOString();
    const criadoEm = texto(req.body?.criadoEm) || agora;
    const atualizadoEm = texto(req.body?.atualizadoEm) || agora;

    if (!razaoSocial && !nomeFantasia) {
      return res.status(400).json({
        erro: "Informe a empresa.",
      });
    }

    const existente = db.prepare(
      "SELECT id FROM empresas WHERE id = ?"
    ).get(id);

    if (existente) {
      return res.status(409).json({
        erro: "Empresa já cadastrada.",
      });
    }

    db.prepare(`
      INSERT INTO empresas (
        id,
        razaoSocial,
        nomeFantasia,
        cnpj,
        situacao,
        criadoEm,
        atualizadoEm
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      razaoSocial,
      nomeFantasia,
      cnpj,
      situacao,
      criadoEm,
      atualizadoEm
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
    console.error("Erro ao cadastrar empresa:", error);

    return res.status(500).json({
      erro: "Não foi possível cadastrar a empresa.",
    });
  }
});

app.put("/api/empresas/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        erro: "Empresa inválida.",
      });
    }

    const atual = db.prepare(
      "SELECT * FROM empresas WHERE id = ?"
    ).get(id) as Record<string, unknown> | undefined;

    if (!atual) {
      return res.status(404).json({
        erro: "Empresa não encontrada.",
      });
    }

    const razaoSocial =
      req.body?.razaoSocial !== undefined
        ? texto(req.body.razaoSocial)
        : String(atual.razaoSocial ?? "");

    const nomeFantasia =
      req.body?.nomeFantasia !== undefined
        ? texto(req.body.nomeFantasia)
        : String(atual.nomeFantasia ?? "");

    const cnpj =
      req.body?.cnpj !== undefined
        ? texto(req.body.cnpj)
        : String(atual.cnpj ?? "");

    const situacao =
      req.body?.situacao !== undefined
        ? texto(req.body.situacao)
        : String(atual.situacao ?? "ATIVA");

    const atualizadoEm = new Date().toISOString();

    db.prepare(`
      UPDATE empresas
      SET
        razaoSocial = ?,
        nomeFantasia = ?,
        cnpj = ?,
        situacao = ?,
        atualizadoEm = ?
      WHERE id = ?
    `).run(
      razaoSocial,
      nomeFantasia,
      cnpj,
      situacao,
      atualizadoEm,
      id
    );

    return res.json({
      sucesso: true,
      dados: {
        id,
        razaoSocial,
        nomeFantasia,
        cnpj,
        situacao,
        criadoEm: String(atual.criadoEm ?? ""),
        atualizadoEm,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);

    return res.status(500).json({
      erro: "Não foi possível atualizar a empresa.",
    });
  }
});

app.delete("/api/empresas/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        erro: "Empresa inválida.",
      });
    }

    db.prepare(
      "DELETE FROM empresas WHERE id = ?"
    ).run(id);

    return res.json({
      sucesso: true,
    });
  } catch (error) {
    console.error("Erro ao remover empresa:", error);

    return res.status(500).json({
      erro: "Não foi possível remover a empresa.",
    });
  }
});

app.get("/api/usuarios", (_req, res) => {
  try {
    const usuarios = db.prepare(`
      SELECT id, usuario, nome, senha, perfil, empresaId, empresaIds, situacao
      FROM usuarios
      ORDER BY nome COLLATE NOCASE
    `).all() as Array<Record<string, unknown>>;

    return res.json({
      sucesso: true,
      dados: usuarios.map((item) => ({
        ...item,
        empresaIds: JSON.parse(String(item.empresaIds || "[]")),
      })),
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return res.status(500).json({ erro: "Não foi possível listar os usuários." });
  }
});

app.post("/api/usuarios", (req, res) => {
  try {
    const usuario = texto(req.body?.usuario).toLowerCase();
    const nome = texto(req.body?.nome);
    const senha = texto(req.body?.senha);
    const perfil = texto(req.body?.perfil) || "COLETOR";
    const situacao = texto(req.body?.situacao) || "ATIVO";
    const empresaIds = Array.isArray(req.body?.empresaIds)
      ? req.body.empresaIds.map(Number).filter((id: number) => Number.isFinite(id) && id > 0)
      : [];
    const empresaId = empresaIds[0] ?? Number(req.body?.empresaId) ?? 0;

    if (!usuario || !nome || !senha) {
      return res.status(400).json({ erro: "Nome, usuário e senha são obrigatórios." });
    }

    const existe = db.prepare(
      "SELECT id FROM usuarios WHERE usuario = ? COLLATE NOCASE"
    ).get(usuario);

    if (existe) {
      return res.status(409).json({ erro: "Este usuário já está cadastrado." });
    }

    const resultado = db.prepare(`
      INSERT INTO usuarios (usuario, nome, senha, perfil, empresaId, empresaIds, situacao)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      usuario,
      nome,
      senha,
      perfil,
      empresaId,
      JSON.stringify(empresaIds),
      situacao
    );

    return res.status(201).json({
      sucesso: true,
      dados: {
        id: Number(resultado.lastInsertRowid),
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
    console.error("Erro ao cadastrar usuário:", error);
    return res.status(500).json({ erro: "Não foi possível cadastrar o usuário." });
  }
});

app.put("/api/usuarios/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const usuario = texto(req.body?.usuario).toLowerCase();
    const nome = texto(req.body?.nome);
    const senha = texto(req.body?.senha);
    const perfil = texto(req.body?.perfil) || "COLETOR";
    const situacao = texto(req.body?.situacao) || "ATIVO";
    const empresaIds = Array.isArray(req.body?.empresaIds)
      ? req.body.empresaIds.map(Number).filter((empresaId: number) => Number.isFinite(empresaId) && empresaId > 0)
      : [];
    const empresaId = empresaIds[0] ?? Number(req.body?.empresaId) ?? 0;

    if (!Number.isFinite(id) || id <= 0 || !usuario || !nome || !senha) {
      return res.status(400).json({ erro: "Dados do usuário inválidos." });
    }

    const resultado = db.prepare(`
      UPDATE usuarios
      SET usuario = ?, nome = ?, senha = ?, perfil = ?, empresaId = ?, empresaIds = ?, situacao = ?
      WHERE id = ?
    `).run(
      usuario,
      nome,
      senha,
      perfil,
      empresaId,
      JSON.stringify(empresaIds),
      situacao,
      id
    );

    if (resultado.changes === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    return res.json({
      sucesso: true,
      dados: { id, usuario, nome, senha, perfil, empresaId, empresaIds, situacao },
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({ erro: "Não foi possível atualizar o usuário." });
  }
});

app.post("/api/login", (req, res) => {
  try {
    const usuario = texto(req.body?.usuario).toLowerCase();
    const senha = texto(req.body?.senha);

    const encontrado = db.prepare(`
      SELECT id, usuario, nome, senha, perfil, empresaId, empresaIds, situacao
      FROM usuarios
      WHERE usuario = ? COLLATE NOCASE
        AND senha = ?
        AND situacao = 'ATIVO'
      LIMIT 1
    `).get(usuario, senha) as Record<string, unknown> | undefined;

    if (!encontrado) {
      return res.status(401).json({ erro: "Usuário ou senha inválidos." });
    }

    return res.json({
      sucesso: true,
      dados: {
        ...encontrado,
        empresaIds: JSON.parse(String(encontrado.empresaIds || "[]")),
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ erro: "Não foi possível realizar o login." });
  }
});

app.get("/api/saude", (_req, res) => {
  return res.json({
    sucesso: true,
    banco: bancoPath,
  });
});

app.post("/api/produtos/importar", (req, res) => {
  try {
    const empresaId = Number(req.body?.empresaId);
    const produtos = req.body?.produtos;

    if (!Number.isFinite(empresaId) || empresaId <= 0) {
      return res.status(400).json({
        erro: "Empresa não informada.",
      });
    }

    if (!Array.isArray(produtos)) {
      return res.status(400).json({
        erro: "Lista de produtos não informada.",
      });
    }

    const excluirProdutosEmpresa = db.prepare(
      "DELETE FROM produtos WHERE empresaId = ?"
    );

    const inserirProduto = db.prepare(`
      INSERT INTO produtos (
        empresaId,
        codigo,
        codigoBarras,
        descricao,
        gramatura,
        unidade,
        departamento,
        secao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const importar = db.transaction(
      (empresa: number, lista: ProdutoEntrada[]) => {
        excluirProdutosEmpresa.run(empresa);

        let gravados = 0;

        for (const produto of lista) {
          const codigo = texto(produto.codigo);
          const descricao = texto(produto.descricao);

          if (!codigo && !descricao) {
            continue;
          }

          inserirProduto.run(
            empresa,
            codigo,
            texto(produto.codigoBarras),
            descricao,
            texto(produto.gramatura),
            texto(produto.unidade),
            texto(produto.departamento),
            texto(produto.secao)
          );

          gravados += 1;
        }

        return gravados;
      }
    );

    const quantidade = importar(
      empresaId,
      produtos as ProdutoEntrada[]
    );

    return res.json({
      sucesso: true,
      empresaId,
      quantidade,
    });
  } catch (error) {
    console.error("Erro ao importar produtos:", error);

    return res.status(500).json({
      erro: "Não foi possível gravar os produtos.",
    });
  }
});

app.get("/api/produtos", (req, res) => {
  try {
    const empresaId = Number(req.query.empresaId);

    if (!Number.isFinite(empresaId) || empresaId <= 0) {
      return res.status(400).json({
        erro: "Empresa não informada.",
      });
    }

    const produtos = db
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
        WHERE empresaId = ?
        ORDER BY descricao COLLATE NOCASE, codigo
      `)
      .all(empresaId);

    return res.json({
      sucesso: true,
      dados: produtos,
    });
  } catch (error) {
    console.error("Erro ao listar produtos:", error);

    return res.status(500).json({
      erro: "Não foi possível listar os produtos.",
    });
  }
});

app.get("/api/produtos/buscar", (req, res) => {
  try {
    const empresaId = Number(req.query.empresaId);
    const termo = texto(req.query.termo);

    if (!Number.isFinite(empresaId) || empresaId <= 0) {
      return res.status(400).json({
        erro: "Empresa não informada.",
      });
    }

    if (!termo) {
      return res.json({
        sucesso: true,
        dados: [],
      });
    }

    const pesquisa = `%${termo}%`;

    const produtos = db
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
        WHERE empresaId = ?
          AND (
            codigo LIKE ? COLLATE NOCASE
            OR codigoBarras LIKE ? COLLATE NOCASE
            OR descricao LIKE ? COLLATE NOCASE
          )
        ORDER BY descricao COLLATE NOCASE, codigo
        LIMIT 50
      `)
      .all(empresaId, pesquisa, pesquisa, pesquisa);

    return res.json({
      sucesso: true,
      dados: produtos,
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);

    return res.status(500).json({
      erro: "Não foi possível buscar os produtos.",
    });
  }
});

app.get("/api/produtos/codigo-barras/:codigo", (req, res) => {
  try {
    const empresaId = Number(req.query.empresaId);
    const codigo = texto(req.params.codigo).replace(/\D/g, "");

    if (!Number.isFinite(empresaId) || empresaId <= 0) {
      return res.status(400).json({
        erro: "Empresa não informada.",
      });
    }

    if (!codigo) {
      return res.status(400).json({
        erro: "Código de barras não informado.",
      });
    }

    const produto = db
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
        WHERE empresaId = ?
          AND REPLACE(REPLACE(REPLACE(codigoBarras, ' ', ''), '-', ''), '.', '') = ?
        LIMIT 1
      `)
      .get(empresaId, codigo);

    return res.json({
      sucesso: true,
      dados: produto ?? null,
    });
  } catch (error) {
    console.error("Erro ao localizar código de barras:", error);

    return res.status(500).json({
      erro: "Não foi possível localizar o produto.",
    });
  }
});

app.post("/api/colaboradores/importar", (req, res) => {
  try {
    const empresaId = Number(req.body?.empresaId);
    const colaboradores = req.body?.colaboradores;

    if (!Number.isFinite(empresaId) || empresaId <= 0) {
      return res.status(400).json({
        erro: "Empresa não informada.",
      });
    }

    if (!Array.isArray(colaboradores)) {
      return res.status(400).json({
        erro: "Lista de colaboradores não informada.",
      });
    }

    const excluir = db.prepare(
      "DELETE FROM colaboradores WHERE empresaId = ?"
    );

    const inserir = db.prepare(`
      INSERT INTO colaboradores (
        empresaId,
        matricula,
        nome,
        cargo,
        setor,
        empresa,
        loja,
        turno,
        situacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const importar = db.transaction(
      (
        idEmpresa: number,
        lista: Array<Record<string, unknown>>
      ) => {
        excluir.run(idEmpresa);

        let quantidade = 0;

        for (const item of lista) {
          const matricula = texto(item.matricula);
          const nome = texto(item.nome);
          const cargo = texto(item.cargo);

          if (!matricula && !nome && !cargo) {
            continue;
          }

          inserir.run(
            idEmpresa,
            matricula,
            nome,
            cargo,
            texto(item.setor),
            texto(item.empresa),
            texto(item.loja),
            texto(item.turno),
            texto(item.situacao) || "ATIVO"
          );

          quantidade += 1;
        }

        return quantidade;
      }
    );

    const quantidade = importar(
      empresaId,
      colaboradores as Array<Record<string, unknown>>
    );

    return res.json({
      sucesso: true,
      empresaId,
      quantidade,
    });
  } catch (error) {
    console.error("Erro ao importar colaboradores:", error);

    return res.status(500).json({
      erro: "Não foi possível importar os colaboradores.",
    });
  }
});

app.get("/api/colaboradores", (req, res) => {
  try {
    const empresaId = Number(req.query.empresaId);

    if (!Number.isFinite(empresaId) || empresaId <= 0) {
      return res.status(400).json({
        erro: "Empresa não informada.",
      });
    }

    const colaboradores = db.prepare(`
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
      WHERE empresaId = ?
      ORDER BY cargo COLLATE NOCASE, nome COLLATE NOCASE
    `).all(empresaId);

    return res.json({
      sucesso: true,
      dados: colaboradores,
    });
  } catch (error) {
    console.error("Erro ao listar colaboradores:", error);

    return res.status(500).json({
      erro: "Não foi possível listar os colaboradores.",
    });
  }
});

app.get("/api/colaboradores/buscar", (req, res) => {
  try {
    const empresaId = Number(req.query.empresaId);
    const termo = texto(req.query.termo);

    if (!Number.isFinite(empresaId) || empresaId <= 0) {
      return res.status(400).json({
        erro: "Empresa não informada.",
      });
    }

    if (!termo) {
      return res.json({
        sucesso: true,
        dados: [],
      });
    }

    const pesquisa = `%${termo}%`;

    const cargos = db.prepare(`
      SELECT
        MIN(id) AS id,
        MIN(matricula) AS matricula,
        MIN(nome) AS nome,
        cargo,
        MIN(setor) AS setor,
        MIN(empresa) AS empresa,
        MIN(loja) AS loja,
        MIN(turno) AS turno,
        MIN(situacao) AS situacao
      FROM colaboradores
      WHERE empresaId = ?
        AND TRIM(cargo) <> ''
        AND cargo LIKE ? COLLATE NOCASE
      GROUP BY LOWER(TRIM(cargo))
      ORDER BY cargo COLLATE NOCASE
      LIMIT 20
    `).all(empresaId, pesquisa);

    return res.json({
      sucesso: true,
      dados: cargos,
    });
  } catch (error) {
    console.error("Erro ao buscar cargos:", error);

    return res.status(500).json({
      erro: "Não foi possível buscar os cargos.",
    });
  }
});

app.get("/api/maquinas", (_req, res) => {
  try {
    const maquinas = db.prepare(`
      SELECT id, codigo, descricao, tipo, setor
      FROM maquinas
      ORDER BY descricao COLLATE NOCASE, codigo
    `).all();

    return res.json({
      sucesso: true,
      dados: maquinas,
    });
  } catch (error) {
    console.error("Erro ao listar máquinas:", error);

    return res.status(500).json({
      erro: "Não foi possível listar as máquinas.",
    });
  }
});

app.post("/api/maquinas/importar", (req, res) => {
  try {
    const maquinas = req.body?.maquinas;

    if (!Array.isArray(maquinas)) {
      return res.status(400).json({
        erro: "Lista de máquinas não informada.",
      });
    }

    const limpar = db.prepare("DELETE FROM maquinas");

    const inserir = db.prepare(`
      INSERT INTO maquinas (
        codigo,
        descricao,
        tipo,
        setor
      ) VALUES (?, ?, ?, ?)
    `);

    const importar = db.transaction(
      (lista: Array<Record<string, unknown>>) => {
        limpar.run();

        let quantidade = 0;

        for (const item of lista) {
          const codigo = texto(item.codigo);
          const descricao = texto(item.descricao);

          if (!codigo && !descricao) {
            continue;
          }

          inserir.run(
            codigo,
            descricao,
            texto(item.tipo),
            texto(item.setor)
          );

          quantidade += 1;
        }

        return quantidade;
      }
    );

    const quantidade = importar(
      maquinas as Array<Record<string, unknown>>
    );

    return res.json({
      sucesso: true,
      quantidade,
    });
  } catch (error) {
    console.error("Erro ao importar máquinas:", error);

    return res.status(500).json({
      erro: "Não foi possível importar as máquinas.",
    });
  }
});

app.get("/api/maquinas/buscar", (req, res) => {
  try {
    const termo = texto(req.query.termo);

    if (!termo) {
      return res.json({
        sucesso: true,
        dados: [],
      });
    }

    const pesquisa = `%${termo}%`;

    const maquinas = db.prepare(`
      SELECT id, codigo, descricao, tipo, setor
      FROM maquinas
      WHERE codigo LIKE ? COLLATE NOCASE
         OR descricao LIKE ? COLLATE NOCASE
      ORDER BY descricao COLLATE NOCASE, codigo
      LIMIT 50
    `).all(pesquisa, pesquisa);

    return res.json({
      sucesso: true,
      dados: maquinas,
    });
  } catch (error) {
    console.error("Erro ao buscar máquinas:", error);

    return res.status(500).json({
      erro: "Não foi possível buscar as máquinas.",
    });
  }
});

app.post(
  "/api/ia/ajustar-modo-preparo",
  async (req, res) => {
    try {
      const {
        tipo,
        texto,
        produto,
        ingredientes,
      } = req.body;

      if (!texto || !String(texto).trim()) {
        return res.status(400).json({
          erro: "Texto do modo de preparo não informado.",
        });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          erro: "Chave GEMINI_API_KEY não configurada.",
        });
      }

      const contextoProduto = produto
        ? `
PRODUTO:
Código: ${produto.codigo || "-"}
Descrição: ${produto.descricao || "-"}
Departamento: ${produto.departamento || "-"}
Seção: ${produto.secao || "-"}
`
        : "";

      const contextoIngredientes = Array.isArray(
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
${texto}
`;

      const resposta = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key":
              process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: instrucao,
                  },
                ],
              },
            ],
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        console.error(
          "Erro Gemini:",
          dados
        );

        return res.status(500).json({
          erro:
            dados?.error?.message ||
            "Erro ao processar o texto com Gemini.",
        });
      }

      const textoAjustado =
        dados?.candidates?.[0]?.content?.parts
          ?.map(
            (parte: { text?: string }) =>
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
          erro: "Produto não informado.",
        });
      }

      if (
        !Array.isArray(ingredientes) ||
        ingredientes.length === 0
      ) {
        return res.status(400).json({
          erro: "Ingredientes não informados.",
        });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          erro: "Chave GEMINI_API_KEY não configurada.",
        });
      }

      const contextoIngredientes =
        ingredientes
          .map(
            (ingrediente) =>
              `- ${ingrediente.identificacao || "-"} | ${
                ingrediente.quantidade || "-"
              } ${ingrediente.unidade || "-"} | ${
                ingrediente.modulo || "-"
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
            "Content-Type": "application/json",
            "x-goog-api-key":
              process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: instrucao,
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

      const dados = await resposta.json();

      if (!resposta.ok) {
        console.error(
          "Erro Gemini validade:",
          dados
        );

        return res.status(500).json({
          erro:
            dados?.error?.message ||
            "Erro ao gerar recomendação de validade.",
        });
      }

      const textoResposta =
        dados?.candidates?.[0]?.content?.parts
          ?.map(
            (parte: { text?: string }) =>
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
        recomendacao.dias === null
          ? null
          : Number(recomendacao.dias);

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
        conservacao:
          String(
            recomendacao.conservacao ||
              "A definir"
          ).trim(),

        motivo:
          String(
            recomendacao.motivo ||
              ""
          ).trim(),

        referencias:
          Array.isArray(
            recomendacao.referencias
          )
            ? recomendacao.referencias.map(
                (referencia: unknown) =>
                  String(referencia)
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

const PORT = 3001;

app.listen(PORT, () => {
  console.log(
    `Servidor Roca Coleta rodando em http://localhost:${PORT}`
  );
});