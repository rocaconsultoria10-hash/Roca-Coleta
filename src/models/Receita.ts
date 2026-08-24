export type MaquinaReceita = {
  id: number;
  identificacao: string;
  horaInicio: string;
  horaFinal: string;
};

export type CargoReceita = {
  id: number;
  identificacao: string;
  horaInicio: string;
  horaFinal: string;
};

export type IngredienteDaReceita = {
  id: number;
  identificacao: string;
  quantidadeUtilizada: string;
  unidadeMedida: string;
  sobra: string;
  modulo: "MASSA" | "COBERTURA_ACABAMENTO";
};

export type EmbalagemDaReceita = {
  id: number;
  identificacao: string;
  quantidade: string;
};

export type FotoReceita = {
  id: number;
  categoria:
    | "INGREDIENTES_PREPARACAO"
    | "PRODUTO_FINAL";
  nome: string;
  tipo: string;
  tamanho: number;
  legenda: string;
  preview: string;
};

export interface Receita {
  id: number;

    produtoId: number;
  codigoProduto: string;
  nomeProduto: string;
  gramaturaProduto: string;
  departamento: string;
  secao: string;

  dataColeta: string;
  responsavelColeta: string;
  estoqueCongelado: string;

  validadeSugeridaDias: number | null;
  validadeConservacao: string;
  validadeMotivo: string;
  validadeReferencias: string[];

  cargosEnvolvidos: CargoReceita[];
  maquinas: MaquinaReceita[];
  ingredientes: IngredienteDaReceita[];
  embalagens: EmbalagemDaReceita[];
  fotos: FotoReceita[];

  horaInicioProducao: string;
  horaFinalProducao: string;
  quantidadeProduzida: string;
  unidadeMedidaProduto: string;
  pesoTotalIngredientes: number;
  pesoTotalProduzido: string;
  unidadePesoProduzido: string;

  modoPreparoProducao: string;
  modoPreparoCliente: string;

  criadoEm: string;
  atualizadoEm: string;
}