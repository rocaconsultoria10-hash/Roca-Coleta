import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { authService } from "../../services/authService";
import { usuarioService } from "../../services/usuarioService";
import type { Usuario } from "../../models/Usuario";

import imagemInicio from "../../assets/inicio-roca.png";

const usuarioAdministradorPadrao: Usuario = {
  id: 1,
  empresaId: 1,
  empresaIds: [],
  usuario: "admin",
  nome: "Administrador",
  senha: "1234",
  perfil: "ADMINISTRADOR",
  situacao: "ATIVO",
};

export default function Login() {
  const navigate = useNavigate();

  const [usuario, setUsuario] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [erro, setErro] =
    useState("");

  const [entrando, setEntrando] =
    useState(false);

  async function entrar() {
    const usuarioDigitado =
      usuario
        .trim()
        .toLowerCase();

    const senhaDigitada =
      senha.trim();

    if (
      !usuarioDigitado ||
      !senhaDigitada
    ) {
      setErro(
        "Informe usuário e senha."
      );

      return;
    }

    setErro("");
    setEntrando(true);

    try {
      let usuarioEncontrado:
        Usuario;

      if (
        usuarioAdministradorPadrao.usuario ===
          usuarioDigitado &&
        usuarioAdministradorPadrao.senha ===
          senhaDigitada
      ) {
        usuarioEncontrado =
          usuarioAdministradorPadrao;
      } else {
        usuarioEncontrado =
          await usuarioService.login(
            usuarioDigitado,
            senhaDigitada
          );
      }

      authService.salvarUsuario(
        usuarioEncontrado
      );

      const empresasUsuario =
        usuarioEncontrado
          .empresaIds?.length
          ? usuarioEncontrado
              .empresaIds
          : usuarioEncontrado
              .empresaId
            ? [
                usuarioEncontrado
                  .empresaId,
              ]
            : [];

      if (
        usuarioEncontrado.perfil !==
          "ADMINISTRADOR" &&
        empresasUsuario.length === 1
      ) {
        authService.salvarEmpresaAtiva(
          empresasUsuario[0]
        );
      } else {
        authService.limparEmpresaAtiva();
      }

      navigate(
        "/inicio",
        {
          replace: true,
        }
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Usuário ou senha inválidos."
      );
    } finally {
      setEntrando(false);
    }
  }

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        backgroundColor: "#7db4df",

        p: 2,
        boxSizing: "border-box",
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
            xs: "center center",
            md: "center center",
          },

          zIndex: 0,
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,

          background: {
            xs: "rgba(5, 35, 75, 0.16)",
            md: "rgba(5, 35, 75, 0.08)",
          },
        }}
      />

      <Paper
        elevation={12}
        sx={{
          position: "relative",
          zIndex: 2,

          width: "100%",
          maxWidth: 380,

          p: {
            xs: 3,
            sm: 4,
          },

          borderRadius: 3,

          backgroundColor:
            "rgba(255,255,255,0.94)",

          backdropFilter:
            "blur(8px)",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            mb: 0.5,
            textAlign: "center",
            color: "#0d3768",
          }}
        >
          ROCA COLETA
        </Typography>

        <Typography
          sx={{
            mb: 3,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          Acesso ao sistema
        </Typography>

        <TextField
          fullWidth
          label="Usuário"
          value={usuario}
          disabled={entrando}
          onChange={(event) => {
            setUsuario(
              event.target.value
            );

            setErro("");
          }}
          sx={{
            mb: 2,
          }}
        />

        <TextField
          fullWidth
          label="Senha"
          type="password"
          value={senha}
          disabled={entrando}
          onChange={(event) => {
            setSenha(
              event.target.value
            );

            setErro("");
          }}
          onKeyDown={(event) => {
            if (
              event.key ===
                "Enter" &&
              !entrando
            ) {
              void entrar();
            }
          }}
          sx={{
            mb: 2,
          }}
        />

        {erro && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
            }}
          >
            {erro}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          onClick={() =>
            void entrar()
          }
          disabled={entrando}
          sx={{
            height: 48,
            fontWeight: 700,
            backgroundColor:
              "#0d3768",
          }}
        >
          {entrando
            ? "ENTRANDO..."
            : "ENTRAR"}
        </Button>
      </Paper>
    </Box>
  );
}