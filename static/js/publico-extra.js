// ==========================================================
// publico-extra.js
// Tradução genérica para telas públicas que não possuem
// um JS próprio de idioma.
// ==========================================================

let idiomaPublicoAtual = localStorage.getItem("idioma") || "pt";

function aplicarIdiomaPublico() {
    document.querySelectorAll("[data-pt]").forEach((el) => {
        el.textContent = idiomaPublicoAtual === "en"
            ? (el.dataset.en || el.dataset.pt)
            : el.dataset.pt;
    });

    document.querySelectorAll("[data-pt-placeholder]").forEach((el) => {
        el.placeholder = idiomaPublicoAtual === "en"
            ? (el.dataset.enPlaceholder || el.dataset.ptPlaceholder)
            : el.dataset.ptPlaceholder;
    });

    document.querySelectorAll("[data-pt-title]").forEach((el) => {
        el.title = idiomaPublicoAtual === "en"
            ? (el.dataset.enTitle || el.dataset.ptTitle)
            : el.dataset.ptTitle;
    });

    document.querySelectorAll("[data-pt-aria]").forEach((el) => {
        el.setAttribute(
            "aria-label",
            idiomaPublicoAtual === "en"
                ? (el.dataset.enAria || el.dataset.ptAria)
                : el.dataset.ptAria
        );
    });

    const textoTradutor = document.getElementById("textoTradutor");
    if (textoTradutor) {
        textoTradutor.textContent = idiomaPublicoAtual === "en" ? "PT" : "EN";
    }

    document.documentElement.lang = idiomaPublicoAtual === "en" ? "en" : "pt-BR";

    window.dispatchEvent(new CustomEvent("bixuco:idioma-alterado", {
        detail: { idioma: idiomaPublicoAtual }
    }));
}

function traduzirPublico(pt, en) {
    return idiomaPublicoAtual === "en" ? (en || pt) : pt;
}

window.traduzirPublico = traduzirPublico;
window.obterIdiomaPublico = () => idiomaPublicoAtual;

const btnTraduzirPublico = document.getElementById("btnTraduzir");
if (btnTraduzirPublico) {
    btnTraduzirPublico.addEventListener("click", () => {
        idiomaPublicoAtual = idiomaPublicoAtual === "pt" ? "en" : "pt";
        localStorage.setItem("idioma", idiomaPublicoAtual);
        aplicarIdiomaPublico();
    });
}

aplicarIdiomaPublico();
