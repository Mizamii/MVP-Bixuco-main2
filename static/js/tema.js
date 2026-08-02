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

    if (btnClaro)  btnClaro.classList.toggle("ativo", tema === "claro");
    if (btnEscuro) btnEscuro.classList.toggle("ativo", tema === "escuro");

    localStorage.setItem("tema", tema);

}

function iniciarTema() {

    const temaSalvo = localStorage.getItem("tema") || "claro";
    aplicarTema(temaSalvo);

    const btnClaro  = document.getElementById("btnClaro");
    const btnEscuro = document.getElementById("btnEscuro");

    if (btnClaro)  btnClaro.addEventListener("click", () => aplicarTema("claro"));
    if (btnEscuro) btnEscuro.addEventListener("click", () => aplicarTema("escuro"));

}

iniciarTema();
