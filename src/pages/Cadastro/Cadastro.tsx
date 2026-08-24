import {
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

export default function Cadastro() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 3,
        }}
      >
        Cadastros
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
          },
          gap: 2,
        }}
      >
        <Paper
          variant="outlined"
          sx={{ p: 3 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            Cadastrar Empresas
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Cadastro de empresas.
          </Typography>

          <Button
            variant="contained"
            onClick={() =>
              navigate("/empresas")
            }
          >
            Acessar
          </Button>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: 3 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            Cadastrar Usuários
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Cadastro de usuários.
          </Typography>

          <Button
            variant="contained"
            onClick={() =>
              navigate("/usuarios")
            }
          >
            Acessar
          </Button>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: 3 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            Importar Dados Empresas
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Importação dos dados das empresas.
          </Typography>

          <Button
            variant="contained"
            onClick={() =>
              navigate("/importacao")
            }
          >
            Acessar
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}