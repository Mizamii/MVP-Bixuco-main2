
// ==========================
// TRADUÇÃO MANUAL
// ==========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

// Textos dinâmicos simples (sem tags internas)
const dicionario = {
    "Responsável":                            "Guardian",
    "Terapeuta":                               "Therapist",
    "Usuário":                                 "User",
    "Nenhuma promoção por enquanto.":          "No promotions for now.",
    "Não foi possível carregar.":              "Could not load."
};

function traduzir(texto) {
    if (idiomaAtual === "pt" || texto == null) return texto;
    return dicionario[texto] || texto;
}

// Textos com formatação interna (<strong>, <em>) — traduzidos via innerHTML
const textosFormatados = {
    fraseFinalTexto: {
        pt: `Mais do que tecnologia, entregamos <strong>conexão</strong>, <strong>empatia</strong> e <strong>inteligência</strong> para apoiar o desenvolvimento infantil.`,
        en: `More than technology, we deliver <strong>connection</strong>, <strong>empathy</strong>, and <strong>intelligence</strong> to support child development.`
    },
    modalPublicoLi1: {
        pt: `<strong>Pais e responsáveis</strong>, que acompanham a rotina da criança de perto;`,
        en: `<strong>Parents and guardians</strong>, who closely follow the child's daily routine;`
    },
    modalPublicoLi2: {
        pt: `<strong>Terapeutas</strong>, que recebem informações organizadas para embasar o acompanhamento profissional.`,
        en: `<strong>Therapists</strong>, who receive organized information to support professional care.`
    },
    modalNaofazemosP1: {
        pt: `O Bixuco <strong>não</strong> substitui avaliação, diagnóstico ou tratamento profissional. Ele é uma ferramenta de apoio e organização — não um serviço de saúde.`,
        en: `Bixuco <strong>does not</strong> replace professional evaluation, diagnosis, or treatment. It is a support and organization tool — not a health service.`
    }
};

let ultimoTipoConta = "Responsável";

function aplicarIdiomaEstatico() {

    document.querySelectorAll("[data-pt]").forEach(el => {
        el.textContent = idiomaAtual === "en"
            ? (el.dataset.en || el.dataset.pt)
            : el.dataset.pt;
    });

    Object.keys(textosFormatados).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = textosFormatados[id][idiomaAtual];
    });

    document.getElementById("textoTradutor").textContent =
        idiomaAtual === "en" ? "Traduzir para o português" : "Traduzir para o inglês";

    document.getElementById("tipoConta").textContent = traduzir(ultimoTipoConta);
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);
    aplicarIdiomaEstatico();

    if (painelNotificacoes.classList.contains("aberto")) {
        carregarNotificacoes();
    }
});

// ==========================
// ABRIR / FECHAR MODAIS
// ==========================

function abrirModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("mostrar");
    document.body.style.overflow = "hidden";
}

function fecharModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("mostrar");
    document.body.style.overflow = "";
}

document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
        abrirModal(`modal-${card.dataset.topico}`);
    });
});

document.querySelectorAll(".modal .fechar").forEach(botao => {
    botao.addEventListener("click", () => {
        const modal = botao.closest(".modal");
        fecharModal(modal.id);
    });
});

document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("mostrar");
            document.body.style.overflow = "";
        }
    });
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal.mostrar").forEach(modal => {
            modal.classList.remove("mostrar");
        });
        document.body.style.overflow = "";
    }
});

// ==========================
// CARREGAR DADOS DO USUÁRIO (topo)
// ==========================

async function carregarUsuario() {
    try {
        const resposta = await fetch("/api/home");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) return;

        const dados = await resposta.json();

        document.getElementById("nomeUsuario").textContent = dados.nome || "Usuário";

        ultimoTipoConta = dados.tipoConta || "Responsável";
        document.getElementById("tipoConta").textContent = traduzir(ultimoTipoConta);

        if (dados.fotoPerfil) {
            document.getElementById("fotoUsuario").src = dados.fotoPerfil;
        }

    } catch (erro) {
        console.log("Erro ao carregar usuário:", erro);
    }
}

document.getElementById("fotoUsuario").addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

// ==========================
// PAINEL DE NOTIFICAÇÕES (só promoções)
// ==========================

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
        const itens = (dados.notificacoes || []).filter(n => n.tipo === "novidade");

        listaNotificacoes.innerHTML = itens.length === 0
            ? `<div class="painel-vazio">${traduzir("Nenhuma promoção por enquanto.")}</div>`
            : itens.map(formatarItemNotificacao).join("");

        const naoLidas = itens.filter(item => !item.lida).length;
        document.getElementById("quantidadeNotificacoes").textContent = naoLidas;

    } catch (erro) {
        console.log("Erro ao carregar notificações:", erro);
        listaNotificacoes.innerHTML = `<div class="painel-vazio">${traduzir("Não foi possível carregar.")}</div>`;
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
carregarNotificacoes();

document.getElementById("fotoUsuario").addEventListener("click", () => {
    window.location.href = "/perfilSemAssinatura";
});

document.getElementById("wrapperPerfilTopo").addEventListener("click", () => {
    window.location.href = "/perfilSemAssinatura";
});