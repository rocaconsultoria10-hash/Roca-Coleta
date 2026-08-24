import { openDB } from "idb";
import type { Maquina } from "../models/Maquina";

const BANCO = "roca-coleta-maquinas";
const VERSAO = 1;
const TABELA = "maquinas";

const dbPromise = openDB(BANCO, VERSAO, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(TABELA)) {
      db.createObjectStore(TABELA, {
        keyPath: "id",
      });
    }
  },
});

export const maquinaService = {
  async listar(): Promise<Maquina[]> {
    const db = await dbPromise;

    const maquinas =
      await db.getAll(TABELA);

    return maquinas.sort((a, b) =>
      a.descricao.localeCompare(
        b.descricao,
        "pt-BR",
        { sensitivity: "base" }
      )
    );
  },

  async importar(
    lista: Maquina[]
  ): Promise<void> {
    const db = await dbPromise;

    const transacao =
      db.transaction(
        TABELA,
        "readwrite"
      );

    await transacao.store.clear();

    for (const maquina of lista) {
      await transacao.store.put(
        maquina
      );
    }

    await transacao.done;
  },

  async buscar(
    termo: string
  ): Promise<Maquina[]> {
    const pesquisa =
      termo.trim().toLowerCase();

    if (!pesquisa) {
      return [];
    }

    const maquinas =
      await this.listar();

    return maquinas
      .filter(
        (maquina) =>
          maquina.codigo
            .toLowerCase()
            .includes(pesquisa) ||
          maquina.descricao
            .toLowerCase()
            .includes(pesquisa)
      )
      .slice(0, 20);
  },
};