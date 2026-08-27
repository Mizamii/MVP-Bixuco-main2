/* ==========================================================
   tema.js
   Lógica ÚNICA de tema claro/escuro, compartilhada por todas
   as páginas. Inclua no fim do <body>, depois dos botões
   #btnClaro e #btnEscuro existirem no HTML:

       <script src="/js/tema.js"></script>

   Funciona mesmo se a página não tiver os botões — nesse caso
   só aplica a classe do tema no <body> e não quebra nada.
   ========================================================== */

function aplicarTema(tema) {

    document.body.classList.remove("tema-claro", "tema-escuro");
    document.body.classList.add(`tema-${tema}`);

    const btnClaro  = document.getElementById("btnClaro");
    const btnEscuro = document.getElementById("btnEscuro");
    const btnMobile = document.getElementById("btnTemaMobile"); // NOVO

    if (btnClaro)  btnClaro.classList.toggle("ativo", tema === "claro");
    if (btnEscuro) btnEscuro.classList.toggle("ativo", tema === "escuro");

    // NOVO — troca o ícone (sol/lua) do botão mobile, se ele existir na página
    if (btnMobile) {
        const icone = btnMobile.querySelector("i");
        if (icone) icone.className = tema === "claro" ? "fa-regular fa-sun" : "fa-regular fa-moon";
    }

    trocarEstiloMapa(tema);
    localStorage.setItem("tema", tema);

}

function iniciarTema() {

    const temaSalvo = localStorage.getItem("tema") || "claro";
    aplicarTema(temaSalvo);

    const btnClaro  = document.getElementById("btnClaro");
    const btnEscuro = document.getElementById("btnEscuro");
    const btnMobile = document.getElementById("btnTemaMobile"); // NOVO

    if (btnClaro)  btnClaro.addEventListener("click", () => aplicarTema("claro"));
    if (btnEscuro) btnEscuro.addEventListener("click", () => aplicarTema("escuro"));

    // NOVO — um único botão que alterna entre claro/escuro a cada toque
    if (btnMobile) {
        btnMobile.addEventListener("click", () => {
            const atual = document.body.classList.contains("tema-escuro") ? "escuro" : "claro";
            aplicarTema(atual === "claro" ? "escuro" : "claro");
        });
    }

}

iniciarTema();