import type { Maquina } from "../models/Maquina";
import { apiUrl } from "./apiConfig";

type RespostaLista = {
  sucesso: boolean;
  dados: Maquina[];
  erro?: string;
};

async function lerResposta(
  resposta: Response
): Promise<RespostaLista> {
  const dados = await resposta
    .json()
    .catch(() => null);

  if (!resposta.ok) {
    throw new Error(
      dados?.erro ||
        `Erro no servidor (${resposta.status}).`
    );
  }

  return dados ?? {
    sucesso: false,
    dados: [],
  };
}

export const maquinaService = {
  async listar(): Promise<Maquina[]> {
    const resposta = await fetch(
      apiUrl("/api/maquinas")
    );

    const dados =
      await lerResposta(resposta);

    return dados.dados ?? [];
  },

  async importar(
    lista: Maquina[]
  ): Promise<void> {
    const resposta = await fetch(
      apiUrl("/api/maquinas/importar"),
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          maquinas: lista,
        }),
      }
    );

    await lerResposta(resposta);
  },

  async buscar(
    termo: string
  ): Promise<Maquina[]> {
    const pesquisa = termo.trim();

    if (!pesquisa) {
      return [];
    }

    const resposta = await fetch(
      apiUrl(
        `/api/maquinas/buscar?termo=${encodeURIComponent(
          pesquisa
        )}`
      )
    );

    const dados =
      await lerResposta(resposta);

    return dados.dados ?? [];
  },
};