
function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

// =========================
// TRADUÇÃO MANUAL — dicionário para textos montados via JS
// =========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    semNotificacoes:    { pt: "Nenhuma notificação por enquanto.",              en: "No notifications yet." },
    erroCarregarNotif:   { pt: "Não foi possível carregar.",                    en: "Couldn't load notifications." },
    carregando:           { pt: "Carregando...",                               en: "Loading..." },
    semRelatorioDia:       { pt: "Não teve relatório disponível nesse dia.",    en: "No report available on this day." },
    erroCarregarDia:        { pt: "Erro ao carregar esse dia. Tente novamente.", en: "Error loading this day. Try again." },
    digiteNota:               { pt: "Digite uma nota antes de salvar.",         en: "Type a note before saving." },
    erroSalvarNota:            { pt: "Erro ao salvar a nota. Tente novamente.", en: "Error saving the note. Try again." },
    salvando:                   { pt: "Salvando...",                           en: "Saving..." },
    salvarNotaTxt:                { pt: "Salvar nota",                         en: "Save note" },
};

function t(chave) {
    const entrada = dicionario[chave];
    return idiomaAtual === "en" ? entrada.en : entrada.pt;
}


// =========================
// COPIAR CÓDIGO DO TERAPEUTA
// =========================

function copiarCodigo() {
    const codigo = document.getElementById("codigoTerapeuta").textContent;
    if (!codigo || codigo === "---") return;

    navigator.clipboard.writeText(codigo).then(() => {
        const icone = document.querySelector("#btnCodigoCopiar .fa-copy");
        if (icone) {
            icone.classList.remove("fa-regular", "fa-copy");
            icone.classList.add("fa-solid", "fa-check");
            setTimeout(() => {
                icone.classList.remove("fa-solid", "fa-check");
                icone.classList.add("fa-regular", "fa-copy");
            }, 2000);
        }
    });
}


// =========================
// PEGA O ID DO PACIENTE DA URL
// Ex: /relatoriosTerapeuta?paciente=42
// =========================
const params     = new URLSearchParams(window.location.search);
const pacienteId = params.get("paciente");
const dataParam  = params.get("data"); // "YYYY-MM-DD" opcional — abre direto nesse dia

if (!pacienteId) {
    window.location.href = "/relatoriosTerapeutaS";
}

// =========================
// CARREGAR DADOS DO TERAPEUTA (topo)
// =========================
async function carregarTerapeuta() {
    try {
        const resposta = await fetch("/api/home-terapeuta");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) return;

        const dados = await resposta.json();

        document.getElementById("nomeTerapeuta").textContent   = dados.nome || "Terapeuta";
        document.getElementById("codigoTerapeuta").textContent = dados.codigoTerapeuta || "---";

        if (dados.fotoPerfil) {
            document.getElementById("fotoUsuario").src = dados.fotoPerfil;
        }

        const badge = document.getElementById("badgeNotificacoes");
        if (dados.notificacoes > 0) {
            badge.textContent   = dados.notificacoes;
            badge.style.display = "inline";
        }

    } catch (e) {
        console.log("Erro ao carregar terapeuta:", e);
    }
}

// =========================
// CARREGAR RELATÓRIO DO PACIENTE (cards + gráficos do mês, fixos)
// =========================
async function carregarRelatorio() {
    try {
        const resposta = await fetch(`/api/relatorio-paciente?paciente=${pacienteId}`);

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) throw new Error("Falha ao carregar relatório");

        const dados = await resposta.json();

        document.getElementById("nomePaciente").textContent =
            dados.nomePaciente || "Paciente";

        preencherCards(dados);
        renderizarGraficos(dados);

    } catch (e) {
        console.log("Erro ao carregar relatório:", e);
        usarDadosExemplo();
    }
}

// =========================
// DADOS DE EXEMPLO (fallback só em caso de erro de rede/servidor)
// =========================
function usarDadosExemplo() {

    document.getElementById("nomePaciente").textContent = "Paciente";

    const dadosExemplo = {
        alertas: 18,
        comparativoAlertas: "↓ 2 comparado ao mês passado",
        tempo: "120 min",
        comparativoTempo:   "↑ 1 min comparado ao mês passado",
        graficoEstresse:    { labels: ["Sex","Sáb","Dom","Seg","Ter","Qua","Qui"], dados: [3,2,5,7,8,4,2] },
        graficoGatilhos:    { labels: ["Ambientes barulhentos","Locais lotados","Mudanças de rotina","Texturas"], dados: [42,28,18,12], cores: ["#32C26D","#0AB7FB","#1D8EC9","#C2C2C2"] }
    };

    preencherCards(dadosExemplo);
    renderizarGraficos(dadosExemplo);
}

// =========================
// PREENCHER CARDS
// =========================
function preencherCards(dados) {

    const alertaEl = document.getElementById("alertasEstresse");
    const seta     = dados.alertas > 0 ? "fa-arrow-up" : "fa-arrow-down";
    const classe   = dados.alertas > 0 ? "negativo" : "positivo";

    alertaEl.className = `valor ${classe}`;
    alertaEl.innerHTML = `<i class="fa-solid ${seta}"></i> ${dados.alertas ?? 0}`;

    document.getElementById("comparativoAlertas").textContent =
        dados.comparativoAlertas || "";

    document.getElementById("tempoEstresse").textContent =
        dados.tempo || "0 min";

    document.getElementById("comparativoTempo").textContent =
        dados.comparativoTempo || "";
}

// =========================
// GRÁFICOS COM CHART.JS
// =========================
let dadosEstresseGlobal  = null;
let dadosGatilhosGlobal  = null;
let graficos             = {};

function renderizarGraficos(dados) {

    Object.values(graficos).forEach(g => g.destroy());
    graficos = {};

    dadosEstresseGlobal = dados.graficoEstresse;
    dadosGatilhosGlobal = dados.graficoGatilhos;

    criarGraficoEstresse("bar");
    criarGraficoGatilhos("doughnut");
}

function criarGraficoEstresse(tipo) {

    const VERDE = "#32C26D";
    const dados = dadosEstresseGlobal;

    if (graficos.estresse) {
        graficos.estresse.destroy();
    }

    const ctx = document.getElementById("graficoBarras").getContext("2d");

    const cores = (dados?.dados || []).map(v =>
        v === Math.max(...(dados?.dados || [])) ? "#E53E3E" :
        v > 5 ? "#F6AD55" : VERDE
    );

    const gradiente = ctx.createLinearGradient(0, 0, 0, 300);
    gradiente.addColorStop(0,   "rgba(50, 194, 109, 0.35)");
    gradiente.addColorStop(1,   "rgba(50, 194, 109, 0)");

    graficos.estresse = new Chart(ctx, {
        type: tipo,
        data: {
            labels: dados?.labels || [],
            datasets: [{
                label:           "Alertas",
                data:            dados?.dados  || [],
                backgroundColor: tipo === "line" ? gradiente : cores,
                borderColor:     tipo === "line" ? VERDE : cores,
                borderWidth:     tipo === "line" ? 2.5 : 0,
                borderRadius:    tipo === "bar"  ? 6 : 0,
                pointBackgroundColor: tipo === "line"
                    ? (dados?.dados || []).map(v =>
                        v === Math.max(...(dados?.dados || [])) ? "#E53E3E" : VERDE)
                    : undefined,
                pointRadius:  tipo === "line" ? 5 : undefined,
                tension:      tipo === "line" ? 0.4 : undefined,
                fill:         tipo === "line" ? true : false
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales:  {
                y: { beginAtZero: true, ticks: { stepSize: 2 } }
            }
        }
    });
}

function trocarTipoEstresse(tipo) {
    criarGraficoEstresse(tipo);
    const iconePorTipo = { bar: "fa-chart-column", line: "fa-chart-line" };
    atualizarBotoesTipo("graficoBarras", tipo, iconePorTipo);
}

function criarGraficoGatilhos(tipo) {

    const VERDE   = "#32C26D";
    const AZUL    = "#0AB7FB";
    const dados   = dadosGatilhosGlobal;
    const legenda = document.getElementById("legendaGatilhos");

    if (graficos.gatilhos) {
        graficos.gatilhos.destroy();
    }

    const ctx = document.getElementById("graficoPizza").getContext("2d");
    const ehRosca = tipo === "doughnut" || tipo === "pie";

    graficos.gatilhos = new Chart(ctx, {
        type: tipo,
        data: {
            labels: dados?.labels || [],
            datasets: [{
                data:            dados?.dados  || [],
                backgroundColor: dados?.cores  || [VERDE, AZUL, "#1D8EC9", "#C2C2C2"],
                borderWidth:     0,
                hoverOffset:     8,
                borderRadius:    tipo === "bar" ? 6 : 0
            }]
        },
        options: {
            responsive: true,
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
            (dados?.labels || []).forEach((label, i) => {
                legenda.innerHTML += `
                    <div class="legenda-item">
                        <span class="legenda-cor" style="background:${dados?.cores?.[i] || VERDE}"></span>
                        <span>${escaparHTML(label)} ${escaparHTML(dados?.dados?.[i])}%</span>
                    </div>`;
            });
            legenda.style.display = "flex";
        } else {
            legenda.style.display = "none";
        }
    }
}

function trocarTipoGatilhos(tipo) {
    criarGraficoGatilhos(tipo);
    const iconePorTipo = {
        doughnut: "fa-circle-dot",
        pie:      "fa-chart-pie",
        bar:      "fa-chart-column"
    };
    atualizarBotoesTipo("graficoPizza", tipo, iconePorTipo);
}

function atualizarBotoesTipo(canvasId, tipoAtivo, iconePorTipo) {

    const card   = document.getElementById(canvasId).closest(".card-grafico");
    const botoes = card.querySelectorAll(".btn-tipo-grafico button");

    botoes.forEach(btn => {
        const icone = btn.querySelector("i");
        if (!icone) return;

        const tipoBtn = Object.entries(iconePorTipo).find(([, cls]) =>
            icone.classList.contains(cls)
        )?.[0];

        btn.classList.toggle("ativo", tipoBtn === tipoAtivo);
    });
}


// =========================
// CALENDÁRIO DE RELATÓRIOS POR DIA
// =========================

const diasSemanaAbrev = { pt: ["D","S","T","Q","Q","S","S"], en: ["S","M","T","W","T","F","S"] };
const nomesMeses = {
    pt: ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"],
    en: ["January","February","March","April","May","June","July","August","September","October","November","December"]
};

let mesAtual;
if (dataParam) {
    const [anoParam, mesParam] = dataParam.split("-").map(Number);
    mesAtual = new Date(anoParam, mesParam - 1, 1);
} else {
    mesAtual = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}
let diaSelecionado   = null;      // "YYYY-MM-DD"
let diasComRelatorio = new Set(); // dias do mês atual que têm relatório

function formatarDataISO(date) {
    return date.toISOString().split("T")[0];
}

async function carregarDiasDoMes() {

    const mesStr = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, "0")}`;

    try {
        const resposta = await fetch(`/api/relatorio-paciente/dias?paciente=${pacienteId}&mes=${mesStr}`);
        if (!resposta.ok) throw new Error();
        const dados = await resposta.json();
        diasComRelatorio = new Set(dados.dias || []);
    } catch (_) {
        diasComRelatorio = new Set();
    }

    renderizarCalendario();
}

function renderizarCalendario() {

    document.getElementById("calendarioDiasSemana").innerHTML =
        diasSemanaAbrev[idiomaAtual].map(d => `<div class="calendario-dia-semana">${d}</div>`).join("");

    document.getElementById("calendarioMesLabel").textContent =
        `${nomesMeses[idiomaAtual][mesAtual.getMonth()]} ${mesAtual.getFullYear()}`;

    const grade        = document.getElementById("calendarioGrade");
    const primeiroDia   = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
    const ultimoDia      = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
    const offsetInicio    = primeiroDia.getDay();
    const hoje             = formatarDataISO(new Date());

    let html = "";

    for (let i = 0; i < offsetInicio; i++) {
        html += `<div class="calendario-dia vazio"></div>`;
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {

        const dataObj     = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia);
        const dataISO      = formatarDataISO(dataObj);
        const temDados       = diasComRelatorio.has(dataISO);
        const futuro          = dataISO > hoje;
        const estaSelecionado  = dataISO === diaSelecionado;

        html += `
            <button
                type="button"
                class="calendario-dia ${temDados ? "tem-relatorio" : ""} ${estaSelecionado ? "selecionado" : ""}"
                ${futuro ? "disabled" : ""}
                data-dia="${dataISO}"
            >${dia}</button>
        `;
    }

    grade.innerHTML = html;

    grade.querySelectorAll(".calendario-dia[data-dia]").forEach(botao => {
        botao.addEventListener("click", () => {
            selecionarDia(botao.dataset.dia);
        });
    });
}

function mesAnterior() {
    mesAtual = new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1);
    carregarDiasDoMes();
}

function mesProximo() {
    mesAtual = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1);
    carregarDiasDoMes();
}

async function selecionarDia(dataISO) {

    diaSelecionado = dataISO;
    renderizarCalendario();


    document.getElementById("calendarioSemSelecao").style.display = "none";
    document.getElementById("painelDiaSelecionado").style.display = "block";

    document.getElementById("painelDiaTitulo").textContent = t("carregando");
    document.getElementById("painelDiaConteudo").innerHTML  = "";
    document.getElementById("notaDoDia").value = "";
    document.getElementById("erroNotaDia").style.display = "none";

    try {

        const resposta = await fetch(`/api/relatorio-paciente/dia?paciente=${pacienteId}&data=${dataISO}`);

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) throw new Error();

        const detalhe = await resposta.json();

        document.getElementById("painelDiaTitulo").textContent =
            detalhe.dataFormatada || new Date(dataISO + "T00:00:00").toLocaleDateString(idiomaAtual === "en" ? "en-US" : "pt-BR");

        document.getElementById("painelDiaConteudo").innerHTML = detalhe.temRelatorio
            ? `<ul class="lista-respostas-dia">${(detalhe.perguntas || []).map(p => `
                <li><strong>${escaparHTML(p.pergunta || p.id)}</strong><span>${escaparHTML(p.resposta)}</span></li>
            `).join("")}</ul>`
            : `<p class="sem-relatorio-dia">${t("semRelatorioDia")}</p>`;
        document.getElementById("notaDoDia").value = detalhe.nota || "";

    } catch (_) {
        document.getElementById("painelDiaConteudo").innerHTML =
            `<p class="sem-relatorio-dia">${t("erroCarregarDia")}</p>`;
    }
}

async function salvarNotaDoDia() {

    if (!diaSelecionado) return;

    const texto    = document.getElementById("notaDoDia").value.trim();
    const erroEl    = document.getElementById("erroNotaDia");
    const btnSalvar  = document.getElementById("btnSalvarNotaDia");

    erroEl.style.display = "none";

    if (!texto) {
        erroEl.textContent   = t("digiteNota");
        erroEl.style.display = "block";
        return;
    }

    btnSalvar.disabled    = true;
    btnSalvar.textContent = t("salvando");

    try {

        const resposta = await fetch("/api/nota-clinica", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ pacienteId, texto, data: diaSelecionado })
        });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) throw new Error();

    } catch (_) {
        erroEl.textContent   = t("erroSalvarNota");
        erroEl.style.display = "block";
    } finally {
        btnSalvar.disabled    = false;
        btnSalvar.textContent = t("salvarNotaTxt");
    }
}


// =========================
// PAINEL DE NOTIFICAÇÕES
// =========================
const painelNotificacoes = document.getElementById("painelNotificacoes");

async function carregarNotificacoes() {
    try {
        const resposta = await fetch("/api/notificacoes");
        if (!resposta.ok) throw new Error();
        const dados = await resposta.json();
        const itens = dados.notificacoes || [];

        document.getElementById("listaNotificacoes").innerHTML = itens.length === 0
            ? `<div class="painel-vazio">${t("semNotificacoes")}</div>`
            : itens.map(n => `
                <div class="item-notificacao ${n.lida ? "" : "nao-lida"}">
                    ${escaparHTML(n.mensagem)}
                    <span class="tempo-notificacao">${escaparHTML(n.tempo)}</span>
                </div>`).join("");
    } catch (_) {
        document.getElementById("listaNotificacoes").innerHTML =
            `<div class="painel-vazio">${t("erroCarregarNotif")}</div>`;
    }
}

document.getElementById("btnNotificacoes").addEventListener("click", async (e) => {
    e.stopPropagation();
    const aberto = painelNotificacoes.classList.toggle("aberto");
    if (aberto) {
        await carregarNotificacoes();
        fetch("/api/notificacoes/marcar-lidas", { method: "POST" }).catch(() => {});
        document.getElementById("badgeNotificacoes").style.display = "none";
    }
});

document.addEventListener("click", (e) => {
    if (!painelNotificacoes.contains(e.target)) {
        painelNotificacoes.classList.remove("aberto");
    }
});

// =========================
// TRADUÇÃO MANUAL
// =========================

function aplicarIdiomaEstatico() {
    document.querySelectorAll("[data-pt]").forEach(el => {
        el.textContent = idiomaAtual === "en"
            ? (el.dataset.en || el.dataset.pt)
            : el.dataset.pt;
    });

    document.getElementById("textoTradutor").textContent =
        idiomaAtual === "en" ? "Traduzir para português" : "Traduzir para inglês";

    document.getElementById("btnSalvarNotaDia").textContent = t("salvarNotaTxt");
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);
    aplicarIdiomaEstatico();
    renderizarCalendario(); // atualiza nomes de mês/dias da semana
    if (diaSelecionado) selecionarDia(diaSelecionado); // re-renderiza o dia aberto no novo idioma
});

aplicarIdiomaEstatico();

// =========================
// TEMA
// =========================
function aplicarTema(tema) {
    document.body.classList.remove("tema-claro", "tema-escuro");
    document.body.classList.add(`tema-${tema}`);
    document.getElementById("btnClaro").classList.toggle("ativo", tema === "claro");
    document.getElementById("btnEscuro").classList.toggle("ativo", tema === "escuro");
    localStorage.setItem("tema", tema);
}

document.getElementById("btnClaro").addEventListener("click",  () => aplicarTema("claro"));
document.getElementById("btnEscuro").addEventListener("click", () => aplicarTema("escuro"));

// =========================
// INICIALIZAÇÃO
// =========================
const temaSalvo = localStorage.getItem("tema") || "claro";
aplicarTema(temaSalvo);

carregarTerapeuta();
carregarRelatorio();
carregarDiasDoMes().then(() => {
    if (dataParam) {
        selecionarDia(dataParam);
    }
});

// Substitui os antigos onclick inline (removidos por causa do CSP)

document.getElementById("fotoUsuario").addEventListener("click", () => {
    window.location.href = "/PerfilTerapeuta";
});

document.getElementById("nomeTerapeuta").addEventListener("click", () => {
    window.location.href = "/PerfilTerapeuta";
});

document.getElementById("btnCodigoCopiar").addEventListener("click", copiarCodigo);

document.getElementById("btnEstresseBar").addEventListener("click", () => {
    trocarTipoEstresse("bar");
});

document.getElementById("btnEstresseLine").addEventListener("click", () => {
    trocarTipoEstresse("line");
});

document.getElementById("btnGatilhosDoughnut").addEventListener("click", () => {
    trocarTipoGatilhos("doughnut");
});

document.getElementById("btnGatilhosPie").addEventListener("click", () => {
    trocarTipoGatilhos("pie");
});

document.getElementById("btnGatilhosBar").addEventListener("click", () => {
    trocarTipoGatilhos("bar");
});

document.getElementById("btnMesAnterior").addEventListener("click", mesAnterior);
document.getElementById("btnMesProximo").addEventListener("click", mesProximo);

document.getElementById("btnSalvarNotaDia").addEventListener("click", salvarNotaDoDia);