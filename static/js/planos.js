// =========================
// TRADUÇÃO MANUAL
// =========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    "Selecione um plano antes de confirmar.": "Select a plan before confirming.",
    "Processando...":                        "Processing...",
    "Confirmar":                              "Confirm",
    "Erro ao processar.":                     "Error processing.",
    "Erro ao processar. Tente novamente.":    "Error processing. Try again.",
    "Nenhuma promoção por enquanto.":         "No promotions for now.",
    "Não foi possível carregar.":             "Could not load.",
    "Carregando...":                          "Loading...",
    "Responsável":                            "Guardian",
    "Terapeuta":                              "Therapist",
    "Usuário":                                "User",
    "Pagamento ainda não aprovado. Aguarde a confirmação do Mercado Pago antes de acessar a home.": "Payment has not been approved yet. Wait for Mercado Pago confirmation before accessing the home page.",
    "Pagamento não aprovado. Tente novamente ou escolha outra forma de pagamento.": "Payment was not approved. Try again or choose another payment method.",
    "Não foi possível validar esse pagamento. Tente novamente.": "We could not validate this payment. Please try again."
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
        idiomaAtual === "en" ? "Traduzir para o português" : "Traduzir para o inglês";

    // Reaplica textos dinâmicos que dependem do idioma
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

// Plano selecionado pelo usuário (clique no card)
let planoSelecionado = null;
let ultimoTipoConta  = "Responsável";

// Plano REAL do usuário (gratis / medio / completo), usado pra
// decidir a navegação — sidebar e destino da foto/nome de perfil.
// Começa em "gratis" até a chamada de carregarUsuario() responder.
let planoCodigoAtual = "gratis";

// Manda pro perfil certo dependendo se o usuário tem plano pago ou não.
// Sem isso, todo mundo (até assinante) era mandado pro perfil da
// versão sem assinatura.
function irParaPerfil() {
    window.location.href = planoCodigoAtual === "gratis"
        ? "/perfilSemAssinatura"
        : "/perfil";
}

// Troca o sidebar reduzido (sem assinatura) pelo completo quando o
// usuário já tem um plano pago — pra não deixar assinante preso
// navegando só entre Planos/ConfiguraçõesSemAssinatura/Sobre.
function atualizarSidebar(planoCodigo) {
    const temPlanoPago = planoCodigo === "medio" || planoCodigo === "completo";
    document.getElementById("navComPlano").style.display  = temPlanoPago ? "flex" : "none";
    document.getElementById("navSemPlano").style.display  = temPlanoPago ? "none"  : "flex";
}

// =========================
// CARREGAR USUÁRIO
// =========================
async function carregarUsuario() {
    try {
        // 🔧 Antes chamava /api/home, que nunca devolveu o campo
        // "plano" — por isso o card atual nunca era pré-selecionado.
        // /api/perfil devolve "plano" (nome bonito) e "planoCodigo"
        // (gratis/medio/completo), que é o que a gente usa pra
        // decidir tudo aqui.
        const resposta = await fetch("/api/perfil");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) return;

        const dados = await resposta.json();

        document.getElementById("nomeUsuario").textContent =
            dados.nome || "Usuário";

        ultimoTipoConta = dados.tipoConta || "Responsável";
        document.getElementById("tipoConta").textContent = traduzir(ultimoTipoConta);

        if (dados.fotoPerfil) {
            document.getElementById("fotoUsuario").src = dados.fotoPerfil;
        }

        planoCodigoAtual = dados.planoCodigo || "gratis";
        atualizarSidebar(planoCodigoAtual);

        // Mostra o plano atual
        if (dados.plano) {
            document.getElementById("nomePlanoAtual").textContent = dados.plano;
            document.getElementById("planoAtualInfo").style.display = "block";
        }

        // Pré-seleciona o card do plano atual usando planoCodigo
        // diretamente — nada de comparar nome de exibição (que pode
        // mudar) com um mapa de string, como era feito antes.
        const idsPorCodigo = {
            gratis:   "cardGratis",
            medio:    "cardMedio",
            completo: "cardCompleto"
        };

        const cardId = idsPorCodigo[planoCodigoAtual];
        if (cardId) {
            const card = document.getElementById(cardId);
            if (card) selecionarPlano(planoCodigoAtual, card);
        }

    } catch (e) {
        console.log("Erro ao carregar usuário:", e);
    }
}

// =========================
// SELECIONAR CARD
// =========================
function selecionarPlano(plano, card) {
    // Remove seleção anterior
    document.querySelectorAll(".card-plano").forEach(c => {
        c.classList.remove("card-plano--selecionado");
    });

    // Marca o card clicado
    card.classList.add("card-plano--selecionado");
    planoSelecionado = plano;

    // Esconde erro se estava visível
    document.getElementById("erroPlano").style.display = "none";
}

// =========================
// CONFIRMAR PLANO
// =========================
async function confirmarPlano() {

    if (!planoSelecionado) {
        const erroEl = document.getElementById("erroPlano");
        erroEl.textContent = traduzir("Selecione um plano antes de confirmar.");
        erroEl.style.display = "block";
        return;
    }

    const btn = document.getElementById("btnConfirmar");
    btn.disabled    = true;
    btn.textContent = traduzir("Processando...");

    try {

        const resposta = await fetch("/api/planos/assinar", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ plano: planoSelecionado })
        });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao processar.");
        }

        // Grátis → vai direto para a home
        if (dados.destino) {
            window.location.href = dados.destino;
            return;
        }

        // Pago → redireciona para o Mercado Pago
        if (dados.linkPagamento) {
            window.location.href = dados.linkPagamento;
            return;
        }

    } catch (erro) {

        console.log("Erro ao confirmar plano:", erro);

        const erroEl = document.getElementById("erroPlano");
        erroEl.textContent = traduzir(erro.message) || traduzir("Erro ao processar. Tente novamente.");
        erroEl.style.display = "block";

    } finally {

        btn.disabled    = false;
        btn.textContent = traduzir("Confirmar");

    }

}

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
// NOTIFICAÇÕES (só promoções)
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
            ? `<div class="painel-vazio">${traduzir("Nenhuma promoção por enquanto.")}</div>`
            : itens.map(formatarItemNotificacao).join("");

        const naoLidas = itens.filter(item => !item.lida).length;
        document.getElementById("quantidadeNotificacoes").textContent = naoLidas;

    } catch (erro) {
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

// =========================
// FEEDBACK DO RETORNO DO MERCADO PAGO
// =========================
function mostrarFeedbackPagamento() {
    const params = new URLSearchParams(window.location.search);
    const info = params.get("info");
    const erro = params.get("erro");

    let mensagem = null;
    let cor = "#E53E3E";

    if (info === "pagamento_pendente") {
        mensagem = "Pagamento ainda não aprovado. Aguarde a confirmação do Mercado Pago antes de acessar a home.";
        cor = "#2252BD";
    } else if (erro === "pagamento_falhou") {
        mensagem = "Pagamento não aprovado. Tente novamente ou escolha outra forma de pagamento.";
    } else if (erro === "pagamento_invalido") {
        mensagem = "Não foi possível validar esse pagamento. Tente novamente.";
    }

    if (!mensagem) return;

    const feedback = document.getElementById("erroPlano");
    feedback.textContent = traduzir(mensagem);
    feedback.style.color = cor;
    feedback.style.display = "block";

    // Remove os parâmetros depois de exibir para não repetir a mensagem ao atualizar.
    window.history.replaceState({}, document.title, window.location.pathname);
}

// =========================
// INICIALIZAÇÃO
// =========================
aplicarIdiomaEstatico();
const temaSalvo = localStorage.getItem("tema") || "claro";
aplicarTema(temaSalvo);
carregarUsuario();
mostrarFeedbackPagamento();

// Substitui os antigos onclick/onerror inline (removidos por causa do CSP)

document.getElementById("fotoUsuario").addEventListener("click", irParaPerfil);
document.getElementById("fotoUsuario").addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

document.getElementById("blocoNomeUsuario").addEventListener("click", irParaPerfil);

document.getElementById("imgMascotePlanos").addEventListener("error", function () {
    this.style.display = "none";
});

document.getElementById("cardGratis").addEventListener("click", function () {
    selecionarPlano("gratis", this);
});

document.getElementById("cardMedio").addEventListener("click", function () {
    selecionarPlano("medio", this);
});

document.getElementById("cardCompleto").addEventListener("click", function () {
    selecionarPlano("completo", this);
});

document.getElementById("btnConfirmar").addEventListener("click", confirmarPlano);