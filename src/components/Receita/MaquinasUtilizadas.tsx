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

import { maquinaService } from "../../services/maquinaService";
import type { Maquina } from "../../models/Maquina";

export type MaquinaUtilizada = {
  id: number;
  nome: string;
  horaInicio: string;
  horaFinal: string;
};

type CampoMaquina =
  | "nome"
  | "horaInicio"
  | "horaFinal";

type Props = {
  maquinas: MaquinaUtilizada[];
  onAdicionarMaquina: () => void;
  onAtualizarMaquina: (
    id: number,
    campo: CampoMaquina,
    valor: string
  ) => void;
  onRemoverMaquina: (
    id: number
  ) => void;
};

function formatarHoraDigitada(
  valor: string
): string {
  let numeros = valor
    .replace(/\D/g, "")
    .slice(0, 4);

  if (numeros.length >= 1) {
    const primeiro = Number(numeros[0]);

    if (primeiro > 2) {
      numeros = `2${numeros.slice(1)}`;
    }
  }

  if (numeros.length >= 2) {
    const hora = Number(
      numeros.slice(0, 2)
    );

    if (hora > 23) {
      numeros =
        "23" + numeros.slice(2);
    }
  }

  if (numeros.length >= 3) {
    const dezenaMinuto = Number(
      numeros[2]
    );

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

  return `${numeros.slice(
    0,
    2
  )}:${numeros.slice(2)}`;
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

  const horas = Math.floor(
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

function nomeLimpo(
  valor: string
): string {
  const partes = valor.split(" - ");

  return partes.length > 1
    ? partes.slice(1).join(" - ")
    : valor;
}

type EditorMaquinaProps = {
  maquina: MaquinaUtilizada;
  onAtualizarMaquina: Props["onAtualizarMaquina"];
  onRemoverMaquina: Props["onRemoverMaquina"];
  onFechar: () => void;
};

function EditorMaquina({
  maquina,
  onAtualizarMaquina,
  onRemoverMaquina,
  onFechar,
}: EditorMaquinaProps) {
  const [resultados, setResultados] =
    useState<Maquina[]>([]);

  const [selecionada, setSelecionada] =
    useState<Maquina | null>(null);

  const tempoTotal =
    calcularTempoTotal(
      maquina.horaInicio,
      maquina.horaFinal
    );

  useEffect(() => {
    async function pesquisarMaquinas() {
      if (
        maquina.nome.trim().length <
          2 ||
        selecionada
      ) {
        setResultados([]);
        return;
      }

      const lista =
        await maquinaService.buscar(
          maquina.nome
        );

      setResultados(lista);
    }

    pesquisarMaquinas();
  }, [
    maquina.nome,
    selecionada,
  ]);

  function selecionarMaquina(
    item: Maquina
  ) {
    setSelecionada(item);

    onAtualizarMaquina(
      maquina.id,
      "nome",
      `${item.codigo} - ${item.descricao}`
    );

    setResultados([]);
  }

  function alterarBusca(
    valor: string
  ) {
    setSelecionada(null);

    onAtualizarMaquina(
      maquina.id,
      "nome",
      valor
    );
  }

  return (
    <Box
      sx={{
        position: {
          xs: "fixed",
          sm: "relative",
        },
        inset: {
          xs: 0,
          sm: "auto",
        },
        zIndex: {
          xs: 1400,
          sm: "auto",
        },
        backgroundColor: "background.default",
        overflowY: "auto",
        p: {
          xs: 0,
          sm: 0,
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 760,
          minHeight: {
            xs: "100%",
            sm: "auto",
          },
          mx: "auto",
          border: {
            xs: "none",
            sm: "1px solid",
          },
          borderColor: "divider",
          borderRadius: {
            xs: 0,
            sm: 2,
          },
          overflow: "hidden",
          boxShadow: {
            xs: "none",
            sm: "0 2px 8px rgba(15,35,60,0.05)",
          },
        }}
      >
        <Box
          sx={{
            px: 1.5,
            py: 1.1,
            backgroundColor:
              "#0D3768",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
            }}
          >
            Máquina / Equipamento
          </Typography>

          <Button
            onClick={onFechar}
            sx={{
              color: "#FFFFFF",
              minWidth: 0,
              fontWeight: 700,
            }}
          >
            Voltar
          </Button>
        </Box>

        <Box
          sx={{
            p: {
              xs: 1,
              sm: 2,
            },
          }}
        >
          <Box
            sx={{
              position: "relative",
              mb: 1.25,
            }}
          >
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Buscar equipamento"
              placeholder="Código ou descrição"
              value={maquina.nome}
              onChange={(event) =>
                alterarBusca(
                  event.target.value
                )
              }
            />

            {resultados.length > 0 && (
              <List
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 30,
                  mt: 0.4,
                  p: 0,
                  maxHeight: 260,
                  overflowY: "auto",
                  backgroundColor:
                    "#FFFFFF",
                  border: "none",
                  borderRadius: 1.5,
                  boxShadow:
                    "0 8px 24px rgba(15,35,60,0.12)",
                }}
              >
                {resultados.map(
                  (item) => (
                    <ListItemButton
                      key={item.id}
                      onClick={() =>
                        selecionarMaquina(
                          item
                        )
                      }
                    >
                      <ListItemText
                        primary={`${item.codigo} - ${item.descricao}`}
                        secondary={[
                          item.tipo,
                          item.setor,
                        ]
                          .filter(Boolean)
                          .join(" | ")}
                      />
                    </ListItemButton>
                  )
                )}
              </List>
            )}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr 1fr",
                sm:
                  "1fr 1fr 1fr",
              },
              gap: 1,
            }}
          >
            <TextField
              fullWidth
              size="small"
              label="Início"
              type="text"
              value={maquina.horaInicio}
              placeholder="00:00"
              onChange={(event) =>
                onAtualizarMaquina(
                  maquina.id,
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
              fullWidth
              size="small"
              label="Fim"
              type="text"
              value={maquina.horaFinal}
              placeholder="00:00"
              onChange={(event) =>
                onAtualizarMaquina(
                  maquina.id,
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
              fullWidth
              size="small"
              label="Tempo"
              value={tempoTotal}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
              sx={{
                gridColumn: {
                  xs: "1 / -1",
                  sm: "auto",
                },
                "& .MuiOutlinedInput-root":
                  {
                    backgroundColor:
                      "#F8FAFC",
                  },
              }}
            />
          </Box>

          {selecionada && (
            <Typography
              sx={{
                mt: 0.8,
                fontSize: "0.88rem",
                color: "text.secondary",
              }}
            >
              {[
                selecionada.tipo,
                selecionada.setor,
              ]
                .filter(Boolean)
                .join(" • ")}
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 1,
              mt: 1.5,
            }}
          >
            <Button
              color="error"
              onClick={() => {
                onRemoverMaquina(
                  maquina.id
                );
                onFechar();
              }}
            >
              Remover
            </Button>

            <Button
              variant="contained"
              onClick={onFechar}
              sx={{
                backgroundColor:
                  "#0D3768",
                fontWeight: 700,
              }}
            >
              Salvar
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default function MaquinasUtilizadas({
  maquinas,
  onAdicionarMaquina,
  onAtualizarMaquina,
  onRemoverMaquina,
}: Props) {
  const [
    editandoId,
    setEditandoId,
  ] = useState<number | null>(null);

  const [seletorAberto, setSeletorAberto] =
    useState(false);

  const [listaCompleta, setListaCompleta] =
    useState<Maquina[]>([]);

  const [carregandoLista, setCarregandoLista] =
    useState(false);

  const [selecionarAposAdicionar, setSelecionarAposAdicionar] =
    useState<Maquina | null>(null);

  const [idsAntes, setIdsAntes] =
    useState<number[]>([]);

  async function abrirSeletor() {
    setCarregandoLista(true);
    setSeletorAberto(true);

    try {
      const lista = await maquinaService.listar();

      setListaCompleta(
        [...lista].sort((a, b) =>
          a.descricao.localeCompare(
            b.descricao,
            "pt-BR",
            { sensitivity: "base" }
          )
        )
      );
    } finally {
      setCarregandoLista(false);
    }
  }

  function selecionarDaLista(item: Maquina) {
    setIdsAntes(maquinas.map((maquina) => maquina.id));
    setSelecionarAposAdicionar(item);
    onAdicionarMaquina();
  }

  useEffect(() => {
    if (!selecionarAposAdicionar) {
      return;
    }

    const nova = maquinas.find(
      (item) => !idsAntes.includes(item.id)
    );

    if (!nova) {
      return;
    }

    onAtualizarMaquina(
      nova.id,
      "nome",
      `${selecionarAposAdicionar.codigo} - ${selecionarAposAdicionar.descricao}`
    );

    setSelecionarAposAdicionar(null);
    setIdsAntes([]);
    setSeletorAberto(false);
  }, [
    maquinas,
    idsAntes,
    selecionarAposAdicionar,
    onAtualizarMaquina,
  ]);

  const maquinaEditando =
    editandoId === null
      ? undefined
      : maquinas.find(
          (item) =>
            item.id === editandoId
        );

  if (maquinaEditando) {
    return (
      <EditorMaquina
        maquina={maquinaEditando}
        onAtualizarMaquina={
          onAtualizarMaquina
        }
        onRemoverMaquina={
          onRemoverMaquina
        }
        onFechar={() =>
          setEditandoId(null)
        }
      />
    );
  }

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
              backgroundColor: "background.default",
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
            backgroundColor: "primary.main",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            fontWeight: 700,
          }}
        >
          Selecionar Equipamento

          <Button
            onClick={() => setSeletorAberto(false)}
            disabled={Boolean(selecionarAposAdicionar)}
            sx={{
              color: "#FFFFFF",
              fontWeight: 700,
            }}
          >
            Voltar
          </Button>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            backgroundColor: "background.paper",
          }}
        >
          {carregandoLista ? (
            <Typography
              sx={{
                p: 2,
                color: "text.secondary",
              }}
            >
              Carregando equipamentos...
            </Typography>
          ) : listaCompleta.length === 0 ? (
            <Typography
              sx={{
                p: 2,
                color: "text.secondary",
              }}
            >
              Nenhum equipamento cadastrado.
            </Typography>
          ) : (
            <List
              disablePadding
              sx={{
                width: "100%",
                minHeight: "100%",
                backgroundColor: "background.paper",
                pb: "max(16px, env(safe-area-inset-bottom))",
              }}
            >
              {listaCompleta.map((item) => (
                <ListItemButton
                  key={item.id}
                  onClick={() => selecionarDaLista(item)}
                  disabled={Boolean(selecionarAposAdicionar)}
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: 1.2,
                    borderBottom: "1px solid #E8EEF5",
                    alignItems: "flex-start",
                  }}
                >
                  <ListItemText
                    primary={item.descricao}
                    secondary={[
                      item.codigo,
                      item.tipo,
                      item.setor,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: 700,
                          color: "text.primary",
                        },
                      },
                      secondary: {
                        sx: {
                          mt: 0.25,
                          fontSize: "0.88rem",
                          color: "text.secondary",
                        },
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
        mt: {
          xs: 0.75,
          sm: 1,
        },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "background.paper",
        boxShadow:
          "0 2px 8px rgba(15,35,60,0.05)",
      }}
    >
      <Box
        sx={{
          minHeight: 46,
          px: {
            xs: 0.9,
            sm: 1.1,
          },
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 1,
          borderBottom: "none",
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            color: "primary.main",
            fontSize: "0.95rem",
          }}
        >
          Máquinas / Equipamentos
        </Typography>

        <Button
          variant="contained"
          size="small"
          onClick={abrirSeletor}
          sx={{
            minHeight: 36,
            px: 1,
            fontSize: "0.84rem",
            fontWeight: 700,
            backgroundColor:
              "#0D3768",
            whiteSpace: "nowrap",
          }}
        >
          + Equipamento
        </Button>
      </Box>

      {maquinas.length === 0 ? (
        <Typography
          sx={{
            px: {
              xs: 0.9,
              sm: 1.1,
            },
            py: {
              xs: 0.7,
              sm: 0.9,
            },
            fontSize: "0.84rem",
            color: "text.secondary",
          }}
        >
          Nenhum equipamento adicionado.
        </Typography>
      ) : (
        <Box>
          {maquinas.map(
            (maquina, index) => {
              const tempo =
                calcularTempoTotal(
                  maquina.horaInicio,
                  maquina.horaFinal
                );

              return (
                <Box
                  key={maquina.id}
                  onClick={() =>
                    setEditandoId(
                      maquina.id
                    )
                  }
                  sx={{
                    minHeight: 44,
                    px: 1.1,
                    py: 0.5,
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 1fr) auto",
                    gap: 1,
                    alignItems: "center",
                    cursor: "pointer",
                    borderBottom: "none",
                    mx: {
                      xs: 0.7,
                      sm: 0.9,
                    },
                    mb:
                      index <
                      maquinas.length - 1
                        ? 0.45
                        : 0.7,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "#F8FAFC",
                    "&:hover": {
                      backgroundColor:
                        "#EEF4FA",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      minWidth: 0,
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "text.primary",
                      overflow: "hidden",
                      textOverflow:
                        "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {nomeLimpo(
                      maquina.nome
                    ) ||
                      `Equipamento ${
                        index + 1
                      }`}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      color: "primary.main",
                      whiteSpace: "nowrap",
                      textAlign: "right",
                    }}
                  >
                    {tempo || "-"}
                  </Typography>
                </Box>
              );
            }
          )}
        </Box>
      )}
      </Paper>
    </>
  );
}