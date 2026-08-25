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
      sx={{
        mt: 1,
        p: {
          xs: 1.5,
          sm: 2,
        },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "background.paper",
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
        Dados da Receita
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1,
        }}
      >
        {dados.map((item) => (
          <Box
            key={item.titulo}
            sx={{
              minWidth: 0,
              px: 1.25,
              py: 1,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
              backgroundColor: "#F8FAFC",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                mb: 0.35,
              }}
            >
              {item.titulo}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: "text.primary",
                fontWeight: 600,
                lineHeight: 1.35,
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