import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import * as XLSX from "xlsx";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { produtoService } from "../../services/produtoService";
import { maquinaService } from "../../services/maquinaService";
import { colaboradorService } from "../../services/colaboradorService";
import { embalagemService } from "../../services/embalagemService";
import { empresaService } from "../../services/empresaService";

import type { Produto } from "../../models/Produto";
import type { Maquina } from "../../models/Maquina";
import type { Colaborador } from "../../models/Colaborador";
import type { Embalagem } from "../../models/Embalagem";
import type { Empresa } from "../../models/Empresa";

type ResumoImportacao = {
  produtos: number;
  maquinas: number;
  colaboradores: number;
  embalagens: number;
};

function normalizarTexto(
  valor: string
): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function buscarPlanilha(
  workbook: XLSX.WorkBook,
  nomesAceitos: string[]
): XLSX.WorkSheet | null {
  const nomesNormalizados =
    nomesAceitos.map(normalizarTexto);

  const nomeEncontrado =
    workbook.SheetNames.find(
      (nome) =>
        nomesNormalizados.includes(
          normalizarTexto(nome)
        )
    );

  if (!nomeEncontrado) {
    return null;
  }

  return workbook.Sheets[nomeEncontrado];
}

function converterLinhas(
  planilha: XLSX.WorkSheet | null
): Record<string, unknown>[] {
  if (!planilha) {
    return [];
  }

  return XLSX.utils.sheet_to_json<
    Record<string, unknown>
  >(planilha, {
    raw: false,
    defval: "",
  });
}

function obterValor(
  linha: Record<string, unknown>,
  nomesAceitos: string[]
): string {
  const entradas =
    Object.entries(linha);

  for (
    const nomeAceito of nomesAceitos
  ) {
    const nomeNormalizado =
      normalizarTexto(nomeAceito);

    const entradaEncontrada =
      entradas.find(
        ([chave]) =>
          normalizarTexto(chave) ===
          nomeNormalizado
      );

    if (entradaEncontrada) {
      return String(
        entradaEncontrada[1] ?? ""
      ).trim();
    }
  }

  return "";
}

function converterNumero(
  valor: string
): number {
  const valorNormalizado = valor
    .trim()
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const numero =
    Number(valorNormalizado);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

export default function ImportacaoProdutos() {
  const [empresas, setEmpresas] =
    useState<Empresa[]>([]);

  const [empresaId, setEmpresaId] =
    useState<number | "">("");

  const [importando, setImportando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [resumo, setResumo] =
    useState<ResumoImportacao | null>(
      null
    );

  async function carregarResumoEmpresa(
    idEmpresa: number
  ) {
    if (
      !Number.isFinite(idEmpresa) ||
      idEmpresa <= 0
    ) {
      setResumo(null);
      return;
    }

    try {
      const [
        produtos,
        maquinas,
        colaboradores,
        embalagens,
      ] = await Promise.all([
        produtoService.listar(),
        maquinaService.listar(),
        colaboradorService.listar(
          idEmpresa
        ),
        embalagemService.listar(),
      ]);

      const produtosEmpresa =
        produtos.filter(
          (produto) =>
            Number(produto.empresaId) ===
            idEmpresa
        );

      setResumo({
        produtos: produtosEmpresa.length,
        maquinas: maquinas.length,
        colaboradores: colaboradores.length,
        embalagens: embalagens.length,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar resumo dos cadastros:",
        error
      );

      setResumo(null);
    }
  }

  useEffect(() => {
    async function carregarEmpresas() {
      try {
        const lista =
          await empresaService.listar();

        setEmpresas(
          lista.filter(
            (empresa) =>
              empresa.situacao ===
              "ATIVA"
          )
        );
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

    carregarEmpresas();
  }, []);

  async function importarArquivo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    if (!empresaId) {
      setErro(
        "Selecione a empresa antes de importar a planilha."
      );

      event.target.value = "";
      return;
    }

    const empresaSelecionada =
      empresas.find(
        (empresa) =>
          empresa.id === empresaId
      );

    if (!empresaSelecionada) {
      setErro(
        "Empresa selecionada não encontrada."
      );

      event.target.value = "";
      return;
    }

    setImportando(true);
    setErro("");
    setResumo(null);

    try {
      const dados =
        await arquivo.arrayBuffer();

      const workbook =
        XLSX.read(dados, {
          type: "array",
        });

      const planilhaProdutos =
        buscarPlanilha(workbook, [
          "Produtos",
          "Produto",
        ]);

      const planilhaMaquinas =
        buscarPlanilha(workbook, [
          "Máquinas",
          "Maquinas",
          "Equipamentos",
          "Máquinas e Equipamentos",
          "Maquinas e Equipamentos",
        ]);

      const planilhaColaboradores =
        buscarPlanilha(workbook, [
          "Colaboradores",
          "Colaborador",
          "Pessoas",
        ]);

      const planilhaEmbalagens =
        buscarPlanilha(workbook, [
          "Embalagens",
          "Embalagem",
        ]);

      if (!planilhaProdutos) {
        throw new Error(
          "A aba Produtos não foi encontrada."
        );
      }

      

      const linhasProdutos =
        converterLinhas(
          planilhaProdutos
        );

      const linhasMaquinas =
        converterLinhas(
          planilhaMaquinas
        );

      const linhasColaboradores =
        converterLinhas(
          planilhaColaboradores
        );

      const linhasEmbalagens =
        converterLinhas(
          planilhaEmbalagens
        );

      const produtos: Produto[] =
  linhasProdutos
    .map((linha, index) => ({
      id: Date.now() + index,

      empresaId:
        Number(empresaId),

      codigo: obterValor(
        linha,
        [
          "Código",
          "Codigo",
        ]
      ),

      codigoBarras: obterValor(
        linha,
        [
          "Código de Barras",
        ]
      ),

      descricao: obterValor(
        linha,
        [
          "Descrição",
          "Descricao",
          "Produto",
        ]
      ),

      gramatura: obterValor(
        linha,
        ["Gramatura"]
      ),

      unidade:
        obterValor(
          linha,
          [
            "Unidade",
            "UN",
          ]
        ),

      departamento:
        obterValor(
          linha,
          ["Departamento"]
        ),

      secao:
        obterValor(
          linha,
          [
            "Seção",
            "Secao",
          ]
        ),
    }))
    .filter(
      (produto) =>
        produto.codigo !== "" ||
        produto.descricao !== ""
    );

      const maquinas: Maquina[] =
        linhasMaquinas
          .map((linha, index) => ({
            id: index + 1,

            codigo: obterValor(
              linha,
              [
                "Código",
                "Codigo",
              ]
            ),

            descricao: obterValor(
              linha,
              [
                "Equipamento",
                "Descrição",
                "Descricao",
                "Máquina",
                "Maquina",
              ]
            ),

            tipo: obterValor(
              linha,
              ["Tipo"]
            ),

            setor: obterValor(
              linha,
              ["Setor"]
            ),
          }))
          .filter(
            (maquina) =>
              maquina.codigo !== "" ||
              maquina.descricao !== ""
          );

      const colaboradores:
        Colaborador[] =
        linhasColaboradores
          .map((linha, index) => ({
            id: index + 1,

            matricula:
              obterValor(
                linha,
                [
                  "Matrícula",
                  "Matricula",
                ]
              ),

            nome: obterValor(
              linha,
              ["Nome"]
            ),

            cargo: obterValor(
              linha,
              ["Cargo"]
            ),

            setor: obterValor(
              linha,
              ["Setor"]
            ),

            empresa:
              empresaSelecionada.nomeFantasia ||
              empresaSelecionada.razaoSocial,

            loja: obterValor(
              linha,
              ["Loja"]
            ),

            turno: obterValor(
              linha,
              ["Turno"]
            ),

            situacao:
              obterValor(
                linha,
                [
                  "Situação",
                  "Situacao",
                ]
              ),
          }))
          .filter(
            (colaborador) =>
              colaborador.matricula !==
                "" ||
              colaborador.nome !== ""
          );

      const embalagens:
        Embalagem[] =
        linhasEmbalagens
          .map((linha, index) => ({
            id: index + 1,

            codigo: obterValor(
              linha,
              [
                "Código",
                "Codigo",
              ]
            ),

            descricao:
              obterValor(
                linha,
                [
                  "Descrição da Embalagem",
                  "Descricao da Embalagem",
                  "Descrição",
                  "Descricao",
                ]
              ),

            categoria:
              obterValor(
                linha,
                ["Categoria"]
              ),

            unidade:
              obterValor(
                linha,
                ["Unidade"]
              ),

            capacidade:
              obterValor(
                linha,
                ["Capacidade"]
              ),

            pesoEmbalagem:
              converterNumero(
                obterValor(
                  linha,
                  [
                    "Peso da Embalagem (g)",
                    "Peso Embalagem (g)",
                    "Peso da Embalagem",
                    "Peso Embalagem",
                  ]
                )
              ),
          }))
          .filter(
            (embalagem) =>
              embalagem.codigo !== "" ||
              embalagem.descricao !== ""
          );

      await produtoService.importar(
  produtos
);

const produtosGravados =
  await produtoService.listar();

const produtosDaEmpresa =
  produtosGravados.filter(
    (produto) =>
      produto.empresaId ===
      Number(empresaId)
  );

console.log(
  "PRODUTOS LIDOS:",
  produtos.length
);

console.log(
  "PRODUTOS GRAVADOS:",
  produtosDaEmpresa.length
);
console.log(
  "TOTAL NO BANCO:",
  produtosGravados.length
);

console.log(
  "EMPRESA SELECIONADA:",
  Number(empresaId)
);

console.log(
  "EMPRESA PRIMEIRO PRODUTO:",
  produtosGravados[0]?.empresaId
);

console.log(
  "EMPRESA ÚLTIMO PRODUTO:",
  produtosGravados[
    produtosGravados.length - 1
  ]?.empresaId
);
console.log(
  "AMOSTRA:",
  produtosDaEmpresa.slice(0, 5)
);

await maquinaService.importar(
  maquinas
);

      await colaboradorService.importar(
        Number(empresaId),
        colaboradores
      );

      await embalagemService.importar(
        embalagens
      );

      setResumo({
        produtos:
          produtos.length,
        maquinas:
          maquinas.length,
        colaboradores:
          colaboradores.length,
        embalagens:
          embalagens.length,
      });
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível importar a planilha."
      );
    } finally {
      setImportando(false);
      event.target.value = "";
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
        Importação de Cadastros
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography
          sx={{
            fontWeight: 700,
            mb: 1,
          }}
        >
          Empresa
        </Typography>

        <TextField
          select
          fullWidth
          label="Selecione a empresa"
          value={empresaId}
          onChange={(event) => {
            const valor =
              event.target.value;

            const novaEmpresaId =
              valor === ""
                ? ""
                : Number(valor);

            setEmpresaId(novaEmpresaId);
            setErro("");

            if (novaEmpresaId === "") {
              setResumo(null);
              return;
            }

            void carregarResumoEmpresa(
              novaEmpresaId
            );
          }}
          sx={{
            maxWidth: 600,
            mb: 3,
          }}
        >
          {empresas.length === 0 && (
            <MenuItem
              value=""
              disabled
            >
              Nenhuma empresa ativa cadastrada
            </MenuItem>
          )}

          {empresas.map(
            (empresa) => (
              <MenuItem
                key={empresa.id}
                value={empresa.id}
              >
                {empresa.nomeFantasia ||
                  empresa.razaoSocial}
              </MenuItem>
            )
          )}
        </TextField>

        <Box>
          <Button
            variant="contained"
            component="label"
            disabled={
              importando ||
              !empresaId
            }
          >
            {importando
              ? "Importando..."
              : "Selecionar planilha"}

            <input
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={
                importarArquivo
              }
            />
          </Button>
        </Box>

        {!empresaId &&
          empresas.length > 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1.5 }}
            >
              Selecione a empresa antes de importar o arquivo.
            </Typography>
          )}

        {importando && (
          <Box
            sx={{
              mt: 3,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CircularProgress
              size={24}
            />

            <Typography>
              Importando os cadastros...
            </Typography>
          </Box>
        )}

        {erro && (
          <Alert
            severity="error"
            sx={{ mt: 3 }}
          >
            {erro}
          </Alert>
        )}

        {resumo && (
          <Alert
            severity="success"
            sx={{ mt: 3 }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              Importação concluída
            </Typography>

            <Typography>
              Produtos:{" "}
              {resumo.produtos}
            </Typography>

            <Typography>
              Máquinas/Equipamentos:{" "}
              {resumo.maquinas}
            </Typography>

            <Typography>
              Colaboradores:{" "}
              {resumo.colaboradores}
            </Typography>

            <Typography>
              Embalagens:{" "}
              {resumo.embalagens}
            </Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  );
}