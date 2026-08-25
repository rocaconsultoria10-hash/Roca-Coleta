import {
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  TextField,
} from "@mui/material";

import type { Produto } from "../../models/Produto";

type Props = {
  busca: string;
  resultados: Produto[];
  produtoSelecionado: Produto | null;
  secaoSelecionada?: string;
  onChangeBusca: (valor: string) => void;
  onSelecionarProduto: (produto: Produto) => void;
};

export default function BuscaProduto({
  busca,
  resultados,
  produtoSelecionado,
  secaoSelecionada,
  onChangeBusca,
  onSelecionarProduto,
}: Props) {
  return (
    <>
      {secaoSelecionada && (
        <Box sx={{ mb: 1.5 }}>
          <Chip
            label={`Seção: ${secaoSelecionada}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      )}

      <TextField
        fullWidth
        label="Buscar por código ou descrição"
        value={busca}
        onChange={(event) => onChangeBusca(event.target.value)}
      />

      {resultados.length > 0 && !produtoSelecionado && (
        <List
          sx={{
            mt: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            maxHeight: {
              xs: "52dvh",
              sm: "60dvh",
              md: "65dvh",
            },
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            bgcolor: "background.paper",
          }}
        >
          {resultados.map((produto) => (
            <ListItemButton
              key={produto.id}
              onClick={() => onSelecionarProduto(produto)}
              sx={{
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:last-child": {
                  borderBottom: "none",
                },
              }}
            >
              <ListItemText
                primary={`${produto.codigo} - ${produto.descricao}`}
                secondary={`${produto.gramatura} | ${produto.departamento} | ${produto.secao}`}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </>
  );
}