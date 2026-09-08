function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}




// ==========================
// ALTERNAR ABAS
// ==========================

const btnVisao  = document.getElementById("btnVisao");
const btnDiario = document.getElementById("btnDiario");
const abaVisao  = document.getElementById("abaVisao");
const abaDiario = document.getElementById("abaDiario");

const btnAlertas = document.getElementById("btnAlertas");
const abaAlertas = document.getElementById("abaAlertas");

function mostrarAba(botaoAtivo, secaoAtiva) {
    [btnVisao, btnDiario, btnAlertas].forEach(b => b.classList.remove("ativa"));
    [abaVisao, abaDiario, abaAlertas].forEach(s => s.style.display = "none");
    botaoAtivo.classList.add("ativa");
    secaoAtiva.style.display = "block";
}

btnVisao.addEventListener("click", () => mostrarAba(btnVisao, abaVisao));
btnDiario.addEventListener("click", () => mostrarAba(btnDiario, abaDiario));
btnAlertas.addEventListener("click", () => {
    mostrarAba(btnAlertas, abaAlertas);
    carregarAlertas();
});


// ==========================
// TRADUÇÃO MANUAL
// ==========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    "registrados este mês":                "registered this month",
    "igual ao mês passado":                 "same as last month",
    "por episódio":                         "per episode",
    "igual a ontem":                        "same as yesterday",
    "registrados hoje":                     "registered today",
    "0 min":                                "0 min",
    "0 s":                                  "0 s",
    "Nenhum relatório encontrado.":         "No report found.",
    "Nenhum relatório preenchido ainda.":   "No report filled in yet.",
    "Fazer relatório agora":                "Fill report now",
    "Ambientes barulhentos":                "Noisy environments",
    "Locais lotados":                       "Crowded places",
    "Mudanças de rotina":                   "Routine changes",
    "Texturas de alimentos":                "Food textures",
    "Sem dados suficientes ainda":          "Not enough data yet",
    "Dom": "Sun", "Seg": "Mon", "Ter": "Tue", "Qua": "Wed",
    "Qui": "Thu", "Sex": "Fri", "Sáb": "Sat",
    "Crises registradas":                   "Recorded crises",
    "Hoje":                                 "Today",
    "Ver no mapa":                          "View on map",
    "Não disponível":                       "Not available",
    "Nenhuma crise registrada neste dia.":  "No crisis recorded on this day.",
    "Não foi possível carregar os alertas.": "Could not load alerts."
};

function traduzir(texto) {
    if (idiomaAtual === "pt" || texto == null) return texto;
    if (dicionario[texto]) return dicionario[texto];

    return String(texto)
        .replace("comparado ao mês passado", "compared to last month")
        .replace("comparado a ontem", "compared to yesterday");
}

function aplicarIdiomaEstatico() {
    document.querySelectorAll("[data-pt]").forEach(el => {
        el.textContent = idiomaAtual === "en"
            ? (el.dataset.en || el.dataset.pt)
            : el.dataset.pt;
    });

    document.getElementById("textoTradutor").textContent =
        idiomaAtual === "en" ? "Traduzir para o português" : "Translate to English";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);

    aplicarIdiomaEstatico();

    if (ultimosDadosRelatorio) {
        preencherCards(ultimosDadosRelatorio);
        renderizarGraficos(ultimosDadosRelatorio);
        preencherDiario(ultimosDadosRelatorio);
    }
});


// ==========================
// DADOS DO USUÁRIO
// ==========================

async function carregarUsuario() {
    try {
        const resposta = await fetch("/api/home");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) return;

        const usuario = await resposta.json();

        document.getElementById("nomeUsuario").textContent =
            usuario.nome || "Usuário";

        document.getElementById("tipoConta").textContent =
            usuario.tipoConta || "Responsável";

        if (usuario.fotoPerfil) {
            document.getElementById("fotoUsuario").src = usuario.fotoPerfil;
        }

    } catch (e) {
        console.log("Erro ao carregar usuário:", e);
    }
}


// ==========================
// DADOS DOS RELATÓRIOS
// ==========================

let ultimosDadosRelatorio = null;

async function carregarRelatorios() {
    try {
        const resposta = await fetch("/api/relatorios");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) {
            usarDadosExemplo();
            return;
        }

        const dados = await resposta.json();
        ultimosDadosRelatorio = dados;

        preencherCards(dados);
        renderizarGraficos(dados);
        preencherDiario(dados);

    } catch (e) {
        console.log("Erro ao carregar relatórios:", e);
        usarDadosExemplo();
    }
}

function usarDadosExemplo() {

    const dadosExemplo = {
        alertas: 18,
        comparativoAlertas: "↓ 2 comparado ao mês passado",
        tempo: "120 min",
        comparativoTempo: "↑ 1 min comparado ao mês passado",

        graficoEstresse: {
            labels: ["Sex", "Sáb", "Dom", "Seg", "Ter", "Qua", "Qui"],
            dados:  [3, 2, 5, 7, 8, 4, 2]
        },

        graficoGatilhos: {
            labels: [
                "Ambientes barulhentos",
                "Locais lotados",
                "Mudanças de rotina",
                "Texturas de alimentos"
            ],
            dados:  [42, 28, 18, 12],
            cores:  ["#32C26D", "#0AB7FB", "#1D8EC9", "#C2C2C2"]
        },

        graficoEvolucao: {
            labels: ["Sex", "Sáb", "Dom", "Seg", "Ter", "Qua", "Qui"],
            dados:  [2, 3, 4, 5, 8, 4, 2]
        },

        dataRelatorio: "Hoje, 05 de julho de 2026",
        perguntas: [
            { pergunta: "Como a criança se sentiu hoje?",              resposta: "Feliz"      },
            { pergunta: "Em qual período houve mais desconforto?",      resposta: "Manhã"      },
            { pergunta: "A pelúcia foi apertada com força?",            resposta: "Sim"        },
            { pergunta: "A criança conseguiu se acalmar facilmente?",   resposta: "Não"        },
            { pergunta: "Houve algum fator que causou desconforto?",    resposta: "Barulho"    },
            { pergunta: "Como foi o comportamento geral?",              resposta: "Tranquilo"  }
        ]
    };

    ultimosDadosRelatorio = dadosExemplo;

    preencherCards(dadosExemplo);
    renderizarGraficos(dadosExemplo);
    preencherDiario(dadosExemplo);

}


// ==========================
// PREENCHER CARDS
// ==========================

function preencherCards(dados) {

    document.getElementById("alertasEstresse").textContent =
        dados.alertas ?? 0;

    document.getElementById("comparativoAlertas").textContent =
        traduzir(dados.comparativoAlertas || "registrados este mês");

    document.getElementById("tempoEstresse").textContent =
        dados.tempo || "0 min";

    document.getElementById("comparativoTempo").textContent =
        traduzir(dados.comparativoTempo || "por episódio");

    document.getElementById("alertasEstresseDiario").textContent =
        dados.alertasHoje ?? 0;

    document.getElementById("comparativoAltasDiario").textContent =
        traduzir(dados.comparativoAlertasDiario || "registrados hoje");

    document.getElementById("tempoEstresseDiario").textContent =
        dados.tempoDiario || "0 min";

    document.getElementById("comparativoTempoDiario").textContent =
        traduzir(dados.comparativoTempo || "por episódio");

}


// ==========================
// GRÁFICOS COM CHART.JS
// ==========================

let graficos = {};
let dadosEstresseGlobal = null;
let dadosGatilhosGlobal = null;
let dadosEvolucaoGlobal = null;

let tipoAtualEstresse = "bar";
let tipoAtualGatilhos = "doughnut";
let tipoAtualEvolucao = "line";

const VERDE = "#32C26D";
const AZUL  = "#0AB7FB";

    // ==========================
// SELETOR DE TIPO DE GRÁFICO (dropdown)
// ==========================

const iconesPorTipo = {
    bar: "fa-chart-column",
    line: "fa-chart-line",
    doughnut: "fa-circle-dot",
    pie: "fa-chart-pie"
};

function alternarSeletorTipo(idSeletor) {

    // Fecha qualquer outro seletor aberto antes de abrir este
    document.querySelectorAll(".seletor-tipo").forEach(seletor => {
        if (seletor.id !== idSeletor) {
            seletor.classList.remove("aberto");
            const btn = seletor.querySelector(".seletor-tipo__atual");
            if (btn) btn.setAttribute("aria-expanded", "false");
        }
    });

    const seletor = document.getElementById(idSeletor);
    if (!seletor) return;

    const estaAberto = seletor.classList.toggle("aberto");
    const btnAtual = seletor.querySelector(".seletor-tipo__atual");
    if (btnAtual) btnAtual.setAttribute("aria-expanded", estaAberto.toString());

}

// Fecha o seletor aberto ao clicar fora dele
document.addEventListener("click", (e) => {
    document.querySelectorAll(".seletor-tipo.aberto").forEach(seletor => {
        if (!seletor.contains(e.target)) {
            seletor.classList.remove("aberto");
            const btn = seletor.querySelector(".seletor-tipo__atual");
            if (btn) btn.setAttribute("aria-expanded", "false");
        }
    });
});

function selecionarTipoGrafico(grafico, tipo) {

    const mapaFuncoes = {
        estresse: criarGraficoEstresse,
        gatilhos: criarGraficoGatilhos,
        evolucao: criarGraficoEvolucao
    };

    const mapaIconeId = {
        estresse: "iconeAtualEstresse",
        gatilhos: "iconeAtualGatilhos",
        evolucao: "iconeAtualEvolucao"
    };

    const mapaSeletorId = {
        estresse: "seletorEstresse",
        gatilhos: "seletorGatilhos",
        evolucao: "seletorEvolucao"
    };

    if (grafico === "estresse") tipoAtualEstresse = tipo;
    if (grafico === "gatilhos") tipoAtualGatilhos = tipo;
    if (grafico === "evolucao") tipoAtualEvolucao = tipo;

    const funcaoCriar = mapaFuncoes[grafico];
    if (funcaoCriar) funcaoCriar(tipo);

    // Atualiza o ícone exibido no botão para refletir o tipo escolhido
    const icone = document.getElementById(mapaIconeId[grafico]);
    if (icone) {
        Object.values(iconesPorTipo).forEach(classe => icone.classList.remove(classe));
        icone.classList.add(iconesPorTipo[tipo]);
    }

    // Fecha o menu depois de escolher
    const seletor = document.getElementById(mapaSeletorId[grafico]);
    if (seletor) {
        seletor.classList.remove("aberto");
        const btn = seletor.querySelector(".seletor-tipo__atual");
        if (btn) btn.setAttribute("aria-expanded", "false");
    }

}

function renderizarGraficos(dados) {

    dadosEstresseGlobal = dados.graficoEstresse;
    dadosGatilhosGlobal = dados.graficoGatilhos;
    dadosEvolucaoGlobal = dados.graficoEvolucao;

    Object.values(graficos).forEach(g => g.destroy());
    graficos = {};

    criarGraficoEstresse(tipoAtualEstresse);
    criarGraficoGatilhos(tipoAtualGatilhos);
    criarGraficoEvolucao(tipoAtualEvolucao);


}

function criarGraficoEstresse(tipo) {

    if (graficos.estresse) {
        graficos.estresse.destroy();
    }

    const ctx = document.getElementById("graficoEstresse").getContext("2d");
    const dadosArr = dadosEstresseGlobal?.dados || [];
    const labelsArr = (dadosEstresseGlobal?.labels || []).map(traduzir);

    const cores = dadosArr.map(v =>
        v === Math.max(...dadosArr) ? "#E53E3E" :
        v > 5 ? "#F6AD55" : VERDE
    );

    const gradiente = ctx.createLinearGradient(0, 0, 0, 300);
    gradiente.addColorStop(0, "rgba(50, 194, 109, 0.35)");
    gradiente.addColorStop(1, "rgba(50, 194, 109, 0)");

    graficos.estresse = new Chart(ctx, {
        type: tipo,
        data: {
            labels: labelsArr,
            datasets: [{
                label:           "Alertas",
                data:            dadosArr,
                backgroundColor: tipo === "line" ? gradiente : cores,
                borderColor:     tipo === "line" ? VERDE : cores,
                borderWidth:     tipo === "line" ? 2.5 : 0,
                borderRadius:    tipo === "bar" ? 6 : 0,
                pointBackgroundColor: tipo === "line"
                    ? dadosArr.map(v => v === Math.max(...dadosArr) ? "#E53E3E" : VERDE)
                    : undefined,
                pointRadius: tipo === "line" ? 5 : undefined,
                tension:     tipo === "line" ? 0.4 : undefined,
                fill:        tipo === "line" ? true : false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 2 } }
            }
        }
    });
}

function criarGraficoGatilhos(tipo) {

    if (graficos.gatilhos) {
        graficos.gatilhos.destroy();
    }

    const gatilhos = dadosGatilhosGlobal || { labels: [], dados: [], cores: [] };
    const labelsArr = (gatilhos.labels || []).map(traduzir);
    const legenda  = document.getElementById("legendaGatilhos");
    const ehRosca  = tipo === "doughnut" || tipo === "pie";

    const ctx = document.getElementById("graficoGatilhos").getContext("2d");

    graficos.gatilhos = new Chart(ctx, {
        type: tipo,
        data: {
            labels: labelsArr,
            datasets: [{
                data:            gatilhos.dados,
                backgroundColor: gatilhos.cores || [VERDE, AZUL, "#1D8EC9", "#C2C2C2"],
                borderWidth:     0,
                hoverOffset:     8,
                borderRadius:    tipo === "bar" ? 6 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: tipo === "doughnut" ? "65%" : 0,
            plugins: {
                legend: { display: tipo === "bar" ? true : false }
            },
            scales: tipo === "bar"
                ? { y: { beginAtZero: true } }
                : {}
        }
    });

    if (legenda) {
        if (ehRosca) {
            legenda.innerHTML = "";
            gatilhos.labels.forEach((label, i) => {
                legenda.innerHTML += `
                    <div class="legenda-item">
                        <span class="legenda-cor" style="background:${gatilhos.cores[i] || VERDE}"></span>
                        <span>${escaparHTML(traduzir(label))} ${escaparHTML(gatilhos.dados[i])}%</span>
                    </div>
                `;
            });
            legenda.style.display = "flex";
        } else {
            legenda.style.display = "none";
        }
    }
}


function criarGraficoEvolucao(tipo) {

    if (graficos.evolucao) {
        graficos.evolucao.destroy();
    }

    const ctx = document.getElementById("graficoEvolucao").getContext("2d");
    const dadosArr = dadosEvolucaoGlobal?.dados || [];
    const labelsArr = (dadosEvolucaoGlobal?.labels || []).map(traduzir);

    const gradiente = ctx.createLinearGradient(0, 0, 0, 300);
    gradiente.addColorStop(0, "rgba(50, 194, 109, 0.35)");
    gradiente.addColorStop(1, "rgba(50, 194, 109, 0)");

    graficos.evolucao = new Chart(ctx, {
        type: tipo,
        data: {
            labels: labelsArr,
            datasets: [{
                label:           "Índice de crise sensorial",
                data:            dadosArr,
                borderColor:     VERDE,
                backgroundColor: tipo === "line" ? gradiente : VERDE,
                borderWidth:     tipo === "line" ? 2.5 : 0,
                borderRadius:    tipo === "bar" ? 6 : 0,
                pointBackgroundColor: tipo === "line"
                    ? dadosArr.map(v => v === Math.max(...dadosArr) ? "#E53E3E" : VERDE)
                    : undefined,
                pointRadius: tipo === "line" ? 5 : undefined,
                tension:     tipo === "line" ? 0.4 : undefined,
                fill:        tipo === "line" ? true : false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (contexto) => `Índice: ${contexto.parsed.y.toFixed(1)} / 10`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: { stepSize: 2 }
                }
            }
        }
    });
}





    

// Colapsa os cards automaticamente só na primeira carga em telas mobile —
// não repete a cada atualização automática (setInterval), senão fecharia
// de novo um card que o usuário tinha aberto manualmente
let colapsoJaAplicado = false;



// ==========================
// PREENCHER ABA DIÁRIO
// ==========================

function preencherDiario(dados) {

    document.getElementById("dataRelatorio").textContent =
        traduzir(dados.dataRelatorio || "Nenhum relatório encontrado.");

    const lista = document.getElementById("listaPerguntas");
    lista.innerHTML = "";

    if (!dados.perguntas || dados.perguntas.length === 0) {

        const textoVazio = traduzir("Nenhum relatório preenchido ainda.");
        const textoLink  = traduzir("Fazer relatório agora");

        lista.innerHTML = `
            <p class="sem-dados">
                ${textoVazio}
                <a href="/RelatorioDiario">${textoLink}</a>
            </p>
        `;

        return;

    }

    dados.perguntas.forEach(item => {
        const div = document.createElement("div");
        div.className = "pergunta-item";
        div.innerHTML = `
            <span class="pergunta-texto">${escaparHTML(item.pergunta)}</span>
            <span class="pergunta-badge">${escaparHTML(item.resposta)}</span>
        `;
        lista.appendChild(div);
    });

}

let dataAlertasSelecionada = new Date();

function formatarDataISO(data) {
    return data.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); // "YYYY-MM-DD"
}

function atualizarLabelDataAlertas() {
    const hoje       = formatarDataISO(new Date());
    const selecionada = formatarDataISO(dataAlertasSelecionada);
    const label = document.getElementById("dataAlertasAtual");

    label.textContent = selecionada === hoje
        ? traduzir("Hoje")
        : dataAlertasSelecionada.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

async function carregarAlertas() {

    const corpoTabela = document.getElementById("corpoTabelaAlertas");
    corpoTabela.innerHTML = `<tr><td colspan="3">${traduzir("Carregando...")}</td></tr>`;

    atualizarLabelDataAlertas();

    try {
        const dataISO = formatarDataISO(dataAlertasSelecionada);
        const resposta = await fetch(`/api/alertas?data=${dataISO}`);

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) {
            corpoTabela.innerHTML = `<tr><td colspan="3">${traduzir("Não foi possível carregar os alertas.")}</td></tr>`;
            return;
        }

        const dados = await resposta.json();
        const crises = dados.crises || [];

        if (crises.length === 0) {
            corpoTabela.innerHTML = `<tr><td colspan="3">${traduzir("Nenhuma crise registrada neste dia.")}</td></tr>`;
            return;
        }

        corpoTabela.innerHTML = crises.map(c => `
            <tr>
                <td>${escaparHTML(c.horario)}</td>
                <td>${(c.latitude && c.longitude)
                    ? `<a href="https://www.google.com/maps?q=${encodeURIComponent(c.latitude)},${encodeURIComponent(c.longitude)}" target="_blank" rel="noopener">${traduzir("Ver no mapa")}</a>`
                    : traduzir("Não disponível")}</td>
                <td>${escaparHTML(c.forca)}</td>
            </tr>
        `).join("");

    } catch (erro) {
        console.log("Erro ao carregar alertas:", erro);
        corpoTabela.innerHTML = `<tr><td colspan="3">${traduzir("Não foi possível carregar os alertas.")}</td></tr>`;
    }
}

document.getElementById("btnDiaAnterior").addEventListener("click", () => {
    dataAlertasSelecionada.setDate(dataAlertasSelecionada.getDate() - 1);
    carregarAlertas();
});

document.getElementById("btnProximoDia").addEventListener("click", () => {
    dataAlertasSelecionada.setDate(dataAlertasSelecionada.getDate() + 1);
    carregarAlertas();
});


// ==========================
// NOTIFICAÇÕES
// ==========================

const painelNotificacoes = document.getElementById("painelNotificacoes");
const listaNotificacoes  = document.getElementById("listaNotificacoes");

function formatarItemNotificacao(item) {
    const classeExtra = item.lida ? "" : "nao-lida";
    return `
        <div class="item-notificacao ${classeExtra}">
            ${escaparHTML(item.mensagem)}
            <span class="tempo-notificacao">${escaparHTML(item.tempo)}</span>
        </div>
    `;
}

async function carregarNotificacoes() {
    try {
        const resposta = await fetch("/api/notificacoes");
        if (!resposta.ok) throw new Error();

        const dados = await resposta.json();
        const itens = dados.notificacoes || [];

        listaNotificacoes.innerHTML = itens.length === 0
            ? `<div class="painel-vazio">Nenhuma notificação por enquanto.</div>`
            : itens.map(formatarItemNotificacao).join("");

        const naoLidas = itens.filter(item => !item.lida).length;
        document.getElementById("quantidadeNotificacoes").textContent = naoLidas;

    } catch (erro) {
        console.log("Erro ao carregar notificações:", erro);
        listaNotificacoes.innerHTML = `<div class="painel-vazio">Não foi possível carregar as notificações.</div>`;
    }
}

async function marcarNotificacoesComoLidas() {
    try {
        await fetch("/api/notificacoes/marcar-lidas", { method: "POST" });
        document.getElementById("quantidadeNotificacoes").textContent = "0";
    } catch (erro) {
        console.log("Erro ao marcar notificações como lidas:", erro);
    }
}

document.getElementById("btnNotificacoes").addEventListener("click", async (e) => {
    e.stopPropagation();

    const estaAberto = painelNotificacoes.classList.contains("aberto");
    if (estaAberto) {
        painelNotificacoes.classList.remove("aberto");
        return;
    }

    painelNotificacoes.classList.add("aberto");
    await carregarNotificacoes();
    marcarNotificacoesComoLidas();
});

document.addEventListener("click", (e) => {
    if (!painelNotificacoes.contains(e.target)) {
        painelNotificacoes.classList.remove("aberto");
    }
});


// ==========================
// INICIALIZAÇÃO
// ==========================

aplicarIdiomaEstatico();
carregarUsuario();
carregarRelatorios();
carregarNotificacoes();

// Atualiza os alertas/tempo de estresse automaticamente, sem precisar recarregar a página
// (útil para acompanhar em tempo real quando o Bixuco físico registra um novo evento)
setInterval(carregarRelatorios, 10000);

// Substitui os antigos onclick inline (removidos por causa do CSP)

document.getElementById("btnRelatorioDiario").addEventListener("click", () => {
    location.href = "/RelatorioDiario";
});

document.getElementById("fotoUsuario").addEventListener("click", () => {
    window.location.href = "/perfil";
});

document.getElementById("fotoUsuario").addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

document.getElementById("blocoNomeUsuario").addEventListener("click", () => {
    window.location.href = "/perfil";
});

document.getElementById("btnToggleEstresse").addEventListener("click", () => {
    alternarSeletorTipo("seletorEstresse");
});

document.getElementById("btnToggleGatilhos").addEventListener("click", () => {
    alternarSeletorTipo("seletorGatilhos");
});

document.getElementById("btnToggleEvolucao").addEventListener("click", () => {
    alternarSeletorTipo("seletorEvolucao");
});

document.getElementById("btnEstresseBar").addEventListener("click", () => {
    selecionarTipoGrafico("estresse", "bar");
});

document.getElementById("btnEstresseLine").addEventListener("click", () => {
    selecionarTipoGrafico("estresse", "line");
});

document.getElementById("btnGatilhosDoughnut").addEventListener("click", () => {
    selecionarTipoGrafico("gatilhos", "doughnut");
});

document.getElementById("btnGatilhosPie").addEventListener("click", () => {
    selecionarTipoGrafico("gatilhos", "pie");
});

document.getElementById("btnGatilhosBar").addEventListener("click", () => {
    selecionarTipoGrafico("gatilhos", "bar");
});

document.getElementById("btnEvolucaoLine").addEventListener("click", () => {
    selecionarTipoGrafico("evolucao", "line");
});

document.getElementById("btnEvolucaoBar").addEventListener("click", () => {
    selecionarTipoGrafico("evolucao", "bar");
});