import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";

type TipoModoPreparo = "PRODUCAO" | "CLIENTE";

type Props = {
  modoPreparoProducao: string;
  modoPreparoCliente: string;
  onChangeModoPreparoProducao: (valor: string) => void;
  onChangeModoPreparoCliente: (valor: string) => void;

  onAjustarComIA?: (
    tipo: TipoModoPreparo,
    texto: string
  ) => Promise<string>;
};

type SpeechRecognitionEvent = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((event: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((event: { error: string }) => void)
    | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () =>
  SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function normalizarComparacao(
  valor: string
): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mesclarSemRepetir(
  anterior: string,
  novo: string
): string {
  const textoAnterior = anterior.trim();
  const textoNovo = novo.trim();

  if (!textoAnterior) {
    return textoNovo;
  }

  if (!textoNovo) {
    return textoAnterior;
  }

  const palavrasAnterior =
    textoAnterior.split(/\s+/);

  const palavrasNovo =
    textoNovo.split(/\s+/);

  const anteriorNormalizado =
    palavrasAnterior.map(
      normalizarComparacao
    );

  const novoNormalizado =
    palavrasNovo.map(
      normalizarComparacao
    );

  const limite = Math.min(
    12,
    anteriorNormalizado.length,
    novoNormalizado.length
  );

  let sobreposicao = 0;

  for (
    let tamanho = limite;
    tamanho >= 1;
    tamanho -= 1
  ) {
    const fimAnterior =
      anteriorNormalizado
        .slice(-tamanho)
        .join(" ");

    const inicioNovo =
      novoNormalizado
        .slice(0, tamanho)
        .join(" ");

    if (
      fimAnterior === inicioNovo
    ) {
      sobreposicao = tamanho;
      break;
    }
  }

  const restante =
    palavrasNovo
      .slice(sobreposicao)
      .join(" ")
      .trim();

  if (!restante) {
    return textoAnterior;
  }

  return `${textoAnterior} ${restante}`;
}

export default function ModoPreparo({
  modoPreparoProducao,
  modoPreparoCliente,
  onChangeModoPreparoProducao,
  onChangeModoPreparoCliente,
  onAjustarComIA,
}: Props) {
  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(null);

  const campoGravandoRef =
    useRef<TipoModoPreparo | null>(null);

  const encerramentoManualRef =
    useRef(false);

  const textoAntesGravacaoRef =
    useRef("");

  const transcricaoAcumuladaRef =
    useRef("");

  const trechoAtualRef =
    useRef("");

  const [campoGravando, setCampoGravando] =
    useState<TipoModoPreparo | null>(null);

  const [ajustandoIA, setAjustandoIA] =
    useState<TipoModoPreparo | null>(null);

  const [mensagemErro, setMensagemErro] =
    useState("");

  function atualizarCampo(
    tipo: TipoModoPreparo,
    valor: string
  ) {
    if (tipo === "PRODUCAO") {
      onChangeModoPreparoProducao(valor);
      return;
    }

    onChangeModoPreparoCliente(valor);
  }

  function obterTextoCampo(
    tipo: TipoModoPreparo
  ): string {
    if (tipo === "PRODUCAO") {
      return modoPreparoProducao;
    }

    return modoPreparoCliente;
  }

  function iniciarGravacao(
    tipo: TipoModoPreparo
  ) {
    setMensagemErro("");

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMensagemErro(
        "O navegador não oferece suporte à transcrição de voz."
      );
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    encerramentoManualRef.current = false;
    textoAntesGravacaoRef.current =
      obterTextoCampo(tipo).trim();
    transcricaoAcumuladaRef.current = "";
    trechoAtualRef.current = "";
    campoGravandoRef.current = tipo;
    setCampoGravando(tipo);

    recognition.onresult = (event) => {
      let trechoDoCiclo = "";

      for (
        let indice = 0;
        indice < event.results.length;
        indice += 1
      ) {
        const resultado =
          event.results[indice];

        const trecho =
          resultado[0]?.transcript ?? "";

        if (!trecho.trim()) {
          continue;
        }

        trechoDoCiclo =
          mesclarSemRepetir(
            trechoDoCiclo,
            trecho.trim()
          );
      }

      trechoAtualRef.current =
        trechoDoCiclo.trim();

      const campoAtual =
        campoGravandoRef.current;

      if (!campoAtual) {
        return;
      }

      const base =
        mesclarSemRepetir(
          textoAntesGravacaoRef.current,
          transcricaoAcumuladaRef.current
        );

      const textoCompleto =
        mesclarSemRepetir(
          base,
          trechoAtualRef.current
        );

      atualizarCampo(
        campoAtual,
        textoCompleto
      );
    };

    recognition.onerror = (event) => {
      if (
        event.error === "aborted" ||
        event.error === "no-speech"
      ) {
        return;
      }

      encerramentoManualRef.current = true;

      setMensagemErro(
        `Erro na transcrição de voz: ${event.error}`
      );
    };

    recognition.onend = () => {
      const deveContinuar =
        !encerramentoManualRef.current &&
        campoGravandoRef.current !== null;

      if (deveContinuar) {
        if (trechoAtualRef.current.trim()) {
          transcricaoAcumuladaRef.current =
            mesclarSemRepetir(
              transcricaoAcumuladaRef.current,
              trechoAtualRef.current
            );

          trechoAtualRef.current = "";
        }

        window.setTimeout(() => {
          if (
            encerramentoManualRef.current ||
            campoGravandoRef.current === null
          ) {
            return;
          }

          try {
            recognition.start();
          } catch {
            recognitionRef.current = null;
            campoGravandoRef.current = null;
            setCampoGravando(null);
          }
        }, 250);

        return;
      }

      recognitionRef.current = null;
      campoGravandoRef.current = null;
      setCampoGravando(null);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function pararGravacao() {
    if (!recognitionRef.current) {
      return;
    }

    encerramentoManualRef.current = true;

    if (trechoAtualRef.current.trim()) {
      transcricaoAcumuladaRef.current =
        mesclarSemRepetir(
          transcricaoAcumuladaRef.current,
          trechoAtualRef.current
        );

      trechoAtualRef.current = "";
    }

    recognitionRef.current.stop();
  }

  async function ajustarComIA(
    tipo: TipoModoPreparo
  ) {
    setMensagemErro("");

    const texto = obterTextoCampo(tipo);

    if (!texto.trim()) {
      setMensagemErro(
        "Digite ou transcreva o modo de preparo antes de ajustar com IA."
      );
      return;
    }

    if (!onAjustarComIA) {
      setMensagemErro(
        "A integração com IA ainda precisa ser conectada."
      );
      return;
    }

    try {
      setAjustandoIA(tipo);

      const textoAjustado =
        await onAjustarComIA(
          tipo,
          texto
        );

      atualizarCampo(
        tipo,
        textoAjustado
      );
    } catch (error) {
      console.error(
        "Erro ao ajustar modo de preparo com IA:",
        error
      );

      setMensagemErro(
        "Não foi possível ajustar o texto com IA."
      );
    } finally {
      setAjustandoIA(null);
    }
  }

  return (
    <Box
      sx={{
        mt: 3,
        display: "grid",
        gap: 2,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: "text.primary",
        }}
      >
        Modo de preparo
      </Typography>

      {mensagemErro && (
        <Alert severity="error">
          {mensagemErro}
        </Alert>
      )}

      <Box
        sx={{
          p: {
            xs: 1.5,
            sm: 2,
          },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          backgroundColor: "background.paper",
          boxShadow:
            "0 2px 8px rgba(15,35,60,0.05)",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            mb: 1,
            color: "text.primary",
          }}
        >
          Produção
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1.5,
          }}
        >
          Registre o modo de preparo utilizado pela equipe de produção.
        </Typography>

        <TextField
          fullWidth
          multiline
          minRows={6}
          label="Modo de preparo da produção"
          value={modoPreparoProducao}
          onChange={(event) =>
            onChangeModoPreparoProducao(
              event.target.value
            )
          }
        />

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            mt: 1.5,
          }}
        >
          <Button
            variant="outlined"
            disabled={
              campoGravando !== null
            }
            onClick={() =>
              iniciarGravacao(
                "PRODUCAO"
              )
            }
          >
            Iniciar gravação
          </Button>

          <Button
            variant="outlined"
            color="error"
            disabled={
              campoGravando !==
              "PRODUCAO"
            }
            onClick={pararGravacao}
          >
            Parar gravação
          </Button>

          <Button
            variant="contained"
            disabled={
              ajustandoIA !== null ||
              campoGravando !== null
            }
            onClick={() =>
              ajustarComIA(
                "PRODUCAO"
              )
            }
          >
            {ajustandoIA ===
            "PRODUCAO"
              ? "Ajustando..."
              : "Ajustar com IA"}
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          p: {
            xs: 1.5,
            sm: 2,
          },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          backgroundColor: "background.paper",
          boxShadow:
            "0 2px 8px rgba(15,35,60,0.05)",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            mb: 1,
            color: "text.primary",
          }}
        >
          Orientação ao cliente
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1.5,
          }}
        >
          Informe como o cliente deve finalizar, armazenar ou preparar o produto em casa ou na revenda.
        </Typography>

        <TextField
          fullWidth
          multiline
          minRows={6}
          label="Modo de preparo para o cliente"
          value={modoPreparoCliente}
          onChange={(event) =>
            onChangeModoPreparoCliente(
              event.target.value
            )
          }
        />

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            mt: 1.5,
          }}
        >
          <Button
            variant="outlined"
            disabled={
              campoGravando !== null
            }
            onClick={() =>
              iniciarGravacao(
                "CLIENTE"
              )
            }
          >
            Iniciar gravação
          </Button>

          <Button
            variant="outlined"
            color="error"
            disabled={
              campoGravando !==
              "CLIENTE"
            }
            onClick={pararGravacao}
          >
            Parar gravação
          </Button>

          <Button
            variant="contained"
            disabled={
              ajustandoIA !== null ||
              campoGravando !== null
            }
            onClick={() =>
              ajustarComIA(
                "CLIENTE"
              )
            }
          >
            {ajustandoIA ===
            "CLIENTE"
              ? "Ajustando..."
              : "Ajustar com IA"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}