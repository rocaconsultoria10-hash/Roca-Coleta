import { openDB } from "idb";
import type { Produto } from "../models/Produto";
import { apiUrl } from "./apiConfig";

const BANCO = "roca-coleta";
const VERSAO = 1;
const TABELA = "produtos";

const DEPARTAMENTO_PRODUCAO_PADARIA =
  "PRODUCAO PADARIA";

type RespostaApi<T> = {
  sucesso?: boolean;
  dados?: T;
  erro?: string;
  quantidade?: number;
};

function normalizarTexto(
  valor: string
): string {
  return String(valor || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toUpperCase();
}

function normalizarCodigo(
  valor: string
): string {
  return String(valor || "")
    .replace(/\D/g, "")
    .trim();
}

function ehProducaoPadaria(
  produto: Produto
): boolean {
  return (
    normalizarTexto(
      produto.departamento
    ) ===
    DEPARTAMENTO_PRODUCAO_PADARIA
  );
}

async function lerResposta<T>(
  resposta: Response
): Promise<RespostaApi<T>> {
  const texto = await resposta.text();

  if (!texto) {
    throw new Error(
      `Servidor retornou resposta vazia (${resposta.status}).`
    );
  }

  let dados: RespostaApi<T>;

  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error(
      `Resposta inválida do servidor (${resposta.status}).`
    );
  }

  if (!resposta.ok) {
    throw new Error(
      dados.erro ||
        `Erro no servidor (${resposta.status}).`
    );
  }

  return dados;
}

const dbPromise = openDB(
  BANCO,
  VERSAO,
  {
    upgrade(db) {
      if (
        !db.objectStoreNames.contains(
          TABELA
        )
      ) {
        const store =
          db.createObjectStore(
            TABELA,
            {
              keyPath: "id",
            }
          );

        store.createIndex(
          "codigo",
          "codigo"
        );

        store.createIndex(
          "descricao",
          "descricao"
        );
      }
    },
  }
);

async function listarLocal(): Promise<
  Produto[]
> {
  const db = await dbPromise;

  return db.getAll(TABELA);
}

async function listarLocalPorEmpresa(
  empresaId: number
): Promise<Produto[]> {
  const produtos =
    await listarLocal();

  return produtos.filter(
    (produto) =>
      Number(produto.empresaId) ===
      Number(empresaId)
  );
}

async function salvarLocalEmpresa(
  empresaId: number,
  produtos: Produto[]
): Promise<void> {
  const db = await dbPromise;

  const transacao =
    db.transaction(
      TABELA,
      "readwrite"
    );

  const store =
    transacao.objectStore(
      TABELA
    );

  const existentes =
    await store.getAll();

  for (
    const produtoExistente
    of existentes
  ) {
    if (
      Number(
        produtoExistente.empresaId
      ) === Number(empresaId)
    ) {
      await store.delete(
        produtoExistente.id
      );
    }
  }

  for (const produto of produtos) {
    await store.put({
      ...produto,
      empresaId,
    });
  }

  await transacao.done;
}

async function listarServidor(
  empresaId: number
): Promise<Produto[]> {
  const resposta = await fetch(apiUrl(`/api/produtos?empresaId=${encodeURIComponent(
      String(empresaId)
    )}`)
  );

  const dados =
    await lerResposta<Produto[]>(
      resposta
    );

  return Array.isArray(dados.dados)
    ? dados.dados
    : [];
}

async function enviarParaServidor(
  empresaId: number,
  produtos: Produto[]
): Promise<void> {
  const resposta = await fetch(apiUrl("/api/produtos/importar"),
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        empresaId,
        produtos,
      }),
    }
  );

  await lerResposta<never>(
    resposta
  );
}

/*
 * MIGRAÇÃO AUTOMÁTICA:
 *
 * Se o servidor ainda não possuir
 * produtos para a empresa, mas este
 * navegador possuir a base antiga no
 * IndexedDB, envia automaticamente
 * essa base para o servidor.
 *
 * Depois disso PC e celular passam a
 * consultar a mesma base central.
 */
async function garantirBaseServidor(
  empresaId: number
): Promise<Produto[]> {
  const produtosServidor =
    await listarServidor(empresaId);

  if (
    produtosServidor.length > 0
  ) {
    return produtosServidor;
  }

  const produtosLocais =
    await listarLocalPorEmpresa(
      empresaId
    );

  if (
    produtosLocais.length === 0
  ) {
    return [];
  }

  console.log(
    "MIGRANDO PRODUTOS PARA O SERVIDOR:",
    {
      empresaId,
      quantidade:
        produtosLocais.length,
    }
  );

  await enviarParaServidor(
    empresaId,
    produtosLocais
  );

  const produtosMigrados =
    await listarServidor(
      empresaId
    );

  console.log(
    "MIGRAÇÃO DE PRODUTOS CONCLUÍDA:",
    {
      empresaId,
      quantidade:
        produtosMigrados.length,
    }
  );

  return produtosMigrados;
}

export const produtoService = {
  /*
   * Mantido para compatibilidade.
   * Retorna a cópia local existente.
   *
   * As telas do sistema devem usar
   * listarPorEmpresa/buscar, que agora
   * trabalham com o servidor.
   */
  async listar(): Promise<
    Produto[]
  > {
    return listarLocal();
  },

  /*
   * IMPORTAÇÃO:
   * grava no servidor central e mantém
   * uma cópia local no navegador.
   */
  async importar(
    lista: Produto[]
  ): Promise<void> {
    if (lista.length === 0) {
      throw new Error(
        "Nenhum produto válido foi encontrado na planilha."
      );
    }

    const empresaId = Number(
      lista[0].empresaId
    );

    if (
      !Number.isFinite(empresaId) ||
      empresaId <= 0
    ) {
      throw new Error(
        "Empresa inválida para importação."
      );
    }

    const produtosValidos =
      lista.filter((produto) => {
        const produtoEmpresaId =
          Number(produto.empresaId);

        const codigo = String(
          produto.codigo || ""
        ).trim();

        const descricao = String(
          produto.descricao || ""
        ).trim();

        return (
          produtoEmpresaId ===
            empresaId &&
          (
            codigo !== "" ||
            descricao !== ""
          )
        );
      });

    if (
      produtosValidos.length === 0
    ) {
      throw new Error(
        "A planilha não possui produtos válidos para esta empresa."
      );
    }

    await enviarParaServidor(
      empresaId,
      produtosValidos
    );

    const produtosServidor =
      await listarServidor(
        empresaId
      );

    await salvarLocalEmpresa(
      empresaId,
      produtosServidor
    );

    if (
      produtosServidor.length !==
      produtosValidos.length
    ) {
      throw new Error(
        `Falha na gravação: a planilha possui ${produtosValidos.length} produtos, mas o servidor possui ${produtosServidor.length}.`
      );
    }

    console.log(
      "IMPORTAÇÃO CONFIRMADA NO SERVIDOR:",
      {
        empresaId,
        produtosPlanilha:
          produtosValidos.length,
        produtosSalvos:
          produtosServidor.length,
      }
    );
  },

  /*
   * BUSCA GERAL CENTRALIZADA
   */
  async buscar(
    termo: string,
    empresaId?: number
  ): Promise<Produto[]> {
    const pesquisaTexto =
      normalizarTexto(termo);

    const pesquisaCodigo =
      normalizarCodigo(termo);

    if (
      !pesquisaTexto &&
      !pesquisaCodigo
    ) {
      return [];
    }

    if (
      empresaId &&
      empresaId > 0
    ) {
      /*
       * Primeiro garante que a base
       * antiga do PC seja migrada caso
       * o servidor ainda esteja vazio.
       */
      await garantirBaseServidor(
        empresaId
      );

      const resposta = await fetch(apiUrl(`/api/produtos/buscar?empresaId=${encodeURIComponent(
          String(empresaId)
        )}&termo=${encodeURIComponent(
          termo
        )}`)
      );

      const dados =
        await lerResposta<Produto[]>(
          resposta
        );

      return Array.isArray(
        dados.dados
      )
        ? dados.dados.slice(0, 30)
        : [];
    }

    /*
     * Compatibilidade para chamadas
     * antigas sem empresaId.
     */
    const produtos =
      await listarLocal();

    return produtos
      .filter((produto) => {
        const codigoInterno =
          normalizarTexto(
            produto.codigo
          );

        const descricao =
          normalizarTexto(
            produto.descricao
          );

        const codigoBarras =
          normalizarCodigo(
            produto.codigoBarras ??
              ""
          );

        return (
          codigoInterno.includes(
            pesquisaTexto
          ) ||
          descricao.includes(
            pesquisaTexto
          ) ||
          (
            pesquisaCodigo.length >
              0 &&
            codigoBarras.includes(
              pesquisaCodigo
            )
          )
        );
      })
      .slice(0, 30);
  },

  /*
   * BUSCA EXATA POR
   * CÓDIGO DE BARRAS
   */
  async buscarPorCodigoBarras(
    codigoBarras: string,
    empresaId?: number
  ): Promise<Produto | null> {
    const codigo =
      normalizarCodigo(
        codigoBarras
      );

    if (!codigo) {
      return null;
    }

    if (
      empresaId &&
      empresaId > 0
    ) {
      await garantirBaseServidor(
        empresaId
      );

      const resposta = await fetch(apiUrl(`/api/produtos/codigo-barras/${encodeURIComponent(
          codigo
        )}?empresaId=${encodeURIComponent(
          String(empresaId)
        )}`)
      );

      const dados =
        await lerResposta<
          Produto | null
        >(resposta);

      return dados.dados ?? null;
    }

    const produtos =
      await listarLocal();

    return (
      produtos.find(
        (item) =>
          normalizarCodigo(
            item.codigoBarras ??
              ""
          ) === codigo
      ) ?? null
    );
  },

  /*
   * BUSCA EXATA POR
   * CÓDIGO INTERNO
   */
  async buscarPorCodigoInterno(
    codigoInterno: string,
    empresaId?: number
  ): Promise<Produto | null> {
    const codigo =
      normalizarTexto(
        codigoInterno
      );

    if (!codigo) {
      return null;
    }

    const produtos =
      empresaId &&
      empresaId > 0
        ? await garantirBaseServidor(
            empresaId
          )
        : await listarLocal();

    const produto =
      produtos.find((item) => {
        if (
          empresaId &&
          empresaId > 0 &&
          Number(
            item.empresaId
          ) !== Number(empresaId)
        ) {
          return false;
        }

        return (
          normalizarTexto(
            item.codigo
          ) === codigo
        );
      });

    return produto ?? null;
  },

  /*
   * TODOS OS PRODUTOS
   * DA EMPRESA.
   *
   * Esta chamada agora usa o servidor
   * e também executa a migração
   * automática da base antiga.
   */
  async listarPorEmpresa(
    empresaId: number
  ): Promise<Produto[]> {
    if (
      !Number.isFinite(
        empresaId
      ) ||
      empresaId <= 0
    ) {
      return [];
    }

    const produtos =
      await garantirBaseServidor(
        empresaId
      );

    return produtos.sort(
      (a, b) =>
        String(
          a.descricao || ""
        ).localeCompare(
          String(
            b.descricao || ""
          ),
          "pt-BR"
        )
    );
  },

  /*
   * SOMENTE PRODUTOS
   * DO DEPARTAMENTO
   * PRODUÇÃO PADARIA.
   */
  async listarProducaoPadariaPorEmpresa(
    empresaId: number
  ): Promise<Produto[]> {
    const produtos =
      await this.listarPorEmpresa(
        empresaId
      );

    return produtos.filter(
      (produto) =>
        ehProducaoPadaria(
          produto
        )
    );
  },

  /*
   * SEÇÕES EXISTENTES
   * NA PRODUÇÃO PADARIA
   */
  async listarSecoesProducaoPadaria(
    empresaId: number
  ): Promise<string[]> {
    const produtos =
      await this
        .listarProducaoPadariaPorEmpresa(
          empresaId
        );

    const secoes =
      produtos
        .map((produto) =>
          String(
            produto.secao || ""
          ).trim()
        )
        .filter(
          (secao) =>
            secao.length > 0
        );

    return Array.from(
      new Set(secoes)
    ).sort((a, b) =>
      a.localeCompare(
        b,
        "pt-BR"
      )
    );
  },

  /*
   * PRODUTOS DE UMA SEÇÃO
   * DA PRODUÇÃO PADARIA
   */
  async listarProdutosPorSecao(
    empresaId: number,
    secao: string
  ): Promise<Produto[]> {
    const secaoNormalizada =
      normalizarTexto(secao);

    if (!secaoNormalizada) {
      return [];
    }

    const produtos =
      await this
        .listarProducaoPadariaPorEmpresa(
          empresaId
        );

    return produtos.filter(
      (produto) =>
        normalizarTexto(
          produto.secao
        ) ===
        secaoNormalizada
    );
  },

  /*
   * BUSCA DE PRODUTO
   * PRODUZIDO NA PADARIA
   */
  async buscarProducaoPadaria(
    empresaId: number,
    termo: string
  ): Promise<Produto[]> {
    const pesquisaTexto =
      normalizarTexto(termo);

    const pesquisaCodigo =
      normalizarCodigo(termo);

    if (
      !pesquisaTexto &&
      !pesquisaCodigo
    ) {
      return [];
    }

    const produtos =
      await this
        .listarProducaoPadariaPorEmpresa(
          empresaId
        );

    return produtos
      .filter((produto) => {
        const codigo =
          normalizarTexto(
            produto.codigo
          );

        const descricao =
          normalizarTexto(
            produto.descricao
          );

        const codigoBarras =
          normalizarCodigo(
            produto.codigoBarras ??
              ""
          );

        return (
          codigo.includes(
            pesquisaTexto
          ) ||
          descricao.includes(
            pesquisaTexto
          ) ||
          (
            pesquisaCodigo.length >
              0 &&
            codigoBarras.includes(
              pesquisaCodigo
            )
          )
        );
      })
      .slice(0, 30);
  },
};