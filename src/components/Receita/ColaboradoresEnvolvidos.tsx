import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { colaboradorService } from "../../services/colaboradorService";
import type { Colaborador } from "../../models/Colaborador";

export type ColaboradorEnvolvido = {
  id: number;
  identificacao: string;
  horaInicio: string;
  horaFinal: string;
};

type CampoColaborador =
  | "identificacao"
  | "horaInicio"
  | "horaFinal";

type Props = {
  colaboradores: ColaboradorEnvolvido[];
  onAdicionarColaborador: () => void;
  onAtualizarColaborador: (
    id: number,
    campo: CampoColaborador,
    valor: string
  ) => void;
  onRemoverColaborador: (
    id: number
  ) => void;
};

type LinhaColaboradorProps = {
  colaborador: ColaboradorEnvolvido;
  indice: number;
  onAtualizarColaborador: (
    id: number,
    campo: CampoColaborador,
    valor: string
  ) => void;
  onRemoverColaborador: (
    id: number
  ) => void;
};

function formatarHoraDigitada(
  valor: string
): string {
  let numeros = valor
    .replace(/\D/g, "")
    .slice(0, 4);

  if (numeros.length >= 2) {
    const hora = Number(numeros.slice(0, 2));
    if (hora > 23) {
      numeros = "23" + numeros.slice(2);
    }
  }

  if (numeros.length >= 3) {
    const dezenaMinuto = Number(numeros[2]);
    if (dezenaMinuto > 5) {
      numeros =
        numeros.slice(0, 2) +
        "5" +
        numeros.slice(3);
    }
  }

  if (numeros.length <= 2) {
    return numeros;
  }

  return `${numeros.slice(0, 2)}:${numeros.slice(2)}`;
}

function calcularTempoTotal(
  horaInicio: string,
  horaFinal: string
): string {
  if (!horaInicio || !horaFinal) {
    return "";
  }

  const [
    horaInicial,
    minutoInicial,
  ] = horaInicio
    .split(":")
    .map(Number);

  const [
    horaEncerramento,
    minutoEncerramento,
  ] = horaFinal
    .split(":")
    .map(Number);

  const inicioEmMinutos =
    horaInicial * 60 +
    minutoInicial;

  let finalEmMinutos =
    horaEncerramento * 60 +
    minutoEncerramento;

  if (
    finalEmMinutos <
    inicioEmMinutos
  ) {
    finalEmMinutos +=
      24 * 60;
  }

  const diferenca =
    finalEmMinutos -
    inicioEmMinutos;

  const horas =
    Math.floor(
      diferenca / 60
    );

  const minutos =
    diferenca % 60;

  if (horas === 0) {
    return `${minutos} min`;
  }

  if (minutos === 0) {
    return `${horas} h`;
  }

  return `${horas} h ${minutos} min`;
}

function LinhaColaborador({
  colaborador,
  indice,
  onAtualizarColaborador,
  onRemoverColaborador,
}: LinhaColaboradorProps) {
  const [
    resultados,
    setResultados,
  ] =
    useState<Colaborador[]>(
      []
    );

  const [
    selecionado,
    setSelecionado,
  ] =
    useState<Colaborador | null>(
      null
    );

  const tempoTrabalhado =
    calcularTempoTotal(
      colaborador.horaInicio,
      colaborador.horaFinal
    );

  useEffect(() => {
    async function pesquisar() {
      if (
        colaborador.identificacao
          .trim().length < 2 ||
        selecionado
      ) {
        setResultados([]);
        return;
      }

      const lista =
        await colaboradorService.buscar(
          colaborador.identificacao
        );

      setResultados(lista);
    }

    pesquisar();
  }, [
    colaborador.identificacao,
    selecionado,
  ]);

  function selecionarColaborador(
    item: Colaborador
  ) {
    setSelecionado(item);

    onAtualizarColaborador(
      colaborador.id,
      "identificacao",
      item.cargo
    );

    setResultados([]);
  }

  function alterarBusca(
    valor: string
  ) {
    setSelecionado(null);

    onAtualizarColaborador(
      colaborador.id,
      "identificacao",
      valor
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        mb: 0.75,
        border: "none",
        borderRadius: 2,
        backgroundColor: "#F8FAFC",
      }}
    >
      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs:
              "minmax(0, 1fr) 82px 82px",
            sm:
              "minmax(220px, 1fr) 110px 110px 110px auto",
          },

          gap: 0.75,
          alignItems: "start",
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            position: "relative",
          }}
        >
          <TextField
            fullWidth
            size="small"
            label={`Cargo ${indice + 1}`}
            value={
              colaborador.identificacao
            }
            onChange={(event) =>
              alterarBusca(
                event.target.value
              )
            }
            placeholder="Pesquisar cargo"
          />

          {resultados.length >
            0 && (
            <List
              sx={{
                position:
                  "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 20,
                mt: 0.5,
                p: 0,
                maxHeight: 220,
                overflowY:
                  "auto",
                backgroundColor:
                  "#FFFFFF",
                border: "none",
                borderRadius: 2,
                boxShadow:
                  "0 8px 24px rgba(15,23,42,0.12)",
              }}
            >
              {resultados.map(
                (item) => (
                  <ListItemButton
                    key={item.id}
                    dense
                    onClick={() =>
                      selecionarColaborador(
                        item
                      )
                    }
                  >
                    <ListItemText
                      primary={
                        item.cargo
                      }
                      secondary={[
                        item.matricula,
                        item.nome,
                        item.setor,
                        item.loja,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " | "
                        )}
                      sx={{
                        "& .MuiListItemText-primary":
                          {
                            fontSize:
                              "0.84rem",
                            fontWeight:
                              700,
                          },

                        "& .MuiListItemText-secondary":
                          {
                            fontSize:
                              "0.72rem",
                          },
                      }}
                    />
                  </ListItemButton>
                )
              )}
            </List>
          )}
        </Box>

        <TextField
          size="small"
          label="Início"
          type="text"
          placeholder="00:00"
          value={
            colaborador.horaInicio
          }
          onChange={(event) =>
            onAtualizarColaborador(
              colaborador.id,
              "horaInicio",
              formatarHoraDigitada(
                event.target.value
              )
            )
          }
          slotProps={{
            htmlInput: {
              inputMode: "numeric",
              maxLength: 5,
              pattern: "[0-9:]*",
            },
            inputLabel: {
              shrink: true,
            },
          }}
        />

        <TextField
          size="small"
          label="Fim"
          type="text"
          placeholder="00:00"
          value={
            colaborador.horaFinal
          }
          onChange={(event) =>
            onAtualizarColaborador(
              colaborador.id,
              "horaFinal",
              formatarHoraDigitada(
                event.target.value
              )
            )
          }
          slotProps={{
            htmlInput: {
              inputMode: "numeric",
              maxLength: 5,
              pattern: "[0-9:]*",
            },
            inputLabel: {
              shrink: true,
            },
          }}
        />

        <TextField
          size="small"
          label="Tempo"
          value={tempoTrabalhado}
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
          sx={{
            display: {
              xs: "none",
              sm: "block",
            },
          }}
        />

        <Button
          color="error"
          size="small"
          onClick={() =>
            onRemoverColaborador(
              colaborador.id
            )
          }
          sx={{
            minWidth: 36,
            px: 0.75,

            gridColumn: {
              xs: "1 / -1",
              sm: "auto",
            },

            justifySelf: {
              xs: "end",
              sm: "stretch",
            },
          }}
        >
          Remover
        </Button>
      </Box>

      {tempoTrabalhado && (
        <Typography
          sx={{
            display: {
              xs: "block",
              sm: "none",
            },

            mt: 0.5,
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#0D3768",
          }}
        >
          Tempo:{" "}
          {tempoTrabalhado}
        </Typography>
      )}
    </Paper>
  );
}

export default function ColaboradoresEnvolvidos({
  colaboradores,
  onAdicionarColaborador,
  onAtualizarColaborador,
  onRemoverColaborador,
}: Props) {
  const [seletorAberto, setSeletorAberto] =
    useState(false);

  const [listaCompleta, setListaCompleta] =
    useState<Colaborador[]>([]);

  const [carregandoLista, setCarregandoLista] =
    useState(false);

  const [selecionarAposAdicionar, setSelecionarAposAdicionar] =
    useState<Colaborador | null>(null);

  const [idsAntes, setIdsAntes] =
    useState<number[]>([]);

  async function abrirSeletor() {
    setCarregandoLista(true);
    setSeletorAberto(true);

    try {
      const lista =
        await colaboradorService.listar();

      setListaCompleta(
        [...lista].sort((a, b) =>
          a.cargo.localeCompare(
            b.cargo,
            "pt-BR",
            { sensitivity: "base" }
          )
        )
      );
    } finally {
      setCarregandoLista(false);
    }
  }

  function selecionarDaLista(
    item: Colaborador
  ) {
    setIdsAntes(
      colaboradores.map(
        (colaborador) => colaborador.id
      )
    );
    setSelecionarAposAdicionar(item);
    onAdicionarColaborador();
  }

  useEffect(() => {
    if (!selecionarAposAdicionar) {
      return;
    }

    const novo = colaboradores.find(
      (item) => !idsAntes.includes(item.id)
    );

    if (!novo) {
      return;
    }

    onAtualizarColaborador(
      novo.id,
      "identificacao",
      selecionarAposAdicionar.cargo
    );

    setSelecionarAposAdicionar(null);
    setIdsAntes([]);
    setSeletorAberto(false);
  }, [
    colaboradores,
    idsAntes,
    selecionarAposAdicionar,
    onAtualizarColaborador,
  ]);

  return (
    <>
    <Dialog
      open={seletorAberto}
      onClose={() => {
        if (!selecionarAposAdicionar) {
          setSeletorAberto(false);
        }
      }}
      fullScreen
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#F4F7FB",
            height: "100dvh",
            maxHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: 1.5, sm: 2 },
          py: 1.2,
          backgroundColor: "#0D3768",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          fontWeight: 800,
        }}
      >
        Selecionar Colaborador

        <Button
          onClick={() =>
            setSeletorAberto(false)
          }
          disabled={Boolean(
            selecionarAposAdicionar
          )}
          sx={{
            color: "#FFFFFF",
            fontWeight: 800,
          }}
        >
          VOLTAR
        </Button>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          backgroundColor: "#FFFFFF",
        }}
      >
        {carregandoLista ? (
          <Typography sx={{ p: 2 }}>
            Carregando colaboradores...
          </Typography>
        ) : listaCompleta.length === 0 ? (
          <Typography
            sx={{
              p: 2,
              color: "#64748B",
            }}
          >
            Nenhum colaborador cadastrado.
          </Typography>
        ) : (
          <List
            disablePadding
            sx={{
              width: "100%",
              minHeight: "100%",
              backgroundColor: "#FFFFFF",
              pb: "max(16px, env(safe-area-inset-bottom))",
            }}
          >
            {listaCompleta.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={() =>
                  selecionarDaLista(item)
                }
                disabled={Boolean(
                  selecionarAposAdicionar
                )}
                sx={{
                  px: { xs: 1.5, sm: 2 },
                  py: 1.2,
                  borderBottom:
                    "1px solid #E8EEF5",
                }}
              >
                <ListItemText
                  primary={item.cargo}
                  secondary={[
                    item.matricula,
                    item.nome,
                    item.setor,
                    item.loja,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                  sx={{
                    "& .MuiListItemText-primary":
                      {
                        fontWeight: 700,
                        color: "#1E293B",
                      },
                    "& .MuiListItemText-secondary":
                      {
                        mt: 0.25,
                        fontSize: "0.76rem",
                        color: "#64748B",
                      },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>

    <Paper
      elevation={0}
      sx={{
        mt: 1.25,

        p: {
          xs: 1,
          sm: 1.25,
        },

        border: "none",
        borderRadius: 2,
        backgroundColor: "#FFFFFF",
        boxShadow:
          "0 2px 10px rgba(15,23,42,0.08)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 1,
          mb: 1,
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            color: "#0D3768",

            fontSize: {
              xs: "0.95rem",
              sm: "1rem",
            },
          }}
        >
          Cargos envolvidos
        </Typography>

        <Button
          variant="contained"
          size="small"
          onClick={abrirSeletor}
          sx={{
            minHeight: 34,
            px: 1.5,
            fontWeight: 800,
            backgroundColor:
              "#0D3768",
          }}
        >
          + Colaboradores
        </Button>
      </Box>

      {colaboradores.length ===
        0 && (
        <Typography
          sx={{
            py: 1,
            fontSize: "0.8rem",
            color: "#64748B",
          }}
        >
          Nenhum cargo
          adicionado.
        </Typography>
      )}

      {colaboradores.map(
        (
          colaborador,
          index
        ) => (
          <LinhaColaborador
            key={
              colaborador.id
            }
            colaborador={
              colaborador
            }
            indice={index}
            onAtualizarColaborador={
              onAtualizarColaborador
            }
            onRemoverColaborador={
              onRemoverColaborador
            }
          />
        )
      )}
    </Paper>
    </>
  );
}