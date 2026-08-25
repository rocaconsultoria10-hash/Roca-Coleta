import {
  useEffect,
  useState,
} from "react";

import {
  Box,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import {
  colaboradorService,
} from "../../services/colaboradorService";

import type {
  Colaborador,
} from "../../models/Colaborador";

type Props = {
  dataColeta: string;
  responsavelColeta: string;
  estoqueCongelado: string;
  onChangeDataColeta: (
    valor: string
  ) => void;
  onChangeResponsavelColeta: (
    valor: string
  ) => void;
  onChangeEstoqueCongelado: (
    valor: string
  ) => void;
};

export default function DadosColeta({
  dataColeta,
  responsavelColeta,
  estoqueCongelado,
  onChangeDataColeta,
  onChangeResponsavelColeta,
  onChangeEstoqueCongelado,
}: Props) {
  const [resultados, setResultados] =
    useState<Colaborador[]>([]);

  const [
    responsavelSelecionado,
    setResponsavelSelecionado,
  ] = useState(false);

  useEffect(() => {
    async function buscarColaboradores() {
      if (
        responsavelColeta.trim().length < 2 ||
        responsavelSelecionado
      ) {
        setResultados([]);
        return;
      }

      const lista =
        await colaboradorService.buscar(
          responsavelColeta
        );

      setResultados(lista);
    }

    buscarColaboradores();
  }, [
    responsavelColeta,
    responsavelSelecionado,
  ]);

  function selecionarColaborador(
    colaborador: Colaborador
  ) {
    onChangeResponsavelColeta(
      `${colaborador.matricula} - ${colaborador.nome}`
    );

    setResponsavelSelecionado(true);
    setResultados([]);
  }

  function alterarResponsavel(
    valor: string
  ) {
    setResponsavelSelecionado(false);
    onChangeResponsavelColeta(valor);
  }

  return (
    <Paper
      sx={{
        mt: 1,
        p: {
          xs: 1.5,
          sm: 2,
        },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor:
          "background.paper",
        boxShadow:
          "0 2px 8px rgba(15,35,60,0.05)",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 1.5,
          color: "text.primary",
        }}
      >
        Dados da Coleta
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "160px minmax(240px, 1fr)",
            md: "160px minmax(260px, 1fr) 190px",
          },
          gap: 1.25,
          alignItems: "start",
        }}
      >
        <TextField
          fullWidth
          label="Data"
          type="date"
          value={dataColeta}
          onChange={(event) =>
            onChangeDataColeta(
              event.target.value
            )
          }
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />

        <Box
          sx={{
            minWidth: 0,
            position: "relative",
          }}
        >
          <TextField
            fullWidth
            label="Responsável"
            value={responsavelColeta}
            onChange={(event) =>
              alterarResponsavel(
                event.target.value
              )
            }
            placeholder="Matrícula ou nome"
          />

          {resultados.length > 0 && (
            <List
              sx={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                zIndex: 20,
                p: 0.5,
                backgroundColor:
                  "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                maxHeight: 240,
                overflowY: "auto",
                boxShadow:
                  "0 8px 24px rgba(15,35,60,0.12)",
              }}
            >
              {resultados.map(
                (colaborador) => (
                  <ListItemButton
                    key={colaborador.id}
                    onClick={() =>
                      selecionarColaborador(
                        colaborador
                      )
                    }
                    sx={{
                      borderRadius: 1.5,
                      py: 0.75,
                    }}
                  >
                    <ListItemText
                      primary={`${colaborador.matricula} - ${colaborador.nome}`}
                      secondary={[
                        colaborador.cargo,
                        colaborador.setor,
                        colaborador.loja,
                      ]
                        .filter(Boolean)
                        .join(" | ")}
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize:
                              "0.9rem",
                            fontWeight: 600,
                            color:
                              "text.primary",
                          },
                        },

                        secondary: {
                          sx: {
                            mt: 0.25,
                            fontSize:
                              "0.8rem",
                            color:
                              "text.secondary",
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                )
              )}
            </List>
          )}
        </Box>

        <FormControl
          fullWidth
          sx={{
            gridColumn: {
              xs: "1",
              sm: "1 / -1",
              md: "auto",
            },
          }}
        >
          <InputLabel
            id="estoque-congelado-label"
          >
            Estoque congelado
          </InputLabel>

          <Select
            labelId="estoque-congelado-label"
            label="Estoque congelado"
            value={estoqueCongelado}
            onChange={(event) =>
              onChangeEstoqueCongelado(
                event.target.value
              )
            }
          >
            <MenuItem value="SIM">
              Sim
            </MenuItem>

            <MenuItem value="NAO">
              Não
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}