import { openDB } from "idb";
import type { Receita } from "../models/Receita";

const BANCO = "roca-coleta-receitas";
const VERSAO = 1;
const TABELA = "receitas";

const dbPromise = openDB(BANCO, VERSAO, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(TABELA)) {
      db.createObjectStore(TABELA, {
        keyPath: "id",
      });
    }
  },
});

export const receitaService = {
  async listar(): Promise<Receita[]> {
    const db = await dbPromise;

    const receitas = await db.getAll(TABELA);

    return receitas.sort((a, b) =>
      b.atualizadoEm.localeCompare(a.atualizadoEm)
    );
  },

  async buscarPorId(id: number): Promise<Receita | undefined> {
    const db = await dbPromise;

    return db.get(TABELA, id);
  },

  async salvar(receita: Receita): Promise<void> {
    const db = await dbPromise;

    await db.put(TABELA, receita);
  },

  async remover(id: number): Promise<void> {
    const db = await dbPromise;

    await db.delete(TABELA, id);
  },

  async listarPorProduto(
    produtoId: number
  ): Promise<Receita[]> {
    const receitas = await this.listar();

    return receitas.filter(
      (receita) => receita.produtoId === produtoId
    );
  },
};