import { openDB } from "idb";
import type { Embalagem } from "../models/Embalagem";

const BANCO = "roca-coleta-embalagens";
const VERSAO = 1;
const TABELA = "embalagens";

const dbPromise = openDB(BANCO, VERSAO, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(TABELA)) {
      db.createObjectStore(TABELA, {
        keyPath: "id",
      });
    }
  },
});

export const embalagemService = {
  async listar(): Promise<Embalagem[]> {
    const db = await dbPromise;
    return db.getAll(TABELA);
  },

  async importar(lista: Embalagem[]): Promise<void> {
    const db = await dbPromise;
    const transacao = db.transaction(TABELA, "readwrite");

    await transacao.store.clear();

    for (const embalagem of lista) {
      await transacao.store.put(embalagem);
    }

    await transacao.done;
  },

  async buscar(termo: string): Promise<Embalagem[]> {
    const pesquisa = termo.trim().toLowerCase();

    if (!pesquisa) return [];

    const embalagens = await this.listar();

    return embalagens
      .filter(
        (embalagem) =>
          embalagem.codigo.toLowerCase().includes(pesquisa) ||
          embalagem.descricao.toLowerCase().includes(pesquisa)
      )
      .slice(0, 20);
  },
};