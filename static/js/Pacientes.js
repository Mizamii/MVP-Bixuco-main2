function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}


let todosPacientes = [];
let filtroAtual    = "todos";


// =========================
// TRADUÇÃO MANUAL — dicionário para textos montados via JS
// =========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    crianca:           { pt: "Criança",              en: "Child" },
    anos:              { pt: "anos",                 en: "years old" },
    ativoAgora:        { pt: "Ativo agora",            en: "Active now" },
    offline:           { pt: "Offline",                en: "Offline" },
    vistoMin:          { pt: (n) => `Visto há ${n} min`, en: (n) => `Seen ${n} min ago` },
    vistoHora:         { pt: (n) => `Visto há ${n} h`,   en: (n) => `Seen ${n} h ago` },
    vistoDias:         { pt: (n) => n === 1 ? "Visto há 1 dia" : `Visto há ${n} dias`, en: (n) => n === 1 ? "Seen 1 day ago" : `Seen ${n} days ago` },
    nuncaAcessou:      { pt: "Sem acesso recente",      en: "No recent activity" },
    alertasSemana:     { pt: (n) => `${n} episódios esta semana`, en: (n) => `${n} episodes this week` },
    alertas:           { pt: "Episódios",              en: "Episodes" },
    atividade:         { pt: "Atividade",              en: "Activity" },
    ultimoRelat:       { pt: "Último relat.",          en: "Last report" },
    relatorio:         { pt: "Relatório",              en: "Report" },
    nivelElevado:      { pt: "Atividade elevada",      en: "Elevated activity" },
    nivelAtencao:      { pt: "Atenção",                en: "Attention" },
    nivelBaixo:        { pt: "Baixa atividade",        en: "Low activity" },
    semNotificacoes:   { pt: "Nenhuma notificação por enquanto.", en: "No notifications yet." },
    hoje:              { pt: "Hoje",                    en: "Today" },
    ontem:             { pt: "Ontem",                   en: "Yesterday" },
    semRelatorios:     { pt: "Sem relatórios",          en: "No reports" },
    diasAtras:         { pt: (n) => `${n} dias`,         en: (n) => `${n} days` },
    erroCarregarNotif: { pt: "Não foi possível carregar.", en: "Couldn't load notifications." },
};

function t(chave, ...args) {
    const entrada = dicionario[chave];
    const valor   = idiomaAtual === "en" ? entrada.en : entrada.pt;
    return typeof valor === "function" ? valor(...args) : valor;
}
function traduzirMensagemNotificacao(item) {
    const mensagem = String(item?.mensagem || "");
    if (idiomaAtual !== "en") return mensagem;

    switch (item?.tipo) {
        case "pedido_vinculo":
            return "You received a link request from a new guardian.";
        case "relatorio_concluido":
            return "You just completed a report. Great job! 🎉";
        case "lembrete_relatorio":
            return "Don't forget to complete today's report! 📋";
        case "vinculo_removido_plano":
            return "Your therapist link was removed because your current plan does not include this feature.";
        case "relatorio_finalizado": {
            const match = mensagem.match(/^(.+?) acabou de finalizar um relatório\. Clique para ver\.$/i);
            return match
                ? `${match[1]} just completed a report. Click to view.`
                : "A patient just completed a report. Click to view.";
        }
        default:
            return mensagem;
    }
}


const nivelParaChave = {
    elevada: "nivelElevado",
    atencao: "nivelAtencao",
    baixa: "nivelBaixo"
};

function formatarUltimoAcesso(valor, status) {
    if (status === "ativo") return "";
    if (!valor) return t("nuncaAcessou");

    const data = new Date(valor);
    const diffMs = Math.max(0, Date.now() - data.getTime());
    const minutos = Math.floor(diffMs / 60000);

    if (minutos < 60) return t("vistoMin", Math.max(5, minutos));

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return t("vistoHora", horas);

    const dias = Math.floor(horas / 24);
    return t("vistoDias", dias);
}

function traduzirUltimoRelatorio(valor) {
    const texto = String(valor || "").trim();

    if (texto === "Hoje") return t("hoje");
    if (texto === "Ontem") return t("ontem");
    if (texto === "Sem relatórios") return t("semRelatorios");

    const dias = texto.match(/^(\d+)\s+dias?$/i);
    if (dias) return t("diasAtras", dias[1]);

    return texto;
}


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
        document.getElementById("codigoTerapeuta").textContent = dados.codigoTerapeuta || "---";

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

document.getElementById("btnCodigoCopiar").addEventListener("click", copiarCodigo);

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

    const atencao = lista.filter(p => p.alertas >= 2);
    const regular = lista.filter(p => p.alertas < 2);

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
        ? `<p class="badge-alerta">${escaparHTML(t("alertasSemana", paciente.alertas))}</p>`
        : "";

    const classeAtividade = {
        elevada: "atividade--elevada",
        atencao: "atividade--atencao",
        baixa: "atividade--baixa"
    }[paciente.nivelAtividade] || "atividade--baixa";

    const chaveNivel =
        nivelParaChave[paciente.nivelAtividade] ||
        "nivelBaixo";

    const nivelExibido = t(chaveNivel);
    const statusExibido = paciente.status === "ativo" ? t("ativoAgora") : t("offline");
    const vistoExibido = formatarUltimoAcesso(paciente.ultimoAcesso, paciente.status);

    card.innerHTML = `
        ${badgeAlerta}

        <div class="card-cabecalho">
            <img
                src="${escaparHTML(paciente.fotoPerfil || '/img/perfilPadrao.png')}"
                alt="${escaparHTML(paciente.nomeResponsavel)}"
            >

            <div class="card-info">
                <strong>${escaparHTML(paciente.nomeResponsavel)}</strong>
                <span>${t("crianca")}: ${escaparHTML(paciente.nomeCrianca)}, ${escaparHTML(paciente.idadeCrianca)} ${t("anos")}</span>
            </div>

            <div class="status-presenca">
                <span class="status-badge status-badge--${paciente.status}">
                    ${escaparHTML(statusExibido)}
                </span>
                ${vistoExibido ? `<small>${escaparHTML(vistoExibido)}</small>` : ""}
            </div>
        </div>

        <div class="card-metricas">
            <div class="metrica">
                <span>${t("alertas")}</span>
                <strong class="metrica-valor metrica-valor--alerta ${classeAtividade}">${escaparHTML(paciente.alertas)}</strong>
            </div>
            <div class="metrica">
                <span>${t("atividade")}</span>
                <strong class="metrica-valor ${classeAtividade}">${escaparHTML(nivelExibido)}</strong>
            </div>
            <div class="metrica">
                <span>${t("ultimoRelat")}</span>
                <strong class="metrica-valor metrica-valor--data">${escaparHTML(traduzirUltimoRelatorio(paciente.ultimoRelatorio))}</strong>
            </div>
        </div>

        <button type="button" class="btn-relatorio">
            <i class="fa-solid fa-clipboard-list"></i>
            ${t("relatorio")}
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

    // Mesma régua visual do sistema:
    // 0–1 = baixa atividade; 2–4 = atenção; 5+ = atividade elevada.
    const ativosNaBusca  = lista.filter(p => p.status === "ativo");
    const alertasNaBusca = lista.filter(p => p.alertas >= 2);

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
            ? `<div class="painel-vazio">${t("semNotificacoes")}</div>`
            : itens.map(item => `
                <div class="item-notificacao ${item.lida ? "" : "nao-lida"}">
                    <p>${escaparHTML(traduzirMensagemNotificacao(item))}</p>
                    <span class="tempo-notificacao">${escaparHTML(item.tempo)}</span>
                </div>
            `).join("");
    } catch (_) {
        listaNotificacoes.innerHTML = `<div class="painel-vazio">${t("erroCarregarNotif")}</div>`;
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
// TRADUÇÃO MANUAL — texto estático (data-pt/data-en) + placeholder da busca
// =========================

function aplicarIdiomaEstatico() {
    document.querySelectorAll("[data-pt]").forEach(el => {
        el.textContent = idiomaAtual === "en"
            ? (el.dataset.en || el.dataset.pt)
            : el.dataset.pt;
    });

    const inputBusca = document.getElementById("inputBusca");
    if (inputBusca) {
        inputBusca.placeholder = idiomaAtual === "en"
            ? inputBusca.dataset.enPlaceholder
            : inputBusca.dataset.ptPlaceholder;
    }

    document.getElementById("textoTradutor").textContent =
        idiomaAtual === "en" ? "Traduzir para português" : "Traduzir para inglês";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);

    aplicarIdiomaEstatico();

    // Reaplica os cards (texto montado via JS) e o painel de notificações, se aberto
    aplicarFiltros();
    if (painelNotificacoes.classList.contains("aberto")) {
        carregarNotificacoes();
    }
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

// Um único botão (no menu da conta, mobile) que alterna entre os dois
document.getElementById("btnTemaMobile").addEventListener("click", () => {
    const atual = document.body.classList.contains("tema-escuro") ? "escuro" : "claro";
    aplicarTema(atual === "claro" ? "escuro" : "claro");
});


// =========================
// INICIALIZAÇÃO
// =========================
const temaSalvo = localStorage.getItem("tema") || "claro";
aplicarTema(temaSalvo);
aplicarIdiomaEstatico();
carregarUsuario();
carregarPacientes();

// Mantém o status Ativo/Offline atualizado mesmo se o terapeuta
// deixar a tela de Pacientes aberta. A presença no backend usa
// janela de 5 minutos; aqui atualizamos a visualização a cada minuto.
setInterval(carregarPacientes, 60 * 1000);

document.getElementById("inputBusca").addEventListener("input", filtrarPacientes);
document.querySelectorAll(".aba").forEach(botao => {
    botao.addEventListener("click", () => trocarAba(botao));
});
