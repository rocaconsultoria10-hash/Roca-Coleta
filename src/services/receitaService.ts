import type { Receita } from "../models/Receita";

const API_URL = "/api/receitas";

type RespostaApi<T> = {
  sucesso: boolean;
  dados: T;
  mensagem?: string;
};

async function tratarResposta<T>(
  response: Response
): Promise<T> {
  const resposta =
    (await response.json()) as RespostaApi<T>;

  if (!response.ok || !resposta.sucesso) {
    throw new Error(
      resposta.mensagem ||
        "Erro ao acessar as receitas."
    );
  }

  return resposta.dados;
}

export const receitaService = {
  async listar(): Promise<Receita[]> {
    const response = await fetch(API_URL);

    return tratarResposta<Receita[]>(response);
  },

  async buscarPorId(
    id: number
  ): Promise<Receita | undefined> {
    const response = await fetch(
      `${API_URL}/${id}`
    );

    if (response.status === 404) {
      return undefined;
    }

    return tratarResposta<Receita>(response);
  },

  async salvar(
    receita: Receita
  ): Promise<void> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(receita),
    });

    await tratarResposta<Receita>(response);
  },

  async remover(id: number): Promise<void> {
    const response = await fetch(
      `${API_URL}/${id}`,
      {
        method: "DELETE",
      }
    );

    await tratarResposta<unknown>(response);
  },

  async listarPorProduto(
    produtoId: number
  ): Promise<Receita[]> {
    const receitas = await this.listar();

    return receitas.filter(
      (receita) =>
        receita.produtoId === produtoId
    );
  },
};