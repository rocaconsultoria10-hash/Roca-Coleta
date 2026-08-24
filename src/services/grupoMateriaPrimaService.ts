import type { GrupoMateriaPrima } from "../models/GrupoMateriaPrima";

const grupos: GrupoMateriaPrima[] = [];

export const grupoMateriaPrimaService = {
  listar(): GrupoMateriaPrima[] {
    return grupos;
  },

  adicionar(grupo: GrupoMateriaPrima): void {
    grupos.push(grupo);
  },
};