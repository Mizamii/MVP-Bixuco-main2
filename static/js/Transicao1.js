
// botão próximo

document
.getElementById("proximo")
.addEventListener("click",()=>{

    window.location.href="/Transicao2";

});


// arrastar com o dedo

const tela = document.getElementById("tela");

let inicioTouch = 0;

tela.addEventListener("touchstart",(e)=>{

    inicioTouch = e.touches[0].clientX;

});

tela.addEventListener("touchend",(e)=>{

    const fimTouch = e.changedTouches[0].clientX;

    if(inicioTouch - fimTouch > 80){

        window.location.href="/Transicao2";

    }

});


// arrastar com o mouse

let inicioMouse = 0;

tela.addEventListener("mousedown",(e)=>{

    inicioMouse = e.clientX;

});

tela.addEventListener("mouseup",(e)=>{

    const fimMouse = e.clientX;

    if(inicioMouse - fimMouse > 80){

        window.location.href="/Transicao2";

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
