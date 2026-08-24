import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  ListItemText,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { empresaService } from "../../services/empresaService";
import { usuarioService } from "../../services/usuarioService";
import { authService } from "../../services/authService";

import type { Empresa } from "../../models/Empresa";
import type { Usuario } from "../../models/Usuario";

type FormUsuario = {
  nome: string;
  usuario: string;
  senha: string;
  empresaIds: number[];
  situacao: "ATIVO" | "INATIVO";
};

const FORM_INICIAL: FormUsuario = {
  nome: "",
  usuario: "",
  senha: "",
  empresaIds: [],
  situacao: "ATIVO",
};

export default function Usuarios() {
  const [usuarios, setUsuarios] =
    useState<Usuario[]>([]);

  const [empresas, setEmpresas] =
    useState<Empresa[]>([]);

  const [form, setForm] =
    useState<FormUsuario>(
      FORM_INICIAL
    );

  const [
    usuarioEdicaoId,
    setUsuarioEdicaoId,
  ] =
    useState<number | null>(
      null
    );

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [salvando, setSalvando] =
    useState(false);

  useEffect(() => {
    void carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [
        listaEmpresas,
        listaUsuarios,
      ] =
        await Promise.all([
          empresaService.listar(),
          usuarioService.listar(),
        ]);

      setEmpresas(
        listaEmpresas.filter(
          (empresa) =>
            empresa.situacao ===
            "ATIVA"
        )
      );

      setUsuarios(
        listaUsuarios
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os usuários."
      );
    }
  }

  function atualizarCampo(
    campo:
      | "nome"
      | "usuario"
      | "senha"
      | "situacao",
    valor: string
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));

    setErro("");
    setSucesso("");
  }

  function atualizarEmpresas(
    valores: number[]
  ) {
    setForm((atual) => ({
      ...atual,
      empresaIds: valores,
    }));

    setErro("");
    setSucesso("");
  }

  function limparFormulario() {
    setForm(FORM_INICIAL);
    setUsuarioEdicaoId(null);
  }

  function validar():
    | string
    | null {
    if (!form.nome.trim()) {
      return "Informe o nome.";
    }

    if (!form.usuario.trim()) {
      return "Informe o usuário.";
    }

    if (!form.senha.trim()) {
      return "Informe a senha.";
    }

    if (
      form.empresaIds.length ===
      0
    ) {
      return "Selecione pelo menos uma empresa.";
    }

    return null;
  }

  async function salvarUsuario() {
    setErro("");
    setSucesso("");

    const usuarioLogado =
      authService.getUsuarioLogado();

    if (
      !usuarioLogado ||
      usuarioLogado.perfil !==
        "ADMINISTRADOR"
    ) {
      setErro(
        "Sessão do administrador não encontrada."
      );

      return;
    }

    const erroValidacao =
      validar();

    if (erroValidacao) {
      setErro(
        erroValidacao
      );

      return;
    }

    const dados = {
      nome:
        form.nome.trim(),

      usuario:
        form.usuario.trim(),

      senha:
        form.senha,

      empresaId:
        form.empresaIds[0],

      empresaIds:
        form.empresaIds,

      situacao:
        form.situacao,

      perfil:
        "COLETOR" as const,
    };

    setSalvando(true);

    try {
      if (usuarioEdicaoId) {
        await usuarioService.atualizar(
          usuarioEdicaoId,
          dados
        );

        setSucesso(
          "Usuário atualizado com sucesso."
        );
      } else {
        await usuarioService.cadastrar(
          dados
        );

        setSucesso(
          "Usuário cadastrado com sucesso."
        );
      }

      authService.salvarUsuario(
        usuarioLogado
      );

      limparFormulario();

      setUsuarios(
        await usuarioService.listar()
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o usuário."
      );
    } finally {
      setSalvando(false);
    }
  }

  function editarUsuario(
    usuario: Usuario
  ) {
    setUsuarioEdicaoId(
      usuario.id
    );

    setForm({
      nome:
        usuario.nome,

      usuario:
        usuario.usuario,

      senha:
        usuario.senha,

      empresaIds:
        usuario.empresaIds
          ?.length
          ? usuario.empresaIds
          : usuario.empresaId
            ? [
                usuario.empresaId,
              ]
            : [],

      situacao:
        usuario.situacao,
    });

    setErro("");
    setSucesso("");
  }

  function nomesEmpresas(
    usuario: Usuario
  ) {
    const ids =
      usuario.empresaIds
        ?.length
        ? usuario.empresaIds
        : usuario.empresaId
          ? [
              usuario.empresaId,
            ]
          : [];

    const nomes =
      ids
        .map((empresaId) => {
          const empresa =
            empresas.find(
              (item) =>
                item.id ===
                empresaId
            );

          return (
            empresa
              ?.nomeFantasia ||
            empresa
              ?.razaoSocial ||
            ""
          );
        })
        .filter(Boolean);

    return (
      nomes.join(", ") ||
      "Empresa não encontrada"
    );
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
        Usuários
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
          {usuarioEdicaoId
            ? "Editar usuário"
            : "Cadastrar usuário"}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md:
                "repeat(2, 1fr)",
            },
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            label="Nome"
            value={form.nome}
            onChange={(event) =>
              atualizarCampo(
                "nome",
                event.target.value
              )
            }
          />

          <TextField
            fullWidth
            label="Usuário"
            value={form.usuario}
            onChange={(event) =>
              atualizarCampo(
                "usuario",
                event.target.value
              )
            }
          />

          <TextField
            fullWidth
            type="password"
            label="Senha"
            value={form.senha}
            onChange={(event) =>
              atualizarCampo(
                "senha",
                event.target.value
              )
            }
          />

          <TextField
            select
            fullWidth
            label="Empresas"
            value={form.empresaIds}
            slotProps={{
              select: {
                multiple: true,

                renderValue: (
                  selecionadas:
                    unknown
                ) => {
                  const ids =
                    selecionadas as number[];

                  return ids
                    .map((id) => {
                      const empresa =
                        empresas.find(
                          (item) =>
                            item.id ===
                            id
                        );

                      return (
                        empresa
                          ?.nomeFantasia ||
                        empresa
                          ?.razaoSocial ||
                        ""
                      );
                    })
                    .filter(Boolean)
                    .join(", ");
                },
              },
            }}
            onChange={(event) => {
              const valor =
                event.target.value;

              const ids =
                Array.isArray(
                  valor
                )
                  ? valor.map(
                      Number
                    )
                  : String(
                      valor
                    )
                      .split(",")
                      .map(Number);

              atualizarEmpresas(
                ids
              );
            }}
          >
            {empresas.map(
              (empresa) => (
                <MenuItem
                  key={
                    empresa.id
                  }
                  value={
                    empresa.id
                  }
                >
                  <Checkbox
                    checked={
                      form
                        .empresaIds
                        .includes(
                          empresa.id
                        )
                    }
                  />

                  <ListItemText
                    primary={
                      empresa
                        .nomeFantasia ||
                      empresa
                        .razaoSocial
                    }
                  />
                </MenuItem>
              )
            )}
          </TextField>

          <TextField
            select
            fullWidth
            label="Situação"
            value={
              form.situacao
            }
            onChange={(event) =>
              atualizarCampo(
                "situacao",
                event.target.value
              )
            }
          >
            <MenuItem
              value="ATIVO"
            >
              Ativo
            </MenuItem>

            <MenuItem
              value="INATIVO"
            >
              Inativo
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
          }}
        >
          <Button
            variant="contained"
            disabled={salvando}
            onClick={() =>
              void salvarUsuario()
            }
          >
            {salvando
              ? "Salvando..."
              : usuarioEdicaoId
                ? "Salvar alterações"
                : "Cadastrar usuário"}
          </Button>

          {usuarioEdicaoId && (
            <Button
              variant="outlined"
              disabled={salvando}
              onClick={
                limparFormulario
              }
            >
              Cancelar
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
          Usuários cadastrados
        </Typography>

        {usuarios.length ===
        0 ? (
          <Typography
            color="text.secondary"
          >
            Nenhum usuário cadastrado.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 2,
            }}
          >
            {usuarios.map(
              (usuario) => (
                <Paper
                  key={
                    usuario.id
                  }
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Typography
                    sx={{
                      fontWeight:
                        700,
                    }}
                  >
                    {usuario.nome}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Usuário:{" "}
                    {
                      usuario.usuario
                    }
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Empresas:{" "}
                    {nomesEmpresas(
                      usuario
                    )}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Situação:{" "}
                    {
                      usuario.situacao
                    }
                  </Typography>

                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      mt: 2,
                    }}
                    onClick={() =>
                      editarUsuario(
                        usuario
                      )
                    }
                  >
                    Editar
                  </Button>
                </Paper>
              )
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}