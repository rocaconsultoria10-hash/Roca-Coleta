import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Box } from "@mui/material";

import BarraSecoesReceita from "./BarraSecoesReceita";
import BuscaProduto from "./BuscaProduto";

import { produtoService } from "../../services/produtoService";
import { authService } from "../../services/authService";

import type { Produto } from "../../models/Produto";

type Props = {
  busca: string;
  produtoSelecionado: Produto | null;
  onChangeBusca: (valor: string) => void;
  onSelecionarProduto: (produto: Produto) => void;
};

function normalizarTexto(valor: string): string {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export default function SeletorProdutoReceita({
  busca,
  produtoSelecionado,
  onChangeBusca,
  onSelecionarProduto,
}: Props) {
  const [secoes, setSecoes] = useState<string[]>([]);
  const [secaoSelecionada, setSecaoSelecionada] = useState("");
  const [produtosProducao, setProdutosProducao] = useState<Produto[]>([]);

  useEffect(() => {
    async function carregarDados() {
      const empresaAtivaId =
        authService.getEmpresaAtivaId() ??
        authService.getUsuarioLogado()?.empresaId ??
        0;

      if (empresaAtivaId <= 0) {
        setProdutosProducao([]);
        setSecoes([]);
        return;
      }

      const produtos =
        await produtoService.listarProducaoPadariaPorEmpresa(
          empresaAtivaId
        );

      const produtosPadaria = produtos.filter(
        (produto) =>
          Number(produto.empresaId) === Number(empresaAtivaId) &&
          normalizarTexto(produto.departamento) === "PRODUCAO PADARIA"
      );

      const secoesEncontradas = Array.from(
        new Set(
          produtosPadaria
            .map((produto) => String(produto.secao || "").trim())
            .filter((secao) => secao.length > 0)
        )
      ).sort((a, b) => a.localeCompare(b, "pt-BR"));

      setProdutosProducao(produtosPadaria);
      setSecoes(secoesEncontradas);

      setSecaoSelecionada((secaoAtual) => {
        if (!secaoAtual || secoesEncontradas.includes(secaoAtual)) {
          return secaoAtual;
        }
        return "";
      });
    }

    void carregarDados();
  }, []);

  const resultados = useMemo(() => {
    if (produtoSelecionado) {
      return [];
    }

    const termo = normalizarTexto(busca);
    let lista = produtosProducao;

    if (secaoSelecionada) {
      lista = lista.filter(
        (produto) =>
          normalizarTexto(produto.secao) ===
          normalizarTexto(secaoSelecionada)
      );
    }

    if (termo) {
      lista = lista.filter(
        (produto) =>
          normalizarTexto(produto.codigo).includes(termo) ||
          normalizarTexto(produto.descricao).includes(termo) ||
          normalizarTexto(produto.codigoBarras || "").includes(termo)
      );
    }

    return lista.slice(0, 100);
  }, [
    busca,
    produtoSelecionado,
    produtosProducao,
    secaoSelecionada,
  ]);

  function selecionarSecao(secao: string) {
    if (produtoSelecionado) {
      return;
    }

    setSecaoSelecionada(secao);
    onChangeBusca("");
  }

  return (
    <Box>
      <BarraSecoesReceita
        secoes={secoes}
        secaoSelecionada={secaoSelecionada}
        onSelecionarSecao={selecionarSecao}
      />

      <BuscaProduto
        busca={busca}
        resultados={resultados}
        produtoSelecionado={produtoSelecionado}
        secaoSelecionada={secaoSelecionada}
        onChangeBusca={produtoSelecionado ? () => {} : onChangeBusca}
        onSelecionarProduto={onSelecionarProduto}
      />
    </Box>
  );
}