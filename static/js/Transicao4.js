
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
        dados.diasConsecutivos ?? 0;

        document.getElementById("diasSeguidos").textContent =
        dias;

                const textoDias  = document.getElementById("textoDias");
        const textoApoio = document.querySelector(".texto-sequencia p");

        if(dias === 0){

            // Houve crise hoje: mensagem acolhedora, sem número
            document.getElementById("diasSeguidos").textContent = "";
            textoDias.textContent  = "Hoje foi um dia mais difícil.";
            textoApoio.textContent = "Registrar o dia já ajuda a entender os padrões. Amanhã a ofensiva recomeça, um dia de cada vez.";

        }

        else if(dias === 1){

            textoDias.textContent = "dia sem nenhuma crise! Parabéns!";

        }

        else{

            textoDias.textContent = "dias sem nenhuma crise! Parabéns!";

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
