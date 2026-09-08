function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}


let todosPacientes = [];
let filtroAtual    = "todos";


// =========================
// CARREGAR USUÁRIO (topo)
// =========================
async function carregarUsuario() {
    try {
        const resposta = await fetch("/api/home-terapeuta");
        if (resposta.status === 401) { window.location.href = "/logar"; return; }
        if (!resposta.ok) return;
        const dados = await resposta.json();

        document.getElementById("nomeTerapeuta").textContent = dados.nome || "Terapeuta";

        if (dados.fotoPerfil) {
            document.getElementById("fotoUsuario").src = dados.fotoPerfil;
        }

        const badge = document.getElementById("badgeNotificacoes");
        if ((dados.notificacoes ?? 0) > 0) {
            badge.textContent   = dados.notificacoes;
            badge.style.display = "inline";
        }
    } catch (_) {}
}


// =========================
// CARREGAR PACIENTES
// =========================
async function carregarPacientes() {
    try {
        const resposta = await fetch("/api/pacientes");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) throw new Error("Falha ao carregar pacientes");

        const dados = await resposta.json();

        todosPacientes = dados.pacientes || [];

        // Contadores e renderização vêm só de aplicarFiltros() agora —
        // evita ter duas fontes de verdade calculando "alertas" com
        // critérios diferentes (era isso que fazia o Arthur, com só
        // 1 alerta, contar na aba "Alertas" mesmo sem aparecer em
        // "Requer atenção")
        aplicarFiltros();

    } catch (erro) {
        console.log("Erro ao carregar pacientes:", erro);
        document.getElementById("listaAtencao").innerHTML = "";
        document.getElementById("listaRegular").innerHTML = "";
        document.getElementById("semAtencao").style.display = "block";
        document.getElementById("semRegular").style.display = "block";
    }
}


// =========================
// RENDERIZAR CARDS
// =========================
function renderPacientes(lista) {
    const listaAtencao  = document.getElementById("listaAtencao");
    const listaRegular  = document.getElementById("listaRegular");

    listaAtencao.innerHTML = "";
    listaRegular.innerHTML = "";

    const atencao = lista.filter(p => p.alertas >= 3);
    const regular = lista.filter(p => p.alertas < 3);

    if (atencao.length === 0) {
        document.getElementById("semAtencao").style.display = "block";
    } else {
        document.getElementById("semAtencao").style.display = "none";
        atencao.forEach(p => listaAtencao.appendChild(criarCard(p, true)));
    }

    if (regular.length === 0) {
        document.getElementById("semRegular").style.display = "block";
    } else {
        document.getElementById("semRegular").style.display = "none";
        regular.forEach(p => listaRegular.appendChild(criarCard(p, false)));
    }
}

function criarCard(paciente, temAlerta) {
    const card = document.createElement("article");
    card.classList.add("card-paciente");
    if (temAlerta) card.classList.add("card-paciente--alerta");

    const badgeAlerta = temAlerta
        ? `<p class="badge-alerta">${escaparHTML(paciente.alertas)} alertas esta semana</p>`
        : "";

    const corEstresse = {
        "Alto":  "estresse--alto",
        "Médio": "estresse--medio",
        "Baixo": "estresse--baixo"
    }[paciente.nivelEstresse] || "";

    card.innerHTML = `
        ${badgeAlerta}

        <div class="card-cabecalho">
            <img
                src="${escaparHTML(paciente.fotoPerfil || '/img/perfilPadrao.png')}"
                alt="${escaparHTML(paciente.nomeResponsavel)}"
            >

            <div class="card-info">
                <strong>${escaparHTML(paciente.nomeResponsavel)}</strong>
                <span>Criança: ${escaparHTML(paciente.nomeCrianca)}, ${escaparHTML(paciente.idadeCrianca)} anos</span>
            </div>

            <span class="status-badge status-badge--${paciente.status}">
                ${paciente.status === "ativo" ? "Ativo" : "Inativo"}
            </span>
        </div>

        <div class="card-metricas">
            <div class="metrica">
                <span>Alertas</span>
                <strong class="metrica-valor metrica-valor--alerta">${escaparHTML(paciente.alertas)}</strong>
            </div>
            <div class="metrica">
                <span>Estresse</span>
                <strong class="metrica-valor ${corEstresse}">${escaparHTML(paciente.nivelEstresse)}</strong>
            </div>
            <div class="metrica">
                <span>Último relat.</span>
                <strong class="metrica-valor metrica-valor--data">${escaparHTML(paciente.ultimoRelatorio)}</strong>
            </div>
        </div>

        <button type="button" class="btn-relatorio">
            <i class="fa-regular fa-clipboard-list"></i>
            Relatório
        </button>
    `;


    card.querySelector(".btn-relatorio").addEventListener("click", () => {
        window.location.href = `/relatoriosTerapeuta?paciente=${encodeURIComponent(paciente.id)}`;
    });

    card.querySelector("img").addEventListener("error", function () {
        this.src = "/img/perfilPadrao.png";
    });

    return card;
}


// =========================
// FILTRAR POR ABA
// =========================
function trocarAba(botao) {
    document.querySelectorAll(".aba").forEach(b => b.classList.remove("aba--ativa"));
    botao.classList.add("aba--ativa");
    filtroAtual = botao.dataset.filtro;
    aplicarFiltros();
}

function filtrarPacientes() {
    aplicarFiltros();
}

function aplicarFiltros() {
    const busca = document.getElementById("inputBusca").value.trim().toLowerCase();

    let lista = [...todosPacientes];

    if (busca) {
        lista = lista.filter(p =>
            p.nomeResponsavel.toLowerCase().includes(busca) ||
            p.nomeCrianca.toLowerCase().includes(busca)
        );
    }

    // Mesmo critério usado em "Requer atenção" (>= 3 alertas) —
    // antes era > 0, o que fazia a aba "Alertas" e a seção "Requer
    // atenção" discordarem sobre quem é considerado alerta.
    const ativosNaBusca  = lista.filter(p => p.status === "ativo");
    const alertasNaBusca = lista.filter(p => p.alertas >= 3);

    document.getElementById("contadorTodos").textContent   = `(${lista.length})`;
    document.getElementById("contadorAtivos").textContent  = `(${ativosNaBusca.length})`;
    document.getElementById("contadorAlertas").textContent = `(${alertasNaBusca.length})`;

    if (filtroAtual === "ativos") {
        lista = ativosNaBusca;
    } else if (filtroAtual === "alertas") {
        lista = alertasNaBusca;
    }

    renderPacientes(lista);
}
// =========================
// NOTIFICAÇÕES
// =========================
const painelNotificacoes = document.getElementById("painelNotificacoes");
const listaNotificacoes  = document.getElementById("listaNotificacoes");

async function carregarNotificacoes() {
    try {
        const resposta = await fetch("/api/notificacoes");
        if (!resposta.ok) throw new Error();
        const dados = await resposta.json();
        const itens = dados.notificacoes || [];

        listaNotificacoes.innerHTML = itens.length === 0
            ? `<div class="painel-vazio">Nenhuma notificação por enquanto.</div>`
            : itens.map(item => `
                <div class="item-notificacao ${item.lida ? "" : "nao-lida"}">
                    <p>${escaparHTML(item.mensagem)}</p>
                    <span class="tempo-notificacao">${escaparHTML(item.tempo)}</span>
                </div>
            `).join("");
    } catch (_) {
        listaNotificacoes.innerHTML = `<div class="painel-vazio">Não foi possível carregar.</div>`;
    }
}

document.getElementById("btnNotificacoes").addEventListener("click", async (e) => {
    e.stopPropagation();
    const estaAberto = painelNotificacoes.classList.toggle("aberto");
    if (estaAberto) {
        await carregarNotificacoes();
        fetch("/api/notificacoes/marcar-lidas", { method: "POST" });
        document.getElementById("badgeNotificacoes").style.display = "none";
    }
});

document.addEventListener("click", (e) => {
    if (!painelNotificacoes.contains(e.target)) {
        painelNotificacoes.classList.remove("aberto");
    }
});


// =========================
// TRADUÇÃO
// =========================
function lerCookie(nome) {
    const valor  = `; ${document.cookie}`;
    const partes = valor.split(`; ${nome}=`);
    if (partes.length === 2) return partes.pop().split(";").shift();
    return null;
}

function iniciarTradutor() {
    new google.translate.TranslateElement(
        { pageLanguage: "pt", includedLanguages: "en", autoDisplay: false },
        "google_translate_element"
    );
}

function atualizarTextoBotao() {
    const cookieAtual = lerCookie("googtrans");
    document.getElementById("textoTradutor").textContent =
        cookieAtual && cookieAtual.includes("/en")
            ? "Voltar para português"
            : "Traduzir para inglês";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    const cookieAtual   = lerCookie("googtrans");
    const estaTraduzido = cookieAtual && cookieAtual.includes("/en");
    const valor = `/pt/${estaTraduzido ? "pt" : "en"}`;
    document.cookie = `googtrans=${valor}; path=/`;
    document.cookie = `googtrans=${valor}; path=/; domain=${location.hostname}`;
    window.location.reload();
});


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
atualizarTextoBotao();
carregarUsuario();
carregarPacientes();

document.getElementById("inputBusca").addEventListener("input", filtrarPacientes);
document.querySelectorAll(".aba").forEach(botao => {
    botao.addEventListener("click", () => trocarAba(botao));
});
