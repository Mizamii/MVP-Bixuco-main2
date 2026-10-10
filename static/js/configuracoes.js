
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

let ultimoTipoContaConfiguracoes = "Responsável";

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

        ultimoTipoContaConfiguracoes =
            usuario.tipoConta || "Responsável";

        document.getElementById("tipoConta").textContent =
            traduzir(ultimoTipoContaConfiguracoes);

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
            listaNotificacoes.innerHTML = `<div class="painel-vazio">${traduzir("Nenhuma notificação por enquanto.")}</div>`;
        } else {
            listaNotificacoes.innerHTML = itens.map(formatarItemNotificacao).join("");
        }

    } catch (erro) {
        console.log("Erro ao carregar notificações:", erro);
        listaNotificacoes.innerHTML = `<div class="painel-vazio">${traduzir("Não foi possível carregar as notificações.")}</div>`;
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
    btnEnviarSenha.textContent = traduzir("Enviar email");
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
    if (e.key !== "Escape") return;
    if (modalSenha.classList.contains("aberto")) fecharModalSenha();
    if (modalPlano.classList.contains("aberto")) fecharModalPlano();
});

btnEnviarSenha.addEventListener("click", async () => {

    btnEnviarSenha.disabled    = true;
    btnEnviarSenha.textContent = traduzir("Enviando...");

    try {

        const me = await fetch("/api/perfil").then(r => r.json());

        const resposta = await fetch("/esqueceu-senha", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ email: me.email })
        });

        if (!resposta.ok) throw new Error();

        mostrarStatusSenha(traduzir("Email enviado! Confira sua caixa de entrada."), "sucesso");
        btnEnviarSenha.textContent = traduzir("Enviado!");

    } catch (_) {

        mostrarStatusSenha(traduzir("Erro ao enviar. Tente novamente."), "erro");
        btnEnviarSenha.disabled    = false;
        btnEnviarSenha.textContent = traduzir("Enviar email");

    }

});


// ==========================
// PLANO E ASSINATURA (MODAL)
// ==========================

const modalPlano = document.getElementById("modalPlano");
const btnGerenciarPlano = document.getElementById("btnGerenciarPlano");
const btnFecharModalPlano = document.getElementById("btnFecharModalPlano");
const btnCancelarPlanoModal = document.getElementById("btnCancelarPlanoModal");
const btnConfirmarPlanoModal = document.getElementById("btnConfirmarPlanoModal");
const statusPlanoModal = document.getElementById("statusPlanoModal");
const nomePlanoAtualModal = document.getElementById("nomePlanoAtualModal");
const resumoPlanoAtual = document.getElementById("resumoPlanoAtual");
const opcoesPlanoModal = [...document.querySelectorAll(".opcao-plano")];
let planoCodigoAtualModal = null;
let planoSelecionadoModal = null;

function nomePlanoPorCodigo(codigo) {
    const nomes = {
        gratis: "Plano Grátis",
        medio: "Plano Básico Bixuco",
        completo: "Plano Premium Bixuco"
    };
    return nomes[codigo] || "Plano Grátis";
}

function renderPlanoAtualModal() {
    if (!planoCodigoAtualModal) return;
    const nome = traduzir(nomePlanoPorCodigo(planoCodigoAtualModal));
    nomePlanoAtualModal.textContent = nome;
    resumoPlanoAtual.textContent = nome;

    opcoesPlanoModal.forEach(botao => {
        const atual = botao.dataset.plano === planoCodigoAtualModal;
        const selecionado = botao.dataset.plano === planoSelecionadoModal;
        botao.classList.toggle("atual", atual);
        botao.classList.toggle("selecionado", selecionado);
        botao.setAttribute("aria-pressed", selecionado ? "true" : "false");
    });

    btnConfirmarPlanoModal.disabled = !planoSelecionadoModal || planoSelecionadoModal === planoCodigoAtualModal;
}

function mostrarStatusPlanoModal(texto = "", tipo = "") {
    statusPlanoModal.textContent = texto;
    statusPlanoModal.className = `status-plano-modal${texto ? " visivel" : ""}${tipo ? ` ${tipo}` : ""}`;
}

async function carregarPlanoAtualModal() {
    nomePlanoAtualModal.textContent = traduzir("Carregando...");
    mostrarStatusPlanoModal();
    try {
        const resposta = await fetch("/api/perfil");
        if (resposta.status === 401) {
            window.location.href = "/logar";
            return false;
        }
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) throw new Error(dados.erro || "Falha ao carregar plano");

        planoCodigoAtualModal = dados.planoCodigo || "gratis";
        planoSelecionadoModal = null;
        renderPlanoAtualModal();
        return true;
    } catch (erro) {
        console.log("Erro ao carregar plano:", erro);
        nomePlanoAtualModal.textContent = traduzir("Não foi possível carregar");
        mostrarStatusPlanoModal(traduzir("Não foi possível carregar seu plano agora."), "erro");
        return false;
    }
}

async function abrirModalPlano() {
    modalPlano.classList.add("aberto");
    modalPlano.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    await carregarPlanoAtualModal();
}

function fecharModalPlano() {
    modalPlano.classList.remove("aberto");
    modalPlano.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    planoSelecionadoModal = null;
    mostrarStatusPlanoModal();
}

btnGerenciarPlano.addEventListener("click", abrirModalPlano);
btnFecharModalPlano.addEventListener("click", fecharModalPlano);
btnCancelarPlanoModal.addEventListener("click", fecharModalPlano);
modalPlano.addEventListener("click", (e) => {
    if (e.target === modalPlano) fecharModalPlano();
});

opcoesPlanoModal.forEach(botao => {
    botao.addEventListener("click", () => {
        const codigo = botao.dataset.plano;
        if (!codigo || codigo === planoCodigoAtualModal) {
            planoSelecionadoModal = null;
            mostrarStatusPlanoModal(
                traduzir("Esse já é o seu plano atual."),
                "info"
            );
        } else {
            planoSelecionadoModal = codigo;
            mostrarStatusPlanoModal();
        }
        renderPlanoAtualModal();
    });
});

btnConfirmarPlanoModal.addEventListener("click", async () => {
    if (!planoSelecionadoModal || planoSelecionadoModal === planoCodigoAtualModal) return;

    if (planoSelecionadoModal === "gratis") {
        const confirmar = window.confirm(traduzir(
            "Ao mudar para o plano Grátis, os recursos pagos do Bixuco deixarão de ficar disponíveis. Deseja continuar?"
        ));
        if (!confirmar) return;
    }

    btnConfirmarPlanoModal.disabled = true;
    btnConfirmarPlanoModal.textContent = traduzir("Processando...");
    mostrarStatusPlanoModal();

    try {
        const resposta = await fetch("/api/planos/assinar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plano: planoSelecionadoModal })
        });
        const dados = await resposta.json().catch(() => ({}));
        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }
        if (!resposta.ok) throw new Error(dados.erro || "Erro ao processar assinatura.");

        if (dados.linkPagamento) {
            window.location.href = dados.linkPagamento;
            return;
        }
        if (dados.destino) {
            window.location.href = dados.destino;
            return;
        }

        mostrarStatusPlanoModal(traduzir("Plano atualizado."), "sucesso");
        await carregarPlanoAtualModal();
    } catch (erro) {
        console.log("Erro ao alterar plano:", erro);
        mostrarStatusPlanoModal(traduzir(erro.message || "Erro ao processar assinatura."), "erro");
    } finally {
        btnConfirmarPlanoModal.textContent = traduzir("Confirmar alteração");
        renderPlanoAtualModal();
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
    btnConfirmar.textContent = traduzir("Excluindo...");

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

const dicionario = {
    "Usuário": "User",
    "Responsável": "Guardian",
    "Nenhuma notificação por enquanto.": "No notifications for now.",
    "Não foi possível carregar as notificações.": "Could not load notifications.",
    "Enviar email": "Send email",
    "Enviando...": "Sending...",
    "Email enviado! Confira sua caixa de entrada.": "Email sent! Check your inbox.",
    "Enviado!": "Sent!",
    "Erro ao enviar. Tente novamente.": "Error sending. Please try again.",
    "Excluindo...": "Deleting...",
    "Plano Grátis": "Free plan",
    "Plano Básico Bixuco": "Bixuco Basic plan",
    "Plano Premium Bixuco": "Bixuco Premium plan",
    "Carregando...": "Loading...",
    "Não foi possível carregar": "Could not load",
    "Não foi possível carregar seu plano agora.": "Could not load your plan right now.",
    "Esse já é o seu plano atual.": "This is already your current plan.",
    "Ao mudar para o plano Grátis, os recursos pagos do Bixuco deixarão de ficar disponíveis. Deseja continuar?": "If you switch to the Free plan, paid Bixuco features will no longer be available. Do you want to continue?",
    "Processando...": "Processing...",
    "Confirmar alteração": "Confirm change",
    "Plano atualizado.": "Plan updated.",
    "Erro ao processar assinatura.": "Error processing subscription."
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
        idiomaAtual === "en" ? "Traduzir para português" : "Traduzir para inglês";

    const tipoConta = document.getElementById("tipoConta");
    if (tipoConta) {
        tipoConta.textContent = traduzir(ultimoTipoContaConfiguracoes);
    }

    if (!btnEnviarSenha.disabled) {
        btnEnviarSenha.textContent = traduzir("Enviar email");
    }

    if (planoCodigoAtualModal) {
        renderPlanoAtualModal();
    }

    if (!btnConfirmarPlanoModal.disabled) {
        btnConfirmarPlanoModal.textContent = traduzir("Confirmar alteração");
    }
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);
    aplicarIdiomaEstatico();

    if (painelNotificacoes.classList.contains("aberto")) {
        carregarNotificacoes();
    }
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

fotoUsuarioEl.addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});



// Links antigos de gerenciamento de assinatura podem apontar para
// /configuracoes?abrir=plano. O modal abre sem trocar o contexto da conta.
if (new URLSearchParams(window.location.search).get("abrir") === "plano") {
    abrirModalPlano();
    const urlPlano = new URL(window.location.href);
    urlPlano.searchParams.delete("abrir");
    window.history.replaceState({}, "", urlPlano.pathname + urlPlano.search + urlPlano.hash);
}
