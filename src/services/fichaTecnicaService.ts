import type { FichaTecnica } from "../models/FichaTecnica.ts";

const fichas: FichaTecnica[] = [];

export const fichaTecnicaService = {
  listar(): FichaTecnica[] {
    return fichas;
  },

  adicionar(ficha: FichaTecnica): void {
    fichas.push(ficha);
  },
};