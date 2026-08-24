import type { Produto } from "../models/Produto";
import type { FotoReceita } from "../models/Receita";

export type RascunhoMaquina = {
  id: number;
  nome: string;
  horaInicio: string;
  horaFinal: string;
};

export type RascunhoColaborador = {
  id: number;
  identificacao: string;
  horaInicio: string;
  horaFinal: string;
};

export type RascunhoEmbalagem = {
  id: number;
  identificacao: string;
  quantidade: string;
};

export type RascunhoIngrediente = {
  id: number;
  identificacao: string;
  quantidadeUtilizada: string;
  unidadeMedida: string;
  sobra: string;
  modulo:
    | "MASSA"
    | "COBERTURA_ACABAMENTO";
};

export type RascunhoRecomendacaoValidade = {
  dias: number | null;
  conservacao: string;
  motivo: string;
  referencias: string[];
};

export type RascunhoReceita = {
  versao: 1;

  empresaId: number;
  usuarioId: number;

  receitaId: number;
  criadoEm: string;
  atualizadoEm: string;

  busca: string;

  produtoSelecionado:
    | Produto
    | null;

  dataColeta: string;
  estoqueCongelado: string;

  maquinas: RascunhoMaquina[];

  colaboradores:
    RascunhoColaborador[];

  embalagens:
    RascunhoEmbalagem[];

  ingredientes:
    RascunhoIngrediente[];

  fotos: FotoReceita[];

  horaInicioProducao: string;
  horaFinalProducao: string;

  quantidadeProduzida: string;
  unidadeMedidaProduto: string;

  pesoTotalProduzido: string;
  unidadePesoProduzido: string;

  modoPreparoProducao: string;
  modoPreparoCliente: string;

  recomendacaoValidade:
    | RascunhoRecomendacaoValidade
    | null;
};

const PREFIXO_CHAVE =
  "roca-coleta-rascunho-receita";

function montarChave(
  empresaId: number,
  usuarioId: number
): string {
  return [
    PREFIXO_CHAVE,
    empresaId,
    usuarioId,
  ].join(":");
}

function dadosValidos(
  empresaId: number,
  usuarioId: number
): boolean {
  return (
    Number.isFinite(empresaId) &&
    empresaId > 0 &&
    Number.isFinite(usuarioId) &&
    usuarioId > 0
  );
}

export const rascunhoReceitaService = {
  salvar(
    rascunho: RascunhoReceita
  ): void {
    if (
      !dadosValidos(
        rascunho.empresaId,
        rascunho.usuarioId
      )
    ) {
      return;
    }

    const chave =
      montarChave(
        rascunho.empresaId,
        rascunho.usuarioId
      );

    const dadosParaSalvar:
      RascunhoReceita = {
      ...rascunho,

      versao: 1,

      atualizadoEm:
        new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        chave,
        JSON.stringify(
          dadosParaSalvar
        )
      );
    } catch (error) {
      console.error(
        "Erro ao salvar rascunho da receita:",
        error
      );
    }
  },

  buscar(
    empresaId: number,
    usuarioId: number
  ): RascunhoReceita | null {
    if (
      !dadosValidos(
        empresaId,
        usuarioId
      )
    ) {
      return null;
    }

    const chave =
      montarChave(
        empresaId,
        usuarioId
      );

    const dados =
      localStorage.getItem(
        chave
      );

    if (!dados) {
      return null;
    }

    try {
      const rascunho =
        JSON.parse(
          dados
        ) as RascunhoReceita;

      if (
        !rascunho ||
        rascunho.versao !== 1
      ) {
        localStorage.removeItem(
          chave
        );

        return null;
      }

      if (
        rascunho.empresaId !==
          empresaId ||
        rascunho.usuarioId !==
          usuarioId
      ) {
        return null;
      }

      return rascunho;
    } catch (error) {
      console.error(
        "Erro ao carregar rascunho da receita:",
        error
      );

      localStorage.removeItem(
        chave
      );

      return null;
    }
  },

  existe(
    empresaId: number,
    usuarioId: number
  ): boolean {
    return (
      this.buscar(
        empresaId,
        usuarioId
      ) !== null
    );
  },

  remover(
    empresaId: number,
    usuarioId: number
  ): void {
    if (
      !dadosValidos(
        empresaId,
        usuarioId
      )
    ) {
      return;
    }

    const chave =
      montarChave(
        empresaId,
        usuarioId
      );

    localStorage.removeItem(
      chave
    );
  },
};