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
        idiomaAtual === "en" ? "Traduzir para o português" : "Traduzir para o inglês";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);
    aplicarIdiomaEstatico();
});

aplicarIdiomaEstatico();

// ==========================
// SELEÇÃO DE TIPO DE CONTA
// ==========================

// Guarda o tipo selecionado pelo usuário
let tipoSelecionado = null;

// ==========================
// SELECIONAR TIPO
// ==========================

function selecionarTipo(tipo) {

    tipoSelecionado = tipo;

    // aria-pressed simplificado — atualiza todos os cards de uma vez
    document.querySelectorAll(".tipo-card").forEach(card => {
        card.classList.remove("tipo-card--ativo");
        card.setAttribute("aria-pressed", "false");
    });

    // Marca o card clicado como ativo
    const cardSelecionado = tipo === "responsavel"
        ? document.getElementById("cardResponsavel")
        : document.getElementById("cardPsicologo");

    cardSelecionado.classList.add("tipo-card--ativo");
    cardSelecionado.setAttribute("aria-pressed", "true");

    // Habilita o botão ao selecionar um card
    document.getElementById("btnContinuar").disabled = false;

    // Esconde a mensagem de erro se estava aparecendo
    const erroSelecao = document.getElementById("erro-selecao");
    erroSelecao.style.display = "none";

}

// ==========================
// CONTINUAR
// ==========================

function continuar() {

    // Segurança extra — mesmo com botão desabilitado,
    // valida novamente caso o JS seja chamado diretamente
    if (tipoSelecionado === null) {

        const erroSelecao = document.getElementById("erro-selecao");
        erroSelecao.style.display = "block";
        return;

    }

    // Redireciona para a próxima etapa conforme o tipo escolhido
    if (tipoSelecionado === "responsavel") {
        window.location.href = "/CriarContaG";
    } else if (tipoSelecionado === "psicologo") {
        window.location.href = "/CriarContaP";
    }

}

// ==========================
// SUBSTITUI OS ONCLICK INLINE (removidos por causa do CSP)
// ==========================

document.getElementById("cardResponsavel").addEventListener("click", () => {
    selecionarTipo("responsavel");
});

document.getElementById("cardPsicologo").addEventListener("click", () => {
    selecionarTipo("psicologo");
});

document.getElementById("btnContinuar").addEventListener("click", continuar);