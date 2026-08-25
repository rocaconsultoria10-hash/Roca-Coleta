import {
  useEffect,
  useState,
} from "react";

import {
  Box,
  Button,
  Collapse,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import { authService } from "../../services/authService";
import { empresaService } from "../../services/empresaService";

import type { Empresa } from "../../models/Empresa";

import imagemInicio from "../../assets/inicio-roca.png";

export default function Inicio() {
  const navigate = useNavigate();

  const usuarioLogado =
    authService.getUsuarioLogado();

  const ehAdministrador =
    usuarioLogado?.perfil ===
    "ADMINISTRADOR";

  const empresaIdsUsuario =
    usuarioLogado?.empresaIds?.length
      ? usuarioLogado.empresaIds
      : usuarioLogado?.empresaId
        ? [usuarioLogado.empresaId]
        : [];

  const empresaIdsChave =
    empresaIdsUsuario.join(",");

  const [
    empresasDisponiveis,
    setEmpresasDisponiveis,
  ] = useState<Empresa[]>([]);

  const [
    empresaAtivaId,
    setEmpresaAtivaId,
  ] = useState<number | "">(
    authService.getEmpresaAtivaId() ?? ""
  );

  const [
  cardsAbertos,
  setCardsAbertos,
] = useState(false);

  useEffect(() => {
    function alternarCardsInicio() {
      setCardsAbertos(
        (valorAtual) =>
          !valorAtual
      );
    }

    window.addEventListener(
      "roca-toggle-cards-inicio",
      alternarCardsInicio
    );

    return () => {
      window.removeEventListener(
        "roca-toggle-cards-inicio",
        alternarCardsInicio
      );
    };
  }, []);

  useEffect(() => {
    async function carregarEmpresas() {
      const todasEmpresas =
        await empresaService.listar();

      const empresasAtivas =
        todasEmpresas.filter(
          (empresa) =>
            empresa.situacao === "ATIVA"
        );

      const permitidas =
        ehAdministrador
          ? empresasAtivas
          : empresasAtivas.filter(
              (empresa) =>
                empresaIdsUsuario.includes(
                  empresa.id
                )
            );

      setEmpresasDisponiveis(
        permitidas
      );

      const empresaAtual =
        authService.getEmpresaAtivaId();

      const empresaAtualPermitida =
        permitidas.some(
          (empresa) =>
            empresa.id === empresaAtual
        );

      if (empresaAtualPermitida) {
        setEmpresaAtivaId(
          empresaAtual as number
        );
        return;
      }

      if (permitidas.length === 1) {
        const id =
          permitidas[0].id;

        authService.salvarEmpresaAtiva(
          id
        );

        setEmpresaAtivaId(id);
        return;
      }

      authService.limparEmpresaAtiva();
      setEmpresaAtivaId("");
    }

    void carregarEmpresas();
  }, [
    ehAdministrador,
    empresaIdsChave,
  ]);

  function selecionarEmpresa(
    valor: string
  ) {
    const id =
      Number(valor);

    if (
      !Number.isFinite(id) ||
      id <= 0
    ) {
      authService.limparEmpresaAtiva();
      setEmpresaAtivaId("");
      return;
    }

    authService.salvarEmpresaAtiva(id);
    setEmpresaAtivaId(id);

    window.location.reload();
  }

  const estiloCard = {
    p: {
      xs: 1.5,
      sm: 2,
      md: 3,
    },

    borderRadius: {
      xs: 1.5,
      md: 2,
    },

    backgroundColor:
      "rgba(255,255,255,0.28)",

    backdropFilter:
      "blur(8px)",

    WebkitBackdropFilter:
      "blur(8px)",

    border:
      "1px solid rgba(255,255,255,0.35)",

    boxShadow:
      "0 4px 16px rgba(0,0,0,0.15)",
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight:
          "calc(100vh - 120px)",
        overflow: "hidden",
        backgroundColor: "#7db4df",
      }}
    >
      <Box
        component="img"
        src={imagemInicio}
        alt=""
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",

          objectFit: {
            xs: "cover",
            sm: "cover",
            md: "contain",
          },

          objectPosition: {
            xs: "center top",
            sm: "center top",
            md: "center center",
          },

          display: "block",
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,

          background: {
            xs: "rgba(5, 35, 75, 0.10)",
            md: "rgba(5, 35, 75,0.06)",
          },
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 2,

          minHeight:
            "calc(100vh - 120px)",

          p: {
            xs: 1.5,
            sm: 2.5,
            md: 4,
          },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,

            mb: {
              xs: 0.5,
              sm: 1,
            },

            color: "#fff",

            textShadow:
              "0 2px 6px rgba(0,0,0,0.45)",

            fontSize: {
              xs: "1.45rem",
              sm: "2rem",
              md: "2.3rem",
            },
          }}
        >
          Roca Coleta
        </Typography>

        <Typography
          sx={{
            color: "#fff",

            mb: {
              xs: 1.5,
              sm: 2.5,
              md: 3,
            },

            fontSize: {
              xs: "0.9rem",
              sm: "1rem",
            },

            textShadow:
              "0 2px 6px rgba(0,0,0,0.45)",
          }}
        >
          Selecione uma opção para continuar.
        </Typography>

        <Collapse
          in={cardsAbertos}
          timeout={350}
          unmountOnExit
        >
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: ehAdministrador
                  ? "repeat(4, 1fr)"
                  : "repeat(3, 1fr)",
              },

              gap: {
                xs: 1,
                sm: 1.5,
                md: 2,
              },

              maxWidth: {
                xs: "100%",
                md: "100%",
              },
            }}
          >
            <Paper
              elevation={6}
              sx={estiloCard}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,

                  mb: {
                    xs: 0.5,
                    md: 1,
                  },

                  fontSize: {
                    xs: "1rem",
                    sm: "1.1rem",
                    md: "1.25rem",
                  },
                }}
              >
                Loja
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mb: {
                    xs: 1,
                    md: 2,
                  },

                  fontSize: {
                    xs: "0.82rem",
                    sm: "0.9rem",
                    md: "1rem",
                  },

                  lineHeight: 1.35,
                }}
              >
                Selecione a loja em que deseja trabalhar.
              </Typography>

              <TextField
                select
                fullWidth
                size="small"
                value={empresaAtivaId}
                onChange={(event) =>
                  selecionarEmpresa(
                    event.target.value
                  )
                }
                slotProps={{
                  select: {
                    displayEmpty: true,
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor:
                      "rgba(255,255,255,0.62)",
                  },
                }}
              >
                <MenuItem value="">
                  Selecione a loja
                </MenuItem>

                {empresasDisponiveis.map(
                  (empresa) => (
                    <MenuItem
                      key={empresa.id}
                      value={empresa.id}
                    >
                      {empresa.nomeFantasia ||
                        empresa.razaoSocial}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Paper>

            <Paper
              elevation={6}
              sx={estiloCard}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,

                  mb: {
                    xs: 0.5,
                    md: 1,
                  },

                  fontSize: {
                    xs: "1rem",
                    sm: "1.1rem",
                    md: "1.25rem",
                  },
                }}
              >
                Receitas
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mb: {
                    xs: 1,
                    md: 2,
                  },

                  fontSize: {
                    xs: "0.82rem",
                    sm: "0.9rem",
                    md: "1rem",
                  },

                  lineHeight: 1.35,
                }}
              >
                Criar e editar fichas de produção.
              </Typography>

              <Button
                variant="contained"
                size="small"
                onClick={() =>
                  navigate("/receitas")
                }
                sx={{
                  minHeight: {
                    xs: 34,
                    md: 40,
                  },

                  px: {
                    xs: 1.5,
                    md: 2,
                  },

                  fontSize: {
                    xs: "0.75rem",
                    md: "0.875rem",
                  },
                }}
              >
                ACESSAR
              </Button>
            </Paper>

            <Paper
              elevation={6}
              sx={estiloCard}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,

                  mb: {
                    xs: 0.5,
                    md: 1,
                  },

                  fontSize: {
                    xs: "1rem",
                    sm: "1.1rem",
                    md: "1.25rem",
                  },
                }}
              >
                Fichas Técnicas
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mb: {
                    xs: 1,
                    md: 2,
                  },

                  fontSize: {
                    xs: "0.82rem",
                    sm: "0.9rem",
                    md: "1rem",
                  },

                  lineHeight: 1.35,
                }}
              >
                Consultar fichas técnicas salvas.
              </Typography>

              <Button
                variant="contained"
                size="small"
                onClick={() =>
                  navigate(
                    "/ficha-tecnica"
                  )
                }
                sx={{
                  minHeight: {
                    xs: 34,
                    md: 40,
                  },

                  px: {
                    xs: 1.5,
                    md: 2,
                  },

                  fontSize: {
                    xs: "0.75rem",
                    md: "0.875rem",
                  },
                }}
              >
                ACESSAR
              </Button>
            </Paper>

            {ehAdministrador && (
              <Paper
                elevation={6}
                sx={estiloCard}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,

                    mb: {
                      xs: 0.5,
                      md: 1,
                    },

                    fontSize: {
                      xs: "1rem",
                      sm: "1.1rem",
                      md: "1.25rem",
                    },
                  }}
                >
                  Cadastros
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mb: {
                      xs: 1,
                      md: 2,
                    },

                    fontSize: {
                      xs: "0.82rem",
                      sm: "0.9rem",
                      md: "1rem",
                    },

                    lineHeight: 1.35,
                  }}
                >
                  Empresas, usuários, produtos,
                  máquinas, pessoas e configurações.
                </Typography>

                <Button
                  variant="contained"
                  size="small"
                  onClick={() =>
                    navigate(
                      "/cadastro"
                    )
                  }
                  sx={{
                    minHeight: {
                      xs: 34,
                      md: 40,
                    },

                    px: {
                      xs: 1.5,
                      md: 2,
                    },

                    fontSize: {
                      xs: "0.75rem",
                      md: "0.875rem",
                    },
                  }}
                >
                  ACESSAR
                </Button>
              </Paper>
            )}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}