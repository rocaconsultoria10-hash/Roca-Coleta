export type PerfilUsuario =
  | "ADMINISTRADOR"
  | "COLETOR";

export interface Usuario {
  id: number;
  usuario: string;
  nome: string;
  senha: string;
  perfil: PerfilUsuario;

  empresaId: number;

  empresaIds: number[];

  situacao:
    | "ATIVO"
    | "INATIVO";
}