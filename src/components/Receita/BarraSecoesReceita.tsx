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
  {
    termos: ["PAO", "PÃES", "PAES"],
    icone: "🥖",
  },
  {
    termos: ["DOCE", "DOCES"],
    icone: "🍩",
  },
  {
    termos: [
      "BOLO",
      "BOLOS",
      "TORTA",
      "TORTAS",
    ],
    icone: "🎂",
  },
  {
    termos: [
      "SALGADO",
      "SALGADOS",
    ],
    icone: "🥐",
  },
  {
    termos: [
      "SUCO",
      "SUCOS",
      "BEBIDA",
      "BEBIDAS",
    ],
    icone: "🥤",
  },
  {
    termos: ["ROSCA", "ROSCAS"],
    icone: "🥨",
  },
  {
    termos: ["QUITANDA"],
    icone: "🥮",
  },
  {
    termos: [
      "FARINHA",
      "FARINHAS",
    ],
    icone: "🌾",
  },
];

function normalizar(
  valor: string
): string {
  return valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toUpperCase();
}

function obterIcone(
  secao: string
): string {
  const secaoNormalizada =
    normalizar(secao);

  const encontrado =
    iconesPorSecao.find(
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
    <Box
      sx={{
        mb: {
          xs: 2.5,
          sm: 3,
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 1.5,
          color: "text.primary",
        }}
      >
        Seções — Produção Padaria
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "nowrap",
          gap: 1,
          alignItems: "stretch",
          width: "100%",
          overflowX: "auto",
          pb: 1,

          scrollbarWidth: "thin",

          "&::-webkit-scrollbar": {
            height: 6,
          },

          "&::-webkit-scrollbar-thumb": {
            bgcolor: "divider",
            borderRadius: 10,
          },
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
                  xs: "0 0 108px",
                  sm: "1 1 0",
                },

                minWidth: {
                  xs: 108,
                  sm: 0,
                },

                minHeight: {
                  xs: 88,
                  sm: 92,
                },

                px: 1.25,
                py: 1.25,

                borderRadius: 2,

                border: "1px solid",

                borderColor: selecionada
                  ? "primary.main"
                  : "divider",

                bgcolor: selecionada
                  ? "primary.main"
                  : "background.paper",

                color: selecionada
                  ? "primary.contrastText"
                  : "text.primary",

                boxShadow: selecionada
                  ? "0 3px 10px rgba(11,45,92,0.16)"
                  : "0 1px 3px rgba(15,35,60,0.06)",

                transition:
                  "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",

                "&:hover": {
                  borderColor:
                    "primary.main",

                  boxShadow:
                    "0 3px 10px rgba(11,45,92,0.12)",
                },

                "&:focus-visible": {
                  outline:
                    "3px solid rgba(0,174,239,0.28)",

                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  gap: 0.75,
                }}
              >
                <Typography
                  component="span"
                  aria-hidden="true"
                  sx={{
                    fontSize: {
                      xs: 26,
                      sm: 28,
                    },
                    lineHeight: 1,
                  }}
                >
                  {obterIcone(secao)}
                </Typography>

                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    textAlign:
                      "center",
                    lineHeight: 1.3,

                    fontSize: {
                      xs: "0.78rem",
                      sm: "0.82rem",
                    },

                    overflow: "hidden",
                    display:
                      "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient:
                      "vertical",
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