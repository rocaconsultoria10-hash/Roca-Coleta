import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { ChangeEvent } from "react";
import type { FotoReceita } from "../../models/Receita";

type CategoriaFoto =
  | "INGREDIENTES_PREPARACAO"
  | "PRODUTO_FINAL";

type Props = {
  fotos: FotoReceita[];
  onChange: (fotos: FotoReceita[]) => void;
};

const LIMITE_FOTOS_POR_CATEGORIA = 4;

export default function FotosReceita({
  fotos,
  onChange,
}: Props) {
  function fotosDaCategoria(
    categoria: CategoriaFoto
  ) {
    return fotos.filter(
      (foto) => foto.categoria === categoria
    );
  }

  async function adicionarFotos(
    categoria: CategoriaFoto,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivos = Array.from(
      event.target.files || []
    );

    if (arquivos.length === 0) {
      return;
    }

    const fotosExistentes =
      fotosDaCategoria(categoria);

    const quantidadeDisponivel =
      LIMITE_FOTOS_POR_CATEGORIA -
      fotosExistentes.length;

    if (quantidadeDisponivel <= 0) {
      alert(
        "Limite de 4 fotos atingido para esta categoria."
      );

      event.target.value = "";
      return;
    }

    const arquivosSelecionados =
      arquivos.slice(
        0,
        quantidadeDisponivel
      );

    const novasFotos: FotoReceita[] =
      await Promise.all(
        arquivosSelecionados.map(
          (arquivo, index) =>
            new Promise<FotoReceita>(
              (resolve, reject) => {
                const leitor =
                  new FileReader();

                leitor.onload = () => {
                  resolve({
                    id: Date.now() + index,
                    categoria,
                    nome: arquivo.name,
                    tipo: arquivo.type,
                    tamanho: arquivo.size,
                    legenda: "",
                    preview: String(
                      leitor.result
                    ),
                  });
                };

                leitor.onerror = () => {
                  reject(
                    new Error(
                      "Não foi possível carregar a foto."
                    )
                  );
                };

                leitor.readAsDataURL(
                  arquivo
                );
              }
            )
        )
      );

    onChange([
      ...fotos,
      ...novasFotos,
    ]);

    event.target.value = "";
  }

  function atualizarLegenda(
    id: number,
    legenda: string
  ) {
    onChange(
      fotos.map((foto) =>
        foto.id === id
          ? {
              ...foto,
              legenda,
            }
          : foto
      )
    );
  }

  function removerFoto(id: number) {
    const fotoRemovida =
      fotos.find(
        (foto) => foto.id === id
      );

    if (
      fotoRemovida?.preview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        fotoRemovida.preview
      );
    }

    onChange(
      fotos.filter(
        (foto) => foto.id !== id
      )
    );
  }

  function renderizarCategoria(
    titulo: string,
    descricao: string,
    categoria: CategoriaFoto
  ) {
    const fotosCategoria =
      fotosDaCategoria(categoria);

    const limiteAtingido =
      fotosCategoria.length >=
      LIMITE_FOTOS_POR_CATEGORIA;

    return (
      <Box
        sx={{
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
            mb: 0.5,
            color: "text.primary",
          }}
        >
          {titulo}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1.5 }}
        >
          {descricao}
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button
            component="label"
            variant="contained"
            disabled={limiteAtingido}
          >
            Tirar foto

            <input
              hidden
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) =>
                adicionarFotos(
                  categoria,
                  event
                )
              }
            />
          </Button>

          <Button
            component="label"
            variant="outlined"
            disabled={limiteAtingido}
          >
            Escolher da galeria

            <input
              hidden
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                adicionarFotos(
                  categoria,
                  event
                )
              }
            />
          </Button>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 1,
          }}
        >
          {fotosCategoria.length} de{" "}
          {LIMITE_FOTOS_POR_CATEGORIA} fotos
        </Typography>

        {fotosCategoria.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.5,
              mt: 2,
            }}
          >
            {fotosCategoria.map(
              (foto) => (
                <Card
                  key={foto.id}
                  variant="outlined"
                  sx={{
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={foto.preview}
                      alt={
                        foto.legenda ||
                        foto.nome
                      }
                      sx={{
                        height: {
                          xs: 200,
                          sm: 180,
                        },
                        objectFit: "cover",
                      }}
                    />

                    <IconButton
                      size="small"
                      aria-label="Remover foto"
                      onClick={() =>
                        removerFoto(
                          foto.id
                        )
                      }
                      sx={{
                        position:
                          "absolute",
                        top: 8,
                        right: 8,
                        bgcolor:
                          "background.paper",
                        border: "1px solid",
                        borderColor:
                          "divider",
                        boxShadow:
                          "0 2px 6px rgba(15,35,60,0.10)",

                        "&:hover": {
                          bgcolor:
                            "background.paper",
                        },
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          fontSize: "1rem",
                          lineHeight: 1,
                          fontWeight: 700,
                        }}
                      >
                        ×
                      </Typography>
                    </IconButton>
                  </Box>

                  <CardContent
                    sx={{
                      p: 1.25,

                      "&:last-child": {
                        pb: 1.25,
                      },
                    }}
                  >
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Descrição da foto"
                      placeholder="Descreva o que esta foto representa na produção"
                      value={
                        foto.legenda
                      }
                      onChange={(event) =>
                        atualizarLegenda(
                          foto.id,
                          event.target.value
                        )
                      }
                    />
                  </CardContent>
                </Card>
              )
            )}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mt: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 0.5,
          color: "text.primary",
        }}
      >
        Fotos da ficha técnica
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 2,
        }}
      >
        Registre imagens da preparação e
        do produto final. É possível
        adicionar até 4 fotos em cada
        categoria.
      </Typography>

      <Stack spacing={1.5}>
        {renderizarCategoria(
          "Ingredientes / Preparação",
          "Ingredientes, pesagens, mistura, montagem ou etapas importantes da produção.",
          "INGREDIENTES_PREPARACAO"
        )}

        {renderizarCategoria(
          "Produto final",
          "Produto pronto, acabamento, apresentação ou embalagem final.",
          "PRODUTO_FINAL"
        )}
      </Stack>
    </Box>
  );
}