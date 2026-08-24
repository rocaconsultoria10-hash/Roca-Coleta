import type { Embalagem } from "../models/Embalagem";

const embalagens: Embalagem[] = [];

export const embalagemService = {
  listar(): Embalagem[] {
    return embalagens;
  },

  adicionar(embalagem: Embalagem): void {
    embalagens.push(embalagem);
  },
};