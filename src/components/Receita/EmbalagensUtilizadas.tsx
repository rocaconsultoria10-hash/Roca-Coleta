import {
  useEffect,
  useState,
} from "react";

import {
  Box,
  Button,
  Chip,
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

import {
  embalagemService,
} from "../../services/embalagemService";

import type {
  Embalagem,
} from "../../models/Embalagem";

export type EmbalagemUtilizada = {
  id: number;
  identificacao: string;
  quantidade: string;
};

type Props = {
  embalagens: EmbalagemUtilizada[];
  onAdicionarEmbalagem: () => void;
  onAtualizarEmbalagem: (
    id: number,
    campo: "identificacao" | "quantidade",
    valor: string
  ) => void;
  onRemoverEmbalagem: (
    id: number
  ) => void;
};

export default function EmbalagensUtilizadas({
  embalagens,
  onAdicionarEmbalagem,
  onAtualizarEmbalagem,
  onRemoverEmbalagem,
}: Props) {
  const [
    seletorAberto,
    setSeletorAberto,
  ] = useState(false);

  const [
    listaCompleta,
    setListaCompleta,
  ] = useState<Embalagem[]>([]);

  const [
    carregandoLista,
    setCarregandoLista,
  ] = useState(false);

  const [
    embalagemSelecionada,
    setEmbalagemSelecionada,
  ] = useState<Embalagem | null>(
    null
  );

  const [
    idsAntes,
    setIdsAntes,
  ] = useState<number[]>([]);

  async function abrirSeletor() {
    setCarregandoLista(true);
    setSeletorAberto(true);

    try {
      const lista =
        await embalagemService.listar();

      setListaCompleta(
        [...lista].sort((a, b) =>
          a.descricao.localeCompare(
            b.descricao,
            "pt-BR",
            {
              sensitivity: "base",
            }
          )
        )
      );
    } finally {
      setCarregandoLista(false);
    }
  }

  function selecionarEmbalagem(
    item: Embalagem
  ) {
    setIdsAntes(
      embalagens.map(
        (embalagem) =>
          embalagem.id
      )
    );

    setEmbalagemSelecionada(
      item
    );

    onAdicionarEmbalagem();
  }

  useEffect(() => {
    if (!embalagemSelecionada) {
      return;
    }

    const nova =
      embalagens.find(
        (item) =>
          !idsAntes.includes(
            item.id
          )
      );

    if (!nova) {
      return;
    }

    onAtualizarEmbalagem(
      nova.id,
      "identificacao",
      `${embalagemSelecionada.codigo} - ${embalagemSelecionada.descricao}`
    );

    setEmbalagemSelecionada(
      null
    );

    setIdsAntes([]);

    setSeletorAberto(false);
  }, [
    embalagens,
    embalagemSelecionada,
    idsAntes,
    onAtualizarEmbalagem,
  ]);

  function obterCadastro(
    identificacao: string
  ): Embalagem | undefined {
    const texto =
      identificacao.trim();

    if (!texto) {
      return undefined;
    }

    return listaCompleta.find(
      (item) =>
        texto ===
        `${item.codigo} - ${item.descricao}`
    );
  }

  return (
    <>
      <Dialog
        open={seletorAberto}
        onClose={() => {
          if (
            !embalagemSelecionada
          ) {
            setSeletorAberto(false);
          }
        }}
        fullScreen
        slotProps={{
          paper: {
            sx: {
              backgroundColor:
                "#F4F7FB",
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
            px: {
              xs: 1.5,
              sm: 2,
            },
            py: 1.2,
            backgroundColor:
              "#0D3768",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 1,
            fontWeight: 800,
          }}
        >
          Selecionar Embalagem

          <Button
            onClick={() =>
              setSeletorAberto(
                false
              )
            }
            disabled={Boolean(
              embalagemSelecionada
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
            WebkitOverflowScrolling:
              "touch",
            backgroundColor:
              "#FFFFFF",
          }}
        >
          {carregandoLista ? (
            <Typography
              sx={{ p: 2 }}
            >
              Carregando embalagens...
            </Typography>
          ) : listaCompleta.length ===
            0 ? (
            <Typography
              sx={{
                p: 2,
                color: "#64748B",
              }}
            >
              Nenhuma embalagem
              cadastrada.
            </Typography>
          ) : (
            <List
              disablePadding
              sx={{
                width: "100%",
                backgroundColor:
                  "#FFFFFF",
                pb:
                  "max(16px, env(safe-area-inset-bottom))",
              }}
            >
              {listaCompleta.map(
                (item) => (
                  <ListItemButton
                    key={item.id}
                    onClick={() =>
                      selecionarEmbalagem(
                        item
                      )
                    }
                    disabled={Boolean(
                      embalagemSelecionada
                    )}
                    sx={{
                      px: {
                        xs: 1.5,
                        sm: 2,
                      },
                      py: 1.2,
                      borderBottom:
                        "1px solid #E8EEF5",
                    }}
                  >
                    <ListItemText
                      primary={`${item.codigo} - ${item.descricao}`}
                      secondary={[
                        item.categoria,
                        item.unidade,
                        item.capacidade,
                        `Tara: ${item.pesoEmbalagem} g`,
                      ]
                        .filter(Boolean)
                        .join(" | ")}
                      sx={{
                        "& .MuiListItemText-primary":
                          {
                            fontWeight: 700,
                            color:
                              "#1E293B",
                          },
                        "& .MuiListItemText-secondary":
                          {
                            mt: 0.25,
                            fontSize:
                              "0.76rem",
                            color:
                              "#64748B",
                          },
                      }}
                    />
                  </ListItemButton>
                )
              )}
            </List>
          )}
        </DialogContent>
      </Dialog>

      <Paper
        elevation={0}
        sx={{
          p: {
            xs: 1.5,
            sm: 2,
          },
          borderRadius: 2,
          backgroundColor:
            "#FFFFFF",
          boxShadow:
            "0 3px 12px rgba(15,23,42,0.10)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 1,
            mb:
              embalagens.length > 0
                ? 2
                : 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#0D3768",
            }}
          >
            Embalagens utilizadas
          </Typography>

          <Button
            variant="contained"
            size="small"
            onClick={
              abrirSeletor
            }
            sx={{
              backgroundColor:
                "#0D3768",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            + EMBALAGEM
          </Button>
        </Box>

        {embalagens.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              color: "#64748B",
            }}
          >
            Nenhuma embalagem
            adicionada.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 1.25,
            }}
          >
            {embalagens.map(
              (embalagem) => {
                const cadastro =
                  obterCadastro(
                    embalagem.identificacao
                  );

                return (
                  <Box
                    key={
                      embalagem.id
                    }
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor:
                        "#F8FAFC",
                      boxShadow:
                        "0 2px 8px rgba(15,23,42,0.06)",
                    }}
                  >
                    <Box
                      sx={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          {
                            xs: "1fr",
                            md:
                              "minmax(0,1fr) 180px auto",
                          },
                        gap: 1.5,
                        alignItems:
                          "center",
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 0,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight:
                              800,
                            color:
                              "#1E293B",
                          }}
                        >
                          {
                            embalagem.identificacao
                          }
                        </Typography>

                        {cadastro && (
                          <Box
                            sx={{
                              mt: 1,
                              display:
                                "flex",
                              gap: 0.75,
                              flexWrap:
                                "wrap",
                            }}
                          >
                            {cadastro.categoria && (
                              <Chip
                                size="small"
                                label={
                                  cadastro.categoria
                                }
                              />
                            )}

                            {cadastro.unidade && (
                              <Chip
                                size="small"
                                label={
                                  cadastro.unidade
                                }
                              />
                            )}

                            {cadastro.capacidade && (
                              <Chip
                                size="small"
                                label={
                                  cadastro.capacidade
                                }
                              />
                            )}

                            <Chip
                              size="small"
                              label={`Tara: ${cadastro.pesoEmbalagem} g`}
                            />
                          </Box>
                        )}
                      </Box>

                      <TextField
                        fullWidth
                        size="small"
                        label="Quantidade utilizada"
                        type="number"
                        value={
                          embalagem.quantidade
                        }
                        onChange={(
                          event
                        ) =>
                          onAtualizarEmbalagem(
                            embalagem.id,
                            "quantidade",
                            event
                              .target
                              .value
                          )
                        }
                        slotProps={{
                          htmlInput: {
                            min: 0,
                            step: 1,
                          },
                        }}
                      />

                      <Box
                        sx={{
                          display:
                            "flex",
                          gap: 0.5,
                          justifyContent:
                            {
                              xs:
                                "flex-start",
                              md:
                                "flex-end",
                            },
                        }}
                      >
                        <Button
                          size="small"
                          onClick={
                            abrirSeletor
                          }
                        >
                          TROCAR
                        </Button>

                        <Button
                          size="small"
                          color="error"
                          onClick={() =>
                            onRemoverEmbalagem(
                              embalagem.id
                            )
                          }
                        >
                          REMOVER
                        </Button>
                      </Box>
                    </Box>
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