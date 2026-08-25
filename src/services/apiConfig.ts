const API_PRODUCAO =
  "https://roca-coleta-production.up.railway.app";

const API_CONFIGURADA =
  String(
    import.meta.env.VITE_API_URL ?? ""
  )
    .trim()
    .replace(/\/+$/, "");

export const API_BASE_URL =
  API_CONFIGURADA ||
  API_PRODUCAO;

export function apiUrl(
  caminho: string
): string {
  const caminhoNormalizado =
    caminho.startsWith("/")
      ? caminho
      : `/${caminho}`;

  return `${API_BASE_URL}${caminhoNormalizado}`;
}