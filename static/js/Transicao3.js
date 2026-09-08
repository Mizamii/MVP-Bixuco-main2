
function voltarPagina(){

    window.location.href="/Transicao2";

}

function proximaPagina(){

    window.location.href="/home";

}


/*passar o dedo*/

let touchInicial = 0;

document.addEventListener("touchstart",(e)=>{

    touchInicial = e.changedTouches[0].clientX;

});

document.addEventListener("touchend",(e)=>{

    const touchFinal = e.changedTouches[0].clientX;

    const distancia = touchFinal - touchInicial;

    if(distancia > 80){

        voltarPagina();

    }

    if(distancia < -80){

        proximaPagina();

    }

});


/*passar o mouse*/

let mousePressionado = false;

let mouseInicial = 0;

document.addEventListener("mousedown",(e)=>{

    mousePressionado = true;

    mouseInicial = e.clientX;

});

document.addEventListener("mouseup",(e)=>{

    if(!mousePressionado){

        return;

    }

    mousePressionado = false;

    const distancia = e.clientX - mouseInicial;

    if(distancia > 80){

        voltarPagina();

    }

    if(distancia < -80){

        proximaPagina();

    }

});


// ==========================
// ANIMAÇÃO DO INDICADOR
// ==========================

(function animarIndicador(){

    const indicadores  = document.querySelectorAll(".indicadores span");
    const indexAtual    = [...indicadores].findIndex(s => s.classList.contains("ativo"));
    const indexAnterior = parseInt(sessionStorage.getItem("indicadorIndex"), 10);

    if (!isNaN(indexAnterior) && indexAnterior !== indexAtual) {

        const larguraDot = 6;   // tamanho do ponto inativo, em px
        const gap        = 6.4; // gap entre eles (0.4rem ≈ 6.4px)

        const deslocamento = (indexAnterior - indexAtual) * (larguraDot + gap);

        const ativo = indicadores[indexAtual];
        ativo.style.setProperty("--deslocamento", `${deslocamento}px`);
        ativo.classList.add("animando");

    }

    sessionStorage.setItem("indicadorIndex", indexAtual);

})();

document.getElementById("btnVoltar").addEventListener("click", voltarPagina);
document.getElementById("btnProximo").addEventListener("click", proximaPagina);