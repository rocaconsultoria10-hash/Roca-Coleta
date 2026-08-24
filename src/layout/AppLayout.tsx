import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import RestaurantMenuOutlinedIcon from "@mui/icons-material/RestaurantMenuOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { authService } from "../services/authService";
import logoRoca from "../assets/logo-roca.png";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const usuarioLogado =
    authService.getUsuarioLogado();

  const ehAdministrador =
    usuarioLogado?.perfil ===
    "ADMINISTRADOR";

  function sair() {
    authService.logout();

    navigate("/login", {
      replace: true,
    });
  }

  function valorNavegacaoAtual() {
    const caminho =
      location.pathname;

    if (
      caminho.startsWith(
        "/receitas"
      )
    ) {
      return "/receitas";
    }

    if (
      caminho.startsWith(
        "/ficha-tecnica"
      )
    ) {
      return "/ficha-tecnica";
    }

    if (
      caminho.startsWith(
        "/cadastro"
      ) ||
      caminho.startsWith(
        "/empresas"
      ) ||
      caminho.startsWith(
        "/usuarios"
      ) ||
      caminho.startsWith(
        "/importacao"
      ) ||
      caminho.startsWith(
        "/produtos"
      ) ||
      caminho.startsWith(
        "/maquinas"
      ) ||
      caminho.startsWith(
        "/embalagens"
      ) ||
      caminho.startsWith(
        "/pessoas"
      ) ||
      caminho.startsWith(
        "/grupos-materia-prima"
      )
    ) {
      return "/cadastro";
    }

    return "/inicio";
  }

  function abrirOuRecolherInicio() {
    if (location.pathname === "/inicio") {
      window.dispatchEvent(
        new CustomEvent(
          "roca-toggle-cards-inicio"
        )
      );

      return;
    }

    navigate("/inicio");
  }

  function navegar(
    valor: string
  ) {
    if (
      valor === "/cadastro"
    ) {
      if (!ehAdministrador) {
        navigate("/inicio");
        return;
      }

      navigate("/cadastro");
      return;
    }

    if (
      valor === "/inicio"
    ) {
      abrirOuRecolherInicio();
      return;
    }

    navigate(valor);
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor:
          "background.default",
        pb: 11,
      }}
    >
      <AppBar
        position="fixed"
        elevation={1}
      >
        <Toolbar
          sx={{
            minHeight: 64,
            display: "flex",
            justifyContent:
              "space-between",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                backgroundColor: "#082F5B",
                color: "#FFFFFF",
                px: {
                  xs: 1.5,
                  sm: 2,
                },
                py: {
                  xs: 0.9,
                  sm: 1,
                },
                borderRadius: 2,
                boxShadow:
                  "0 4px 14px rgba(8,47,91,0.28)",
                minWidth: {
                  xs: 120,
                  sm: 150,
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: "0.68rem",
                    sm: "0.72rem",
                  },
                  fontWeight: 800,
                  opacity: 0.84,
                  lineHeight: 1,
                  mb: 0.45,
                  letterSpacing: 0.3,
                }}
              >
                ROCA COLETA
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "0.94rem",
                    sm: "1rem",
                  },
                  fontWeight: 800,
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                }}
              >
                Olá,{" "}
                {usuarioLogado?.nome
                  ?.trim()
                  .split(/\s+/)[0] ||
                  "Usuário"}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={sair}
              sx={{
                color: "#fff",
                borderColor:
                  "rgba(255,255,255,0.65)",
                fontWeight: 700,
                minWidth: 70,

                "&:hover": {
                  borderColor: "#fff",
                  backgroundColor:
                    "rgba(255,255,255,0.10)",
                },
              }}
            >
              SAIR
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Box
        component="main"
        sx={{
          width: "100%",
          maxWidth: 1400,
          mx: "auto",
          px: {
            xs: 1,
            sm: 2,
            md: 3,
          },
          py: 2,
        }}
      >
        <Outlet />
      </Box>

      <Paper
        elevation={10}
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1200,
          borderRadius: 0,
          overflow: "visible",
          borderTop:
            "1px solid #E5E7EB",
        }}
      >
        <BottomNavigation
          showLabels
          value={
            valorNavegacaoAtual()
          }
          onChange={(
            _event,
            novoValor
          ) =>
            navegar(
              novoValor
            )
          }
          sx={{
            height: 68,
            position: "relative",

            "& .MuiBottomNavigationAction-root": {
              minWidth: 0,
              px: 0.5,
              flex: 1,
              maxWidth: "none",
            },

            "& .MuiBottomNavigationAction-label": {
              fontSize: "0.68rem",
              fontWeight: 700,
            },
          }}
        >
          <BottomNavigationAction
            label="Início"
            value="/inicio"
            icon={
              <HomeOutlinedIcon />
            }
          />

          <BottomNavigationAction
            label="Receitas"
            value="/receitas"
            icon={
              <RestaurantMenuOutlinedIcon />
            }
          />

          <BottomNavigationAction
            label=""
            value="/centro-reservado"
            disabled
            icon={<Box />}
            sx={{
              visibility: "hidden",
              pointerEvents: "none",
            }}
          />

          <BottomNavigationAction
            label="Fichas"
            value="/ficha-tecnica"
            icon={
              <DescriptionOutlinedIcon />
            }
          />

          {ehAdministrador ? (
            <BottomNavigationAction
              label="Cadastros"
              value="/cadastro"
              icon={
                <Inventory2OutlinedIcon />
              }
            />
          ) : (
            <BottomNavigationAction
              label=""
              value="/espaco-reservado"
              disabled
              icon={<Box />}
              sx={{
                visibility: "hidden",
                pointerEvents: "none",
              }}
            />
          )}
        </BottomNavigation>

        <Box
          onClick={
            abrirOuRecolherInicio
          }
          sx={{
            position: "absolute",
            left: "50%",
            top: -31,
            transform:
              "translateX(-50%)",
            width: {
              xs: 68,
              sm: 76,
            },
            height: {
              xs: 68,
              sm: 76,
            },
            borderRadius: "50%",
            bgcolor: "#FFFFFF",
            border:
              "5px solid #FFFFFF",
            boxShadow:
              "0 6px 18px rgba(15,23,42,0.22)",
            cursor: "pointer",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1301,
          }}
        >
          <Box
            component="img"
            src={logoRoca}
            alt="Roca"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
              display: "block",
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}