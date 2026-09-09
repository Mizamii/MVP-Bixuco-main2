
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

document.getElementById("btnClaro").addEventListener("click", () => {
    aplicarTema("claro");
});

document.getElementById("btnEscuro").addEventListener("click", () => {
    aplicarTema("escuro");
});

const temaSalvo = localStorage.getItem("tema") || "claro";
aplicarTema(temaSalvo);


// ==========================
// CARREGA DADOS DO USUÁRIO
// ==========================

async function carregarUsuario() {

    try {

        const resposta = await fetch("/api/home");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) {
            throw new Error();
        }

        const usuario = await resposta.json();

        document.getElementById("nomeUsuario").textContent =
            usuario.nome || "Usuário";

        document.getElementById("tipoConta").textContent =
            usuario.tipoConta || "Responsável";

        if (usuario.fotoPerfil) {
            document.getElementById("fotoUsuario").src = usuario.fotoPerfil;
        }

    } catch (erro) {

        console.log("Erro ao carregar usuário:", erro);

    }

}

carregarUsuario();


// ==========================
// NOTIFICAÇÕES (TOGGLES)
// ==========================

const notifRelatorio = document.getElementById("notifRelatorio");
const notifNovidades = document.getElementById("notifNovidades");

// 🔧 FIX DO BUG: antes os checkboxes tinham o estado fixo no HTML
// (sempre "checked" no lembrete, sempre desmarcado nas novidades),
// então nunca refletiam o que estava realmente salvo no banco.
// Agora buscamos o valor real ao carregar a página.
async function carregarPreferenciasNotificacao() {

    try {

        const resposta = await fetch("/api/configuracoes/notificacoes");

        if (!resposta.ok) throw new Error("Falha ao carregar preferências");

        const dados = await resposta.json();

        notifRelatorio.checked = dados.lembrete;
        notifNovidades.checked = dados.novidades;

    } catch (erro) {

        console.log("Erro ao carregar preferências de notificação:", erro);
        // Em caso de erro, mantém os padrões que já estão no HTML

    }

}

async function salvarNotificacao(dados) {

    try {

        await fetch("/api/configuracoes/notificacoes", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(dados)

        });

    } catch (erro) {

        console.log("Erro ao salvar notificação:", erro);

    }

}

notifRelatorio.addEventListener("change", () => {
    salvarNotificacao({ lembrete: notifRelatorio.checked });
});

notifNovidades.addEventListener("change", () => {
    salvarNotificacao({ novidades: notifNovidades.checked });
});

carregarPreferenciasNotificacao();


// ==========================
// PAINEL DE NOTIFICAÇÕES (SININHO)
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

        if (!resposta.ok) throw new Error("Falha ao carregar notificações");

        const dados = await resposta.json();
        const itens = dados.notificacoes || [];

        if (itens.length === 0) {
            listaNotificacoes.innerHTML = `<div class="painel-vazio">Nenhuma notificação por enquanto.</div>`;
        } else {
            listaNotificacoes.innerHTML = itens.map(formatarItemNotificacao).join("");
        }

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
// COMPARTILHAR TERAPEUTA
// ==========================

document.getElementById("btnCompartilhar").addEventListener("click", () => {
    const mensagem = encodeURIComponent(
        "Olá! Venha conhecer o Bixuco, um aplicativo que ajuda no acompanhamento de crianças com hipersensibilidade sensorial. 🐱\n\n" +
        "https://mvp-bixuco.onrender.com"
    );
    window.open(`https://wa.me/?text=${mensagem}`, "_blank");
});


// ==========================
// 🔧 ALTERAR SENHA — AGORA VIA MODAL
// ==========================

const modalSenha        = document.getElementById("modalSenha");
const formAlterarSenha  = document.getElementById("formAlterarSenha");
const btnSalvarSenha    = document.getElementById("btnSalvarSenha");
const statusSenha       = document.getElementById("statusSenha");

function abrirModalSenha() {
    modalSenha.classList.add("aberto");
    document.body.style.overflow = "hidden";
}

function fecharModalSenha() {
    modalSenha.classList.remove("aberto");
    document.body.style.overflow = "";
    formAlterarSenha.reset();
    statusSenha.className = "status-senha";
}

function mostrarStatusSenha(texto, tipo) {
    statusSenha.textContent = texto;
    statusSenha.className   = `status-senha visivel ${tipo}`;
}

document.getElementById("btnAlterarSenha").addEventListener("click", abrirModalSenha);
document.getElementById("btnFecharModalSenha").addEventListener("click", fecharModalSenha);

// Fecha clicando fora do card
modalSenha.addEventListener("click", (e) => {
    if (e.target === modalSenha) fecharModalSenha();
});

// Fecha com Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalSenha.classList.contains("aberto")) {
        fecharModalSenha();
    }
});

formAlterarSenha.addEventListener("submit", async (e) => {

    e.preventDefault();

    const senhaAtual         = document.getElementById("senhaAtual").value;
    const novaSenha          = document.getElementById("novaSenha").value;
    const confirmarNovaSenha = document.getElementById("confirmarNovaSenha").value;

    if (novaSenha.length < 6 || !/[A-Z]/.test(novaSenha) || !/[!@#$%^&*(),.?":{}|<>_\-\\[\];'/+=]/.test(novaSenha)) {
        mostrarStatusSenha("A nova senha deve ter pelo menos 6 caracteres, uma letra maiúscula e um caractere especial.", "erro");
        return;
    }

    if (novaSenha !== confirmarNovaSenha) {
        mostrarStatusSenha("As senhas novas não coincidem.", "erro");
        return;
    }

    btnSalvarSenha.disabled    = true;
    btnSalvarSenha.textContent = "Salvando...";

    try {

        const resposta = await fetch("/api/alterar-senha", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                senhaAtual,
                novaSenha,
                confirmarNovaSenha
            })

        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao alterar a senha.");
        }

        mostrarStatusSenha(dados.mensagem || "Senha alterada com sucesso!", "sucesso");
        formAlterarSenha.reset();

        setTimeout(fecharModalSenha, 1800);

    } catch (erro) {

        mostrarStatusSenha(erro.message, "erro");

    } finally {

        btnSalvarSenha.disabled    = false;
        btnSalvarSenha.textContent = "Salvar nova senha";

    }

});


// ==========================
// EXCLUIR CONTA
// ==========================

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
    btnConfirmar.textContent = "Excluindo...";

    try {

        const resposta = await fetch("/api/excluir-conta", {
            method: "DELETE"
        });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        // 🔧 FIX: vai para / independente da resposta
        // pois a sessão é destruída antes do JSON chegar
        window.location.href = "/logar";

    } catch (erro) {

        console.log("Erro ao excluir conta:", erro);
        // Mesmo com erro de rede vai para home — a conta já foi excluída
        window.location.href = "/";

    }

});


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
        idiomaAtual === "en" ? "Traduzir para português" : "Traduzir para inglês";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);
    aplicarIdiomaEstatico();
});

// Aplica o idioma salvo ao carregar
aplicarIdiomaEstatico();

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