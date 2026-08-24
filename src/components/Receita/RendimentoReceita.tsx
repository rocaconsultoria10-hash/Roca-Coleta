import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

type Props = {
  horaInicio: string;
  horaFinal: string;
  quantidadeProduzida: string;
  unidadeMedidaProduto: string;
  pesoTotalIngredientes: number;
  pesoTotalProduzido: string;
  unidadePesoProduzido: string;
  onChangeHoraInicio: (valor: string) => void;
  onChangeHoraFinal: (valor: string) => void;
  onChangeQuantidadeProduzida: (valor: string) => void;
  onChangeUnidadeMedidaProduto: (valor: string) => void;
  onChangePesoTotalProduzido: (valor: string) => void;
  onChangeUnidadePesoProduzido: (valor: string) => void;
  exibirTempoProducao?: boolean;
};

function calcularTempoTotal(
  horaInicio: string,
  horaFinal: string
): string {
  if (!horaInicio || !horaFinal) {
    return "";
  }

  const [horaInicial, minutoInicial] = horaInicio
    .split(":")
    .map(Number);

  const [horaEncerramento, minutoEncerramento] = horaFinal
    .split(":")
    .map(Number);

  const inicioEmMinutos = horaInicial * 60 + minutoInicial;

  let finalEmMinutos =
    horaEncerramento * 60 + minutoEncerramento;

  if (finalEmMinutos < inicioEmMinutos) {
    finalEmMinutos += 24 * 60;
  }

  const diferenca = finalEmMinutos - inicioEmMinutos;
  const horas = Math.floor(diferenca / 60);
  const minutos = diferenca % 60;

  if (horas === 0) {
    return `${minutos} min`;
  }

  if (minutos === 0) {
    return `${horas} h`;
  }

  return `${horas} h ${minutos} min`;
}

function converterNumero(valor: string): number {
  const numero = Number(valor.replace(",", "."));

  return Number.isFinite(numero) ? numero : 0;
}

function converterPesoParaKg(
  valor: string,
  unidade: string
): number | null {
  const numero = converterNumero(valor);

  if (numero < 0) {
    return null;
  }

  if (unidade === "KG") {
    return numero;
  }

  if (unidade === "G") {
    return numero / 1000;
  }

  return null;
}

function formatarNumero(valor: number): string {
  if (!Number.isFinite(valor)) {
    return "";
  }

  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
}

export default function RendimentoReceita({
  horaInicio,
  horaFinal,
  quantidadeProduzida,
  unidadeMedidaProduto,
  pesoTotalIngredientes,
  pesoTotalProduzido,
  unidadePesoProduzido,
  onChangeHoraInicio,
  onChangeHoraFinal,
  onChangeQuantidadeProduzida,
  onChangeUnidadeMedidaProduto,
  onChangePesoTotalProduzido,
  onChangeUnidadePesoProduzido,
  exibirTempoProducao = true,
}: Props) {
  const tempoTotal = calcularTempoTotal(
    horaInicio,
    horaFinal
  );

  const quantidade = converterNumero(quantidadeProduzida);

  const pesoProduzidoEmKg = converterPesoParaKg(
    pesoTotalProduzido,
    unidadePesoProduzido
  );

  const podeCalcularPorPeso =
    pesoTotalIngredientes > 0 &&
    pesoProduzidoEmKg !== null;

  const pesoUnitarioEmKg =
    podeCalcularPorPeso && quantidade > 0
      ? pesoProduzidoEmKg / quantidade
      : 0;

  const perdaQuebraEmKg =
    podeCalcularPorPeso
      ? Math.max(
          pesoTotalIngredientes - pesoProduzidoEmKg,
          0
        )
      : 0;

  const perdaPercentual =
    podeCalcularPorPeso
      ? (perdaQuebraEmKg / pesoTotalIngredientes) * 100
      : 0;

  const rendimento =
    podeCalcularPorPeso
      ? (pesoProduzidoEmKg / pesoTotalIngredientes) * 100
      : 0;

  return (
    <>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, mt: 4, mb: 2 }}
      >
        Dados da Produção
      </Typography>

      {exibirTempoProducao && (
        <>
      <Typography sx={{ fontWeight: 600, mb: 2 }}>
          Tempo de produção
        </Typography>
  
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          <TextField
            label="Hora de início"
            type="time"
            value={horaInicio}
            onChange={(event) =>
              onChangeHoraInicio(event.target.value)
            }
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
  
          <TextField
            label="Hora final"
            type="time"
            value={horaFinal}
            onChange={(event) =>
              onChangeHoraFinal(event.target.value)
            }
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
  
          <TextField
            label="Tempo total"
            value={tempoTotal}
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
          />
        </Box>
  
          </>
      )}

      <Typography
        sx={{
          fontWeight: 600,
          mt: 3,
          mb: 2,
        }}
      >
        Resultado da produção
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
          },
          gap: 2,
        }}
      >
        <TextField
          label="Quantidade produzida"
          type="number"
          value={quantidadeProduzida}
          onChange={(event) =>
            onChangeQuantidadeProduzida(event.target.value)
          }
          slotProps={{
            htmlInput: {
              min: 0,
              step: 1,
            },
          }}
        />

        <FormControl fullWidth>
          <InputLabel id="unidade-medida-produto-label">
            Unidade de medida do produto
          </InputLabel>

          <Select
            labelId="unidade-medida-produto-label"
            label="Unidade de medida do produto"
            value={unidadeMedidaProduto}
            onChange={(event) =>
              onChangeUnidadeMedidaProduto(event.target.value)
            }
          >
            <MenuItem value="KG">KG</MenuItem>
            <MenuItem value="G">G</MenuItem>
            <MenuItem value="L">L</MenuItem>
            <MenuItem value="ML">ML</MenuItem>
            <MenuItem value="UN">UN</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Peso total dos ingredientes"
          value={
            pesoTotalIngredientes > 0
              ? `${formatarNumero(
                  pesoTotalIngredientes
                )} KG`
              : ""
          }
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 130px",
            gap: 1,
          }}
        >
          <TextField
            label="Peso total produzido"
            type="number"
            value={pesoTotalProduzido}
            onChange={(event) =>
              onChangePesoTotalProduzido(event.target.value)
            }
            slotProps={{
              htmlInput: {
                min: 0,
                step: 0.001,
              },
            }}
          />

          <FormControl fullWidth>
            <InputLabel id="unidade-peso-produzido-label">
              Unidade
            </InputLabel>

            <Select
              labelId="unidade-peso-produzido-label"
              label="Unidade"
              value={unidadePesoProduzido}
              onChange={(event) =>
                onChangeUnidadePesoProduzido(
                  event.target.value
                )
              }
            >
              <MenuItem value="KG">KG</MenuItem>
              <MenuItem value="G">G</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TextField
          label="Peso unitário"
          value={
            pesoUnitarioEmKg > 0
              ? `${formatarNumero(
                  pesoUnitarioEmKg
                )} KG`
              : ""
          }
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />

        <TextField
          label="Perda / quebra"
          value={
            podeCalcularPorPeso
              ? `${formatarNumero(
                  perdaQuebraEmKg
                )} KG`
              : ""
          }
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />

        <TextField
          label="Perda percentual"
          value={
            podeCalcularPorPeso
              ? `${formatarNumero(
                  perdaPercentual
                )}%`
              : ""
          }
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />

        <TextField
          label="Rendimento da produção"
          value={
            podeCalcularPorPeso
              ? `${formatarNumero(rendimento)}%`
              : ""
          }
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />
      </Box>

      {unidadePesoProduzido &&
        !["KG", "G"].includes(unidadePesoProduzido) && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            O cálculo automático de perda e rendimento exige
            o peso produzido em KG ou G.
          </Typography>
        )}
    </>
  );
}