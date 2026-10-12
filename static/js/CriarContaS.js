                             
                  
                             

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

                             
                           
                             

                                         
let tipoSelecionado = null;

                             
                  
                             

function selecionarTipo(tipo) {

    tipoSelecionado = tipo;

                                                                     
    document.querySelectorAll(".tipo-card").forEach(card => {
        card.classList.remove("tipo-card--ativo");
        card.setAttribute("aria-pressed", "false");
    });

                                      
    const cardSelecionado = tipo === "responsavel"
        ? document.getElementById("cardResponsavel")
        : document.getElementById("cardPsicologo");

    cardSelecionado.classList.add("tipo-card--ativo");
    cardSelecionado.setAttribute("aria-pressed", "true");

                                             
    document.getElementById("btnContinuar").disabled = false;

                                                      
    const erroSelecao = document.getElementById("erro-selecao");
    erroSelecao.style.display = "none";

}

                             
            
                             

function continuar() {

                                                      
                                                          
    if (tipoSelecionado === null) {

        const erroSelecao = document.getElementById("erro-selecao");
        erroSelecao.style.display = "block";
        return;

    }

                                                                 
    if (tipoSelecionado === "responsavel") {
        window.location.href = "/CriarContaG";
    } else if (tipoSelecionado === "psicologo") {
        window.location.href = "/CriarContaP";
    }

}

                             
                                                           
                             

document.getElementById("cardResponsavel").addEventListener("click", () => {
    selecionarTipo("responsavel");
});

document.getElementById("cardPsicologo").addEventListener("click", () => {
    selecionarTipo("psicologo");
});

document.getElementById("btnContinuar").addEventListener("click", continuar);