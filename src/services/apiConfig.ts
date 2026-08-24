import { Capacitor } from "@capacitor/core";

const API_REDE_LOCAL =
  "http://192.168.18.170:3001";

const API_CONFIGURADA =
  String(
    import.meta.env.VITE_API_URL ?? ""
  )
    .trim()
    .replace(/\/+$/, "");

export const API_BASE_URL =
  API_CONFIGURADA ||
  (Capacitor.isNativePlatform()
    ? API_REDE_LOCAL
    : "");

export function apiUrl(
  caminho: string
): string {
  const caminhoNormalizado =
    caminho.startsWith("/")
      ? caminho
      : `/${caminho}`;

  return `${API_BASE_URL}${caminhoNormalizado}`;
}