import {
  Box,
  Paper,
  Typography,
} from "@mui/material";

import type { Produto } from "../../models/Produto";

type Props = {
  produto: Produto;
};

export default function DadosReceita({
  produto,
}: Props) {
  const dados = [
    {
      titulo: "Código",
      valor: produto.codigo,
    },
    {
      titulo: "Receita",
      valor: produto.descricao,
    },
    {
      titulo: "Departamento",
      valor: produto.departamento,
    },
    {
      titulo: "Seção",
      valor: produto.secao,
    },
  ];

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
        Dados da Receita
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(4, minmax(0, 1fr))",
          },
          gap: {
            xs: 0.55,
            sm: 0.75,
          },
        }}
      >
        {dados.map((item) => (
          <Box
            key={item.titulo}
            sx={{
              minWidth: 0,
              px: {
                xs: 0.75,
                sm: 1,
              },
              py: {
                xs: 0.65,
                sm: 0.75,
              },
              border: "none",
              borderRadius: 1.5,
              backgroundColor: "#F5F8FC",
              boxShadow:
                "inset 0 0 0 1px rgba(13,55,104,0.05)",
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: "0.62rem",
                  sm: "0.68rem",
                },
                fontWeight: 800,
                color: "#64748B",
                lineHeight: 1.1,
                mb: 0.3,
                textTransform: "uppercase",
              }}
            >
              {item.titulo}
            </Typography>

            <Typography
              sx={{
                fontSize: {
                  xs: "0.78rem",
                  sm: "0.9rem",
                },
                fontWeight: 700,
                color: "#1F2937",
                lineHeight: 1.2,
                wordBreak: "break-word",
              }}
            >
              {item.valor || "-"}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}