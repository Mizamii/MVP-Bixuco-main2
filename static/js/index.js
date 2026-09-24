// Sombra na navbar ao rolar a página.
// (Antes estava num <script> inline dentro do index.html, que o CSP do helmet bloqueia.)
(function () {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    function atualizar() {
        navbar.classList.toggle("navbar-scroll", window.scrollY > 20);
    }

    window.addEventListener("scroll", atualizar, { passive: true });
    atualizar();
})();
