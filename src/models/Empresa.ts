export interface Empresa {
  id: number;

  razaoSocial: string;
  nomeFantasia: string;
  email: string;

  situacao:
    | "ATIVA"
    | "INATIVA";

  criadoEm: string;
  atualizadoEm: string;

  cnpj?: string;
  telefone?: string;
}