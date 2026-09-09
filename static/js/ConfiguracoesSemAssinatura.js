
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

        document.getElementById("tipoConta").textContent =
            dados.tipoConta || "Responsável";

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
    const mensagem = encodeURIComponent(
        "Olá! Venha conhecer o Bixuco, um aplicativo que ajuda no acompanhamento de crianças com hipersensibilidade sensorial. 🐱\n\n" +
        "https://mvp-bixuco.onrender.com"
    );
    window.open(`https://wa.me/?text=${mensagem}`, "_blank");
});

// =========================
// 🔧 ALTERAR SENHA — AGORA VIA MODAL
// =========================

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

modalSenha.addEventListener("click", (e) => {
    if (e.target === modalSenha) fecharModalSenha();
});

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
    btnConfirmar.textContent = "Excluindo...";

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
            btnConfirmar.textContent = "Sim, excluir minha conta";
            confirmarExclusao.querySelector("p").textContent =
                "❌ " + (dados.erro || "Erro ao excluir. Tente novamente.");
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
            ? `<div class="painel-vazio">Nenhuma promoção por enquanto.</div>`
            : itens.map(formatarItemNotificacao).join("");

        const naoLidas = itens.filter(item => !item.lida).length;
        document.getElementById("quantidadeNotificacoes").textContent = naoLidas;

    } catch (erro) {
        console.log("Erro ao carregar notificações:", erro);
        listaNotificacoes.innerHTML = `<div class="painel-vazio">Não foi possível carregar.</div>`;
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

// =========================
// 🔧 FIX: TRADUÇÃO MANUAL (sem Google Translate)
// Troca o texto de todo elemento com data-pt/data-en,
// igual ao padrão usado na tela de configurações com assinatura
// =========================
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
aplicarIdiomaEstatico();
carregarUsuario();

// ==========================
// SUBSTITUI OS ONCLICK/ONERROR INLINE (removidos por causa do CSP)
// ==========================

const fotoUsuarioEl = document.getElementById("fotoUsuario");

fotoUsuarioEl.addEventListener("click", () => {
    window.location.href = "/perfilSemAssinatura";
});

fotoUsuarioEl.addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

document.getElementById("wrapperPerfilTopo").addEventListener("click", () => {
    window.location.href = "/perfilSemAssinatura";
});

document.getElementById("imgMascote").addEventListener("error", function () {
    this.style.display = "none";
});

document.getElementById("imgSeguranca").addEventListener("error", function () {
    this.style.display = "none";
});