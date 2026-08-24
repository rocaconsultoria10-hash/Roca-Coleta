export interface IPaginacao<T> {
  itens: T[];
  total: number;
  pagina: number;
  quantidade: number;
}