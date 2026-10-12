                                                             
          
                                                             
                                                         
                                            

                                          

                                                              
                                                          
                                                                
function aplicarTema(tema) {

    document.body.classList.remove("tema-claro", "tema-escuro");
    document.body.classList.add(`tema-${tema}`);

    const btnClaro  = document.getElementById("btnClaro");
    const btnEscuro = document.getElementById("btnEscuro");
    const btnMobile = document.getElementById("btnTemaMobile");

    if (btnClaro)  btnClaro.classList.toggle("ativo", tema === "claro");
    if (btnEscuro) btnEscuro.classList.toggle("ativo", tema === "escuro");

    if (btnMobile) {
        const icone = btnMobile.querySelector("i");
        if (icone) icone.className = tema === "claro" ? "fa-regular fa-sun" : "fa-regular fa-moon";
    }

                                                                             
    if (typeof trocarEstiloMapa === "function") {
        trocarEstiloMapa(tema);
    }

    localStorage.setItem("tema", tema);

}

function iniciarTema() {

    const temaSalvo = localStorage.getItem("tema") || "claro";
    aplicarTema(temaSalvo);

    const btnClaro  = document.getElementById("btnClaro");
    const btnEscuro = document.getElementById("btnEscuro");
    const btnMobile = document.getElementById("btnTemaMobile");        

    if (btnClaro)  btnClaro.addEventListener("click", () => aplicarTema("claro"));
    if (btnEscuro) btnEscuro.addEventListener("click", () => aplicarTema("escuro"));

                                                                        
    if (btnMobile) {
        btnMobile.addEventListener("click", () => {
            const atual = document.body.classList.contains("tema-escuro") ? "escuro" : "claro";
            aplicarTema(atual === "claro" ? "escuro" : "claro");
        });
    }

}

iniciarTema();