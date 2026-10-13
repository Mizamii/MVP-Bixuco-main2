let idiomaAtual = localStorage.getItem("idioma") === "en" ? "en" : "pt";
let apoiadorSelecionado = 0;

function atualizarApoiador() {
    const botoes = [...document.querySelectorAll(".apoiadores__aba")];
    const video = document.getElementById("apoiador-video");
    if (!botoes.length || !video) return;

    const selecionado = botoes[apoiadorSelecionado];
    botoes.forEach((botao, indice) => {
        const ativo = indice === apoiadorSelecionado;
        botao.classList.toggle("is-active", ativo);
        botao.setAttribute("aria-selected", String(ativo));
        botao.tabIndex = ativo ? 0 : -1;
    });

    const painel = document.getElementById("apoiador-painel");
    const nome = document.getElementById("apoiador-nome");
    const descricao = document.getElementById("apoiador-descricao");
    const contador = document.getElementById("apoiador-contador");
    if (painel) painel.setAttribute("aria-labelledby", selecionado.id);
    if (nome) nome.textContent = selecionado.querySelector(".apoiadores__nome").textContent;
    if (descricao) descricao.textContent = idiomaAtual === "en" ? selecionado.dataset.descricaoEn : selecionado.dataset.descricaoPt;
    if (contador) contador.textContent = String(apoiadorSelecionado + 1).padStart(2, "0") + " / 03";

    const fonte = idiomaAtual === "en" ? selecionado.dataset.videoEn : selecionado.dataset.videoPt;
    if (video.getAttribute("src") !== fonte) {
        video.pause();
        video.setAttribute("poster", selecionado.dataset.poster);
        video.setAttribute("src", fonte);
        video.load();
    }
    video.setAttribute("aria-label", idiomaAtual === "en" ? "Video testimonial by " + nome.textContent : "Depoimento em vídeo de " + nome.textContent);
}

function atualizarCapturasIndex() {
    const escuro = document.body.classList.contains("tema-escuro");
    document.querySelectorAll("img[data-src-pt]").forEach(imagem => {
        const prefixo = idiomaAtual === "en" ? "srcEn" : "srcPt";
        const caminho = escuro && imagem.dataset[`${prefixo}Dark`]
            ? imagem.dataset[`${prefixo}Dark`]
            : imagem.dataset[prefixo];
        if (caminho && imagem.getAttribute("src") !== caminho) imagem.src = caminho;
        imagem.alt = idiomaAtual === "en" ? (imagem.dataset.altEn || "") : (imagem.dataset.altPt || "");
    });
}

function aplicarIdiomaIndex() {
    document.querySelectorAll("[data-pt]").forEach(elemento => {
        elemento.textContent = idiomaAtual === "en" ? (elemento.dataset.en || elemento.dataset.pt) : elemento.dataset.pt;
    });

    atualizarCapturasIndex();

    document.querySelectorAll("[data-aria-label-pt]").forEach(elemento => {
        elemento.setAttribute("aria-label", idiomaAtual === "en" ? elemento.dataset.ariaLabelEn : elemento.dataset.ariaLabelPt);
    });

    const textoTradutor = document.getElementById("textoTradutor");
    if (textoTradutor) textoTradutor.textContent = idiomaAtual === "en" ? "PT" : "EN";

    document.documentElement.lang = idiomaAtual === "en" ? "en" : "pt-BR";
    document.title = idiomaAtual === "en"
        ? "Bixuco — Technology that supports, welcomes and connects"
        : "Bixuco — Tecnologia que acompanha, acolhe e conecta";
    atualizarApoiador();
}

const btnTraduzir = document.getElementById("btnTraduzir");
if (btnTraduzir) {
    btnTraduzir.addEventListener("click", () => {
        idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
        localStorage.setItem("idioma", idiomaAtual);
        aplicarIdiomaIndex();
    });
}

const botoesApoiadores = [...document.querySelectorAll(".apoiadores__aba")];
botoesApoiadores.forEach((botao, indice) => {
    botao.addEventListener("click", () => {
        apoiadorSelecionado = indice;
        atualizarApoiador();
    });
    botao.addEventListener("keydown", evento => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(evento.key)) return;
        evento.preventDefault();
        if (evento.key === "Home") apoiadorSelecionado = 0;
        else if (evento.key === "End") apoiadorSelecionado = botoesApoiadores.length - 1;
        else if (evento.key === "ArrowRight") apoiadorSelecionado = (indice + 1) % botoesApoiadores.length;
        else apoiadorSelecionado = (indice - 1 + botoesApoiadores.length) % botoesApoiadores.length;
        atualizarApoiador();
        botoesApoiadores[apoiadorSelecionado].focus();
    });
});

const anteriorApoiador = document.getElementById("apoiador-anterior");
const proximoApoiador = document.getElementById("apoiador-proximo");
if (anteriorApoiador) anteriorApoiador.addEventListener("click", () => {
    apoiadorSelecionado = (apoiadorSelecionado + botoesApoiadores.length - 1) % botoesApoiadores.length;
    atualizarApoiador();
});
if (proximoApoiador) proximoApoiador.addEventListener("click", () => {
    apoiadorSelecionado = (apoiadorSelecionado + 1) % botoesApoiadores.length;
    atualizarApoiador();
});

aplicarIdiomaIndex();

(function () {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    function atualizar() {
        navbar.classList.toggle("navbar-scroll", window.scrollY > 20);
    }

    window.addEventListener("scroll", atualizar, { passive: true });
    atualizar();
})();

const observadorTemaIndex = new MutationObserver(mutacoes => {
    if (mutacoes.some(mutacao => mutacao.attributeName === "class")) atualizarCapturasIndex();
});
observadorTemaIndex.observe(document.body, { attributes: true, attributeFilter: ["class"] });
atualizarCapturasIndex();
