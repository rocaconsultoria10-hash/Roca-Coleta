import type { Usuario } from "../models/Usuario";
import { apiUrl } from "./apiConfig";

const CHAVE_USUARIOS =
  "roca-coleta-usuarios";

type RespostaApi<T> = {
  sucesso?: boolean;
  dados?: T;
  erro?: string;
};

function carregarUsuariosLocais(): Usuario[] {
  try {
    const dados =
      localStorage.getItem(
        CHAVE_USUARIOS
      );

    if (!dados) {
      return [];
    }

    return JSON.parse(
      dados
    ) as Usuario[];
  } catch {
    return [];
  }
}

async function lerResposta<T>(
  resposta: Response
): Promise<T> {
  const dados =
    (await resposta.json()) as RespostaApi<T>;

  if (!resposta.ok) {
    throw new Error(
      dados.erro ||
        "Erro ao acessar o servidor."
    );
  }

  return dados.dados as T;
}

async function migrarUsuariosLocais(
  usuariosServidor: Usuario[]
): Promise<Usuario[]> {
  const usuariosLocais =
    carregarUsuariosLocais();

  if (usuariosLocais.length === 0) {
    return usuariosServidor;
  }

  const nomesServidor =
    new Set(
      usuariosServidor.map(
        (item) =>
          item.usuario
            .trim()
            .toLowerCase()
      )
    );

  let houveMigracao = false;

  for (const usuario of usuariosLocais) {
    const chave =
      usuario.usuario
        .trim()
        .toLowerCase();

    if (
      !chave ||
      nomesServidor.has(chave)
    ) {
      continue;
    }

    try {
      const resposta =
        await fetch(apiUrl("/api/usuarios"),
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              nome: usuario.nome,
              usuario:
                usuario.usuario,
              senha: usuario.senha,
              perfil:
                usuario.perfil,
              empresaId:
                usuario.empresaId,
              empresaIds:
                usuario.empresaIds?.length
                  ? usuario.empresaIds
                  : usuario.empresaId
                    ? [
                        usuario.empresaId,
                      ]
                    : [],
              situacao:
                usuario.situacao,
            }),
          }
        );

      if (resposta.ok) {
        houveMigracao = true;
        nomesServidor.add(chave);
      }
    } catch {
      // Se o servidor estiver indisponível,
      // a listagem normal abaixo exibirá o erro.
    }
  }

  if (!houveMigracao) {
    return usuariosServidor;
  }

  const respostaAtualizada =
    await fetch(apiUrl("/api/usuarios"));

  return lerResposta<Usuario[]>(
    respostaAtualizada
  );
}

export const usuarioService = {
  async listar(): Promise<Usuario[]> {
    const resposta =
      await fetch(apiUrl("/api/usuarios"));

    const usuariosServidor =
      await lerResposta<Usuario[]>(
        resposta
      );

    return migrarUsuariosLocais(
      usuariosServidor
    );
  },

  async cadastrar(
    usuario: Omit<Usuario, "id">
  ): Promise<Usuario> {
    const resposta =
      await fetch(apiUrl("/api/usuarios"),
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            usuario
          ),
        }
      );

    return lerResposta<Usuario>(
      resposta
    );
  },

  async atualizar(
    id: number,
    dados: Omit<Usuario, "id">
  ): Promise<Usuario> {
    const resposta =
      await fetch(apiUrl(`/api/usuarios/${id}`),
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            dados
          ),
        }
      );

    return lerResposta<Usuario>(
      resposta
    );
  },

  async login(
    usuario: string,
    senha: string
  ): Promise<Usuario> {
    const resposta =
      await fetch(apiUrl("/api/login"),
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            usuario,
            senha,
          }),
        }
      );

    return lerResposta<Usuario>(
      resposta
    );
  },
};