
                          

function voltar(){

    window.location.href = "/Transicao1";

}

function proximo(){

    window.location.href = "/Transicao3";

}

                                    

let inicioX = 0;
let fimX = 0;
let arrastando = false;

function verificarSwipe(){

    const distancia = fimX - inicioX;

                           
    if(distancia > 80){

        window.location.href = "/Transicao1";

    }

                        
    if(distancia < -80){

        window.location.href = "/Transicao3";

    }

}

         

document.addEventListener("touchstart",(e)=>{

    inicioX = e.touches[0].clientX;

});

document.addEventListener("touchmove",(e)=>{

    fimX = e.touches[0].clientX;

});

document.addEventListener("touchend",()=>{

    verificarSwipe();

});

     

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

                                    
document.addEventListener("mouseleave",()=>{

    arrastando = false;

});


                             
                        
                             

(function animarIndicador(){

    const indicadores  = document.querySelectorAll("#conteudo > div span");
    const indexAtual    = [...indicadores].findIndex(s => s.classList.contains("ativo"));
    const indexAnterior = parseInt(sessionStorage.getItem("indicadorIndex"), 10);

    if (!isNaN(indexAnterior) && indexAnterior !== indexAtual) {

        const larguraDot = 6;                                     
        const gap        = 6.4;                                   

        const deslocamento = (indexAnterior - indexAtual) * (larguraDot + gap);

        const ativo = indicadores[indexAtual];
        ativo.style.setProperty("--deslocamento", `${deslocamento}px`);
        ativo.classList.add("animando");

    }

    sessionStorage.setItem("indicadorIndex", indexAtual);

})();

document.getElementById("btnVoltar").addEventListener("click", voltar);
document.getElementById("btnAvancar").addEventListener("click", proximo);