type JanelaComCapacitor = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
};

const API_REDE_LOCAL =
  "http://192.168.18.170:3001";

const API_CONFIGURADA =
  String(
    import.meta.env.VITE_API_URL ?? ""
  )
    .trim()
    .replace(/\/+$/, "");

function estaNoAplicativoNativo(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const janela =
    window as JanelaComCapacitor;

  return Boolean(
    janela.Capacitor
      ?.isNativePlatform?.()
  );
}

export const API_BASE_URL =
  API_CONFIGURADA ||
  (estaNoAplicativoNativo()
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