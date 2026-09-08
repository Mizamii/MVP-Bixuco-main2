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

const dicionario = {
    "Seu Bixuco está a caminho!":                              "Your Bixuco is on its way!",
    "Ele já foi postado e está com a transportadora.":         "It has already been posted and is with the carrier.",
    "Seu pedido está sendo preparado com muito carinho.":      "Your order is being carefully prepared.",
    "Seu Bixuco foi entregue!":                                "Your Bixuco has been delivered!",
    "Seu pedido chegou. Vamos vinculá-lo?":                    "Your order has arrived. Let's link it?"
};

function traduzir(texto) {
    if (idiomaAtual === "pt" || texto == null) return texto;
    return dicionario[texto] || texto;
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
    atualizarBanner(ultimoStatus);
});

aplicarIdiomaEstatico();

// =========================
// DADOS DO USUÁRIO NO TOPO
// =========================

document.getElementById("fotoUsuario").addEventListener("click", () => {
    window.location.href = "/perfil";
});

document.getElementById("fotoUsuario").addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

document.getElementById("blocoNomeUsuario").addEventListener("click", () => {
    window.location.href = "/perfil";
});

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
// CÓDIGO DE RASTREIO / ACOMPANHAR
// =========================

document.getElementById("btn-copiar").addEventListener("click", () => {
    const codigo = document.getElementById("codigo-texto").textContent;
    navigator.clipboard.writeText(codigo);
});

document.getElementById("btn-acompanhar").addEventListener("click", () => {
    window.open("https://www.mercadolivre.com.br/gz/tracking", "_blank");
});

// =========================
// TIMELINE E BANNER — dinâmicos, de acordo com o status real do pedido
// =========================

const ORDEM_ETAPAS = ["em_producao", "enviado", "em_transito", "entregue"];
// índice da etapa da timeline (0 a 4) alcançada por cada status:
// etapa 0 (Pedido recebido) sempre concluída assim que existe um pedido
const ETAPA_POR_STATUS = {
    em_producao: 1,
    enviado:     2,
    em_transito: 3,
    entregue:    4
};

const BANNER_POR_STATUS = {
    em_producao: {
        icone:  "fa-solid fa-box",
        titulo: "Seu pedido está sendo preparado com muito carinho.",
        sub:    null
    },
    enviado: {
        icone:  "fa-solid fa-truck",
        titulo: "Seu Bixuco está a caminho!",
        sub:    "Ele já foi postado e está com a transportadora."
    },
    em_transito: {
        icone:  "fa-solid fa-truck-fast",
        titulo: "Seu Bixuco está a caminho!",
        sub:    "Ele já foi postado e está com a transportadora."
    },
    entregue: {
        icone:  "fa-solid fa-circle-check",
        titulo: "Seu Bixuco foi entregue!",
        sub:    "Seu pedido chegou. Vamos vinculá-lo?"
    }
};

let ultimoStatus = "em_producao";

function atualizarTimeline(status) {
    const etapaAtingida = ETAPA_POR_STATUS[status] ?? 1;

    document.querySelectorAll("#timeline .etapa").forEach(el => {
        const indice = parseInt(el.dataset.etapa, 10);
        el.classList.remove("concluida", "atual");

        if (indice < etapaAtingida) el.classList.add("concluida");
        else if (indice === etapaAtingida) el.classList.add("atual");
    });
}

function atualizarBanner(status) {
    const info = BANNER_POR_STATUS[status] || BANNER_POR_STATUS.em_producao;
    const icone = document.getElementById("banner-icone");
    const titulo = document.getElementById("banner-titulo");
    const sub = document.getElementById("banner-subtitulo");

    icone.className = info.icone;
    titulo.textContent = traduzir(info.titulo);

    if (info.sub) {
        sub.textContent = traduzir(info.sub);
        sub.style.display = "block";
    } else {
        sub.style.display = "none";
    }
}

async function carregarStatusPedido() {
    try {
        const resposta = await fetch("/api/pedidos/status");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) return;

        const dados = await resposta.json();

        ultimoStatus = dados.status || "em_producao";

        if (dados.codigo_rastreio) {
            document.getElementById("codigo-texto").textContent = dados.codigo_rastreio;
        }

        if (dados.previsao_entrega) {
            const data = new Date(dados.previsao_entrega);
            document.getElementById("data-previsao").textContent =
                data.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
        }

        atualizarTimeline(ultimoStatus);
        atualizarBanner(ultimoStatus);

        if (ultimoStatus === "entregue") {
            window.location.href = "/BixucoEntregue";
        }

    } catch (erro) {
        console.log("Não foi possível atualizar o status do pedido.", erro);
    }
}

carregarStatusPedido();
