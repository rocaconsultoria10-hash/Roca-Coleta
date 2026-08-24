import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import type { Receita } from "../models/Receita";

function nomeArquivo(
  texto: string
): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function formatarData(
  data: string
): string {
  if (!data) {
    return "-";
  }

  const valor = data.includes("T")
    ? new Date(data)
    : new Date(`${data}T00:00:00`);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return data;
  }

  return valor.toLocaleDateString(
    "pt-BR"
  );
}

function converterNumero(
  valor: string | number
): number {
  if (
    typeof valor === "number"
  ) {
    return Number.isFinite(valor)
      ? valor
      : 0;
  }

  const numero = Number(
    String(valor || "")
      .trim()
      .replace(",", ".")
  );

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function calcularMinutos(
  inicio: string,
  final: string
): number {
  if (
    !inicio ||
    !final
  ) {
    return 0;
  }

  const [
    horaInicio,
    minutoInicio,
  ] = inicio
    .split(":")
    .map(Number);

  const [
    horaFinal,
    minutoFinal,
  ] = final
    .split(":")
    .map(Number);

  const inicioMinutos =
    horaInicio * 60 +
    minutoInicio;

  let finalMinutos =
    horaFinal * 60 +
    minutoFinal;

  if (
    finalMinutos <
    inicioMinutos
  ) {
    finalMinutos +=
      24 * 60;
  }

  return (
    finalMinutos -
    inicioMinutos
  );
}

function formatarTempo(
  minutos: number
): string {
  if (
    minutos <= 0
  ) {
    return "-";
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  const minutosRestantes =
    minutos % 60;

  if (
    horas === 0
  ) {
    return `${minutosRestantes} min`;
  }

  if (
    minutosRestantes === 0
  ) {
    return `${horas} h`;
  }

  return `${horas} h ${minutosRestantes} min`;
}

function tituloSecao(
  doc: jsPDF,
  titulo: string,
  y: number
): number {
  if (
    y > 265
  ) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(13);
  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.text(
    titulo,
    14,
    y
  );

  return y + 7;
}

function finalTabela(
  doc: jsPDF,
  fallback: number
): number {
  const tabela =
    (
      doc as unknown as {
        lastAutoTable?: {
          finalY?: number;
        };
      }
    ).lastAutoTable;

  return (
    tabela?.finalY ??
    fallback
  );
}

function adicionarTextoLongo(
  doc: jsPDF,
  titulo: string,
  texto: string,
  yInicial: number
): number {
  let y =
    tituloSecao(
      doc,
      titulo,
      yInicial
    );

  doc.setFontSize(10);
  doc.setFont(
    "helvetica",
    "normal"
  );

  const linhas =
    doc.splitTextToSize(
      texto || "-",
      180
    );

  for (
    const linha of linhas
  ) {
    if (
      y > 275
    ) {
      doc.addPage();
      y = 20;
    }

    doc.text(
      linha,
      14,
      y
    );

    y += 5;
  }

  return y + 3;
}

async function imagemParaDataUrl(
  url: string
): Promise<string | null> {
  try {
    const resposta =
      await fetch(url);

    const blob =
      await resposta.blob();

    return await new Promise(
      (
        resolve
      ) => {
        const reader =
          new FileReader();

        reader.onloadend =
          () => {
            resolve(
              typeof reader.result ===
                "string"
                ? reader.result
                : null
            );
          };

        reader.readAsDataURL(
          blob
        );
      }
    );
  } catch {
    return null;
  }
}

async function adicionarFotos(
  doc: jsPDF,
  receita: Receita
): Promise<void> {
  if (
    !receita.fotos ||
    receita.fotos.length === 0
  ) {
    return;
  }

  doc.addPage();

  doc.setFontSize(15);
  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.text(
    "Galeria de Fotos",
    14,
    20
  );

  let x = 14;
  let y = 30;

  for (
    const foto of receita.fotos
  ) {
    const imagem =
      await imagemParaDataUrl(
        foto.preview
      );

    if (!imagem) {
      continue;
    }

    if (
      y > 235
    ) {
      doc.addPage();
      x = 14;
      y = 20;
    }

    try {
      doc.addImage(
        imagem,
        "JPEG",
        x,
        y,
        82,
        55
      );
    } catch {
      try {
        doc.addImage(
          imagem,
          "PNG",
          x,
          y,
          82,
          55
        );
      } catch {
        continue;
      }
    }

    doc.setFontSize(8);
    doc.setFont(
      "helvetica",
      "normal"
    );

    const legenda =
      foto.legenda ||
      foto.nome ||
      "";

    const linhasLegenda =
      doc.splitTextToSize(
        legenda,
        80
      );

    doc.text(
      linhasLegenda,
      x,
      y + 60
    );

    if (
      x === 14
    ) {
      x = 108;
    } else {
      x = 14;
      y += 78;
    }
  }
}

async function adicionarFicha(
  doc: jsPDF,
  receita: Receita,
  novaPagina: boolean
): Promise<void> {
  if (
    novaPagina
  ) {
    doc.addPage();
  }

  const massaCrua =
    receita.pesoTotalIngredientes ||
    0;

  const massaAssada =
    converterNumero(
      receita.pesoTotalProduzido
    );

  const rendimento =
    massaCrua > 0 &&
    massaAssada >= 0
      ? (
          massaAssada /
          massaCrua
        ) *
        100
      : 0;

  const perda =
    massaCrua > 0
      ? Math.max(
          massaCrua -
            massaAssada,
          0
        )
      : 0;

  const totalMaoDeObra =
    receita.cargosEnvolvidos.reduce(
      (
        total,
        cargo
      ) =>
        total +
        calcularMinutos(
          cargo.horaInicio,
          cargo.horaFinal
        ),
      0
    );

  const totalMaquinas =
    receita.maquinas.reduce(
      (
        total,
        maquina
      ) =>
        total +
        calcularMinutos(
          maquina.horaInicio,
          maquina.horaFinal
        ),
      0
    );

  const logoRoca =
  await imagemParaDataUrl(
    "/logo-roca-branca.png"
  );

if (logoRoca) {
  try {
    doc.addImage(
      logoRoca,
      "PNG",
      176,
      8,
      16,
      16
    );
  } catch {
    // mantém o PDF funcionando
  }
}

doc.setTextColor(
  41,
  128,
  185
);

doc.setFont(
  "helvetica",
  "bold"
);

doc.setFontSize(9);

doc.text(
  "ROCA COLETA | Ficha Técnica",
  14,
  14
);

doc.text(
  `${receita.codigoProduto || "-"} - ${receita.nomeProduto || "-"}`,
  14,
  20
);

doc.setTextColor(
  0,
  0,
  0
);

let y = 29;

  autoTable(
    doc,
    {
      startY: y,
      head: [
        [
          "Informação",
          "Dados",
        ],
      ],
      body: [
        [
          "Departamento",
          receita.departamento ||
            "-",
        ],
        [
          "Seção",
          receita.secao ||
            "-",
        ],
        [
          "Data da coleta",
          formatarData(
            receita.dataColeta
          ),
        ],
        [
          "Responsável",
          receita.responsavelColeta ||
            "-",
        ],
        [
          "Estoque congelado",
          receita.estoqueCongelado ||
            "-",
        ],
        [
          "Quantidade produzida",
          `${receita.quantidadeProduzida || "-"} ${receita.unidadeMedidaProduto || ""}`,
        ],
        [
          "Peso total produzido",
          `${receita.pesoTotalProduzido || "-"} ${receita.unidadePesoProduzido || ""}`,
        ],
      ],
      styles: {
        fontSize: 9,
      },
      margin: {
        left: 14,
        right: 14,
      },
    }
  );

  y =
    finalTabela(
      doc,
      y
    ) + 8;

  

      const ingredientesMassa =
    receita.ingredientes.filter(
      (ingrediente) =>
        ingrediente.modulo === "MASSA"
    );

  y =
    tituloSecao(
      doc,
      "Produção da Massa",
      y
    );

  autoTable(
    doc,
    {
      startY: y,
      head: [
        [
          "Ingrediente",
          "Quantidade",
          "Unidade",
        ],
      ],
      body:
        ingredientesMassa.length > 0
          ? ingredientesMassa.map(
              (ingrediente) => [
                ingrediente.identificacao,
                ingrediente.quantidadeUtilizada,
                ingrediente.unidadeMedida,
              ]
            )
          : [["-", "-", "-"]],
      styles: {
        fontSize: 8,
      },
      margin: {
        left: 14,
        right: 14,
      },
    }
  );

  y =
    finalTabela(
      doc,
      y
    ) + 8;

  y =
    tituloSecao(
      doc,
      "Cargos envolvidos",
      y
    );
    

  autoTable(
    doc,
    {
      startY: y,
      head: [
        [
          "Cargo",
          "Início",
          "Final",
          "Tempo",
        ],
      ],
      body:
        receita.cargosEnvolvidos.map(
          (
            cargo
          ) => [
            cargo.identificacao,
            cargo.horaInicio ||
              "-",
            cargo.horaFinal ||
              "-",
            formatarTempo(
              calcularMinutos(
                cargo.horaInicio,
                cargo.horaFinal
              )
            ),
          ]
        ),
      styles: {
        fontSize: 8,
      },
      margin: {
        left: 14,
        right: 14,
      },
    }
  );

  y =
    finalTabela(
      doc,
      y
    ) + 8;

  y =
    tituloSecao(
      doc,
      "Máquinas e equipamentos",
      y
    );

  autoTable(
    doc,
    {
      startY: y,
      head: [
        [
          "Máquina",
          "Início",
          "Final",
          "Tempo",
        ],
      ],
      body:
        receita.maquinas.map(
          (
            maquina
          ) => [
            maquina.identificacao,
            maquina.horaInicio ||
              "-",
            maquina.horaFinal ||
              "-",
            formatarTempo(
              calcularMinutos(
                maquina.horaInicio,
                maquina.horaFinal
              )
            ),
          ]
        ),
      styles: {
        fontSize: 8,
      },
      margin: {
        left: 14,
        right: 14,
      },
    }
  );

  y =
    finalTabela(
      doc,
      y
    ) + 8;

  y =
    tituloSecao(
      doc,
      "Embalagens",
      y
    );

  autoTable(
    doc,
    {
      startY: y,
      head: [
        [
          "Embalagem",
          "Quantidade",
        ],
      ],
      body:
        receita.embalagens.map(
          (
            embalagem
          ) => [
            embalagem.identificacao,
            embalagem.quantidade ||
              "-",
          ]
        ),
      styles: {
        fontSize: 8,
      },
      margin: {
        left: 14,
        right: 14,
      },
    }
  );

  y =
    finalTabela(
      doc,
      y
    ) + 8;

  y =
    tituloSecao(
      doc,
      "Resumo Técnico da Produção",
      y
    );

  autoTable(
    doc,
    {
      startY: y,
      head: [
        [
          "Informação",
          "Resultado",
        ],
      ],
      body: [
        [
          "Massa crua",
          `${massaCrua.toLocaleString(
            "pt-BR",
            {
              maximumFractionDigits: 3,
            }
          )} KG`,
        ],
        [
          "Massa assada",
          `${massaAssada.toLocaleString(
            "pt-BR",
            {
              maximumFractionDigits: 3,
            }
          )} KG`,
        ],
        [
          "Perda da massa",
          `${perda.toLocaleString(
            "pt-BR",
            {
              maximumFractionDigits: 3,
            }
          )} KG`,
        ],
        [
          "Rendimento",
          `${rendimento.toLocaleString(
            "pt-BR",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}%`,
        ],
        [
          "Mão de obra",
          formatarTempo(
            totalMaoDeObra
          ),
        ],
        [
          "Máquinas",
          formatarTempo(
            totalMaquinas
          ),
        ],
      ],
      styles: {
        fontSize: 9,
      },
      margin: {
        left: 14,
        right: 14,
      },
    }
  );

  y =
    finalTabela(
      doc,
      y
    ) + 8;

  y =
    tituloSecao(
      doc,
      "Validade",
      y
    );

  autoTable(
    doc,
    {
      startY: y,
      body: [
        [
          "Sugestão",
          receita.validadeSugeridaDias
            ? `${receita.validadeSugeridaDias} dias`
            : "-",
        ],
        [
          "Conservação",
          receita.validadeConservacao ||
            "-",
        ],
        [
          "Motivo",
          receita.validadeMotivo ||
            "-",
        ],
        [
          "Referências",
          receita.validadeReferencias?.join(
            " | "
          ) || "-",
        ],
      ],
      styles: {
        fontSize: 8,
      },
      margin: {
        left: 14,
        right: 14,
      },
    }
  );

  y =
    finalTabela(
      doc,
      y
    ) + 10;

  y =
    adicionarTextoLongo(
      doc,
      "Modo de preparo - Produção",
      receita.modoPreparoProducao ||
        "-",
      y
    );

  adicionarTextoLongo(
    doc,
    "Modo de preparo - Cliente",
    receita.modoPreparoCliente ||
      "-",
    y
  );
}

async function exportarFichaPdf(
  receita: Receita
): Promise<void> {
  const doc =
    new jsPDF({
      orientation:
        "portrait",
      unit: "mm",
      format: "a4",
    });

  await adicionarFicha(
  doc,
  receita,
  false
);

  await adicionarFotos(
    doc,
    receita
  );

  doc.save(
    `Ficha_Tecnica_${nomeArquivo(
      receita.codigoProduto ||
        receita.nomeProduto ||
        "receita"
    )}.pdf`
  );
}

async function exportarFichasPdf(
  receitas: Receita[]
): Promise<void> {
  if (
    receitas.length === 0
  ) {
    return;
  }

  const doc =
    new jsPDF({
      orientation:
        "portrait",
      unit: "mm",
      format: "a4",
    });

  for (
    let index = 0;
    index <
    receitas.length;
    index++
  ) {
    const receita =
      receitas[index];

    await adicionarFicha(
  doc,
  receita,
  index > 0
);

    await adicionarFotos(
      doc,
      receita
    );
  }

  doc.save(
    "Fichas_Tecnicas_Roca_Coleta.pdf"
  );
}

function exportarFichasExcel(
  receitas: Receita[]
): void {
  if (receitas.length === 0) {
    return;
  }

  const linhas: (
    | string
    | number
  )[][] = [];

  receitas.forEach(
    (
      receita,
      indiceReceita
    ) => {
      const massaCrua =
        receita.pesoTotalIngredientes ||
        0;

      const massaAssada =
        converterNumero(
          receita.pesoTotalProduzido
        );

      const perdaMassa =
        massaCrua > 0
          ? Math.max(
              massaCrua -
                massaAssada,
              0
            )
          : 0;

      const rendimento =
        massaCrua > 0
          ? (
              massaAssada /
              massaCrua
            ) *
            100
          : 0;

      const quantidadeProduzida =
        converterNumero(
          receita.quantidadeProduzida
        );

      const pesoMedioUnidade =
        quantidadeProduzida > 0 &&
        massaAssada > 0
          ? massaAssada /
            quantidadeProduzida
          : 0;

      const totalMaoDeObra =
        receita.cargosEnvolvidos.reduce(
          (
            total,
            cargo
          ) =>
            total +
            calcularMinutos(
              cargo.horaInicio,
              cargo.horaFinal
            ),
          0
        );

      const totalMaquinas =
        receita.maquinas.reduce(
          (
            total,
            maquina
          ) =>
            total +
            calcularMinutos(
              maquina.horaInicio,
              maquina.horaFinal
            ),
          0
        );

      if (indiceReceita > 0) {
        linhas.push([]);
        linhas.push([]);
      }

      linhas.push([
        "FICHA TÉCNICA",
      ]);

      linhas.push([
        "Código",
        receita.codigoProduto ||
          "-",
      ]);

      linhas.push([
        "Receita",
        receita.nomeProduto ||
          "-",
      ]);

      linhas.push([
        "Departamento",
        receita.departamento ||
          "-",
      ]);

      linhas.push([
        "Seção",
        receita.secao ||
          "-",
      ]);

      linhas.push([
        "Data da Coleta",
        formatarData(
          receita.dataColeta
        ),
      ]);

      linhas.push([
        "Responsável",
        receita.responsavelColeta ||
          "-",
      ]);

      linhas.push([
        "Estoque Congelado",
        receita.estoqueCongelado ||
          "-",
      ]);

      linhas.push([
        "Criada em",
        receita.criadoEm
          ? new Date(
              receita.criadoEm
            ).toLocaleString(
              "pt-BR"
            )
          : "-",
      ]);

      linhas.push([
        "Última Atualização",
        receita.atualizadoEm
          ? new Date(
              receita.atualizadoEm
            ).toLocaleString(
              "pt-BR"
            )
          : "-",
      ]);

      linhas.push([]);

      linhas.push([
        "RESUMO TÉCNICO / TOTAIS",
      ]);

      linhas.push([
        "Informação",
        "Resultado",
      ]);

      linhas.push([
        "Quantidade Produzida",
        `${receita.quantidadeProduzida || "-"} ${receita.unidadeMedidaProduto || ""}`,
      ]);

      linhas.push([
        "Peso Total Produzido",
        `${receita.pesoTotalProduzido || "-"} ${receita.unidadePesoProduzido || ""}`,
      ]);

      linhas.push([
        "Massa Crua",
        massaCrua,
        "KG",
      ]);

      linhas.push([
        "Massa Assada",
        massaAssada,
        "KG",
      ]);

      linhas.push([
        "Perda da Massa",
        perdaMassa,
        "KG",
      ]);

      linhas.push([
        "Rendimento da Massa",
        Number(
          rendimento.toFixed(
            2
          )
        ),
        "%",
      ]);

      linhas.push([
        "Peso Médio por Unidade",
        pesoMedioUnidade > 0
          ? pesoMedioUnidade <
            1
            ? Number(
                (
                  pesoMedioUnidade *
                  1000
                ).toFixed(
                  2
                )
              )
            : Number(
                pesoMedioUnidade.toFixed(
                  3
                )
              )
          : 0,
        pesoMedioUnidade > 0 &&
        pesoMedioUnidade < 1
          ? "g"
          : "KG",
      ]);

      linhas.push([
        "Mão de Obra Total",
        formatarTempo(
          totalMaoDeObra
        ),
      ]);

      linhas.push([
        "Mão de Obra Total em Minutos",
        totalMaoDeObra,
      ]);

      linhas.push([
        "Máquinas Total",
        formatarTempo(
          totalMaquinas
        ),
      ]);

      linhas.push([
        "Máquinas Total em Minutos",
        totalMaquinas,
      ]);

      linhas.push([]);

      linhas.push([
        "INGREDIENTES",
      ]);

      linhas.push([
        "Ingrediente",
        "Quantidade Utilizada",
        "Unidade",
        "Sobra",
        "Unidade Sobra",
        "Módulo",
      ]);

      receita.ingredientes.forEach(
        (
          ingrediente
        ) => {
          linhas.push([
            ingrediente.identificacao ||
              "-",
            ingrediente.quantidadeUtilizada ||
              "-",
            ingrediente.unidadeMedida ||
              "-",
            ingrediente.sobra ||
              "-",
            ingrediente.sobra
              ? ingrediente.unidadeMedida
              : "-",
            ingrediente.modulo ===
            "MASSA"
              ? "Massa"
              : "Cobertura / Acabamento",
          ]);
        }
      );

      linhas.push([]);

      linhas.push([
        "CARGOS ENVOLVIDOS",
      ]);

      linhas.push([
        "Cargo",
        "Hora Início",
        "Hora Final",
        "Tempo Individual",
        "Minutos",
      ]);

      receita.cargosEnvolvidos.forEach(
        (
          cargo
        ) => {
          const minutos =
            calcularMinutos(
              cargo.horaInicio,
              cargo.horaFinal
            );

          linhas.push([
            cargo.identificacao ||
              "-",
            cargo.horaInicio ||
              "-",
            cargo.horaFinal ||
              "-",
            formatarTempo(
              minutos
            ),
            minutos,
          ]);
        }
      );

      linhas.push([
        "TOTAL MÃO DE OBRA",
        "",
        "",
        formatarTempo(
          totalMaoDeObra
        ),
        totalMaoDeObra,
      ]);

      linhas.push([]);

      linhas.push([
        "MÁQUINAS E EQUIPAMENTOS",
      ]);

      linhas.push([
        "Máquina / Equipamento",
        "Hora Início",
        "Hora Final",
        "Tempo Individual",
        "Minutos",
      ]);

      receita.maquinas.forEach(
        (
          maquina
        ) => {
          const minutos =
            calcularMinutos(
              maquina.horaInicio,
              maquina.horaFinal
            );

          linhas.push([
            maquina.identificacao ||
              "-",
            maquina.horaInicio ||
              "-",
            maquina.horaFinal ||
              "-",
            formatarTempo(
              minutos
            ),
            minutos,
          ]);
        }
      );

      linhas.push([
        "TOTAL MÁQUINAS",
        "",
        "",
        formatarTempo(
          totalMaquinas
        ),
        totalMaquinas,
      ]);

      linhas.push([]);

      linhas.push([
        "EMBALAGENS UTILIZADAS",
      ]);

      linhas.push([
        "Embalagem",
        "Quantidade",
      ]);

      receita.embalagens.forEach(
        (
          embalagem
        ) => {
          linhas.push([
            embalagem.identificacao ||
              "-",
            embalagem.quantidade ||
              "-",
          ]);
        }
      );

      linhas.push([]);

      linhas.push([
        "VALIDADE",
      ]);

      linhas.push([
        "Validade Sugerida",
        receita.validadeSugeridaDias
          ? `${receita.validadeSugeridaDias} dias`
          : "-",
      ]);

      linhas.push([
        "Conservação",
        receita.validadeConservacao ||
          "-",
      ]);

      linhas.push([
        "Motivo",
        receita.validadeMotivo ||
          "-",
      ]);

      linhas.push([
        "Referências",
        receita.validadeReferencias?.join(
          " | "
        ) || "-",
      ]);

      linhas.push([]);

      linhas.push([
        "MODO DE PREPARO - PRODUÇÃO",
      ]);

      linhas.push([
        receita.modoPreparoProducao ||
          "-",
      ]);

      linhas.push([]);

      linhas.push([
        "MODO DE PREPARO - CLIENTE",
      ]);

      linhas.push([
        receita.modoPreparoCliente ||
          "-",
      ]);

      linhas.push([]);

      linhas.push([
        "FOTOS REGISTRADAS",
      ]);

      linhas.push([
        "Categoria",
        "Nome",
        "Legenda",
      ]);

      receita.fotos?.forEach(
        (
          foto
        ) => {
          linhas.push([
            foto.categoria ===
            "PRODUTO_FINAL"
              ? "Produto Final"
              : "Ingredientes / Preparação",
            foto.nome ||
              "-",
            foto.legenda ||
              "-",
          ]);
        }
      );
    }
  );

  const planilha =
    XLSX.utils.aoa_to_sheet(
      linhas
    );

  planilha["!cols"] = [
    { wch: 35 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 25 },
  ];

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    planilha,
    "Fichas Técnicas"
  );

  XLSX.writeFile(
    workbook,
    "Fichas_Tecnicas_Roca_Coleta.xlsx"
  );
}

export const exportacaoFichaService = {
  exportarFichaPdf,
  exportarFichasPdf,
  exportarFichasExcel,
};  