// =========================
// INDEX — IDIOMA
// =========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

function aplicarIdiomaIndex() {
    document.querySelectorAll("[data-pt]").forEach(el => {
        el.textContent = idiomaAtual === "en"
            ? (el.dataset.en || el.dataset.pt)
            : el.dataset.pt;
    });

    const textoTradutor = document.getElementById("textoTradutor");
    if (textoTradutor) {
        textoTradutor.textContent = idiomaAtual === "en" ? "PT" : "EN";
    }

    document.documentElement.lang = idiomaAtual === "en" ? "en" : "pt-BR";
    document.title = idiomaAtual === "en"
        ? "Bixuco — Technology that supports, welcomes and connects"
        : "Bixuco — Tecnologia que acompanha, acolhe e conecta";
}

const btnTraduzir = document.getElementById("btnTraduzir");
if (btnTraduzir) {
    btnTraduzir.addEventListener("click", () => {
        idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
        localStorage.setItem("idioma", idiomaAtual);
        aplicarIdiomaIndex();
    });
}

aplicarIdiomaIndex();

// =========================
// SOMBRA NA NAVBAR AO ROLAR
// =========================

(function () {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    function atualizar() {
        navbar.classList.toggle("navbar-scroll", window.scrollY > 20);
    }

    window.addEventListener("scroll", atualizar, { passive: true });
    atualizar();
})();
