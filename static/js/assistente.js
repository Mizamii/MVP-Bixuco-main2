let idiomaAtual = localStorage.getItem("idioma") || "pt";
let enviando = false;

const mensagensEl = document.getElementById("mensagensAssistente");
const formEl = document.getElementById("formAssistente");
const inputEl = document.getElementById("inputAssistente");
const btnEnviar = document.getElementById("btnEnviarAssistente");
const btnNovaConversa = document.getElementById("btnNovaConversa");
const avisoRelatorio = document.getElementById("avisoRelatorioAtualizado");
const atalhosEl = document.getElementById("atalhosAssistente");

function escaparHTML(texto) {
    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function traduzirElementos() {
    document.documentElement.lang = idiomaAtual === "en" ? "en" : "pt-BR";

    document.querySelectorAll("[data-pt][data-en]").forEach(el => {
        el.textContent = idiomaAtual === "en" ? el.dataset.en : el.dataset.pt;
    });

    if (inputEl) {
        inputEl.placeholder = idiomaAtual === "en"
            ? "Ask about records, Bixuco, or tell me how the day went..."
            : "Pergunte sobre os registros, o Bixuco ou conte como foi o dia...";
    }

    if (btnEnviar) {
        btnEnviar.setAttribute("aria-label", idiomaAtual === "en" ? "Send message" : "Enviar mensagem");
    }

    const textoTradutor = document.getElementById("textoTradutor");
    if (textoTradutor) {
        textoTradutor.textContent = idiomaAtual === "en"
            ? "Traduzir para o português"
            : "Traduzir para o inglês";
    }
}

function alternarIdioma() {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);
    traduzirElementos();
}

function criarMensagem(role, texto, classeExtra = "") {
    const linha = document.createElement("div");
    linha.className = `assistente-mensagem ${role === "user" ? "usuario" : "assistente"} ${classeExtra}`.trim();

    const bolha = document.createElement("div");
    bolha.className = "assistente-bolha";
    bolha.textContent = texto;

    linha.appendChild(bolha);
    mensagensEl.appendChild(linha);
    mensagensEl.scrollTop = mensagensEl.scrollHeight;
    return linha;
}

function mensagemInicial() {
    return idiomaAtual === "en"
        ? "Hi! I'm the Bixuco Assistant. I can check Bixuco records linked to your account, answer questions about the system, help you understand the day and organize information for today's report. What would you like to know?"
        : "Oi! Sou o Assistente Bixuco. Posso consultar os registros do Bixuco vinculados à sua conta, tirar dúvidas sobre o sistema, ajudar a entender o dia e organizar informações do relatório de hoje. O que você gostaria de saber?";
}

async function carregarHistorico() {
    mensagensEl.innerHTML = "";

    try {
        const resposta = await fetch("/api/assistente/historico");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (resposta.status === 403) {
            window.location.href = "/planos";
            return;
        }

        if (!resposta.ok) throw new Error("historico");

        const dados = await resposta.json();
        const historico = Array.isArray(dados.mensagens) ? dados.mensagens : [];

        if (historico.length === 0) {
            criarMensagem("assistant", mensagemInicial());
            return;
        }

        historico.forEach(item => {
            if (!item || typeof item.content !== "string") return;
            if (item.role !== "user" && item.role !== "assistant") return;
            criarMensagem(item.role, item.content);
        });
    } catch (erro) {
        criarMensagem(
            "assistant",
            idiomaAtual === "en"
                ? "I couldn't load the previous conversation, but you can start a new one here."
                : "Não consegui carregar a conversa anterior, mas você pode começar uma nova por aqui."
        );
    }
}

async function enviarMensagem(texto) {
    texto = String(texto || "").trim();
    if (!texto || enviando) return;

    enviando = true;
    inputEl.disabled = true;
    btnEnviar.disabled = true;
    avisoRelatorio.hidden = true;

    criarMensagem("user", texto);
    const digitando = criarMensagem(
        "assistant",
        idiomaAtual === "en" ? "Checking your Bixuco data..." : "Consultando os dados do seu Bixuco...",
        "digitando"
    );

    try {
        const resposta = await fetch("/api/assistente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensagem: texto, idioma: idiomaAtual })
        });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (resposta.status === 403) {
            window.location.href = "/planos";
            return;
        }

        const dados = await resposta.json();
        digitando.remove();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro no assistente.");
        }

        criarMensagem("assistant", dados.mensagem || (idiomaAtual === "en" ? "I couldn't answer that." : "Não consegui responder isso."));

        if (dados.relatorioAtualizado) {
            avisoRelatorio.hidden = false;
            window.clearTimeout(window.__timerAvisoRelatorio);
            window.__timerAvisoRelatorio = window.setTimeout(() => {
                avisoRelatorio.hidden = true;
            }, 5500);
        }
    } catch (erro) {
        if (digitando.isConnected) digitando.remove();
        criarMensagem(
            "assistant",
            erro.message && erro.message !== "Erro no assistente."
                ? erro.message
                : (idiomaAtual === "en"
                    ? "I couldn't respond right now. Please try again in a moment."
                    : "Não consegui responder agora. Tente novamente em instantes.")
        );
    } finally {
        enviando = false;
        inputEl.disabled = false;
        btnEnviar.disabled = false;
        inputEl.focus({ preventScroll: true });
    }
}

function ajustarAltura() {
    inputEl.style.height = "auto";
    inputEl.style.height = `${Math.min(inputEl.scrollHeight, 130)}px`;
}

async function novaConversa() {
    if (enviando) return;

    const confirmar = window.confirm(
        idiomaAtual === "en"
            ? "Start a new chat? This clears only the assistant conversation history; reports and Bixuco records will not be deleted."
            : "Começar uma nova conversa? Isso apaga apenas o histórico do Assistente; relatórios e registros do Bixuco não serão excluídos."
    );

    if (!confirmar) return;

    try {
        const resposta = await fetch("/api/assistente/historico", { method: "DELETE" });
        if (!resposta.ok) throw new Error("limpar");
        mensagensEl.innerHTML = "";
        criarMensagem("assistant", mensagemInicial());
        avisoRelatorio.hidden = true;
    } catch (_) {
        criarMensagem(
            "assistant",
            idiomaAtual === "en" ? "I couldn't clear the chat right now." : "Não consegui limpar a conversa agora."
        );
    }
}

async function carregarCabecalho() {
    try {
        const resposta = await fetch("/api/home");
        if (!resposta.ok) return;
        const dados = await resposta.json();

        const nome = document.getElementById("nomeUsuario");
        const tipo = document.getElementById("tipoConta");
        const foto = document.getElementById("fotoUsuario");
        const badge = document.getElementById("quantidadeNotificacoes");

        if (nome) nome.textContent = dados.nome || "Usuário";
        if (tipo) tipo.textContent = idiomaAtual === "en" ? "Guardian" : (dados.tipoConta || "Responsável");
        if (foto && dados.fotoPerfil) foto.src = dados.fotoPerfil;
        if (badge) badge.textContent = String(dados.notificacoes || 0);
    } catch (_) {}
}

async function carregarNotificacoes() {
    const lista = document.getElementById("listaNotificacoes");
    if (!lista) return;

    try {
        const resposta = await fetch("/api/notificacoes");
        if (!resposta.ok) throw new Error("notif");
        const dados = await resposta.json();
        const itens = Array.isArray(dados.notificacoes) ? dados.notificacoes : [];

        lista.innerHTML = "";

        if (itens.length === 0) {
            const vazio = document.createElement("div");
            vazio.className = "painel-vazio";
            vazio.textContent = idiomaAtual === "en" ? "No notifications yet." : "Nenhuma notificação por enquanto.";
            lista.appendChild(vazio);
            return;
        }

        itens.forEach(item => {
            const div = document.createElement("div");
            div.className = `item-notificacao ${item.lida ? "" : "nao-lida"}`.trim();
            const texto = document.createElement("div");
            texto.textContent = item.mensagem || "";
            div.appendChild(texto);
            if (item.tempo) {
                const tempo = document.createElement("span");
                tempo.className = "tempo-notificacao";
                tempo.textContent = item.tempo;
                div.appendChild(tempo);
            }
            lista.appendChild(div);
        });
    } catch (_) {
        lista.textContent = idiomaAtual === "en"
            ? "Couldn't load notifications."
            : "Não foi possível carregar as notificações.";
    }
}

formEl.addEventListener("submit", e => {
    e.preventDefault();
    const texto = inputEl.value.trim();
    if (!texto) return;
    inputEl.value = "";
    ajustarAltura();
    enviarMensagem(texto);
});

inputEl.addEventListener("input", ajustarAltura);
inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        formEl.requestSubmit();
    }
});

btnNovaConversa.addEventListener("click", novaConversa);

document.getElementById("btnRelatorioDiario")?.addEventListener("click", () => {
    window.location.href = "/RelatorioDiario";
});

atalhosEl?.addEventListener("click", e => {
    const botao = e.target.closest("button[data-msg-pt]");
    if (!botao || enviando) return;
    const texto = idiomaAtual === "en" ? botao.dataset.msgEn : botao.dataset.msgPt;
    enviarMensagem(texto);
});

const btnTraduzir = document.getElementById("btnTraduzir");
btnTraduzir?.addEventListener("click", () => {
    alternarIdioma();
    carregarCabecalho();
});

const painelNotificacoes = document.getElementById("painelNotificacoes");
document.getElementById("btnNotificacoes")?.addEventListener("click", async e => {
    e.stopPropagation();
    if (!painelNotificacoes) return;
    const abrindo = !painelNotificacoes.classList.contains("aberto");
    painelNotificacoes.classList.toggle("aberto", abrindo);
    if (abrindo) {
        await carregarNotificacoes();
        fetch("/api/notificacoes/marcar-lidas", { method: "POST" }).catch(() => {});
        const badge = document.getElementById("quantidadeNotificacoes");
        if (badge) badge.textContent = "0";
    }
});

document.addEventListener("click", e => {
    if (painelNotificacoes && !painelNotificacoes.contains(e.target)) {
        painelNotificacoes.classList.remove("aberto");
    }
});

traduzirElementos();
carregarCabecalho();
carregarHistorico();
