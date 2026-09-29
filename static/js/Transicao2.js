
// botões voltar e avançar

function voltar(){

    window.location.href = "/Transicao1";

}

function proximo(){

    window.location.href = "/Transicao3";

}

// arrastar para o lado celular e pc

let inicioX = 0;
let fimX = 0;
let arrastando = false;

function verificarSwipe(){

    const distancia = fimX - inicioX;

    // voltou para a tela 1
    if(distancia > 80){

        window.location.href = "/Transicao1";

    }

    // foi para a tela 3
    if(distancia < -80){

        window.location.href = "/Transicao3";

    }

}

//celular

document.addEventListener("touchstart",(e)=>{

    inicioX = e.touches[0].clientX;

});

document.addEventListener("touchmove",(e)=>{

    fimX = e.touches[0].clientX;

});

document.addEventListener("touchend",()=>{

    verificarSwipe();

});

// pc

document.addEventListener("mousedown",(e)=>{

    arrastando = true;
    inicioX = e.clientX;

});

document.addEventListener("mousemove",(e)=>{

    if(!arrastando) return;

    fimX = e.clientX;

});

document.addEventListener("mouseup",()=>{

    if(!arrastando) return;

    arrastando = false;

    verificarSwipe();

});

// caso solte o mouse fora da janela
document.addEventListener("mouseleave",()=>{

    arrastando = false;

});


// ==========================
// ANIMAÇÃO DO INDICADOR
// ==========================

(function animarIndicador(){

    const indicadores  = document.querySelectorAll("#conteudo > div span");
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

document.getElementById("btnVoltar").addEventListener("click", voltar);
document.getElementById("btnAvancar").addEventListener("click", proximo);