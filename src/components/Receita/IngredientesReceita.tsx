import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

import { BrowserMultiFormatReader } from "@zxing/browser";

import { produtoService } from "../../services/produtoService";
import { authService } from "../../services/authService";

import type { Produto } from "../../models/Produto";

export type IngredienteReceita = {
  id: number;
  identificacao: string;
  quantidadeUtilizada: string;
  unidadeMedida: string;
  sobra: string;
  modulo:
    | "MASSA"
    | "COBERTURA_ACABAMENTO";
};

type CampoIngrediente =
  | "identificacao"
  | "quantidadeUtilizada"
  | "unidadeMedida"
  | "sobra"
  | "modulo";

type Props = {
  ingredientes: IngredienteReceita[];
  onAdicionarIngrediente: () => void;
  onAdicionarIngredienteCobertura: () => void;
  onAtualizarIngrediente: (
    id: number,
    campo: CampoIngrediente,
    valor: string
  ) => void;
  onRemoverIngrediente: (
    id: number
  ) => void;
};

function normalizarTexto(
  valor: string
): string {
  return String(valor || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase();
}

function normalizarCodigo(
  valor: string
): string {
  return String(valor || "")
    .replace(/\D/g, "")
    .trim();
}

function inferirUnidadeMedida(
  gramatura: string | number
): string {
  const valor = String(
    gramatura ?? ""
  )
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (
    valor.includes("KG") ||
    valor.includes("QUILO") ||
    valor.includes("QUILOGRAMA")
  ) {
    return "KG";
  }

  if (valor.includes("ML")) {
    return "ML";
  }

  if (
    valor.includes("LITRO") ||
    /(^|[^A-Z])L($|[^A-Z])/.test(
      valor
    ) ||
    /[0-9]L($|[^A-Z])/.test(
      valor
    )
  ) {
    return "L";
  }

  if (
    valor.includes("GRAMA") ||
    /[0-9]G($|[^A-Z])/.test(
      valor
    )
  ) {
    return "G";
  }

  if (
    valor.includes("UNIDADE") ||
    valor.includes("UND") ||
    valor.includes("UN")
  ) {
    return "UN";
  }

  return "";
}

function calcularUnidadeAutomatica(
  gramatura: string | number,
  quantidade: string
): string {
  const unidadeBase =
    inferirUnidadeMedida(gramatura);

  const valor = Number(
    String(quantidade || "")
      .replace(",", ".")
  );

  if (
    !Number.isFinite(valor) ||
    valor <= 0
  ) {
    return unidadeBase;
  }

  if (
    unidadeBase === "KG" ||
    unidadeBase === "G"
  ) {
    return valor < 1
      ? "G"
      : "KG";
  }

  if (
    unidadeBase === "L" ||
    unidadeBase === "ML"
  ) {
    return valor < 1
      ? "ML"
      : "L";
  }

  if (unidadeBase === "UN") {
    return "UN";
  }

  return "";
}

function nomeLimpo(
  valor: string
): string {
  const partes =
    valor.split(" - ");

  return partes.length > 1
    ? partes
        .slice(1)
        .join(" - ")
    : valor;
}

function obterCodigoIdentificacao(
  valor: string
): string {
  const partes =
    valor.split(" - ");

  return partes[0]?.trim() ?? "";
}

type EditorIngredienteProps = {
  ingrediente: IngredienteReceita;
  onAtualizarIngrediente: Props["onAtualizarIngrediente"];
  onRemoverIngrediente: Props["onRemoverIngrediente"];
  onFechar: () => void;
};

function EditorIngrediente({
  ingrediente,
  onAtualizarIngrediente,
  onRemoverIngrediente,
  onFechar,
}: EditorIngredienteProps) {
  const usuarioLogado =
    authService.getUsuarioLogado();

  const empresaId =
    authService.getEmpresaAtivaId() ??
    usuarioLogado?.empresaId ??
    0;

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const streamRef =
    useRef<MediaStream | null>(
      null
    );

  const scannerControlsRef =
    useRef<{
      stop: () => void;
    } | null>(
      null
    );

  const frameRef =
    useRef<number | null>(
      null
    );

  const [produtos, setProdutos] =
    useState<Produto[]>([]);

  const [buscaProduto, setBuscaProduto] =
    useState("");

  const [codigoBarras, setCodigoBarras] =
    useState("");

  const [produtoSelecionado, setProdutoSelecionado] =
    useState<Produto | null>(
      null
    );

  const [cameraAberta, setCameraAberta] =
    useState(false);

  const [mensagemErro, setMensagemErro] =
    useState("");

  const [mensagemCamera, setMensagemCamera] =
    useState("");

  useEffect(() => {
    async function carregarProdutos() {
      if (empresaId <= 0) {
        setProdutos([]);
        return;
      }

      const listaEmpresa =
        await produtoService.listarPorEmpresa(
          empresaId
        );

      setProdutos(listaEmpresa);

      if (
        ingrediente.identificacao.trim()
      ) {
        const codigoAtual =
          obterCodigoIdentificacao(
            ingrediente.identificacao
          );

        const encontrado =
          listaEmpresa.find(
            (produto) =>
              String(produto.codigo) ===
                String(codigoAtual) ||
              `${produto.codigo} - ${produto.descricao}` ===
                ingrediente.identificacao
          );

        if (encontrado) {
          setProdutoSelecionado(
            encontrado
          );

          setBuscaProduto(
            encontrado.descricao
          );

          setCodigoBarras(
            encontrado.codigoBarras ?? ""
          );
        }
      }
    }

    void carregarProdutos();
  }, [
    empresaId,
    ingrediente.identificacao,
  ]);

  useEffect(() => {
    return () => {
      pararCamera();
    };
  }, []);

  const resultados = useMemo(
    () => {
      const termo =
        normalizarTexto(
          buscaProduto
        );

      if (termo.length < 2) {
        return [];
      }

      return produtos
        .filter((produto) => {
          const descricao =
            normalizarTexto(
              produto.descricao
            );

          const codigo =
            normalizarTexto(
              produto.codigo
            );

          const codigoBarras =
            normalizarTexto(
              produto.codigoBarras ??
                ""
            );

          return (
            descricao.includes(
              termo
            ) ||
            codigo.includes(
              termo
            ) ||
            codigoBarras.includes(
              termo
            )
          );
        })
        .slice(0, 30);
    },
    [buscaProduto, produtos]
  );

  function selecionarProduto(
    produto: Produto
  ) {
    setProdutoSelecionado(produto);

    const identificacao =
      `${produto.codigo} - ${produto.descricao}`;

    setBuscaProduto(
      produto.descricao
    );

    setCodigoBarras(
      produto.codigoBarras ?? ""
    );

    onAtualizarIngrediente(
      ingrediente.id,
      "identificacao",
      identificacao
    );

    if (
      !ingrediente.unidadeMedida
    ) {
      const unidadeInferida =
        inferirUnidadeMedida(
          produto.gramatura ?? ""
        );

      if (unidadeInferida) {
        onAtualizarIngrediente(
          ingrediente.id,
          "unidadeMedida",
          unidadeInferida
        );
      }
    }

    setMensagemErro("");
    setMensagemCamera("");
  }

  function alterarBuscaProduto(
    valor: string
  ) {
    setBuscaProduto(valor);
    setProdutoSelecionado(null);
    setMensagemErro("");
    setMensagemCamera("");
  }

  function limparProduto() {
    setProdutoSelecionado(null);
    setBuscaProduto("");
    setCodigoBarras("");
    setMensagemErro("");
    setMensagemCamera("");

    onAtualizarIngrediente(
      ingrediente.id,
      "identificacao",
      ""
    );
  }

  function pararCamera() {
    if (scannerControlsRef.current) {
      scannerControlsRef.current.stop();
      scannerControlsRef.current = null;
    }

    if (
      frameRef.current !== null
    ) {
      cancelAnimationFrame(
        frameRef.current
      );

      frameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }

    setCameraAberta(false);
  }

  async function processarCodigoBarras(
    codigoLido: string
  ) {
    const codigo =
      normalizarCodigo(
        codigoLido
      );

    if (!codigo) {
      setMensagemErro(
        "Informe ou leia um código de barras válido."
      );

      return false;
    }

    const produto =
      produtos.find(
        (item) =>
          normalizarCodigo(
            item.codigoBarras ?? ""
          ) === codigo
      );

    setCodigoBarras(codigoLido);

    if (produto) {
      selecionarProduto(produto);

      setMensagemCamera(
        `Código localizado: ${codigoLido}`
      );

      pararCamera();

      return true;
    }

    setProdutoSelecionado(null);
    setMensagemErro(
      `Código ${codigoLido} não localizado no cadastro.`
    );
    setMensagemCamera("");
    pararCamera();

    return false;
  }

  async function localizarCodigoDigitado() {
    setMensagemErro("");
    setMensagemCamera("");

    await processarCodigoBarras(
      codigoBarras
    );
  }

  async function iniciarLeituraCamera() {
    setMensagemErro("");
    setMensagemCamera("");

    if (
      !navigator.mediaDevices?.getUserMedia
    ) {
      setMensagemErro(
        "A câmera não está disponível neste acesso. Verifique se o navegador tem permissão para usar a câmera."
      );

      return;
    }

    try {
      pararCamera();
      setCameraAberta(true);

      await new Promise<void>(
        (resolve) => {
          window.requestAnimationFrame(
            () => resolve()
          );
        }
      );

      const video =
        videoRef.current;

      if (!video) {
        setMensagemErro(
          "Não foi possível preparar a câmera."
        );

        setCameraAberta(false);
        return;
      }

      const leitor =
        new BrowserMultiFormatReader();

      const controles =
        await leitor.decodeFromVideoDevice(
          undefined,
          video,
          async (resultado) => {
            if (!resultado) {
              return;
            }

            const codigoLido =
              resultado.getText();

            if (!codigoLido) {
              return;
            }

            await processarCodigoBarras(
              codigoLido
            );
          }
        );

      scannerControlsRef.current =
        controles;
    } catch (error) {
      console.error(
        "Erro ao abrir câmera:",
        error
      );

      setMensagemErro(
        "Não foi possível abrir a câmera. Verifique a permissão do navegador."
      );

      pararCamera();
    }
  }

  function cancelar() {
    pararCamera();

    const ingredienteVazio =
      !ingrediente.identificacao.trim() &&
      !ingrediente.quantidadeUtilizada.trim() &&
      !ingrediente.unidadeMedida.trim() &&
      !ingrediente.sobra.trim();

    if (ingredienteVazio) {
      onRemoverIngrediente(
        ingrediente.id
      );
    }

    onFechar();
  }

  function salvar() {
    setMensagemErro("");

    if (!produtoSelecionado) {
      setMensagemErro(
        "Selecione o produto."
      );

      return;
    }

    if (
      !ingrediente.quantidadeUtilizada.trim() ||
      Number(
        ingrediente.quantidadeUtilizada
          .replace(",", ".")
      ) <= 0
    ) {
      setMensagemErro(
        "Informe o peso utilizado."
      );

      return;
    }

    if (
      !ingrediente.unidadeMedida
    ) {
      setMensagemErro(
        "Informe a unidade de medida."
      );

      return;
    }

    pararCamera();
    onFechar();
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1600,
        bgcolor: "#F5F7FA",
        overflowY: "auto",
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          minHeight: 56,
          px: {
            xs: 1.25,
            sm: 2,
          },
          bgcolor: "#0D3768",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 1,
          boxShadow:
            "0 2px 8px rgba(15,23,42,0.18)",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: {
                xs: "1rem",
                sm: "1.08rem",
              },
              lineHeight: 1.15,
            }}
          >
            Ingrediente da Receita
          </Typography>

          <Typography
            sx={{
              mt: 0.15,
              fontSize: "0.7rem",
              opacity: 0.88,
            }}
          >
            Identificar produto e informar peso
          </Typography>
        </Box>

        <Button
          onClick={cancelar}
          startIcon={
            <CloseOutlinedIcon />
          }
          sx={{
            color: "#FFFFFF",
            minWidth: 0,
            px: 0.5,
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          FECHAR
        </Button>
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: 680,
          mx: "auto",
          px: {
            xs: 1.25,
            sm: 2,
          },
          py: 1.25,
          pb: 12,
          boxSizing: "border-box",
        }}
      >
        {mensagemErro && (
          <Alert
            severity="error"
            sx={{ mb: 1 }}
          >
            {mensagemErro}
          </Alert>
        )}

        {mensagemCamera && (
          <Alert
            severity="success"
            sx={{ mb: 1 }}
          >
            {mensagemCamera}
          </Alert>
        )}

        {!produtoSelecionado && (
          <>
            <Paper
              elevation={0}
              sx={{
                border: "none",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#FFFFFF",
                boxShadow:
                  "0 2px 10px rgba(15,23,42,0.08)",
              }}
            >
              <Box
                sx={{
                  px: 1.25,
                  py: 0.8,
                  bgcolor: "#F7F9FC",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: 900,
                    color: "#0D3768",
                  }}
                >
                  1. CÓDIGO DE BARRAS
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.1,
                  display: "grid",
                  gap: 0.8,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Código de barras"
                  placeholder="Digite ou leia o código"
                  value={codigoBarras}
                  onChange={(event) => {
                    setCodigoBarras(
                      event.target.value
                    );
                    setMensagemErro("");
                    setMensagemCamera("");
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      void localizarCodigoDigitado();
                    }
                  }}
                  slotProps={{
                    htmlInput: {
                      inputMode: "numeric",
                    },
                  }}
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr 1fr",
                      sm: "1fr 1fr",
                    },
                    gap: 0.8,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={
                      localizarCodigoDigitado
                    }
                    startIcon={
                      <SearchOutlinedIcon />
                    }
                    sx={{
                      minHeight: 40,
                      borderWidth: 2,
                      borderColor:
                        "#0D3768",
                      color: "#0D3768",
                      fontWeight: 900,
                    }}
                  >
                    BUSCAR
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={
                      <CameraAltOutlinedIcon />
                    }
                    onClick={
                      iniciarLeituraCamera
                    }
                    sx={{
                      minHeight: 40,
                      bgcolor: "#0D3768",
                      fontWeight: 900,
                    }}
                  >
                    CÂMERA
                  </Button>
                </Box>

                {cameraAberta && (
                  <Box
                    sx={{
                      mt: 0.4,
                      overflow: "hidden",
                      borderRadius: 1.25,
                      bgcolor: "#000",
                      position: "relative",
                    }}
                  >
                    <Box
                      component="video"
                      ref={videoRef}
                      muted
                      playsInline
                      sx={{
                        display: "block",
                        width: "100%",
                        maxHeight: 320,
                        objectFit: "cover",
                      }}
                    />

                    <Box
                      sx={{
                        position:
                          "absolute",
                        inset: "22% 8%",
                        border:
                          "3px solid #FFFFFF",
                        borderRadius: 1,
                        pointerEvents:
                          "none",
                      }}
                    />

                    <Button
                      onClick={pararCamera}
                      variant="contained"
                      color="error"
                      size="small"
                      sx={{
                        position:
                          "absolute",
                        bottom: 8,
                        right: 8,
                        fontWeight: 900,
                      }}
                    >
                      CANCELAR
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                my: 1,
              }}
            >
              <Box sx={{ flex: 1 }} />
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  color: "#64748B",
                }}
              >
                OU
              </Typography>
              <Box sx={{ flex: 1 }} />
            </Box>

            <Paper
              elevation={0}
              sx={{
                border: "none",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#FFFFFF",
                boxShadow:
                  "0 2px 10px rgba(15,23,42,0.08)",
              }}
            >
              <Box
                sx={{
                  px: 1.25,
                  py: 0.8,
                  bgcolor: "#F7F9FC",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: 900,
                    color: "#0D3768",
                  }}
                >
                  2. PRODUTO / CÓDIGO INTERNO
                </Typography>
              </Box>

              <Box sx={{ p: 1.1 }}>
                <TextField
                  autoFocus
                  fullWidth
                  size="small"
                  label="Produto ou código interno"
                  placeholder="Digite para localizar"
                  value={buscaProduto}
                  onChange={(event) =>
                    alterarBuscaProduto(
                      event.target.value
                    )
                  }
                  slotProps={{
                    input: {
                      endAdornment: (
                        <SearchOutlinedIcon
                          sx={{
                            color:
                              "#0D3768",
                          }}
                        />
                      ),
                    },
                  }}
                />
              </Box>
            </Paper>

            {resultados.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  mt: 0.75,
                  border: "none",
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "#FFFFFF",
                  boxShadow:
                    "0 2px 10px rgba(15,23,42,0.08)",
                }}
              >
                <List
                  disablePadding
                  sx={{
                    maxHeight: "48vh",
                    overflowY: "auto",
                  }}
                >
                  {resultados.map(
                    (produto) => (
                      <ListItemButton
                        key={produto.id}
                        onClick={() =>
                          selecionarProduto(
                            produto
                          )
                        }
                        sx={{
                          px: 1.25,
                          py: 1,
                          alignItems:
                            "flex-start",
                          borderBottom:
                            "1px solid #E2E8F0",
                          "&:last-of-type": {
                            borderBottom:
                              "none",
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            produto.descricao
                          }
                          secondary={[
                            produto.codigo
                              ? `Cód. interno: ${produto.codigo}`
                              : "",
                            produto.codigoBarras
                              ? `Barras: ${produto.codigoBarras}`
                              : "",
                            produto.gramatura
                              ? `Gramatura: ${produto.gramatura}`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                          slotProps={{
                            primary: {
                              sx: {
                                fontWeight: 900,
                                color:
                                  "#172033",
                                lineHeight: 1.25,
                              },
                            },
                            secondary: {
                              sx: {
                                mt: 0.3,
                                fontSize:
                                  "0.73rem",
                                lineHeight: 1.3,
                              },
                            },
                          }}
                        />
                      </ListItemButton>
                    )
                  )}
                </List>
              </Paper>
            )}

            {buscaProduto.trim().length >= 2 &&
              resultados.length === 0 && (
                <Typography
                  sx={{
                    mt: 0.8,
                    px: 0.2,
                    fontSize: "0.8rem",
                    color: "#64748B",
                  }}
                >
                  Nenhum produto encontrado.
                </Typography>
              )}
          </>
        )}

        {produtoSelecionado && (
          <Box
            sx={{
              display: "grid",
              gap: 1,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                border: "none",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#FFFFFF",
                boxShadow:
                  "0 2px 10px rgba(15,23,42,0.08)",
              }}
            >
              <Box
                sx={{
                  px: 1.25,
                  py: 0.75,
                  bgcolor: "#F7F9FC",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: 900,
                    color: "#0D3768",
                  }}
                >
                  PRODUTO SELECIONADO
                </Typography>

                <Button
                  size="small"
                  onClick={limparProduto}
                  sx={{
                    minWidth: 0,
                    p: 0,
                    fontSize: "0.7rem",
                    fontWeight: 900,
                    color: "#0D3768",
                  }}
                >
                  TROCAR
                </Button>
              </Box>

              <Box
                sx={{
                  p: 1.25,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: "#172033",
                    fontSize: "1rem",
                    lineHeight: 1.25,
                  }}
                >
                  {produtoSelecionado.descricao}
                </Typography>

                <Box
                  sx={{
                    mt: 0.7,
                    display: "grid",
                    gap: 0.25,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.76rem",
                      color: "#475569",
                    }}
                  >
                    <strong>Cód. interno:</strong>{" "}
                    {produtoSelecionado.codigo || "-"}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "0.76rem",
                      color: "#475569",
                    }}
                  >
                    <strong>Cód. barras:</strong>{" "}
                    {produtoSelecionado.codigoBarras || "-"}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "0.76rem",
                      color: "#475569",
                    }}
                  >
                    <strong>Gramatura cadastrada:</strong>{" "}
                    {produtoSelecionado.gramatura || "-"}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                border: "none",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#FFFFFF",
                boxShadow:
                  "0 2px 10px rgba(15,23,42,0.08)",
              }}
            >
              <Box
                sx={{
                  px: 1.25,
                  py: 0.75,
                  bgcolor: "#F7F9FC",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: 900,
                    color: "#0D3768",
                  }}
                >
                  3. PESO E GRAMATURA
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.1,
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1fr) 118px",
                  gap: 0.8,
                }}
              >
                <TextField
                  fullWidth
                  autoFocus
                  size="small"
                  type="number"
                  label="Peso utilizado"
                  value={
                    ingrediente.quantidadeUtilizada
                  }
                  onChange={(event) => {
                    const quantidade =
                      event.target.value;

                    onAtualizarIngrediente(
                      ingrediente.id,
                      "quantidadeUtilizada",
                      quantidade
                    );

                    const unidadeBase =
                      inferirUnidadeMedida(
                        produtoSelecionado.gramatura ??
                          ""
                      );

                    if (unidadeBase) {
                      onAtualizarIngrediente(
                        ingrediente.id,
                        "unidadeMedida",
                        calcularUnidadeAutomatica(
                          produtoSelecionado.gramatura ??
                            "",
                          quantidade
                        )
                      );
                    }
                  }}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: 0.001,
                    },
                  }}
                />

                {inferirUnidadeMedida(
                  produtoSelecionado.gramatura ??
                    ""
                ) ? (
                  <TextField
                    fullWidth
                    size="small"
                    label="Unidade"
                    value={
                      ingrediente.unidadeMedida
                    }
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
                ) : (
                  <FormControl
                    fullWidth
                    size="small"
                  >
                    <InputLabel
                      id={`unidade-${ingrediente.id}`}
                    >
                      Unidade
                    </InputLabel>

                    <Select
                      labelId={`unidade-${ingrediente.id}`}
                      label="Unidade"
                      value={
                        ingrediente.unidadeMedida
                      }
                      MenuProps={{
                        sx: {
                          zIndex: 1700,
                        },
                      }}
                      onChange={(event) =>
                        onAtualizarIngrediente(
                          ingrediente.id,
                          "unidadeMedida",
                          event.target.value
                        )
                      }
                    >
                      <MenuItem value="G">
                        G
                      </MenuItem>
                      <MenuItem value="KG">
                        KG
                      </MenuItem>
                      <MenuItem value="ML">
                        ML
                      </MenuItem>
                      <MenuItem value="L">
                        L
                      </MenuItem>
                      <MenuItem value="UN">
                        UN
                      </MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Paper>

            <Button
              fullWidth
              variant="contained"
              onClick={salvar}
              sx={{
                minHeight: 50,
                bgcolor: "#0D3768",
                fontWeight: 900,
                fontSize: "0.92rem",
                borderRadius: 1.25,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#092D57",
                  boxShadow: "none",
                },
              }}
            >
              SALVAR INGREDIENTE
            </Button>

            <Button
              fullWidth
              color="error"
              onClick={() => {
                onRemoverIngrediente(
                  ingrediente.id
                );

                onFechar();
              }}
              sx={{
                minHeight: 38,
                fontWeight: 900,
              }}
            >
              REMOVER INGREDIENTE
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

type BlocoIngredientesProps = {
  ingredientes: IngredienteReceita[];
  onAdicionar: () => void;
  onEditar: (id: number) => void;
};

function BlocoIngredientes({
  ingredientes,
  onAdicionar,
  onEditar,
}: BlocoIngredientesProps) {
  const quantidadeLinhas = Math.max(
    4,
    ingredientes.length
  );

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1.25,
        border: "none",
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        boxShadow:
          "0 3px 12px rgba(15,23,42,0.10)",
      }}
    >
      <Box
        sx={{
          minHeight: 46,
          px: 1.1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontWeight: 900,
            color: "#0D3768",
            fontSize: "0.92rem",
          }}
        >
          Ingredientes da Receita
        </Typography>

        <Button
          size="small"
          variant="contained"
          onClick={onAdicionar}
          sx={{
            minHeight: 30,
            px: 1,
            fontSize: "0.7rem",
            fontWeight: 900,
            backgroundColor: "#0D3768",
            whiteSpace: "nowrap",
          }}
        >
          + INGREDIENTE
        </Button>
      </Box>

      <Box
        sx={{
          px: 0.75,
          pb: 0.75,
          display: "grid",
          gap: 0.5,
        }}
      >
        {Array.from({
          length: quantidadeLinhas,
        }).map((_, index) => {
          const ingrediente =
            ingredientes[index];

          if (!ingrediente) {
            return (
              <Box
                key={`vazio-${index}`}
                onClick={onAdicionar}
                sx={{
                  minHeight: 46,
                  px: 1.1,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 1.5,
                  backgroundColor: "#F8FAFC",
                  border:
                    "1px dashed #D7DEE8",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  "&:hover": {
                    backgroundColor:
                      "#F1F5F9",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    color: "#94A3B8",
                    fontWeight: 700,
                  }}
                >
                  Ingrediente {index + 1}
                </Typography>
              </Box>
            );
          }

          return (
            <Box
              key={ingrediente.id}
              onClick={() =>
                onEditar(ingrediente.id)
              }
              sx={{
                minHeight: 46,
                px: 1.1,
                py: 0.65,
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1fr) auto",
                gap: 1,
                alignItems: "center",
                cursor: "pointer",
                borderRadius: 1.5,
                backgroundColor: "#F8FAFC",
                boxSizing: "border-box",
                "&:hover": {
                  backgroundColor:
                    "#F1F5F9",
                },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    minWidth: 0,
                    fontSize: "0.84rem",
                    fontWeight: 800,
                    color: "#1E293B",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {nomeLimpo(
                    ingrediente.identificacao
                  ) ||
                    `Ingrediente ${
                      index + 1
                    }`}
                </Typography>

                {ingrediente.sobra && (
                  <Typography
                    sx={{
                      mt: 0.15,
                      fontSize: "0.7rem",
                      color: "#64748B",
                    }}
                  >
                    Sobra:{" "}
                    {ingrediente.sobra}{" "}
                    {
                      ingrediente.unidadeMedida
                    }
                  </Typography>
                )}
              </Box>

              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 900,
                  color: "#0D3768",
                  whiteSpace: "nowrap",
                  textAlign: "right",
                }}
              >
                {ingrediente.quantidadeUtilizada ||
                  "-"}{" "}
                {ingrediente.unidadeMedida}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

export default function IngredientesReceita({
  ingredientes,
  onAdicionarIngrediente,
  onAdicionarIngredienteCobertura: _onAdicionarIngredienteCobertura,
  onAtualizarIngrediente,
  onRemoverIngrediente,
}: Props) {
  const [
    editandoId,
    setEditandoId,
  ] = useState<number | null>(
    null
  );

  const [
    aguardandoNovo,
    setAguardandoNovo,
  ] = useState(false);

  const [
    idsAntes,
    setIdsAntes,
  ] = useState<number[]>([]);

  useEffect(() => {
    if (!aguardandoNovo) {
      return;
    }

    const novo =
      ingredientes.find(
        (item) =>
          !idsAntes.includes(item.id)
      );

    if (novo) {
      setEditandoId(novo.id);
      setAguardandoNovo(false);
      setIdsAntes([]);
    }
  }, [
    ingredientes,
    aguardandoNovo,
    idsAntes,
  ]);

  function adicionarIngrediente() {
    setIdsAntes(
      ingredientes.map(
        (item) => item.id
      )
    );

    setAguardandoNovo(true);
    onAdicionarIngrediente();
  }

  const ingredienteEditando =
    editandoId === null
      ? undefined
      : ingredientes.find(
          (item) =>
            item.id === editandoId
        );

  return (
    <>
      <BlocoIngredientes
        ingredientes={ingredientes}
        onAdicionar={
          adicionarIngrediente
        }
        onEditar={
          setEditandoId
        }
      />

      {ingredienteEditando && (
        <EditorIngrediente
          ingrediente={
            ingredienteEditando
          }
          onAtualizarIngrediente={
            onAtualizarIngrediente
          }
          onRemoverIngrediente={
            onRemoverIngrediente
          }
          onFechar={() =>
            setEditandoId(null)
          }
        />
      )}
    </>
  );
}