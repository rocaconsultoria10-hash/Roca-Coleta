import type { Embalagem } from "../models/Embalagem";

type RespostaLista = {
  sucesso: boolean;
  dados: Embalagem[];
};

export const embalagemService = {
  async listar(): Promise<Embalagem[]> {
    const resposta = await fetch(
      "/api/embalagens"
    );

    if (!resposta.ok) {
      const dados = await resposta
        .json()
        .catch(() => null);

      throw new Error(
        dados?.erro ||
          "Não foi possível carregar as embalagens."
      );
    }

    const dados =
      (await resposta.json()) as RespostaLista;

    return dados.dados ?? [];
  },

  async importar(
    lista: Embalagem[]
  ): Promise<void> {
    const resposta = await fetch(
      "/api/embalagens/importar",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          embalagens: lista,
        }),
      }
    );

    if (!resposta.ok) {
      const corpo = await resposta.text();

      let mensagem = corpo;

      try {
        const dados = JSON.parse(corpo);

        mensagem =
          dados?.detalhe ||
          dados?.erro ||
          corpo;
      } catch {
        // Mantém o corpo original quando não for JSON.
      }

      throw new Error(
        `Erro ${resposta.status}: ${
          mensagem ||
          "Não foi possível importar as embalagens."
        }`
      );
    }
  },

  async buscar(
    termo: string
  ): Promise<Embalagem[]> {
    const pesquisa =
      termo.trim();

    if (!pesquisa) {
      return [];
    }

    const resposta = await fetch(
      `/api/embalagens/buscar?termo=${encodeURIComponent(
        pesquisa
      )}`
    );

    if (!resposta.ok) {
      const dados = await resposta
        .json()
        .catch(() => null);

      throw new Error(
        dados?.erro ||
          "Não foi possível buscar as embalagens."
      );
    }

    const dados =
      (await resposta.json()) as RespostaLista;

    return dados.dados ?? [];
  },
};