import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import SeletorProdutoReceita from "../../components/Receita/SeletorProdutoReceita";
import DadosReceita from "../../components/Receita/DadosReceita";
import DadosColeta from "../../components/Receita/DadosColeta";

import MaquinasUtilizadas, {
  type MaquinaUtilizada,
} from "../../components/Receita/MaquinasUtilizadas";

import ColaboradoresEnvolvidos, {
  type ColaboradorEnvolvido,
} from "../../components/Receita/ColaboradoresEnvolvidos";

import EmbalagensUtilizadas, {
  type EmbalagemUtilizada,
} from "../../components/Receita/EmbalagensUtilizadas";

import IngredientesReceita, {
  type IngredienteReceita,
} from "../../components/Receita/IngredientesReceita";

import ModoPreparo from "../../components/Receita/ModoPreparo";
import FotosReceita from "../../components/Receita/FotosReceita";

import { produtoService } from "../../services/produtoService";
import { authService } from "../../services/authService";
import { receitaService } from "../../services/receitaService";
import { rascunhoReceitaService } from "../../services/rascunhoReceitaService";
import { apiUrl } from "../../services/apiConfig";

import type { Produto } from "../../models/Produto";
import type {
  Receita,
  FotoReceita,
} from "../../models/Receita";

type CampoMaquina = "nome" | "horaInicio" | "horaFinal";
type CampoColaborador =
  | "identificacao"
  | "horaInicio"
  | "horaFinal";

type CampoEmbalagem =
  | "identificacao"
  | "quantidade";

type CampoIngrediente =
  | "identificacao"
  | "quantidadeUtilizada"
  | "unidadeMedida"
  | "sobra"
  | "modulo";

function converterQuantidadeParaNumero(valor: string): number {
  const valorNormalizado = valor
    .trim()
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const numero = Number(valorNormalizado);

  return Number.isFinite(numero) ? numero : 0;
}


function formatarHoraDigitada(
  valor: string
): string {
  let numeros = valor
    .replace(/\D/g, "")
    .slice(0, 4);

  if (numeros.length >= 2) {
    const hora = Number(
      numeros.slice(0, 2)
    );

    if (hora > 23) {
      numeros =
        "23" + numeros.slice(2);
    }
  }

  if (numeros.length >= 3) {
    const dezenaMinuto = Number(
      numeros[2]
    );

    if (dezenaMinuto > 5) {
      numeros =
        numeros.slice(0, 2) +
        "5" +
        numeros.slice(3);
    }
  }

  if (numeros.length <= 2) {
    return numeros;
  }

  return `${numeros.slice(0, 2)}:${numeros.slice(2)}`;
}

function calcularTempoTotalReceita(
  inicio: string,
  fim: string
): string {
  if (
    !/^\d{2}:\d{2}$/.test(inicio) ||
    !/^\d{2}:\d{2}$/.test(fim)
  ) {
    return "00:00";
  }

  const [horaInicio, minutoInicio] =
    inicio.split(":").map(Number);

  const [horaFim, minutoFim] =
    fim.split(":").map(Number);

  if (
    horaInicio > 23 ||
    horaFim > 23 ||
    minutoInicio > 59 ||
    minutoFim > 59
  ) {
    return "00:00";
  }

  const inicioMinutos =
    horaInicio * 60 + minutoInicio;

  let fimMinutos =
    horaFim * 60 + minutoFim;

  if (fimMinutos < inicioMinutos) {
    fimMinutos += 24 * 60;
  }

  const total =
    fimMinutos - inicioMinutos;

  const horas =
    Math.floor(total / 60);

  const minutos =
    total % 60;

  return `${String(horas).padStart(
    2,
    "0"
  )}:${String(minutos).padStart(
    2,
    "0"
  )}`;
}



function converterPesoParaKg(
  valor: string,
  unidade: string
): number {
  const numero =
    converterQuantidadeParaNumero(valor);

  const unidadeNormalizada =
    unidade.trim().toUpperCase();

  if (
    ["G", "GRAMA", "GRAMAS"].includes(
      unidadeNormalizada
    )
  ) {
    return numero / 1000;
  }

  if (
    [
      "KG",
      "QUILO",
      "QUILOS",
      "QUILOGRAMA",
      "QUILOGRAMAS",
    ].includes(unidadeNormalizada)
  ) {
    return numero;
  }

  return 0;
}

function formatarPesoKgOuG(
  pesoKg: number
): string {
  if (
    !Number.isFinite(pesoKg) ||
    pesoKg <= 0
  ) {
    return "0 G";
  }

  if (pesoKg >= 1) {
    return `${pesoKg
      .toFixed(3)
      .replace(/0+$/, "")
      .replace(/\.$/, "")
      .replace(".", ",")} KG`;
  }

  return `${(pesoKg * 1000)
    .toFixed(1)
    .replace(/\.0$/, "")
    .replace(".", ",")} G`;
}

export default function Receitas() {
  const usuarioLogado = authService.getUsuarioLogado();
  const receitaEdicaoId = Number(
  sessionStorage.getItem("receitaEdicaoId") || 0
);

const modoEdicao = receitaEdicaoId > 0;

  const empresaId =
  authService.getEmpresaAtivaId() ??
  usuarioLogado?.empresaId ??
  0;
  const usuarioId = usuarioLogado?.id ?? 0;

  const rascunhoInicial = useMemo(() => {
    if (modoEdicao || empresaId <= 0 || usuarioId <= 0) {
      return null;
    }

    return rascunhoReceitaService.buscar(
      empresaId,
      usuarioId
    );
  }, [modoEdicao, empresaId, usuarioId]);

  const [receitaId] = useState(() =>
    rascunhoInicial?.receitaId ?? Date.now()
  );
  const [criadoEm, setCriadoEm] = useState(
    () =>
      rascunhoInicial?.criadoEm ??
      new Date().toISOString()
  );

  const [busca, setBusca] = useState(
    () => rascunhoInicial?.busca ?? ""
  );
  const [, setResultados] = useState<Produto[]>([]);

  const [produtoSelecionado, setProdutoSelecionado] =
    useState<Produto | null>(
      () => rascunhoInicial?.produtoSelecionado ?? null
    );

  const [dataColeta, setDataColeta] = useState(
    () => rascunhoInicial?.dataColeta ?? ""
  );

  const [responsavelColeta] = useState(
    usuarioLogado?.nome ?? "Usuário não identificado"
  );

  
  const [estoqueCongelado, setEstoqueCongelado] = useState(
    () => rascunhoInicial?.estoqueCongelado ?? ""
  );

  const [maquinas, setMaquinas] = useState<
    MaquinaUtilizada[]
  >(() => rascunhoInicial?.maquinas ?? []);

  const [colaboradores, setColaboradores] = useState<
    ColaboradorEnvolvido[]
  >(() => rascunhoInicial?.colaboradores ?? []);

  const [embalagens, setEmbalagens] = useState<
    EmbalagemUtilizada[]
  >(() => rascunhoInicial?.embalagens ?? []);


  const [ingredientes, setIngredientes] = useState<
    IngredienteReceita[]
  >(() => rascunhoInicial?.ingredientes ?? []);

  const [fotos, setFotos] = useState<
    FotoReceita[]
  >(() => rascunhoInicial?.fotos ?? []);

  const [horaInicioProducao, setHoraInicioProducao] =
    useState(() => rascunhoInicial?.horaInicioProducao ?? "");

  const [horaFinalProducao, setHoraFinalProducao] =
    useState(() => rascunhoInicial?.horaFinalProducao ?? "");

  const tempoTotalReceita = useMemo(
    () =>
      calcularTempoTotalReceita(
        horaInicioProducao,
        horaFinalProducao
      ),
    [
      horaInicioProducao,
      horaFinalProducao,
    ]
  );

  const [quantidadeProduzida, setQuantidadeProduzida] =
    useState(() => rascunhoInicial?.quantidadeProduzida ?? "");

  const [unidadeMedidaProduto, setUnidadeMedidaProduto] =
    useState(() => rascunhoInicial?.unidadeMedidaProduto ?? "");

  const [pesoTotalProduzido, setPesoTotalProduzido] =
    useState(() => rascunhoInicial?.pesoTotalProduzido ?? "");

  const [unidadePesoProduzido, setUnidadePesoProduzido] =
    useState(() => rascunhoInicial?.unidadePesoProduzido ?? "");

  const [pesoMassaCrua, setPesoMassaCrua] =
    useState("");

  const [unidadePesoMassaCrua, setUnidadePesoMassaCrua] =
    useState("KG");

  const [pesoUnidadeProduzida, setPesoUnidadeProduzida] =
    useState("");

  const [unidadePesoUnidadeProduzida, setUnidadePesoUnidadeProduzida] =
    useState("G");

  const [modoPreparoProducao, setModoPreparoProducao] =
    useState(() => rascunhoInicial?.modoPreparoProducao ?? "");

  const [modoPreparoCliente, setModoPreparoCliente] =
    useState(() => rascunhoInicial?.modoPreparoCliente ?? "");

  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");
  const [abaAtual, setAbaAtual] = useState(0);
  const [confirmacaoCancelarAberta, setConfirmacaoCancelarAberta] =
    useState(false);
  const [
    recomendacaoValidade,
    setRecomendacaoValidade,
  ] = useState<{
    dias: number | null;
    conservacao: string;
    motivo: string;
    referencias: string[];
  } | null>(() => rascunhoInicial?.recomendacaoValidade ?? null);

const [
  carregandoValidade,
  setCarregandoValidade,
] = useState(false);

  useEffect(() => {
    if (
      modoEdicao ||
      !produtoSelecionado ||
      empresaId <= 0 ||
      usuarioId <= 0
    ) {
      return;
    }

    const temporizador = window.setTimeout(() => {
      rascunhoReceitaService.salvar({
        versao: 1,
        empresaId,
        usuarioId,
        receitaId,
        criadoEm,
        atualizadoEm: new Date().toISOString(),
        busca,
        produtoSelecionado,
        dataColeta,
        estoqueCongelado,
        maquinas,
        colaboradores,
        embalagens,
        ingredientes,
        fotos,
        horaInicioProducao,
        horaFinalProducao,
        quantidadeProduzida,
        unidadeMedidaProduto,
        pesoTotalProduzido,
        unidadePesoProduzido,
        modoPreparoProducao,
        modoPreparoCliente,
        recomendacaoValidade,
      });
    }, 350);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [
    modoEdicao,
    empresaId,
    usuarioId,
    receitaId,
    criadoEm,
    busca,
    produtoSelecionado,
    dataColeta,
    estoqueCongelado,
    maquinas,
    colaboradores,
    embalagens,
    ingredientes,
    fotos,
    horaInicioProducao,
    horaFinalProducao,
    quantidadeProduzida,
    unidadeMedidaProduto,
    pesoTotalProduzido,
    unidadePesoProduzido,
    modoPreparoProducao,
    modoPreparoCliente,
    recomendacaoValidade,
  ]);

  const pesoTotalIngredientes = useMemo(() => {
    return ingredientes.reduce((total, ingrediente) => {
      const quantidadeUtilizada =
        converterQuantidadeParaNumero(
          ingrediente.quantidadeUtilizada
        );

      const sobra = converterQuantidadeParaNumero(
        ingrediente.sobra
      );

      const quantidadeConsumida = Math.max(
        quantidadeUtilizada - sobra,
        0
      );

      const unidade = ingrediente.unidadeMedida
        .trim()
        .toUpperCase();

      if (
        ["KG", "QUILO", "QUILOS", "QUILOGRAMA", "QUILOGRAMAS"].includes(
          unidade
        )
      ) {
        return total + quantidadeConsumida;
      }

      if (["G", "GRAMA", "GRAMAS"].includes(unidade)) {
        return total + quantidadeConsumida / 1000;
      }

      return total;
    }, 0);
  }, [ingredientes]);

  const pesoMassaCruaKg = useMemo(
    () =>
      converterPesoParaKg(
        pesoMassaCrua,
        unidadePesoMassaCrua
      ),
    [
      pesoMassaCrua,
      unidadePesoMassaCrua,
    ]
  );

  const pesoMassaAssadaKg = useMemo(
    () =>
      converterPesoParaKg(
        pesoTotalProduzido,
        unidadePesoProduzido
      ),
    [
      pesoTotalProduzido,
      unidadePesoProduzido,
    ]
  );

  const pesoUnidadeProduzidaKg = useMemo(
    () =>
      converterPesoParaKg(
        pesoUnidadeProduzida,
        unidadePesoUnidadeProduzida
      ),
    [
      pesoUnidadeProduzida,
      unidadePesoUnidadeProduzida,
    ]
  );

  const quantidadeUnidadesProduzidas =
    converterQuantidadeParaNumero(
      quantidadeProduzida
    );

  const podeCalcularProcesso =
    pesoMassaCruaKg > 0 &&
    pesoMassaAssadaKg >= 0;

  const perdaProcessoKg =
    podeCalcularProcesso
      ? Math.max(
          pesoMassaCruaKg -
            pesoMassaAssadaKg,
          0
        )
      : 0;

  const perdaProcessoPercentual =
    podeCalcularProcesso
      ? (perdaProcessoKg /
          pesoMassaCruaKg) *
        100
      : 0;

  const pesoAproveitavelKg =
    podeCalcularProcesso
      ? pesoMassaAssadaKg
      : 0;

  const rendimentoTeoricoUn =
    pesoAproveitavelKg > 0 &&
    pesoUnidadeProduzidaKg > 0
      ? pesoAproveitavelKg /
        pesoUnidadeProduzidaKg
      : 0;

  const diferencaRendimento =
    quantidadeUnidadesProduzidas > 0 &&
    rendimentoTeoricoUn > 0
      ? quantidadeUnidadesProduzidas -
        rendimentoTeoricoUn
      : 0;

  function formatarPercentual(
    valor: number
  ): string {
    if (!Number.isFinite(valor)) {
      return "0,00%";
    }

    return `${valor.toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}%`;
  }

  function formatarQuantidade(
    valor: number
  ): string {
    if (!Number.isFinite(valor)) {
      return "0";
    }

    return valor.toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    );
  }


    useEffect(() => {
    async function buscarProdutos() {
      if (busca.trim().length < 2 || produtoSelecionado) {
        setResultados([]);
        return;
      }

      const lista = await produtoService.buscar(busca);

      setResultados(lista);
    }

    buscarProdutos();
  }, [busca, produtoSelecionado]);

  useEffect(() => {
    async function carregarReceitaParaEdicao() {
      if (!modoEdicao) {
        return;
      }

      try {
        const receitaEncontrada =
  await receitaService.buscarPorId(
    receitaEdicaoId
  );

if (!receitaEncontrada) {
  setMensagemErro(
    "Não foi possível localizar a receita para edição."
  );

  return;
}

        const produtos =
  await produtoService.listar();

const produtoEncontrado =
  produtos.find(
    (item) =>
      item.id ===
        receitaEncontrada.produtoId ||
      item.codigo ===
        receitaEncontrada.codigoProduto
  );

const produtoDaReceita: Produto =
  produtoEncontrado ?? {
    id:
      receitaEncontrada.produtoId,
    empresaId: 0,
    codigo:
      receitaEncontrada.codigoProduto,
    descricao:
      receitaEncontrada.nomeProduto,
    gramatura:
      receitaEncontrada.gramaturaProduto,
    unidade: "",
    departamento:
      receitaEncontrada.departamento,
    secao:
      receitaEncontrada.secao,
  };

setProdutoSelecionado(
  produtoDaReceita
);

setBusca(
  `${produtoDaReceita.codigo} - ${produtoDaReceita.descricao}`
);

setResultados([]);

setDataColeta(
  receitaEncontrada.dataColeta
);

setEstoqueCongelado(
  receitaEncontrada.estoqueCongelado
);

setCriadoEm(
  receitaEncontrada.criadoEm
);
        

        setColaboradores(
          receitaEncontrada.cargosEnvolvidos.map((cargo) => ({
            id: cargo.id,
            identificacao: cargo.identificacao,
            horaInicio: cargo.horaInicio,
            horaFinal: cargo.horaFinal,
          }))
        );

        setMaquinas(
          receitaEncontrada.maquinas.map((maquina) => ({
            id: maquina.id,
            nome: maquina.identificacao,
            horaInicio: maquina.horaInicio,
            horaFinal: maquina.horaFinal,
          }))
        );

        setIngredientes(
  receitaEncontrada.ingredientes.map(
    (ingrediente) => ({
      id: ingrediente.id,
      identificacao: ingrediente.identificacao,
      quantidadeUtilizada:
        ingrediente.quantidadeUtilizada,
      unidadeMedida: ingrediente.unidadeMedida,
      sobra: ingrediente.sobra,
      modulo:
        ingrediente.modulo ||
        "MASSA",
    })
  )
);

        setEmbalagens(
          receitaEncontrada.embalagens.map((embalagem) => ({
            id: embalagem.id,
            identificacao: embalagem.identificacao,
            quantidade: embalagem.quantidade,
          }))
        );
        setFotos(
  receitaEncontrada.fotos || []
);

        setHoraInicioProducao(
          receitaEncontrada.horaInicioProducao
        );

        setHoraFinalProducao(
          receitaEncontrada.horaFinalProducao
        );

        setQuantidadeProduzida(
          receitaEncontrada.quantidadeProduzida
        );

        setUnidadeMedidaProduto(
          receitaEncontrada.unidadeMedidaProduto
        );

        setPesoTotalProduzido(
          receitaEncontrada.pesoTotalProduzido
        );

        setUnidadePesoProduzido(
          receitaEncontrada.unidadePesoProduzido
        );

        setModoPreparoProducao(
          receitaEncontrada.modoPreparoProducao
        );

        setModoPreparoCliente(
          receitaEncontrada.modoPreparoCliente
        );
      } catch (error) {
        console.error(
          "Erro ao carregar receita para edição:",
          error
        );

        setMensagemErro(
          "Não foi possível carregar a receita para edição."
        );
      }
    }

    carregarReceitaParaEdicao();
  }, [modoEdicao, receitaEdicaoId]);

  function alterarBusca(valor: string) {
  // Depois que uma receita foi selecionada,
  // o cabeçalho não pode ser alterado acidentalmente.
  if (produtoSelecionado) {
    return;
  }

  setBusca(valor);
  setMensagemSucesso("");
  setMensagemErro("");
}

function selecionarProduto(produto: Produto) {
  // Impede substituir a receita depois
  // que o cabeçalho já foi definido.
  if (produtoSelecionado) {
    return;
  }

  setProdutoSelecionado(produto);

  setBusca(
    `${produto.codigo} - ${produto.descricao}`
  );

  setResultados([]);

  setMensagemSucesso("");
  setMensagemErro("");
}

  function adicionarMaquina() {
    setMaquinas((listaAtual) => [
      ...listaAtual,
      {
        id: Date.now(),
        nome: "",
        horaInicio: "",
        horaFinal: "",
      },
    ]);
  }

  function atualizarMaquina(
    id: number,
    campo: CampoMaquina,
    valor: string
  ) {
    setMaquinas((listaAtual) =>
      listaAtual.map((maquina) =>
        maquina.id === id
          ? {
              ...maquina,
              [campo]: valor,
            }
          : maquina
      )
    );
  }

  function removerMaquina(id: number) {
    setMaquinas((listaAtual) =>
      listaAtual.filter((maquina) => maquina.id !== id)
    );
  }

  function adicionarColaborador() {
  setColaboradores((listaAtual) => [
    ...listaAtual,
    {
      id: Date.now(),
      identificacao: "",
      horaInicio: "",
      horaFinal: "",
    },
  ]);
}

  function atualizarColaborador(
  id: number,
  campo: CampoColaborador,
  valor: string
) {
  setColaboradores((listaAtual) =>
    listaAtual.map((colaborador) =>
      colaborador.id === id
        ? {
            ...colaborador,
            [campo]: valor,
          }
        : colaborador
    )
  );
}

  function removerColaborador(id: number) {
    setColaboradores((listaAtual) =>
      listaAtual.filter(
        (colaborador) => colaborador.id !== id
      )
    );
  }

  function adicionarEmbalagem() {
    setEmbalagens((listaAtual) => [
      ...listaAtual,
      {
        id: Date.now(),
        identificacao: "",
        quantidade: "",
      },
    ]);
  }

  function atualizarEmbalagem(
    id: number,
    campo: CampoEmbalagem,
    valor: string
  ) {
    setEmbalagens((listaAtual) =>
      listaAtual.map((embalagem) =>
        embalagem.id === id
          ? {
              ...embalagem,
              [campo]: valor,
            }
          : embalagem
      )
    );
  }

  function removerEmbalagem(id: number) {
    setEmbalagens((listaAtual) =>
      listaAtual.filter((embalagem) => embalagem.id !== id)
    );
  }

  function adicionarIngrediente() {
  setIngredientes((listaAtual) => [
    ...listaAtual,
    {
      id:
        Date.now() +
        listaAtual.length +
        1,
      identificacao: "",
      quantidadeUtilizada: "",
      unidadeMedida: "",
      sobra: "",
      modulo: "MASSA",
    },
  ]);
}

function adicionarIngredienteCobertura() {
  setIngredientes((listaAtual) => [
    ...listaAtual,
    {
      id:
        Date.now() +
        listaAtual.length +
        1000,
      identificacao: "",
      quantidadeUtilizada: "",
      unidadeMedida: "",
      sobra: "",
      modulo: "COBERTURA_ACABAMENTO",
    },
  ]);
}
  function atualizarIngrediente(
    id: number,
    campo: CampoIngrediente,
    valor: string
  ) {
    setMensagemErro("");
    setMensagemSucesso("");

    setIngredientes((listaAtual) =>
      listaAtual.map((ingrediente) =>
        ingrediente.id === id
          ? {
              ...ingrediente,
              [campo]: valor,
            }
          : ingrediente
      )
    );
  }

  function removerIngrediente(id: number) {
    setIngredientes((listaAtual) =>
      listaAtual.filter((ingrediente) => ingrediente.id !== id)
    );
  }
  const ingredientesPreenchidos = ingredientes.filter(
  (ingrediente) =>
    ingrediente.identificacao.trim() !== "" ||
    ingrediente.quantidadeUtilizada.trim() !== "" ||
    ingrediente.unidadeMedida !== "" ||
    ingrediente.sobra.trim() !== ""
);

  function validarReceita(): string | null {
    if (!produtoSelecionado) {
      return "Selecione o produto produzido.";
    }

    if (!dataColeta) {
      return "Informe a data da coleta.";
    }

    if (responsavelColeta === "Usuário não identificado") {
      return "Não foi possível identificar o responsável pela coleta.";
    }

    if (ingredientesPreenchidos.length === 0) {
      return "Adicione pelo menos um ingrediente.";
    }

    const ingredienteIncompleto = ingredientesPreenchidos.some(
      (ingrediente) => {
        const quantidade =
          converterQuantidadeParaNumero(
            ingrediente.quantidadeUtilizada
          );

        return (
          !ingrediente.identificacao.trim() ||
          quantidade <= 0 ||
          !ingrediente.unidadeMedida.trim()
        );
      }
    );

    if (ingredienteIncompleto) {
      return "Preencha o ingrediente, a quantidade e a unidade de medida.";
    }

    if (
      !quantidadeProduzida ||
      converterQuantidadeParaNumero(quantidadeProduzida) <= 0
    ) {
      return "Informe uma quantidade produzida maior que zero.";
    }

    if (!unidadeMedidaProduto) {
      setUnidadeMedidaProduto("UN");
    }

    if (
      !pesoTotalProduzido ||
      converterQuantidadeParaNumero(pesoTotalProduzido) <= 0
    ) {
      return "Informe um peso total produzido maior que zero.";
    }

    if (!unidadePesoProduzido) {
      return "Informe a unidade do peso produzido.";
    }

    return null;
  }
  async function gerarRecomendacaoValidade() {
  if (!produtoSelecionado) {
    setMensagemErro(
      "Selecione o produto antes de sugerir a validade."
    );

    return null;
  }

  if (ingredientesPreenchidos.length === 0) {
    setMensagemErro(
      "Informe os ingredientes antes de sugerir a validade."
    );

    return null;
  }

  setCarregandoValidade(true);
  setMensagemErro("");

  try {
    const resposta = await fetch(apiUrl("/api/ia/sugerir-validade"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          produto: {
            codigo:
              produtoSelecionado.codigo,
            descricao:
              produtoSelecionado.descricao,
            departamento:
              produtoSelecionado.departamento,
            secao:
              produtoSelecionado.secao,
          },

          estoqueCongelado,

          ingredientes:
            ingredientesPreenchidos.map(
              (ingrediente) => ({
                identificacao:
                  ingrediente.identificacao,
                quantidade:
                  ingrediente.quantidadeUtilizada,
                unidade:
                  ingrediente.unidadeMedida,
                modulo:
                  ingrediente.modulo,
              })
            ),

          modoPreparoProducao,
          modoPreparoCliente,
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        dados?.erro ||
          "Não foi possível gerar a recomendação de validade."
      );
    }

    const recomendacao = {
      dias:
        dados.dias === null
          ? null
          : Number(dados.dias),

      conservacao:
        dados.conservacao ||
        "A definir",

      motivo:
        dados.motivo || "",

      referencias:
        Array.isArray(
          dados.referencias
        )
          ? dados.referencias
          : [],
    };

    setRecomendacaoValidade(
      recomendacao
    );

    return recomendacao;
  } catch (error) {
    console.error(
      "Erro ao sugerir validade:",
      error
    );

    setMensagemErro(
      "Não foi possível gerar a recomendação de validade."
    );

    return null;
  } finally {
    setCarregandoValidade(false);
  }
}

  async function ajustarModoPreparoComIA(
  tipo: "PRODUCAO" | "CLIENTE",
  texto: string
): Promise<string> {
  const resposta = await fetch(apiUrl("/api/ia/ajustar-modo-preparo"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipo,
        texto,
        produto: produtoSelecionado
          ? {
              codigo: produtoSelecionado.codigo,
              descricao: produtoSelecionado.descricao,
              departamento:
                produtoSelecionado.departamento,
              secao: produtoSelecionado.secao,
            }
          : null,
        ingredientes: ingredientesPreenchidos.map(
          (ingrediente) => ({
            identificacao:
              ingrediente.identificacao,
            quantidade:
              ingrediente.quantidadeUtilizada,
            unidade:
              ingrediente.unidadeMedida,
            modulo: ingrediente.modulo,
          })
        ),
      }),
    }
  );

  if (!resposta.ok) {
    throw new Error(
      "Não foi possível ajustar o modo de preparo."
    );
  }

  const dados = await resposta.json();

  if (
    !dados.textoAjustado ||
    typeof dados.textoAjustado !== "string"
  ) {
    throw new Error(
      "Resposta inválida do serviço de IA."
    );
  }

  return dados.textoAjustado;
}

function cancelarReceita() {
  setConfirmacaoCancelarAberta(true);
}

function fecharConfirmacaoCancelar() {
  setConfirmacaoCancelarAberta(false);
}

function confirmarCancelamentoReceita() {
  setConfirmacaoCancelarAberta(false);

  if (modoEdicao) {
    sessionStorage.removeItem(
      "receitaEdicaoId"
    );

    window.location.href =
      "/ficha-tecnica";

    return;
  }

  rascunhoReceitaService.remover(
    empresaId,
    usuarioId
  );

  window.location.href =
    "/receitas";
}

async function salvarFichaTecnica() {
  setMensagemSucesso("");
  setMensagemErro("");

  const erroValidacao = validarReceita();

  if (erroValidacao) {
    setMensagemErro(erroValidacao);
    return;
  }

  if (!produtoSelecionado) {
    return;
  }

  setSalvando(true);

  try {
    const agora = new Date().toISOString();

    const recomendacaoParaSalvar =
  recomendacaoValidade ??
  (await gerarRecomendacaoValidade());

if (!recomendacaoParaSalvar) {
  return;
}

const receita: Receita = {
  id: modoEdicao
    ? receitaEdicaoId
    : receitaId,

  empresaId,

  produtoId: produtoSelecionado.id,
  codigoProduto: produtoSelecionado.codigo,
  nomeProduto: produtoSelecionado.descricao,
  gramaturaProduto:
    produtoSelecionado.gramatura,
  departamento:
    produtoSelecionado.departamento,
  secao:
    produtoSelecionado.secao,

  dataColeta,
  responsavelColeta,
  estoqueCongelado,

  validadeSugeridaDias:
    recomendacaoParaSalvar.dias,
  validadeConservacao:
    recomendacaoParaSalvar.conservacao,
  validadeMotivo:
    recomendacaoParaSalvar.motivo,
  validadeReferencias:
    recomendacaoParaSalvar.referencias,

      cargosEnvolvidos: colaboradores
        .filter((colaborador) =>
          colaborador.identificacao.trim()
        )
        .map((colaborador) => ({
          id: colaborador.id,
          identificacao:
            colaborador.identificacao,
          horaInicio:
            colaborador.horaInicio,
          horaFinal:
            colaborador.horaFinal,
        })),

      maquinas: maquinas
        .filter((maquina) =>
          maquina.nome.trim()
        )
        .map((maquina) => ({
          id: maquina.id,
          identificacao: maquina.nome,
          horaInicio: maquina.horaInicio,
          horaFinal: maquina.horaFinal,
        })),

      ingredientes:
        ingredientesPreenchidos.map(
          (ingrediente) => ({
            id: ingrediente.id,
            identificacao:
              ingrediente.identificacao.trim(),
            quantidadeUtilizada:
              ingrediente.quantidadeUtilizada,
            unidadeMedida:
              ingrediente.unidadeMedida,
            sobra: ingrediente.sobra,
            modulo: ingrediente.modulo,
          })
        ),

            embalagens: embalagens
        .filter((embalagem) =>
          embalagem.identificacao.trim()
        )
        .map((embalagem) => ({
          id: embalagem.id,
          identificacao:
            embalagem.identificacao,
          quantidade:
            embalagem.quantidade,
        })),

      fotos,

      horaInicioProducao,
      horaFinalProducao,
      quantidadeProduzida,
      unidadeMedidaProduto,
      pesoTotalIngredientes,
      pesoTotalProduzido,
      unidadePesoProduzido,

      modoPreparoProducao,
      modoPreparoCliente,

      criadoEm,
      atualizadoEm: agora,
    };

    await receitaService.salvar(receita);

    if (!modoEdicao) {
      rascunhoReceitaService.remover(
        empresaId,
        usuarioId
      );
    }

    if (modoEdicao) {
      sessionStorage.removeItem(
        "receitaEdicaoId"
      );

      window.location.href =
        "/ficha-tecnica";

      return;
    }

    setMensagemSucesso(
  "Ficha técnica salva com sucesso."
);

window.setTimeout(() => {
  window.location.href = "/receitas";
}, 800);
  } catch (error) {
    console.error(
      "Erro ao salvar ficha técnica:",
      error
    );

    setMensagemErro(
      "Não foi possível salvar a ficha técnica."
    );
  } finally {
    setSalvando(false);
  }
}

  return (
    <Box
  sx={{
    px: { xs: 1, sm: 2, md: 3 },
    py: { xs: 1.5, md: 3 },
  }}
>
{produtoSelecionado && (
        <Paper
          elevation={0}
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            mb: 2,
            px: { xs: 0.75, sm: 1.25, md: 2 },
            py: { xs: 0.75, sm: 1 },
            borderRadius: 2.5,
            backgroundColor: "rgba(255,255,255,0.98)",
            boxShadow: "0 4px 18px rgba(15,23,42,0.14)",
            backdropFilter: "blur(8px)",
            overflow: "hidden",
          }}
        >
          <Typography
            title={produtoSelecionado.descricao}
            sx={{
              mb: { xs: 0.75, sm: 1 },
              px: { xs: 0.25, sm: 0.5 },
              fontSize: { xs: "0.88rem", sm: "1rem", md: "1.15rem" },
              lineHeight: 1.2,
              fontWeight: 900,
              color: "#111827",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {produtoSelecionado.descricao}
          </Typography>

          <Box
            sx={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 62px",
                sm: "repeat(3, minmax(0, 1fr)) 82px",
                md: "repeat(3, minmax(0, 1fr)) 96px",
              },
              gap: { xs: 0.5, sm: 0.75, md: 1 },
              alignItems: "stretch",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                minWidth: 0,
                p: { xs: 0.45, sm: 0.65 },
                borderRadius: 1.5,
                boxShadow: "0 2px 7px rgba(15,23,42,0.10)",
              }}
            >
              <Typography
                noWrap
                sx={{
                  mb: 0.2,
                  fontSize: { xs: "0.48rem", sm: "0.56rem" },
                  fontWeight: 900,
                  color: "#64748B",
                  textTransform: "uppercase",
                }}
              >
                Início
              </Typography>

              <TextField
                fullWidth
                size="small"
                type="text"
                value={horaInicioProducao}
                placeholder="00:00"
                onChange={(event) =>
                  setHoraInicioProducao(
                    formatarHoraDigitada(event.target.value)
                  )
                }
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    maxLength: 5,
                    pattern: "[0-9:]*",
                    style: {
                      textAlign: "center",
                      fontWeight: 900,
                      padding: "5px 2px",
                      fontSize: "0.78rem",
                    },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: { xs: 30, sm: 34 },
                  },
                }}
              />
            </Paper>

            <Paper
              elevation={0}
              sx={{
                minWidth: 0,
                p: { xs: 0.45, sm: 0.65 },
                borderRadius: 1.5,
                boxShadow: "0 2px 7px rgba(15,23,42,0.10)",
              }}
            >
              <Typography
                noWrap
                sx={{
                  mb: 0.2,
                  fontSize: { xs: "0.48rem", sm: "0.56rem" },
                  fontWeight: 900,
                  color: "#64748B",
                  textTransform: "uppercase",
                }}
              >
                Fim
              </Typography>

              <TextField
                fullWidth
                size="small"
                type="text"
                value={horaFinalProducao}
                placeholder="00:00"
                onChange={(event) =>
                  setHoraFinalProducao(
                    formatarHoraDigitada(event.target.value)
                  )
                }
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    maxLength: 5,
                    pattern: "[0-9:]*",
                    style: {
                      textAlign: "center",
                      fontWeight: 900,
                      padding: "5px 2px",
                      fontSize: "0.78rem",
                    },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: { xs: 30, sm: 34 },
                  },
                }}
              />
            </Paper>

            <Paper
              elevation={0}
              sx={{
                minWidth: 0,
                p: { xs: 0.45, sm: 0.65 },
                borderRadius: 1.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 7px rgba(15,23,42,0.10)",
              }}
            >
              <Typography
                noWrap
                sx={{
                  fontSize: { xs: "0.43rem", sm: "0.54rem" },
                  fontWeight: 900,
                  color: "#64748B",
                  textTransform: "uppercase",
                }}
              >
                Total
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.15,
                  fontSize: { xs: "0.82rem", sm: "0.98rem", md: "1.08rem" },
                  fontWeight: 900,
                  color: "#0D3768",
                  lineHeight: 1,
                }}
              >
                {tempoTotalReceita}
              </Typography>
            </Paper>

            <Button
              variant="contained"
              color="error"
              onClick={cancelarReceita}
              disabled={salvando}
              sx={{
                minWidth: 0,
                width: "100%",
                minHeight: 0,
                alignSelf: "center",
                height: { xs: 34, sm: 38 },
                borderRadius: 1.5,
                px: { xs: 0.25, sm: 0.5 },
                py: 0.25,
                fontWeight: 900,
                fontSize: {
                  xs: "0.48rem",
                  sm: "0.58rem",
                  md: "0.64rem",
                },
                lineHeight: 1,
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(220,38,38,0.22)",
              }}
            >
              Cancelar
            </Button>
          </Box>
        </Paper>
      )}

      <Paper
  sx={{
    p: { xs: 1.5, sm: 2, md: 3 },
  }}
>
        {!produtoSelecionado && (
          <SeletorProdutoReceita
            busca={busca}
            produtoSelecionado={produtoSelecionado}
            onChangeBusca={alterarBusca}
            onSelecionarProduto={selecionarProduto}
          />
        )}

        {produtoSelecionado && (
          <>
            <Box
              sx={{
                borderBottom: "1px solid #E5E7EB",
                mb: 3,
              }}
            >
              <Tabs
                value={abaAtual}
                onChange={(_, valor) =>
                  setAbaAtual(valor)
                }
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  minHeight: 46,
                  "& .MuiTab-root": {
                    minHeight: 46,
                    fontWeight: 800,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                  },
                }}
              >
                <Tab
                  label={
                    produtoSelecionado.descricao
                  }
                />
                <Tab label="Equipamentos" />
                <Tab label="Pessoas" />
                <Tab label="Ingredientes + Preparo" />
                <Tab label="Embalagens" />
                <Tab label="Recomendações / Validade" />
                <Tab label="Rendimento" />
              </Tabs>
            </Box>

            {abaAtual === 0 && (
              <Box>
                <SeletorProdutoReceita
                  busca={busca}
                  produtoSelecionado={produtoSelecionado}
                  onChangeBusca={alterarBusca}
                  onSelecionarProduto={selecionarProduto}
                />

                <DadosReceita
                  produto={produtoSelecionado}
                />

                <DadosColeta
                  dataColeta={dataColeta}
                  responsavelColeta={
                    responsavelColeta
                  }
                  estoqueCongelado={
                    estoqueCongelado
                  }
                  onChangeDataColeta={
                    setDataColeta
                  }
                  onChangeResponsavelColeta={() =>
                    undefined
                  }
                  onChangeEstoqueCongelado={
                    setEstoqueCongelado
                  }
                />
              </Box>
            )}

            {abaAtual === 1 && (
              <MaquinasUtilizadas
                maquinas={maquinas}
                onAdicionarMaquina={
                  adicionarMaquina
                }
                onAtualizarMaquina={
                  atualizarMaquina
                }
                onRemoverMaquina={
                  removerMaquina
                }
              />
            )}

            {abaAtual === 2 && (
              <ColaboradoresEnvolvidos
                colaboradores={colaboradores}
                onAdicionarColaborador={
                  adicionarColaborador
                }
                onAtualizarColaborador={
                  atualizarColaborador
                }
                onRemoverColaborador={
                  removerColaborador
                }
              />
            )}

            {abaAtual === 3 && (
              <Box>
                <IngredientesReceita
                  ingredientes={ingredientes}
                  onAdicionarIngrediente={
                    adicionarIngrediente
                  }
                  onAdicionarIngredienteCobertura={
                    adicionarIngredienteCobertura
                  }
                  onAtualizarIngrediente={
                    atualizarIngrediente
                  }
                  onRemoverIngrediente={
                    removerIngrediente
                  }
                />

                <ModoPreparo
                  modoPreparoProducao={
                    modoPreparoProducao
                  }
                  modoPreparoCliente={
                    modoPreparoCliente
                  }
                  onChangeModoPreparoProducao={
                    setModoPreparoProducao
                  }
                  onChangeModoPreparoCliente={
                    setModoPreparoCliente
                  }
                  onAjustarComIA={
                    ajustarModoPreparoComIA
                  }
                />

                <FotosReceita
                  fotos={fotos}
                  onChange={setFotos}
                />
              </Box>
            )}

            {abaAtual === 4 && (
              <EmbalagensUtilizadas
                embalagens={embalagens}
                onAdicionarEmbalagem={
                  adicionarEmbalagem
                }
                onAtualizarEmbalagem={
                  atualizarEmbalagem
                }
                onRemoverEmbalagem={
                  removerEmbalagem
                }
              />
            )}

            {abaAtual === 5 && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 2,
                  boxShadow:
                    "0 3px 12px rgba(15,23,42,0.10)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Recomendações / Validade
                </Typography>

                <Button
                  variant="contained"
                  onClick={
                    gerarRecomendacaoValidade
                  }
                  disabled={carregandoValidade}
                  sx={{
                    mb: recomendacaoValidade
                      ? 3
                      : 0,
                  }}
                >
                  {carregandoValidade
                    ? "Analisando..."
                    : "Sugerir validade"}
                </Button>

                {recomendacaoValidade && (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.5,
                    }}
                  >
                    <Typography>
                      <strong>
                        Sugestão do Roca Coleta:
                      </strong>{" "}
                      {recomendacaoValidade.dias !==
                      null
                        ? `${recomendacaoValidade.dias} dias`
                        : "A definir"}
                    </Typography>

                    <Typography>
                      <strong>
                        Conservação:
                      </strong>{" "}
                      {
                        recomendacaoValidade.conservacao
                      }
                    </Typography>

                    <Typography>
                      <strong>
                        Motivo:
                      </strong>{" "}
                      {
                        recomendacaoValidade.motivo
                      }
                    </Typography>

                    <Box>
                      <Typography
                        sx={{ fontWeight: 700 }}
                      >
                        Referências consultadas:
                      </Typography>

                      {recomendacaoValidade.referencias.map(
                        (
                          referencia,
                          indice
                        ) => (
                          <Typography
                            key={`${referencia}-${indice}`}
                          >
                            • {referencia}
                          </Typography>
                        )
                      )}
                    </Box>
                  </Box>
                )}
              </Paper>
            )}

            {abaAtual === 6 && (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: "#0D3768",
                  }}
                >
                  Rendimento
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                  }}
                >
                  {[
                    {
                      titulo: "Peso massa crua",
                      valor: pesoMassaCrua,
                      unidade: unidadePesoMassaCrua,
                      setValor: setPesoMassaCrua,
                      setUnidade: setUnidadePesoMassaCrua,
                    },
                    {
                      titulo: "Peso massa assada",
                      valor: pesoTotalProduzido,
                      unidade: unidadePesoProduzido,
                      setValor: setPesoTotalProduzido,
                      setUnidade: setUnidadePesoProduzido,
                    },
                    {
                      titulo: "Peso UN produzida",
                      valor: pesoUnidadeProduzida,
                      unidade: unidadePesoUnidadeProduzida,
                      setValor: setPesoUnidadeProduzida,
                      setUnidade: setUnidadePesoUnidadeProduzida,
                    },
                  ].map((item) => (
                    <Paper
                      key={item.titulo}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                        boxShadow:
                          "0 3px 10px rgba(15,23,42,0.10)",
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        noWrap
                        sx={{
                          mb: 0.75,
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          color: "#64748B",
                          textTransform: "uppercase",
                        }}
                      >
                        {item.titulo}
                      </Typography>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(0, 1fr) 78px",
                          gap: 0.75,
                        }}
                      >
                        <TextField
                          fullWidth
                          size="small"
                          value={item.valor}
                          placeholder="Peso"
                          onChange={(event) =>
                            item.setValor(event.target.value)
                          }
                          slotProps={{
                            htmlInput: {
                              inputMode: "decimal",
                            },
                          }}
                          sx={{
                            "& .MuiOutlinedInput-notchedOutline":
                              { border: "none" },
                            "& .MuiOutlinedInput-root":
                              { backgroundColor: "#F8FAFC" },
                          }}
                        />

                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={item.unidade}
                          onChange={(event) =>
                            item.setUnidade(event.target.value)
                          }
                          sx={{
                            "& .MuiOutlinedInput-notchedOutline":
                              { border: "none" },
                            "& .MuiOutlinedInput-root":
                              { backgroundColor: "#F8FAFC" },
                          }}
                        >
                          <MenuItem value="G">G</MenuItem>
                          <MenuItem value="KG">KG</MenuItem>
                        </TextField>
                      </Box>
                    </Paper>
                  ))}

                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      boxShadow:
                        "0 3px 10px rgba(15,23,42,0.10)",
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      noWrap
                      sx={{
                        mb: 0.75,
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: "#64748B",
                        textTransform: "uppercase",
                      }}
                    >
                      Qt UN produzidas
                    </Typography>

                    <TextField
                      fullWidth
                      size="small"
                      value={quantidadeProduzida}
                      placeholder="Quantidade"
                      onChange={(event) => {
                        setQuantidadeProduzida(
                          event.target.value
                        );
                        if (
                          unidadeMedidaProduto !== "UN"
                        ) {
                          setUnidadeMedidaProduto("UN");
                        }
                      }}
                      slotProps={{
                        htmlInput: {
                          inputMode: "numeric",
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-notchedOutline":
                          { border: "none" },
                        "& .MuiOutlinedInput-root":
                          { backgroundColor: "#F8FAFC" },
                      }}
                    />
                  </Paper>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                    mt: 0.5,
                  }}
                >
                  {[
                    {
                      titulo: "Peso Ingredientes",
                      valor: formatarPesoKgOuG(
                        pesoTotalIngredientes
                      ),
                    },
                    {
                      titulo: "Perda de Processo",
                      valor: podeCalcularProcesso
                        ? formatarPesoKgOuG(
                            perdaProcessoKg
                          )
                        : "—",
                    },
                    {
                      titulo: "Perda %",
                      valor: podeCalcularProcesso
                        ? formatarPercentual(
                            perdaProcessoPercentual
                          )
                        : "—",
                    },
                    {
                      titulo: "Peso Aproveitável",
                      valor: podeCalcularProcesso
                        ? formatarPesoKgOuG(
                            pesoAproveitavelKg
                          )
                        : "—",
                    },
                    {
                      titulo: "Rendimento teórico UN",
                      valor:
                        rendimentoTeoricoUn > 0
                          ? `${formatarQuantidade(
                              rendimentoTeoricoUn
                            )} UN`
                          : "—",
                    },
                    {
                      titulo: "Diferença de rendimento",
                      valor:
                        rendimentoTeoricoUn > 0 &&
                        quantidadeUnidadesProduzidas > 0
                          ? `${formatarQuantidade(
                              diferencaRendimento
                            )} UN`
                          : "—",
                    },
                  ].map((item) => (
                    <Paper
                      key={item.titulo}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#E7ECF3",
                        boxShadow:
                          "0 3px 10px rgba(15,23,42,0.10)",
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.25,
                      }}
                    >
                      <Typography
                        noWrap
                        sx={{
                          minWidth: 0,
                          fontSize: {
                            xs: "0.68rem",
                            sm: "0.76rem",
                          },
                          fontWeight: 800,
                          color: "#64748B",
                          textTransform: "uppercase",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.titulo}
                      </Typography>

                      <Typography
                        noWrap
                        sx={{
                          flexShrink: 0,
                          fontSize: {
                            xs: "0.98rem",
                            sm: "1.08rem",
                          },
                          fontWeight: 900,
                          color: "#0D3768",
                        }}
                      >
                        {item.valor}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}

            <Box
              sx={{
                mt: 4,
                pt: 3,
                borderTop:
                  "1px solid #E5E7EB",
              }}
            >
              {mensagemErro && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                >
                  {mensagemErro}
                </Alert>
              )}

              {mensagemSucesso && (
                <Alert
                  severity="success"
                  sx={{ mb: 2 }}
                >
                  {mensagemSucesso}
                </Alert>
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: {
                    xs: "column",
                    sm: "row",
                  },
                  gap: 2,
                  justifyContent:
                    "space-between",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    width: {
                      xs: "100%",
                      sm: "auto",
                    },
                  }}
                >
                  {abaAtual > 0 && (
                    <Button
                      variant="outlined"
                      onClick={() =>
                        setAbaAtual(
                          (atual) =>
                            atual - 1
                        )
                      }
                    >
                      ANTERIOR
                    </Button>
                  )}

                  {abaAtual < 6 && (
                    <Button
                      variant="contained"
                      onClick={() =>
                        setAbaAtual(
                          (atual) =>
                            atual + 1
                        )
                      }
                    >
                      {abaAtual === 0
                        ? "PRÓXIMO: EQUIPAMENTOS"
                        : abaAtual === 1
                          ? "PRÓXIMO: PESSOAS"
                          : abaAtual === 2
                            ? "PRÓXIMO: INGREDIENTES + PREPARO"
                            : abaAtual === 3
                              ? "PRÓXIMO: EMBALAGENS"
                              : abaAtual === 4
                                ? "PRÓXIMO: RECOMENDAÇÕES / VALIDADE"
                                : "PRÓXIMO: RESUMO"}
                    </Button>
                  )}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: {
                      xs: "column",
                      sm: "row",
                    },
                    gap: 2,
                  }}
                >
                  {abaAtual === 6 && (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={
                        salvarFichaTecnica
                      }
                      disabled={salvando}
                    >
                      {salvando
                        ? "Salvando..."
                        : modoEdicao
                          ? "Salvar alterações"
                          : "Salvar ficha técnica"}
                    </Button>
                  )}

                </Box>
              </Box>
            </Box>
          </>
        )}

      </Paper>

      <Dialog
        open={confirmacaoCancelarAberta}
        onClose={fecharConfirmacaoCancelar}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Cancelar coleta
        </DialogTitle>

        <DialogContent>
          <DialogContentText
            sx={{
              fontSize: "1rem",
              color: "text.primary",
            }}
          >
            Deseja cancelar a coleta da receita?
          </DialogContentText>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            gap: 1,
            flexDirection: {
              xs: "column-reverse",
              sm: "row",
            },
          }}
        >
          <Button
            onClick={fecharConfirmacaoCancelar}
            variant="outlined"
            fullWidth
          >
            Não, continuar
          </Button>

          <Button
            onClick={confirmarCancelamentoReceita}
            variant="contained"
            color="error"
            fullWidth
          >
            Sim, cancelar coleta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}