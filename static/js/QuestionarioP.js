
// ==========================
// PERGUNTAS DO QUESTIONÁRIO
// ==========================

const perguntas = [

    "Com que frequência sua criança fica incomodada com barulhos altos ou inesperados?",

    "Sua criança evita certas texturas de alimentos ou tecidos?",

    "Ela demonstra sensibilidade excessiva à luz ou movimentos rápidos?",

    "Sua criança procura atividades com bastante movimento, como girar ou pular?",

    "Sua criança se distrai facilmente durante atividades?",

    "Ela se incomoda quando alguém encosta nela inesperadamente?",

    "Sua criança gosta de observar objetos girando ou luzes?",

    "Ela evita lugares muito movimentados ou cheios de pessoas?",

    "Sua criança gosta de cheirar objetos frequentemente?",

    "Ela apresenta dificuldade para dormir devido aos estímulos do ambiente?"

];

// Alternativas fixas para todas as perguntas
const alternativas = [
    "Sempre",
    "Quase sempre",
    "Raramente",
    "Nunca"
];

// Variáveis de estado
let perguntaAtual    = 0;
let respostaSelecionada = null;

// 🔧 FIX 1: Array para guardar todas as respostas e enviar ao backend
const respostasUsuario = [];

// Referências aos elementos
const btnProximo    = document.getElementById("btn-proximo");
const erroSalvar    = document.getElementById("erro-salvar");

// ==========================
// BARRA DE PROGRESSO
// ==========================

// 🔧 FIX 8: Cria a barra uma vez e atualiza só as classes
// Antes era recriada do zero a cada pergunta

function criarBarra() {

    const barra = document.getElementById("barra-progresso");
    barra.innerHTML = "";

    for (let i = 0; i < perguntas.length; i++) {

        const ponto = document.createElement("span");
        ponto.id = `ponto-${i}`;
        barra.appendChild(ponto);

    }

}

function atualizarBarra() {

    for (let i = 0; i < perguntas.length; i++) {

        const ponto = document.getElementById(`ponto-${i}`);

        ponto.className = "";
        ponto.textContent = "";

        if (i < perguntaAtual) {
            ponto.classList.add("ativo");
        } else if (i === perguntaAtual) {
            ponto.classList.add("atual");
            ponto.textContent = i + 1;
        }

    }

}

// ==========================
// ATUALIZAR PERGUNTA
// ==========================

function atualizarPergunta() {

    // Atualiza o texto da pergunta e o contador
    document.getElementById("pergunta-texto").textContent =
        perguntas[perguntaAtual];

    // Destaca o número da pergunta atual em azul
    document.getElementById("texto-progresso").innerHTML =
        `Pergunta <span class="questionario-progresso__numero">${perguntaAtual + 1}</span> de ${perguntas.length}`;

    // Atualiza a barra de progresso
    atualizarBarra();

    // Recria as opções de resposta
    const opcoes = document.getElementById("opcoes");
    opcoes.innerHTML = "";

    alternativas.forEach(opcao => {

        const botao = document.createElement("button");
        botao.type      = "button";
        botao.className = "opcao";
        botao.textContent = opcao;

        botao.addEventListener("click", () => selecionarOpcao(botao, opcao));

        opcoes.appendChild(botao);

    });

    // Reseta estado da pergunta
    respostaSelecionada   = null;
    btnProximo.disabled   = true;
    erroSalvar.style.display = "none";

    // Muda o texto do botão na última pergunta
    btnProximo.textContent = perguntaAtual === perguntas.length - 1
        ? "Finalizar"
        : "Próxima pergunta";

}

// ==========================
// SELECIONAR OPÇÃO
// ==========================

function selecionarOpcao(botao, resposta) {

    // Remove seleção anterior
    document.querySelectorAll(".opcao").forEach(op => {
        op.classList.remove("selecionada");
    });

    // Marca a opção clicada
    botao.classList.add("selecionada");

    respostaSelecionada = resposta;
    btnProximo.disabled = false;

}

// ==========================
// PRÓXIMA PERGUNTA
// ==========================

// 🔧 FIX 5: addEventListener em vez de onclick inline
btnProximo.addEventListener("click", async () => {

    if (respostaSelecionada === null) return;

    // 🔧 FIX 1: Guarda a resposta no array
    respostasUsuario.push({
        pergunta: perguntas[perguntaAtual],
        resposta: respostaSelecionada
    });

    // Se ainda há perguntas, avança para a próxima
    if (perguntaAtual < perguntas.length - 1) {

        perguntaAtual++;
        atualizarPergunta();

    } else {

        // Última pergunta respondida — salva o perfil sensorial
        await finalizarQuestionario();

    }

});

// ==========================
// FINALIZAR E SALVAR
// ==========================

// 🔧 FIX 1 + 6 + 7: Salva as respostas no backend ao finalizar
// Antes só redirecionava para /home sem salvar nada
async function finalizarQuestionario() {

    // 🔧 FIX 6: Desabilita o botão enquanto salva
    btnProximo.disabled    = true;
    btnProximo.textContent = "Salvando...";

    try {

        const resposta = await fetch("/api/perfil-sensorial", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                respostas: respostasUsuario
            })
        });

        // 🔧 FIX 4: Redireciona para login se não autenticado
        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (resposta.redirected) {
            window.location.href = resposta.url;
            return;
        }

        if (resposta.ok) {
            // Perfil salvo com sucesso — vai para a home
            window.location.href = "/Transicao1";
            return;
        }

        throw new Error("Resposta inesperada do servidor.");

    } catch (erro) {

        console.log("Erro ao salvar perfil sensorial:", erro);

        // 🔧 FIX 7: Mostra o erro e reabilita o botão para tentar de novo
        erroSalvar.textContent   = "Erro ao salvar. Tente novamente.";
        erroSalvar.style.display = "block";

        btnProximo.disabled    = false;
        btnProximo.textContent = "Finalizar";

    }

}

// ==========================
// INICIALIZAÇÃO
// ==========================

// Cria a barra uma vez e carrega a primeira pergunta
criarBarra();
atualizarPergunta();
