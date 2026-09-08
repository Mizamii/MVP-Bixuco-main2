
// =========================
// TRADUÇÃO MANUAL — dicionário para textos montados via JS
// =========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    semNotificacoes:    { pt: "Nenhuma notificação por enquanto.",  en: "No notifications yet." },
    erroCarregarNotif:   { pt: "Não foi possível carregar.",        en: "Couldn't load notifications." },
    enviando:             { pt: "Enviando...",                     en: "Sending..." },
    enviado:               { pt: "Enviado!",                       en: "Sent!" },
    erroEnviar:              { pt: "Erro — tente de novo",         en: "Error — try again" },
    erroExcluirConta:         { pt: "Erro ao excluir conta. Tente novamente.", en: "Error deleting account. Please try again." },
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
// CARREGAR DADOS DO TOPO
// =========================
async function carregarUsuario() {
    try {
        const resposta = await fetch("/api/home-terapeuta");
        if (resposta.status === 401) { window.location.href = "/logar"; return; }
        if (!resposta.ok) return;
        const dados = await resposta.json();

        document.getElementById("nomeTerapeuta").textContent   = dados.nome || "Terapeuta";
        document.getElementById("codigoTerapeuta").textContent = dados.codigoTerapeuta || "---";

        if (dados.fotoPerfil) document.getElementById("fotoUsuario").src = dados.fotoPerfil;

        const badge = document.getElementById("badgeNotificacoes");
        if ((dados.notificacoes ?? 0) > 0) {
            badge.textContent   = dados.notificacoes;
            badge.style.display = "inline";
        }
    } catch (_) {}
}


// =========================
// NOTIFICAÇÕES — toggles salvos no backend
// =========================
async function carregarPreferencias() {
    try {
        const resposta = await fetch("/api/preferencias");
        if (!resposta.ok) return;
        const dados = await resposta.json();
        document.getElementById("toggleRelatorio").checked   = dados.lembreteRelatorio ?? true;
        document.getElementById("toggleSolicitacao").checked = dados.novaSolicitacao    ?? true;
    } catch (_) {}
}

async function salvarPreferencia(chave, valor) {
    try {
        await fetch("/api/preferencias", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ [chave]: valor })
        });
    } catch (_) {}
}

document.getElementById("toggleRelatorio").addEventListener("change", (e) => {
    salvarPreferencia("lembreteRelatorio", e.target.checked);
});

document.getElementById("toggleSolicitacao").addEventListener("change", (e) => {
    salvarPreferencia("novaSolicitacao", e.target.checked);
});


// =========================
// ALTERAR SENHA
// =========================
document.getElementById("btnAlterarSenha").addEventListener("click", () => {
    document.getElementById("msgEmailSenha").style.display = "none";
    document.getElementById("modalSenha").style.display = "flex";
});

document.getElementById("btnCancelarSenha").addEventListener("click", () => {
    document.getElementById("modalSenha").style.display = "none";
});

document.getElementById("btnEnviarSenha").addEventListener("click", async () => {
    const btn = document.getElementById("btnEnviarSenha");
    btn.disabled    = true;
    btn.textContent = t("enviando");
    try {
        // busca o email do usuário logado e envia o link
        const me = await fetch("/api/home-terapeuta").then(r => r.json());
        await fetch("/esqueceu-senha", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ email: me.email })
        });
        document.getElementById("msgEmailSenha").style.display = "block";
        btn.textContent = t("enviado");
    } catch (_) {
        btn.textContent = t("erroEnviar");
        btn.disabled    = false;
    }
});

function fecharModalSenhaFora(e) {
    if (e.target === document.getElementById("modalSenha")) {
        document.getElementById("modalSenha").style.display = "none";
    }
}


// =========================
// EXCLUIR CONTA
// =========================
document.getElementById("btnExcluirConta").addEventListener("click", () => {
    document.getElementById("modalExcluir").style.display = "flex";
});

document.getElementById("btnCancelarExcluir").addEventListener("click", () => {
    document.getElementById("modalExcluir").style.display = "none";
});

document.getElementById("btnConfirmarExcluir").addEventListener("click", async () => {
    try {
        const resposta = await fetch("/api/excluir-conta", { method: "DELETE" });
        if (resposta.ok) window.location.href = "/";
        else alert(t("erroExcluirConta"));
    } catch (_) {
        alert(t("erroExcluirConta"));
    }
});

function fecharModalFora(e) {
    if (e.target === document.getElementById("modalExcluir")) {
        document.getElementById("modalExcluir").style.display = "none";
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        document.getElementById("modalExcluir").style.display = "none";
        document.getElementById("modalSenha").style.display   = "none";
    }
});


// =========================
// NOTIFICAÇÕES — painel do sininho
// =========================
const painelNotificacoes = document.getElementById("painelNotificacoes");
const listaNotificacoes  = document.getElementById("listaNotificacoes");

function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

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
                    <p>${escaparHTML(item.mensagem)}</p>
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
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);
    aplicarIdiomaEstatico();
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
carregarUsuario();
carregarPreferencias();

// ==========================
// SUBSTITUI OS ONCLICK/ONERROR INLINE (removidos por causa do CSP)
// ==========================

const fotoUsuarioEl = document.getElementById("fotoUsuario");

fotoUsuarioEl.addEventListener("click", () => {
    window.location.href = "/perfilTerapeuta";
});

fotoUsuarioEl.addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

document.getElementById("nomeTerapeuta").addEventListener("click", () => {
    window.location.href = "/perfilTerapeuta";
});

document.getElementById("btnCodigoCopiar").addEventListener("click", copiarCodigo);

document.getElementById("imgMascoteConfig").addEventListener("error", function () {
    this.style.display = "none";
});

document.getElementById("imgSeguranca").addEventListener("error", function () {
    this.style.display = "none";
});

document.getElementById("modalExcluir").addEventListener("click", fecharModalFora);
document.getElementById("modalSenha").addEventListener("click", fecharModalSenhaFora);