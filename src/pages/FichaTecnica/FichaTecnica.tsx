import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { receitaService } from "../../services/receitaService";
import { exportacaoFichaService } from "../../services/exportacaoFichaService";
import type { Receita } from "../../models/Receita";

import logoRoca from "../../assets/logo-roca.png";

function calcularMinutos(
  horaInicio: string,
  horaFinal: string
): number {
  if (!horaInicio || !horaFinal) {
    return 0;
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

  return finalEmMinutos - inicioEmMinutos;
}

function formatarTempo(minutosTotais: number): string {
  if (minutosTotais <= 0) {
    return "-";
  }

  const horas = Math.floor(minutosTotais / 60);
  const minutos = minutosTotais % 60;

  if (horas === 0) {
    return `${minutos} min`;
  }

  if (minutos === 0) {
    return `${horas} h`;
  }

  return `${horas} h ${minutos} min`;
}
function converterNumero(valor: string | number): number {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (!valor) {
    return 0;
  }

  const numero = Number(
    String(valor)
      .trim()
      .replace(",", ".")
  );

  return Number.isFinite(numero) ? numero : 0;
}
function formatarData(data: string): string {
  if (!data) return "-";

  const dataSemFuso = data.includes("T")
    ? new Date(data)
    : new Date(`${data}T00:00:00`);

  if (Number.isNaN(dataSemFuso.getTime())) {
    return data;
  }

  return dataSemFuso.toLocaleDateString("pt-BR");
}

function formatarDataHora(data: string): string {
  if (!data) return "-";

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return data;
  }

  return valor.toLocaleString("pt-BR");
}
export default function FichaTecnica() {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [buscaReceita, setBuscaReceita] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [mensagemErro, setMensagemErro] = useState("");

  const [receitaSelecionada, setReceitaSelecionada] =
    useState<Receita | null>(null);

  const [receitaParaExcluir, setReceitaParaExcluir] =
    useState<Receita | null>(null);

  const [excluindo, setExcluindo] = useState(false);

  const [receitasSelecionadas, setReceitasSelecionadas] =
    useState<number[]>([]);

  useEffect(() => {
    carregarReceitas();
  }, []);

  async function carregarReceitas() {
    setCarregando(true);
    setMensagemErro("");

    try {
      const lista = await receitaService.listar();
      setReceitas(lista);
    } catch (error) {
      console.error("Erro ao listar fichas técnicas:", error);
      setMensagemErro(
        "Não foi possível carregar as fichas técnicas."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function excluirReceita() {
  if (!receitaParaExcluir) return;

  setExcluindo(true);
  setMensagemErro("");

  try {
    await receitaService.remover(
      receitaParaExcluir.id
    );

    setReceitas((listaAtual) =>
      listaAtual.filter(
        (receita) =>
          receita.id !==
          receitaParaExcluir.id
      )
    );

    setReceitaParaExcluir(null);
  } catch (error) {
    console.error(
      "Erro ao excluir ficha técnica:",
      error
    );

    setMensagemErro(
      "Não foi possível excluir a ficha técnica."
    );
  } finally {
    setExcluindo(false);
  }
}

function alternarSelecaoReceita(
  receitaId: number
) {
  setReceitasSelecionadas(
    (selecionadasAtuais) => {
      const jaSelecionada =
        selecionadasAtuais.includes(
          receitaId
        );

      if (jaSelecionada) {
        return selecionadasAtuais.filter(
          (id) =>
            id !== receitaId
        );
      }

      return [
        ...selecionadasAtuais,
        receitaId,
      ];
    }
  );
}

  
const totalMinutosMaoDeObra = receitaSelecionada
  ? receitaSelecionada.cargosEnvolvidos.reduce(
      (total, cargo) =>
        total +
        calcularMinutos(
          cargo.horaInicio,
          cargo.horaFinal
        ),
      0
    )
  : 0;
const totalMinutosMaquinas = receitaSelecionada
  ? receitaSelecionada.maquinas.reduce(
      (total, maquina) =>
        total +
        calcularMinutos(
          maquina.horaInicio,
          maquina.horaFinal
        ),
      0
    )
  : 0;

const massaCrua = receitaSelecionada
  ? receitaSelecionada.pesoTotalIngredientes
  : 0;

const massaAssada = receitaSelecionada
  ? converterNumero(
      receitaSelecionada.pesoTotalProduzido
    )
  : 0;

const rendimentoMassa =
  massaCrua > 0 && massaAssada >= 0
    ? (massaAssada / massaCrua) * 100
    : 0;

const perdaMassa =
  massaCrua > 0 && massaAssada >= 0
    ? Math.max(massaCrua - massaAssada, 0)
    : 0;

const quantidadeProduzidaNumero = receitaSelecionada
  ? converterNumero(
      receitaSelecionada.quantidadeProduzida
    )
  : 0;

const pesoMedioPorUnidade =
  quantidadeProduzidaNumero > 0 && massaAssada > 0
    ? massaAssada / quantidadeProduzidaNumero
    : 0;

const receitasFiltradas = receitas.filter((receita) => {
  const busca = buscaReceita
    .trim()
    .toLowerCase();

  if (!busca) {
    return true;
  }

  const codigo = String(
    receita.codigoProduto || ""
  ).toLowerCase();

  const nome = String(
    receita.nomeProduto || ""
  ).toLowerCase();

  return (
    codigo.includes(busca) ||
    nome.includes(busca)
  );
});
const fichasSelecionadas = receitas.filter(
  (receita) =>
    receitasSelecionadas.includes(
      receita.id
    )
);
return (
    
    <Box sx={{ p: 3 }}>
  <Box
    sx={{
      mb: 3,
      display: "flex",
      justifyContent: "space-between",
      alignItems: {
        xs: "flex-start",
        md: "center",
      },
      flexDirection: {
        xs: "column",
        md: "row",
      },
      gap: 2,
    }}
  >
    <Box>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700 }}
      >
        Fichas Técnicas
      </Typography>

      <Typography
        color="text.secondary"
        sx={{ mt: 0.5 }}
      >
        Receitas coletadas e salvas no sistema
      </Typography>
    </Box>

    <Chip
      label={`${receitas.length} ficha${
        receitas.length === 1 ? "" : "s"
      }`}
    />
  </Box>

  <Box
  sx={{
    mb: 3,
    display: "flex",
    gap: 2,
    flexWrap: "wrap",
    alignItems: "center",
  }}
>
  <TextField
    fullWidth
    label="Buscar receita"
    placeholder="Digite o código ou nome da receita"
    value={buscaReceita}
    onChange={(event) =>
      setBuscaReceita(
        event.target.value
      )
    }
    sx={{
      maxWidth: 700,
      flex: 1,
      minWidth: 280,
    }}
  />

  <Button
    variant="contained"
    disabled={
      fichasSelecionadas.length === 0
    }
    onClick={() =>
      exportacaoFichaService.exportarFichasPdf(
        fichasSelecionadas
      )
    }
  >
    Exportar PDF
  </Button>

  <Button
    variant="outlined"
    disabled={
      fichasSelecionadas.length === 0
    }
    onClick={() =>
      exportacaoFichaService.exportarFichasExcel(
        fichasSelecionadas
      )
    }
  >
    Exportar Excel
  </Button>
</Box>

      {mensagemErro && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {mensagemErro}
        </Alert>
      )}

      {carregando ? (
  <Box
    sx={{
      py: 8,
      display: "flex",
      justifyContent: "center",
    }}
  >
    <CircularProgress />
  </Box>
) : receitas.length === 0 ? (
  <Paper
    variant="outlined"
    sx={{
      p: 5,
      textAlign: "center",
    }}
  >
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
      }}
    >
      Nenhuma ficha técnica salva
    </Typography>

    <Typography
      color="text.secondary"
      sx={{ mt: 1 }}
    >
      As receitas salvas aparecerão nesta página.
    </Typography>
  </Paper>
) : (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 1.5,
    }}
  >
    {receitasFiltradas.map((receita) => {
      const fotoProdutoFinal =
        receita.fotos?.find(
          (foto) =>
            foto.categoria === "PRODUTO_FINAL"
        ) || receita.fotos?.[0];

      const selecionada =
        receitasSelecionadas.includes(
          receita.id
        );

      return (
        <Paper
          key={receita.id}
          variant="outlined"
          sx={{
            display: "flex",
            alignItems: "stretch",
            overflow: "hidden",
            borderRadius: 2,
            minHeight: 120,
            cursor: "pointer",
            transition: "0.2s",
            borderColor: selecionada
              ? "primary.main"
              : "divider",
            borderWidth: selecionada
              ? 2
              : 1,
            "&:hover": {
              boxShadow: 2,
            },
          }}
          onClick={() =>
            setReceitaSelecionada(
              receita
            )
          }
        >
          <Box
            onClick={(event) => {
              event.stopPropagation();

              alternarSelecaoReceita(
                receita.id
              );
            }}
            sx={{
              width: 42,
              minWidth: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: selecionada
                ? "primary.main"
                : "grey.100",
              color: selecionada
                ? "primary.contrastText"
                : "text.secondary",
              fontWeight: 800,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            {selecionada
              ? "✓"
              : "○"}
          </Box>

          <Box
            sx={{
              width: {
                xs: 110,
                sm: 150,
              },
              minWidth: {
                xs: 110,
                sm: 150,
              },
              bgcolor: "grey.100",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {fotoProdutoFinal ? (
              <Box
                component="img"
                src={
                  fotoProdutoFinal.preview
                }
                alt={
                  fotoProdutoFinal.legenda ||
                  receita.nomeProduto
                }
                sx={{
                  width: "100%",
                  height: "100%",
                  minHeight: 120,
                  objectFit: "cover",
                }}
              />
            ) : (
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Sem foto
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              flex: 1,
              p: {
                xs: 1.5,
                sm: 2,
              },
              display: "flex",
              flexDirection: "column",
              justifyContent:
                "space-between",
              minWidth: 0,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "primary.main",
                  lineHeight: 1.25,
                }}
              >
                {receita.codigoProduto} -{" "}
                {receita.nomeProduto}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Coleta em{" "}
                {formatarData(
                  receita.dataColeta
                )}
              </Typography>

              <Box
                sx={{
                  mt: 1.5,
                  display: "flex",
                  gap: {
                    xs: 2,
                    sm: 4,
                  },
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Produção
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    {receita.quantidadeProduzida ||
                      "-"}{" "}
                    {
                      receita.unidadeMedidaProduto
                    }
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Peso produzido
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    {receita.pesoTotalProduzido ||
                      "-"}{" "}
                    {
                      receita.unidadePesoProduzido
                    }
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                mt: 1.5,
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
                flexWrap: "wrap",
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  setReceitaSelecionada(
                    receita
                  )
                }
              >
                Visualizar
              </Button>

              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  sessionStorage.setItem(
                    "receitaEdicaoId",
                    String(receita.id)
                  );

                  window.location.href =
                    "/receitas";
                }}
              >
                Editar
              </Button>

              <Button
                size="small"
                color="error"
                onClick={() =>
                  setReceitaParaExcluir(
                    receita
                  )
                }
              >
                Excluir
              </Button>
            </Box>
          </Box>
        </Paper>
      );
    })}
  </Box>
)}
    

      <Dialog
        open={Boolean(receitaSelecionada)}
        onClose={() => setReceitaSelecionada(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: "1.25rem",
                fontWeight: 500,
              }}
            >
              Ficha técnica
            </Typography>

            <Box
              component="img"
              src={logoRoca}
              alt="Roca"
              sx={{
                width: 54,
                height: 54,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {receitaSelecionada && (
            <Box sx={{ display: "grid", gap: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {receitaSelecionada.codigoProduto} -{" "}
                  {receitaSelecionada.nomeProduto}
                </Typography>

                <Typography color="text.secondary">
                  {receitaSelecionada.departamento} |{" "}
                  {receitaSelecionada.secao}
                </Typography>
              </Box>

                            <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  Dados da coleta
                </Typography>

                <Typography>
                  Data:{" "}
                  {formatarData(receitaSelecionada.dataColeta)}
                </Typography>

                <Typography>
                  Responsável:{" "}
                  {receitaSelecionada.responsavelColeta}
                </Typography>

                
                <Typography>
                  Estoque congelado:{" "}
                  {receitaSelecionada.estoqueCongelado || "-"}
                </Typography>
                <Typography>
  Criada em:{" "}
  {formatarDataHora(receitaSelecionada.criadoEm)}
</Typography>

<Typography>
  Última atualização:{" "}
  {formatarDataHora(receitaSelecionada.atualizadoEm)}
</Typography>
              </Box>

                            <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  Cargos envolvidos
                </Typography>

                {receitaSelecionada.cargosEnvolvidos.length === 0 ? (
                  <Typography color="text.secondary">
                    Nenhum cargo informado.
                  </Typography>
                ) : (
                  <>
                    {receitaSelecionada.cargosEnvolvidos.map(
                      (cargo) => {
                        const minutosTrabalhados =
                          calcularMinutos(
                            cargo.horaInicio,
                            cargo.horaFinal
                          );

                        return (
                          <Typography key={cargo.id}>
                            {cargo.identificacao}
                            {" | "}
                            {cargo.horaInicio || "-"} até{" "}
                            {cargo.horaFinal || "-"}
                            {" | "}
                            {formatarTempo(
                              minutosTrabalhados
                            )}
                          </Typography>
                        );
                      }
                    )}

                    <Typography
                      sx={{
                        mt: 1.5,
                        fontWeight: 700,
                      }}
                    >
                      Total de mão de obra:{" "}
                      {formatarTempo(
                        totalMinutosMaoDeObra
                      )}
                    </Typography>
                  </>
                )}
              </Box>

                            <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  Máquinas e equipamentos
                </Typography>

                {receitaSelecionada.maquinas.length === 0 ? (
                  <Typography color="text.secondary">
                    Nenhuma máquina ou equipamento informado.
                  </Typography>
                ) : (
                  <>
                    {receitaSelecionada.maquinas.map((maquina) => {
                      const minutosMaquina = calcularMinutos(
                        maquina.horaInicio,
                        maquina.horaFinal
                      );

                      return (
                        <Typography key={maquina.id}>
                          {maquina.identificacao}
                          {" | "}
                          {maquina.horaInicio || "-"} até{" "}
                          {maquina.horaFinal || "-"}
                          {" | "}
                          {formatarTempo(minutosMaquina)}
                        </Typography>
                      );
                    })}

                    <Typography
                      sx={{
                        mt: 1.5,
                        fontWeight: 700,
                      }}
                    >
                      Total de máquinas:{" "}
                      {formatarTempo(totalMinutosMaquinas)}
                    </Typography>
                  </>
                )}
              </Box>

              <Box>
  <Typography sx={{ fontWeight: 700, mb: 1 }}>
    Produção da Massa
  </Typography>

  {receitaSelecionada.ingredientes.filter(
    (ingrediente) => ingrediente.modulo === "MASSA"
  ).length === 0 ? (
    <Typography color="text.secondary">
      Nenhum ingrediente informado.
    </Typography>
  ) : (
    receitaSelecionada.ingredientes
      .filter(
        (ingrediente) => ingrediente.modulo === "MASSA"
      )
      .map((ingrediente) => (
        <Typography key={ingrediente.id}>
          {ingrediente.identificacao}:{" "}
          {ingrediente.quantidadeUtilizada}{" "}
          {ingrediente.unidadeMedida}
          {ingrediente.sobra
            ? ` | Sobra: ${ingrediente.sobra} ${ingrediente.unidadeMedida}`
            : ""}
        </Typography>
      ))
  )}

  <Typography
    sx={{
      fontWeight: 700,
      mt: 2.5,
      mb: 1,
    }}
  >
    Cobertura / Acabamento
  </Typography>

  {receitaSelecionada.ingredientes.filter(
    (ingrediente) =>
      ingrediente.modulo === "COBERTURA_ACABAMENTO"
  ).length === 0 ? (
    <Typography color="text.secondary">
      Nenhum ingrediente informado.
    </Typography>
  ) : (
    receitaSelecionada.ingredientes
      .filter(
        (ingrediente) =>
          ingrediente.modulo === "COBERTURA_ACABAMENTO"
      )
      .map((ingrediente) => (
        <Typography key={ingrediente.id}>
          {ingrediente.identificacao}:{" "}
          {ingrediente.quantidadeUtilizada}{" "}
          {ingrediente.unidadeMedida}
          {ingrediente.sobra
            ? ` | Sobra: ${ingrediente.sobra} ${ingrediente.unidadeMedida}`
            : ""}
        </Typography>
      ))
  )}
</Box>

              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  Embalagens utilizadas
                </Typography>

                {receitaSelecionada.embalagens.length === 0 ? (
                  <Typography color="text.secondary">
                    Nenhuma embalagem informada.
                  </Typography>
                ) : (
                  receitaSelecionada.embalagens.map(
                    (embalagem) => (
                      <Typography key={embalagem.id}>
                        {embalagem.identificacao}:{" "}
                        {embalagem.quantidade || "-"}
                      </Typography>
                    )
                  )
                )}
              </Box>
                            <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 2 }}
                >
                  Resumo Técnico da Produção
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "1.4fr 1fr 1.4fr",
                    },
                    gap: 0,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, pb: 1 }}>
                    Informação
                  </Typography>

                  <Typography sx={{ fontWeight: 700, pb: 1 }}>
                    Resultado
                  </Typography>

                  <Typography sx={{ fontWeight: 700, pb: 1 }}>
                    Aplicação
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Massa crua
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    {massaCrua > 0
                      ? `${massaCrua.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 3,
                        })} KG`
                      : "-"}
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Base da produção
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Massa assada
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    {massaAssada > 0
                      ? `${massaAssada.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 3,
                        })} KG`
                      : "-"}
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Resultado da produção
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Perda da massa
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    {perdaMassa > 0
                      ? `${perdaMassa.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 3,
                        })} KG`
                      : "-"}
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Perda no processo
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Rendimento da massa
                  </Typography>

                  <Typography sx={{ py: 1, fontWeight: 700 }}>
                    {rendimentoMassa > 0
                      ? `${rendimentoMassa.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}%`
                      : "-"}
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Indicador de rendimento
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Quantidade produzida
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    {receitaSelecionada.quantidadeProduzida || "-"}{" "}
                    {receitaSelecionada.unidadeMedidaProduto}
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Produção final
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Peso médio por unidade
                  </Typography>

                  <Typography sx={{ py: 1 }}>
  {pesoMedioPorUnidade > 0
    ? pesoMedioPorUnidade < 1
      ? `${(
          pesoMedioPorUnidade * 1000
        ).toLocaleString("pt-BR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })} g`
      : `${pesoMedioPorUnidade.toLocaleString(
          "pt-BR",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 3,
          }
        )} KG`
    : "-"}
</Typography>

                  <Typography sx={{ py: 1 }}>
                    Padronização do produto
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Mão de obra
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    {formatarTempo(totalMinutosMaoDeObra)}
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Tempo total trabalhado
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Máquinas
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    {formatarTempo(totalMinutosMaquinas)}
                  </Typography>

                  <Typography sx={{ py: 1 }}>
                    Tempo total de utilização
                  </Typography>
                </Box>
              </Paper>
              <Paper
  variant="outlined"
  sx={{
    p: 2.5,
    borderRadius: 2,
  }}
>
  <Typography
    variant="h6"
    sx={{ fontWeight: 700, mb: 2 }}
  >
    Recomendação de Validade
  </Typography>

  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        sm: "1fr 2fr",
      },
      gap: 1.5,
    }}
  >
    <Typography sx={{ fontWeight: 600 }}>
      Sugestão do Roca Coleta
    </Typography>

    <Typography>
      {receitaSelecionada.validadeSugeridaDias
        ? `${receitaSelecionada.validadeSugeridaDias} dias`
        : "-"}
    </Typography>

    <Typography sx={{ fontWeight: 600 }}>
      Conservação considerada
    </Typography>

    <Typography>
      {receitaSelecionada.validadeConservacao || "-"}
    </Typography>

    <Typography sx={{ fontWeight: 600 }}>
      Motivo
    </Typography>

    <Typography>
      {receitaSelecionada.validadeMotivo || "-"}
    </Typography>

    <Typography sx={{ fontWeight: 600 }}>
      Referências consultadas
    </Typography>

    <Box>
      {receitaSelecionada.validadeReferencias?.length > 0
        ? receitaSelecionada.validadeReferencias.map(
            (referencia, index) => (
              <Typography key={index}>
                • {referencia}
              </Typography>
            )
          )
        : (
          <Typography>-</Typography>
        )}
    </Box>
  </Box>
</Paper>

              
              <Box>
  <Typography sx={{ fontWeight: 700, mb: 1 }}>
    Modo de preparo
  </Typography>

  <Typography sx={{ whiteSpace: "pre-wrap" }}>
    Produção:{" "}
    {receitaSelecionada.modoPreparoProducao || "-"}
  </Typography>

  <Typography
    sx={{
      mt: 1,
      whiteSpace: "pre-wrap",
    }}
  >
    Cliente:{" "}
    {receitaSelecionada.modoPreparoCliente || "-"}
  </Typography>
</Box>

<Box>
  <Typography
    variant="h6"
    sx={{
      fontWeight: 700,
      mb: 2,
    }}
  >
    Galeria de Fotos
  </Typography>

  {!receitaSelecionada.fotos ||
  receitaSelecionada.fotos.length === 0 ? (
    <Typography color="text.secondary">
      Nenhuma foto registrada.
    </Typography>
  ) : (
    <>
      <Typography
        sx={{
          fontWeight: 700,
          mb: 1.5,
        }}
      >
        Ingredientes / Preparação
      </Typography>

      {receitaSelecionada.fotos.filter(
        (foto) =>
          foto.categoria ===
          "INGREDIENTES_PREPARACAO"
      ).length === 0 ? (
        <Typography
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Nenhuma foto registrada.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            mb: 3,
          }}
        >
          {receitaSelecionada.fotos
            .filter(
              (foto) =>
                foto.categoria ===
                "INGREDIENTES_PREPARACAO"
            )
            .map((foto) => (
              <Paper
                key={foto.id}
                variant="outlined"
                sx={{
                  overflow: "hidden",
                  borderRadius: 2,
                }}
              >
                <Box
                  component="img"
                  src={foto.preview}
                  alt={foto.legenda || foto.nome}
                  sx={{
                    width: "100%",
                    height: 160,
                    display: "block",
                    objectFit: "cover",
                  }}
                />

                {foto.legenda && (
                  <Typography
                    variant="body2"
                    sx={{
                      p: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    {foto.legenda}
                  </Typography>
                )}
              </Paper>
            ))}
        </Box>
      )}

      <Typography
        sx={{
          fontWeight: 700,
          mb: 1.5,
        }}
      >
        Produto Final
      </Typography>

      {receitaSelecionada.fotos.filter(
        (foto) =>
          foto.categoria === "PRODUTO_FINAL"
      ).length === 0 ? (
        <Typography color="text.secondary">
          Nenhuma foto registrada.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {receitaSelecionada.fotos
            .filter(
              (foto) =>
                foto.categoria === "PRODUTO_FINAL"
            )
            .map((foto) => (
              <Paper
                key={foto.id}
                variant="outlined"
                sx={{
                  overflow: "hidden",
                  borderRadius: 2,
                }}
              >
                <Box
                  component="img"
                  src={foto.preview}
                  alt={foto.legenda || foto.nome}
                  sx={{
                    width: "100%",
                    height: 160,
                    display: "block",
                    objectFit: "cover",
                  }}
                />

                {foto.legenda && (
                  <Typography
                    variant="body2"
                    sx={{
                      p: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    {foto.legenda}
                  </Typography>
                )}
              </Paper>
            ))}
        </Box>
      )}
    </>
  )}
</Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
  <Button
    onClick={() =>
      setReceitaSelecionada(null)
    }
  >
    Fechar
  </Button>

  <Button
    variant="contained"
    disabled={!receitaSelecionada}
    onClick={() => {
      if (!receitaSelecionada) {
        return;
      }

      exportacaoFichaService.exportarFichaPdf(
        receitaSelecionada
      );
    }}
  >
    Exportar PDF
  </Button>
</DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(receitaParaExcluir)}
        onClose={() => {
          if (!excluindo) {
            setReceitaParaExcluir(null);
          }
        }}
      >
        <DialogTitle>Excluir ficha técnica</DialogTitle>

        <DialogContent>
          <Typography>
            Confirma a exclusão da ficha de{" "}
            <strong>
              {receitaParaExcluir?.nomeProduto}
            </strong>
            ?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setReceitaParaExcluir(null)}
            disabled={excluindo}
          >
            Cancelar
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={excluirReceita}
            disabled={excluindo}
          >
            {excluindo ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}