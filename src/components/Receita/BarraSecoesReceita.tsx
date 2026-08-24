import {
  Box,
  ButtonBase,
  Typography,
} from "@mui/material";

type Props = {
  secoes: string[];
  secaoSelecionada: string;
  onSelecionarSecao: (secao: string) => void;
};

const iconesPorSecao: Array<{
  termos: string[];
  icone: string;
}> = [
  { termos: ["PAO", "PÃES", "PAES"], icone: "🥖" },
  { termos: ["DOCE", "DOCES"], icone: "🍩" },
  {
    termos: ["BOLO", "BOLOS", "TORTA", "TORTAS"],
    icone: "🎂",
  },
  {
    termos: ["SALGADO", "SALGADOS"],
    icone: "🥐",
  },
  {
    termos: ["SUCO", "SUCOS", "BEBIDA", "BEBIDAS"],
    icone: "🥤",
  },
  { termos: ["ROSCA", "ROSCAS"], icone: "🥨" },
  { termos: ["QUITANDA"], icone: "🥮" },
  {
    termos: ["FARINHA", "FARINHAS"],
    icone: "🌾",
  },
];

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function obterIcone(secao: string): string {
  const secaoNormalizada = normalizar(secao);

  const encontrado = iconesPorSecao.find(
    ({ termos }) =>
      termos.some((termo) =>
        secaoNormalizada.includes(
          normalizar(termo)
        )
      )
  );

  return encontrado?.icone ?? "🍞";
}

export default function BarraSecoesReceita({
  secoes,
  secaoSelecionada,
  onSelecionarSecao,
}: Props) {
  if (secoes.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 800,
          mb: 1.5,
        }}
      >
        Seções — Produção Padaria
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "nowrap",
          gap: {
            xs: 1,
            sm: 1.2,
          },
          alignItems: "stretch",
          width: "100%",
          overflowX: "auto",
          pb: 1,
          scrollbarWidth: "thin",
        }}
      >
        {secoes.map((secao) => {
          const selecionada =
            secaoSelecionada === secao;

          return (
            <ButtonBase
              key={secao}
              onClick={() =>
                onSelecionarSecao(secao)
              }
              sx={{
                flex: {
                  xs: "0 0 118px",
                  sm: "1 1 0",
                },
                minWidth: {
                  xs: 118,
                  sm: 0,
                },
                minHeight: 112,
                px: {
                  xs: 1,
                  sm: 1.25,
                },
                py: 1.5,
                borderRadius: 3,
                bgcolor: selecionada
                  ? "primary.main"
                  : "background.paper",
                color: selecionada
                  ? "primary.contrastText"
                  : "text.primary",
                boxShadow: selecionada
                  ? 3
                  : 1,
                transition: "0.2s",
                "&:hover": {
                  boxShadow: 3,
                  transform:
                    "translateY(-2px)",
                },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontSize: 38,
                    lineHeight: 1,
                  }}
                >
                  {obterIcone(secao)}
                </Typography>

                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: 1.2,
                    fontSize: {
                      xs: "0.72rem",
                      sm: "0.78rem",
                    },
                  }}
                >
                  {secao}
                </Typography>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}