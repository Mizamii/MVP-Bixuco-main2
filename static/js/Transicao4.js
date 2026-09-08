
// ===========================
// Buscar dados
// ===========================

async function carregarDados(){

    try{

        const resposta = await fetch("/api/home");

        if(!resposta.ok){

            throw new Error();

        }

        const dados =
        await resposta.json();

        // Nome da criança

        if(dados.nomeCrianca){

            document.getElementById("nomeCrianca").textContent =
            dados.nomeCrianca;

        }

        // Dias consecutivos

        let dias =
        dados.diasConsecutivos || 1;

        document.getElementById("diasSeguidos").textContent =
        dias;

        if(dias == 1){

            document.getElementById("textoDias").textContent =
            "dia seguido!";

        }

        else{

            document.getElementById("textoDias").textContent =
            "dias seguidos!";

        }

    }

    catch(erro){

        console.log(erro);

    }

}



// ===========================
// Botão
// ===========================

document
.getElementById("btnInicio")
.addEventListener("click",()=>{

    window.location.href="/home";

});



// ===========================
// Iniciar
// ===========================

carregarDados();
