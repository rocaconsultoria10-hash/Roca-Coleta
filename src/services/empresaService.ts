import type { Empresa } from "../models/Empresa";
import { apiUrl } from "./apiConfig";

const CHAVE_STORAGE =
  "roca_coleta_empresas";

type RespostaApi<T> = {
  sucesso?: boolean;
  dados?: T;
  erro?: string;
};

function carregarEmpresasLocais(): Empresa[] {
  try {
    const dados =
      localStorage.getItem(
        CHAVE_STORAGE
      );

    if (!dados) {
      return [];
    }

    return JSON.parse(
      dados
    ) as Empresa[];
  } catch {
    return [];
  }
}

async function lerResposta<T>(
  resposta: Response
): Promise<T> {
  const dados =
    (await resposta.json()) as RespostaApi<T>;

  if (!resposta.ok) {
    throw new Error(
      dados.erro ||
        "Erro ao acessar o servidor."
    );
  }

  return dados.dados as T;
}

async function migrarEmpresasLocais(
  empresasServidor: Empresa[]
): Promise<Empresa[]> {
  const empresasLocais =
    carregarEmpresasLocais();

  if (empresasLocais.length === 0) {
    return empresasServidor;
  }

  const idsServidor =
    new Set(
      empresasServidor.map(
        (empresa) =>
          Number(empresa.id)
      )
    );

  let houveMigracao = false;

  for (const empresa of empresasLocais) {
    if (
      idsServidor.has(
        Number(empresa.id)
      )
    ) {
      continue;
    }

    try {
      const resposta =
        await fetch(apiUrl("/api/empresas"),
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              empresa
            ),
          }
        );

      if (resposta.ok) {
        houveMigracao = true;
        idsServidor.add(
          Number(empresa.id)
        );
      }
    } catch {
      // A chamada principal exibirá o erro
      // caso o servidor esteja indisponível.
    }
  }

  if (!houveMigracao) {
    return empresasServidor;
  }

  const respostaAtualizada =
    await fetch(apiUrl("/api/empresas"));

  return lerResposta<Empresa[]>(
    respostaAtualizada
  );
}

export const empresaService = {
  async listar(): Promise<Empresa[]> {
    const resposta =
      await fetch(apiUrl("/api/empresas"));

    const empresasServidor =
      await lerResposta<Empresa[]>(
        resposta
      );

    return migrarEmpresasLocais(
      empresasServidor
    );
  },

  async buscarPorId(
    id: number
  ): Promise<Empresa | null> {
    const empresas =
      await this.listar();

    return (
      empresas.find(
        (empresa) =>
          Number(empresa.id) ===
          Number(id)
      ) || null
    );
  },

  async cadastrar(
    dados: Omit<
      Empresa,
      "id" | "criadoEm" | "atualizadoEm"
    >
  ): Promise<Empresa> {
    const agora =
      new Date().toISOString();

    const novaEmpresa = {
      ...dados,
      id: Date.now(),
      criadoEm: agora,
      atualizadoEm: agora,
    };

    const resposta =
      await fetch(apiUrl("/api/empresas"),
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            novaEmpresa
          ),
        }
      );

    return lerResposta<Empresa>(
      resposta
    );
  },

  async atualizar(
    id: number,
    dados: Partial<
      Omit<Empresa, "id" | "criadoEm">
    >
  ): Promise<Empresa> {
    const resposta =
      await fetch(apiUrl(`/api/empresas/${id}`),
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            dados
          ),
        }
      );

    return lerResposta<Empresa>(
      resposta
    );
  },

  async alterarSituacao(
    id: number,
    situacao: "ATIVA" | "INATIVA"
  ): Promise<Empresa> {
    return this.atualizar(
      id,
      {
        situacao,
      }
    );
  },

  async remover(
    id: number
  ): Promise<void> {
    const resposta =
      await fetch(apiUrl(`/api/empresas/${id}`),
        {
          method: "DELETE",
        }
      );

    if (!resposta.ok) {
      const dados =
        (await resposta.json()) as RespostaApi<unknown>;

      throw new Error(
        dados.erro ||
          "Não foi possível remover a empresa."
      );
    }
  },
};