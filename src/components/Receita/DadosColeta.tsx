import { useEffect, useState } from "react";
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

import { colaboradorService } from "../../services/colaboradorService";
import type { Colaborador } from "../../models/Colaborador";

type Props = {
  dataColeta: string;
  responsavelColeta: string;
  estoqueCongelado: string;
  onChangeDataColeta: (valor: string) => void;
  onChangeResponsavelColeta: (valor: string) => void;
  onChangeEstoqueCongelado: (valor: string) => void;
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
      elevation={0}
      sx={{
        mt: {
          xs: 0.75,
          sm: 1,
        },
        p: {
          xs: 0.9,
          sm: 1.25,
        },
        border: "none",
        borderRadius: 2,
        backgroundColor: "#FFFFFF",
        boxShadow:
          "0 3px 12px rgba(13,55,104,0.10)",
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          mb: {
            xs: 0.7,
            sm: 1,
          },
          color: "#0D3768",
          fontSize: {
            xs: "0.95rem",
            sm: "1rem",
          },
        }}
      >
        Dados da Coleta
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "112px minmax(0, 1fr)",
            sm: "160px minmax(240px, 1fr) 180px",
          },
          gap: {
            xs: 0.55,
            sm: 0.75,
          },
          alignItems: "start",
        }}
      >
        <TextField
          fullWidth
          size="small"
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
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#FFFFFF",
              "& fieldset": {
                borderColor:
                  "rgba(13,55,104,0.16)",
              },
              "&:hover fieldset": {
                borderColor:
                  "rgba(13,55,104,0.28)",
              },
              "&.Mui-focused fieldset": {
                borderWidth: 1,
                borderColor: "#0D3768",
              },
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
            size="small"
            label="Responsável"
            value={responsavelColeta}
            onChange={(event) =>
              alterarResponsavel(
                event.target.value
              )
            }
            placeholder="Matrícula ou nome"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#FFFFFF",
              "& fieldset": {
                borderColor:
                  "rgba(13,55,104,0.16)",
              },
              "&:hover fieldset": {
                borderColor:
                  "rgba(13,55,104,0.28)",
              },
              "&.Mui-focused fieldset": {
                borderWidth: 1,
                borderColor: "#0D3768",
              },
              },
            }}
          />

          {resultados.length > 0 && (
            <List
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 20,
                mt: 0.5,
                p: 0,
                backgroundColor: "#FFFFFF",
                border: "none",
                borderRadius: 1.5,
                maxHeight: 220,
                overflowY: "auto",
                boxShadow:
                  "0 8px 24px rgba(13,55,104,0.14)",
              }}
            >
              {resultados.map(
                (colaborador) => (
                  <ListItemButton
                    key={colaborador.id}
                    dense
                    onClick={() =>
                      selecionarColaborador(
                        colaborador
                      )
                    }
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
                      sx={{
                        "& .MuiListItemText-primary":
                          {
                            fontSize:
                              "0.86rem",
                            fontWeight:
                              700,
                          },

                        "& .MuiListItemText-secondary":
                          {
                            fontSize:
                              "0.74rem",
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
          size="small"
          sx={{
            gridColumn: {
              xs: "1 / -1",
              sm: "auto",
            },

            "& .MuiOutlinedInput-root": {
              backgroundColor: "#FFFFFF",

              "& fieldset": {
                borderWidth: 1.5,
                borderColor: "#9EACBD",
              },

              "&:hover fieldset": {
                borderColor: "#0D3768",
              },

              "&.Mui-focused fieldset": {
                borderWidth: 2,
                borderColor: "#0D3768",
              },
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