import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { empresaService } from "../../services/empresaService";
import type { Empresa } from "../../models/Empresa";

type FormEmpresa = {
  razaoSocial: string;
  nomeFantasia: string;
  email: string;
  situacao: "ATIVA" | "INATIVA";
};

const FORM_INICIAL: FormEmpresa = {
  razaoSocial: "",
  nomeFantasia: "",
  email: "",
  situacao: "ATIVA",
};

export default function Empresas() {
  const [empresas, setEmpresas] =
    useState<Empresa[]>([]);

  const [form, setForm] =
    useState<FormEmpresa>(
      FORM_INICIAL
    );

  const [empresaEdicaoId, setEmpresaEdicaoId] =
    useState<number | null>(null);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  useEffect(() => {
    carregarEmpresas();
  }, []);

  async function carregarEmpresas() {
    try {
      const lista =
        await empresaService.listar();

      setEmpresas(lista);
    } catch (error) {
      console.error(
        "Erro ao carregar empresas:",
        error
      );

      setErro(
        "Não foi possível carregar as empresas."
      );
    }
  }

  function atualizarCampo(
    campo: keyof FormEmpresa,
    valor: string
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));

    setErro("");
    setSucesso("");
  }

  function limparFormulario() {
    setForm(FORM_INICIAL);
    setEmpresaEdicaoId(null);
  }

  function validar(): string | null {
    if (!form.razaoSocial.trim()) {
      return "Informe a razão social.";
    }

    if (!form.nomeFantasia.trim()) {
      return "Informe o nome fantasia.";
    }

    return null;
  }

  async function salvarEmpresa() {
    setErro("");
    setSucesso("");

    const erroValidacao =
      validar();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    try {
      if (empresaEdicaoId) {
        await empresaService.atualizar(
          empresaEdicaoId,
          {
            razaoSocial:
              form.razaoSocial.trim(),
            nomeFantasia:
              form.nomeFantasia.trim(),
            email:
              form.email.trim(),
            situacao:
              form.situacao,
          }
        );

        setSucesso(
          "Empresa atualizada com sucesso."
        );
      } else {
        await empresaService.cadastrar(
          {
            razaoSocial:
              form.razaoSocial.trim(),
            nomeFantasia:
              form.nomeFantasia.trim(),
            email:
              form.email.trim(),
            situacao:
              form.situacao,
          }
        );

        setSucesso(
          "Empresa cadastrada com sucesso."
        );
      }

      limparFormulario();
      await carregarEmpresas();
    } catch (error) {
      console.error(
        "Erro ao salvar empresa:",
        error
      );

      setErro(
        "Não foi possível salvar a empresa."
      );
    }
  }

  function editarEmpresa(
    empresa: Empresa
  ) {
    setEmpresaEdicaoId(
      empresa.id
    );

    setForm({
      razaoSocial:
        empresa.razaoSocial,
      nomeFantasia:
        empresa.nomeFantasia,
      email:
        empresa.email,
      situacao:
        empresa.situacao,
    });

    setErro("");
    setSucesso("");
  }

  async function alterarSituacao(
    empresa: Empresa
  ) {
    try {
      const novaSituacao =
        empresa.situacao === "ATIVA"
          ? "INATIVA"
          : "ATIVA";

      await empresaService.alterarSituacao(
        empresa.id,
        novaSituacao
      );

      await carregarEmpresas();
    } catch (error) {
      console.error(
        "Erro ao alterar situação da empresa:",
        error
      );

      setErro(
        "Não foi possível alterar a situação da empresa."
      );
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 3,
        }}
      >
        Empresas
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          mb: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 2,
          }}
        >
          {empresaEdicaoId
            ? "Editar empresa"
            : "Cadastrar empresa"}
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
            fullWidth
            label="Razão social"
            value={form.razaoSocial}
            onChange={(event) =>
              atualizarCampo(
                "razaoSocial",
                event.target.value
              )
            }
          />

          <TextField
            fullWidth
            label="Nome fantasia"
            value={form.nomeFantasia}
            onChange={(event) =>
              atualizarCampo(
                "nomeFantasia",
                event.target.value
              )
            }
          />

          <TextField
            fullWidth
            label="E-mail"
            value={form.email}
            onChange={(event) =>
              atualizarCampo(
                "email",
                event.target.value
              )
            }
          />

          <TextField
            select
            fullWidth
            label="Situação"
            value={form.situacao}
            onChange={(event) =>
              atualizarCampo(
                "situacao",
                event.target.value
              )
            }
          >
            <MenuItem value="ATIVA">
              Ativa
            </MenuItem>

            <MenuItem value="INATIVA">
              Inativa
            </MenuItem>
          </TextField>
        </Box>

        {erro && (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
          >
            {erro}
          </Alert>
        )}

        {sucesso && (
          <Alert
            severity="success"
            sx={{ mt: 2 }}
          >
            {sucesso}
          </Alert>
        )}

        <Box
          sx={{
            mt: 3,
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            onClick={
              salvarEmpresa
            }
          >
            {empresaEdicaoId
              ? "Salvar alterações"
              : "Cadastrar empresa"}
          </Button>

          {empresaEdicaoId && (
            <Button
              variant="outlined"
              onClick={
                limparFormulario
              }
            >
              Cancelar edição
            </Button>
          )}
        </Box>
      </Paper>

      <Paper
        variant="outlined"
        sx={{ p: 3 }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 2,
          }}
        >
          Empresas cadastradas
        </Typography>

        {empresas.length === 0 ? (
          <Typography
            color="text.secondary"
          >
            Nenhuma empresa cadastrada.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 2,
            }}
          >
            {empresas.map(
              (empresa) => (
                <Paper
                  key={empresa.id}
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
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
                        sx={{
                          fontWeight: 700,
                        }}
                      >
                        {
                          empresa.nomeFantasia
                        }
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {
                          empresa.razaoSocial
                        }
                      </Typography>

                      {empresa.email && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          E-mail:{" "}
                          {empresa.email}
                        </Typography>
                      )}

                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          fontWeight: 600,
                        }}
                      >
                        Situação:{" "}
                        {
                          empresa.situacao
                        }
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        variant="outlined"
                        onClick={() =>
                          editarEmpresa(
                            empresa
                          )
                        }
                      >
                        Editar
                      </Button>

                      <Button
                        variant="outlined"
                        color={
                          empresa.situacao ===
                          "ATIVA"
                            ? "error"
                            : "success"
                        }
                        onClick={() =>
                          alterarSituacao(
                            empresa
                          )
                        }
                      >
                        {empresa.situacao ===
                        "ATIVA"
                          ? "Inativar"
                          : "Ativar"}
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              )
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}