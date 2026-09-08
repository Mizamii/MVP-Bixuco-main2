// ==========================
// TEMA
// ==========================

function aplicarTema(tema) {
    document.body.classList.remove("tema-claro", "tema-escuro");
    document.body.classList.add(`tema-${tema}`);
    document.getElementById("btnClaro").classList.toggle("ativo", tema === "claro");
    document.getElementById("btnEscuro").classList.toggle("ativo", tema === "escuro");
    localStorage.setItem("tema", tema);
}

document.getElementById("btnClaro").addEventListener("click", () => aplicarTema("claro"));
document.getElementById("btnEscuro").addEventListener("click", () => aplicarTema("escuro"));

aplicarTema(localStorage.getItem("tema") || "claro");

// ==========================
// TRADUÇÃO MANUAL
// ==========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

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
});

aplicarIdiomaEstatico();

// =========================
// DADOS DO USUÁRIO NO TOPO
// =========================

async function carregarDadosUsuario() {
    try {
        const resposta = await fetch("/api/home");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) throw new Error(`Falha ao carregar dados do usuário (status ${resposta.status})`);

        const dados = await resposta.json();

        document.getElementById("nomeUsuario").textContent = dados.nome || "Usuário";
        document.getElementById("tipoConta").textContent   = dados.tipoConta || "Responsável";

        if (dados.fotoPerfil) {
            document.getElementById("fotoUsuario").src = dados.fotoPerfil;
        }

    } catch (erro) {
        console.log("Erro ao carregar dados do usuário:", erro);
        document.getElementById("nomeUsuario").textContent = "Usuário";
        document.getElementById("tipoConta").textContent   = "Responsável";
    }
}

carregarDadosUsuario();

// =========================
// NOTIFICAÇÕES
// =========================

const painelNotificacoes = document.getElementById("painelNotificacoes");
const listaNotificacoes  = document.getElementById("listaNotificacoes");

function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

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

carregarNotificacoes();

// =========================
// AÇÃO PRINCIPAL
// =========================

document.getElementById("btn-vincular").addEventListener("click", () => {
    window.location.href = "/VincularIdentidade";
});

// ==========================
// SUBSTITUI OS ONCLICK/ONERROR INLINE (removidos por causa do CSP)
// ==========================

document.getElementById("btnRelatorioDiario").addEventListener("click", () => {
    location.href = "/RelatorioDiario";
});

const fotoUsuarioEl = document.getElementById("fotoUsuario");

fotoUsuarioEl.addEventListener("click", () => {
    window.location.href = "/perfil";
});

fotoUsuarioEl.addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

document.getElementById("wrapperPerfilTopo").addEventListener("click", () => {
    window.location.href = "/perfil";
});
