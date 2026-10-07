// =========================
// CARREGAR USUÁRIO
// =========================
async function carregarUsuario() {
    try {
        const resposta = await fetch("/api/home");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) return;

        const dados = await resposta.json();

        document.getElementById("nomeUsuario").textContent =
            dados.nome || "Usuário";

        ultimoTipoContaSemAssinatura = dados.tipoConta || "Responsável";
        document.getElementById("tipoConta").textContent =
            traduzirSemAssinatura(ultimoTipoContaSemAssinatura);

        if (dados.fotoPerfil) {
            document.getElementById("fotoUsuario").src = dados.fotoPerfil;
        }

    } catch (e) {
        console.log("Erro ao carregar usuário:", e);
    }
}

// =========================
// 🔧 FIX: TOGGLE DE NOTIFICAÇÕES (NOVIDADES/PROMOÇÕES)
// Reaproveita a mesma rota da versão com assinatura,
// mas aqui só existe o campo "novidades" (sem lembrete de relatório)
// =========================
const notifNovidades = document.getElementById("notifNovidades");

async function carregarPreferenciasNotificacao() {
    try {
        const resposta = await fetch("/api/configuracoes/notificacoes");
        if (!resposta.ok) throw new Error("Falha ao carregar preferências");

        const dados = await resposta.json();
        notifNovidades.checked = dados.novidades;

    } catch (erro) {
        console.log("Erro ao carregar preferências de notificação:", erro);
    }
}

async function salvarNotificacao(dados) {
    try {
        await fetch("/api/configuracoes/notificacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });
    } catch (erro) {
        console.log("Erro ao salvar notificação:", erro);
    }
}

notifNovidades.addEventListener("change", () => {
    salvarNotificacao({ novidades: notifNovidades.checked });
});

carregarPreferenciasNotificacao();

// =========================
// 🔧 FIX: INDIQUE O BIXUCO (COMPARTILHAR)
// =========================
document.getElementById("btnIndicar").addEventListener("click", () => {
    const mensagemBase = idiomaAtual === "en"
        ? "Hi! Come discover Bixuco, an app that helps caregivers follow children with sensory hypersensitivity. 🐱\n\n"
        : "Olá! Venha conhecer o Bixuco, um aplicativo que ajuda no acompanhamento de crianças com hipersensibilidade sensorial. 🐱\n\n";

    const mensagem = encodeURIComponent(
        mensagemBase + "https://mvp-bixuco.onrender.com"
    );
    window.open(`https://wa.me/?text=${mensagem}`, "_blank");
});

const modalSenha     = document.getElementById("modalSenha");
const btnEnviarSenha = document.getElementById("btnEnviarSenha");
const statusSenha    = document.getElementById("statusSenha");

function abrirModalSenha() {
    modalSenha.classList.add("aberto");
    document.body.style.overflow = "hidden";
}

function fecharModalSenha() {
    modalSenha.classList.remove("aberto");
    document.body.style.overflow = "";
    statusSenha.className = "status-senha";
    btnEnviarSenha.disabled    = false;
    btnEnviarSenha.textContent = traduzirSemAssinatura("Enviar email");
}

function mostrarStatusSenha(texto, tipo) {
    statusSenha.textContent = texto;
    statusSenha.className   = `status-senha visivel ${tipo}`;
}

document.getElementById("btnAlterarSenha").addEventListener("click", abrirModalSenha);
document.getElementById("btnFecharModalSenha").addEventListener("click", fecharModalSenha);

modalSenha.addEventListener("click", (e) => {
    if (e.target === modalSenha) fecharModalSenha();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalSenha.classList.contains("aberto")) {
        fecharModalSenha();
    }
});

btnEnviarSenha.addEventListener("click", async () => {

    btnEnviarSenha.disabled    = true;
    btnEnviarSenha.textContent = traduzirSemAssinatura("Enviando...");

    try {

        const me = await fetch("/api/perfil").then(r => r.json());

        const resposta = await fetch("/esqueceu-senha", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ email: me.email })
        });

        if (!resposta.ok) throw new Error();

        mostrarStatusSenha(traduzirSemAssinatura("Email enviado! Confira sua caixa de entrada."), "sucesso");
        btnEnviarSenha.textContent = traduzirSemAssinatura("Enviado!");

    } catch (_) {

        mostrarStatusSenha(traduzirSemAssinatura("Erro ao enviar. Tente novamente."), "erro");
        btnEnviarSenha.disabled    = false;
        btnEnviarSenha.textContent = "Enviar email";

    }

});

// =========================
// EXCLUIR CONTA
// =========================
const btnExcluir        = document.getElementById("btnExcluirConta");
const confirmarExclusao = document.getElementById("confirmarExclusao");
const btnConfirmar      = document.getElementById("btnConfirmarExclusao");
const btnCancelar       = document.getElementById("btnCancelarExclusao");

btnExcluir.addEventListener("click", () => {
    confirmarExclusao.style.display = "block";
    btnExcluir.style.display = "none";
});

btnCancelar.addEventListener("click", () => {
    confirmarExclusao.style.display = "none";
    btnExcluir.style.display = "flex";
});

btnConfirmar.addEventListener("click", async () => {
    btnConfirmar.disabled    = true;
    btnConfirmar.textContent = traduzirSemAssinatura("Excluindo...");

    try {
        const resposta = await fetch("/api/excluir-conta", { method: "DELETE" });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (resposta.ok) {
            window.location.href = "/";
        } else {
            const dados = await resposta.json();
            btnConfirmar.disabled    = false;
            btnConfirmar.textContent = traduzirSemAssinatura("Sim, excluir minha conta");
            confirmarExclusao.querySelector("p").textContent =
                "❌ " + (dados.erro || traduzirSemAssinatura("Erro ao excluir. Tente novamente."));
        }

    } catch (e) {
        console.log("Erro ao excluir conta:", e);
        btnConfirmar.disabled    = false;
        btnConfirmar.textContent = "Sim, excluir minha conta";
    }
});

// =========================
// 🔧 FIX: PAINEL DE NOTIFICAÇÕES (SININHO)
// Mesmo padrão da tela de Planos — só mostra notificações
// do tipo "novidade" (promoções), já que quem não tem
// assinatura não recebe lembrete de relatório
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

        const itens = (dados.notificacoes || []).filter(n => n.tipo === "novidade");

        listaNotificacoes.innerHTML = itens.length === 0
            ? `<div class="painel-vazio">${traduzirSemAssinatura("Nenhuma promoção por enquanto.")}</div>`
            : itens.map(formatarItemNotificacao).join("");

        const naoLidas = itens.filter(item => !item.lida).length;
        document.getElementById("quantidadeNotificacoes").textContent = naoLidas;

    } catch (erro) {
        console.log("Erro ao carregar notificações:", erro);
        listaNotificacoes.innerHTML = `<div class="painel-vazio">${traduzirSemAssinatura("Não foi possível carregar.")}</div>`;
    }
}

async function marcarNotificacoesComoLidas() {
    try {
        await fetch("/api/notificacoes/marcar-lidas", { method: "POST" });
        document.getElementById("quantidadeNotificacoes").textContent = 0;
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

// =========================
// 🔧 FIX: TRADUÇÃO MANUAL (sem Google Translate)
// Troca o texto de todo elemento com data-pt/data-en,
// igual ao padrão usado na tela de configurações com assinatura
// =========================
let idiomaAtual = localStorage.getItem("idioma") || "pt";
let ultimoTipoContaSemAssinatura = "Responsável";

const dicionarioSemAssinatura = {
    "Usuário": "User",
    "Responsável": "Guardian",
    "Enviar email": "Send email",
    "Enviando...": "Sending...",
    "Email enviado! Confira sua caixa de entrada.": "Email sent! Check your inbox.",
    "Enviado!": "Sent!",
    "Erro ao enviar. Tente novamente.": "Could not send. Try again.",
    "Excluindo...": "Deleting...",
    "Sim, excluir minha conta": "Yes, delete my account",
    "Erro ao excluir. Tente novamente.": "Could not delete the account. Try again.",
    "Nenhuma promoção por enquanto.": "No promotions for now.",
    "Não foi possível carregar.": "Could not load."
};

function traduzirSemAssinatura(texto) {
    if (idiomaAtual === "pt" || texto == null) return texto;
    return dicionarioSemAssinatura[texto] || texto;
}

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

    const tipoContaEl = document.getElementById("tipoConta");
    if (tipoContaEl) {
        tipoContaEl.textContent = traduzirSemAssinatura(ultimoTipoContaSemAssinatura);
    }
});

// =========================
// TEMA
// =========================
// 🔧 A lógica de tema (claro/escuro, incluindo o botão mobile) já vem
// inteira do /js/tema.js compartilhado — não redefinimos nada aqui.
// Ter uma segunda cópia era o que causava o botão mobile "não fazer
// nada" na tela de Perfil (dois listeners alternando e se cancelando).

// =========================
// INICIALIZAÇÃO
// =========================
aplicarIdiomaEstatico();
carregarUsuario();

// ==========================
// SUBSTITUI OS ONCLICK/ONERROR INLINE (removidos por causa do CSP)
// ==========================

const fotoUsuarioEl = document.getElementById("fotoUsuario");

fotoUsuarioEl.addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

document.getElementById("imgMascote").addEventListener("error", function () {
    this.style.display = "none";
});

document.getElementById("imgSeguranca").addEventListener("error", function () {
    this.style.display = "none";
});