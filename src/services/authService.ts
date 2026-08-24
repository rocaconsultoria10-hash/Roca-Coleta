import type { Usuario } from "../models/Usuario";

const CHAVE_USUARIO =
  "roca-coleta-usuario-logado";

const CHAVE_EMPRESA_ATIVA =
  "roca-coleta-empresa-ativa";

export const authService = {
  salvarUsuario(
    usuario: Usuario
  ): void {
    localStorage.setItem(
      CHAVE_USUARIO,
      JSON.stringify(usuario)
    );
  },

  getUsuarioLogado(): Usuario | null {
    const dados =
      localStorage.getItem(
        CHAVE_USUARIO
      );

    if (!dados) {
      return null;
    }

    try {
      return JSON.parse(
        dados
      ) as Usuario;
    } catch {
      localStorage.removeItem(
        CHAVE_USUARIO
      );

      return null;
    }
  },

  estaLogado(): boolean {
    return (
      this.getUsuarioLogado() !== null
    );
  },

  salvarEmpresaAtiva(
    empresaId: number
  ): void {
    localStorage.setItem(
      CHAVE_EMPRESA_ATIVA,
      String(empresaId)
    );
  },

  getEmpresaAtivaId():
    | number
    | null {
    const valor =
      localStorage.getItem(
        CHAVE_EMPRESA_ATIVA
      );

    if (!valor) {
      return null;
    }

    const empresaId =
      Number(valor);

    if (
      !Number.isFinite(
        empresaId
      ) ||
      empresaId <= 0
    ) {
      localStorage.removeItem(
        CHAVE_EMPRESA_ATIVA
      );

      return null;
    }

    return empresaId;
  },

  limparEmpresaAtiva(): void {
    localStorage.removeItem(
      CHAVE_EMPRESA_ATIVA
    );
  },

  logout(): void {
    localStorage.removeItem(
      CHAVE_USUARIO
    );

    localStorage.removeItem(
      CHAVE_EMPRESA_ATIVA
    );
  },
};