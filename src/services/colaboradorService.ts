import { openDB } from "idb";

import type { Colaborador } from "../models/Colaborador";

import { authService } from "./authService";
import { apiUrl } from "./apiConfig";

const BANCO =
  "roca-coleta-colaboradores";

const VERSAO = 1;

const TABELA =
  "colaboradores";

type RespostaApi<T> = {
  sucesso?: boolean;
  dados?: T;
  quantidade?: number;
  erro?: string;
};

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
        db.createObjectStore(
          TABELA,
          {
            keyPath: "id",
          }
        );
      }
    },
  }
);

function obterEmpresaId(
  empresaIdInformado?: number
): number {
  if (
    empresaIdInformado &&
    Number.isFinite(
      empresaIdInformado
    ) &&
    empresaIdInformado > 0
  ) {
    return empresaIdInformado;
  }

  const usuario =
    authService.getUsuarioLogado();

  return (
    authService.getEmpresaAtivaId() ??
    usuario?.empresaId ??
    0
  );
}

async function lerResposta<T>(
  resposta: Response
): Promise<T> {
  const texto =
    await resposta.text();

  if (!texto) {
    throw new Error(
      "O servidor retornou uma resposta vazia."
    );
  }

  let dados:
    RespostaApi<T>;

  try {
    dados =
      JSON.parse(
        texto
      ) as RespostaApi<T>;
  } catch {
    throw new Error(
      "O servidor retornou uma resposta inválida."
    );
  }

  if (!resposta.ok) {
    throw new Error(
      dados.erro ||
        "Não foi possível concluir a operação."
    );
  }

  return dados.dados as T;
}

async function listarLocal():
  Promise<Colaborador[]> {
  const db =
    await dbPromise;

  return db.getAll(
    TABELA
  );
}

async function salvarCopiaLocal(
  lista: Colaborador[]
): Promise<void> {
  const db =
    await dbPromise;

  const transacao =
    db.transaction(
      TABELA,
      "readwrite"
    );

  await transacao.store.clear();

  for (
    const colaborador
    of lista
  ) {
    await transacao.store.put(
      colaborador
    );
  }

  await transacao.done;
}

async function listarServidor(
  empresaId: number
): Promise<Colaborador[]> {
  const resposta =
    await fetch(apiUrl(`/api/colaboradores?empresaId=${encodeURIComponent(
        String(empresaId)
      )}`)
    );

  const dados =
    await lerResposta<
      Colaborador[]
    >(resposta);

  return Array.isArray(dados)
    ? dados
    : [];
}

async function enviarParaServidor(
  empresaId: number,
  lista: Colaborador[]
): Promise<void> {
  const resposta =
    await fetch(apiUrl("/api/colaboradores/importar"),
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            empresaId,
            colaboradores:
              lista,
          }),
      }
    );

  if (!resposta.ok) {
    const texto =
      await resposta.text();

    let mensagem =
      "Não foi possível importar os colaboradores.";

    if (texto) {
      try {
        const dados =
          JSON.parse(
            texto
          ) as RespostaApi<never>;

        mensagem =
          dados.erro ||
          mensagem;
      } catch {
        // Mantém mensagem padrão.
      }
    }

    throw new Error(
      mensagem
    );
  }
}

async function garantirBaseServidor(
  empresaId: number
): Promise<Colaborador[]> {
  const servidor =
    await listarServidor(
      empresaId
    );

  if (
    servidor.length > 0
  ) {
    return servidor;
  }

  const locais =
    await listarLocal();

  if (
    locais.length === 0
  ) {
    return [];
  }

  /*
   * Migração automática da base
   * antiga do IndexedDB do PC.
   * Assim não é necessário
   * reimportar a planilha.
   */
  await enviarParaServidor(
    empresaId,
    locais
  );

  return listarServidor(
    empresaId
  );
}

export const colaboradorService = {
  async listar(
    empresaIdInformado?: number
  ): Promise<Colaborador[]> {
    const empresaId =
      obterEmpresaId(
        empresaIdInformado
      );

    if (empresaId <= 0) {
      return [];
    }

    return garantirBaseServidor(
      empresaId
    );
  },

  /*
   * Mantém compatibilidade com
   * o código atual:
   *
   * importar(lista)
   *
   * Também aceita:
   *
   * importar(empresaId, lista)
   */
  async importar(
    listaOuEmpresaId:
      | Colaborador[]
      | number,
    listaInformada?:
      Colaborador[]
  ): Promise<void> {
    const empresaId =
      typeof listaOuEmpresaId ===
      "number"
        ? obterEmpresaId(
            listaOuEmpresaId
          )
        : obterEmpresaId();

    const lista =
      Array.isArray(
        listaOuEmpresaId
      )
        ? listaOuEmpresaId
        : listaInformada ??
          [];

    if (empresaId <= 0) {
      throw new Error(
        "Selecione a empresa antes de importar os colaboradores."
      );
    }

    await enviarParaServidor(
      empresaId,
      lista
    );

    /*
     * Mantém cópia local apenas
     * para compatibilidade/migração.
     * A fonte principal passa a ser
     * o servidor.
     */
    await salvarCopiaLocal(
      lista
    );
  },

  /*
   * Mantém a assinatura que o
   * componente atual já utiliza:
   *
   * buscar(termo)
   */
  async buscar(
    termo: string,
    empresaIdInformado?: number
  ): Promise<Colaborador[]> {
    const pesquisa =
      termo.trim();

    if (!pesquisa) {
      return [];
    }

    const empresaId =
      obterEmpresaId(
        empresaIdInformado
      );

    if (empresaId <= 0) {
      return [];
    }

    /*
     * Se o servidor ainda estiver
     * vazio, migra a planilha/base
     * antiga do navegador primeiro.
     */
    await garantirBaseServidor(
      empresaId
    );

    const resposta =
      await fetch(apiUrl(`/api/colaboradores/buscar?empresaId=${encodeURIComponent(
          String(empresaId)
        )}&termo=${encodeURIComponent(
          pesquisa
        )}`)
      );

    const dados =
      await lerResposta<
        Colaborador[]
      >(resposta);

    return Array.isArray(dados)
      ? dados
      : [];
  },
};