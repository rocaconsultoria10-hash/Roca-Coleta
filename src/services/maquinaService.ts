import type { Maquina } from "../models/Maquina";

type RespostaLista = {
  sucesso: boolean;
  dados: Maquina[];
};

export const maquinaService = {
  async listar(): Promise<Maquina[]> {
    const resposta = await fetch(
      "/api/maquinas"
    );

    if (!resposta.ok) {
      const dados = await resposta
        .json()
        .catch(() => null);

      throw new Error(
        dados?.erro ||
          "Não foi possível carregar os equipamentos."
      );
    }

    const dados =
      (await resposta.json()) as RespostaLista;

    return dados.dados ?? [];
  },

  async importar(
    lista: Maquina[]
  ): Promise<void> {
    const resposta = await fetch(
      "/api/maquinas/importar",
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

    if (!resposta.ok) {
      const dados = await resposta
        .json()
        .catch(() => null);

      throw new Error(
        dados?.erro ||
          "Não foi possível importar os equipamentos."
      );
    }
  },

  async buscar(
    termo: string
  ): Promise<Maquina[]> {
    const pesquisa =
      termo.trim();

    if (!pesquisa) {
      return [];
    }

    const resposta = await fetch(
      `/api/maquinas/buscar?termo=${encodeURIComponent(
        pesquisa
      )}`
    );

    if (!resposta.ok) {
      const dados = await resposta
        .json()
        .catch(() => null);

      throw new Error(
        dados?.erro ||
          "Não foi possível buscar os equipamentos."
      );
    }

    const dados =
      (await resposta.json()) as RespostaLista;

    return dados.dados ?? [];
  },
};