import type { Pessoa } from "../models/Pessoa";

const pessoas: Pessoa[] = [];

export const pessoaService = {
  listar(): Pessoa[] {
    return pessoas;
  },

  adicionar(pessoa: Pessoa): void {
    pessoas.push(pessoa);
  },
};