export interface Produto {
  id: number;

  empresaId: number;

  codigo: string;
  codigoBarras?: string;
  descricao: string;
  gramatura: string;
  unidade: string;
  departamento: string;
  secao: string;
}