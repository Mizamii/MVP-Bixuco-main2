// ==========================
// TRADUÇÃO MANUAL
// ==========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

// Dicionário para textos fixos (título, botão, erro etc.)
const dicionarioQuestionarioP = {
    "Finalizar": "Finish",
    "Próxima pergunta": "Next question",
    "Salvando...": "Saving...",
    "Erro ao salvar. Tente novamente.": "Error saving. Try again."
};

function traduzir(texto) {
    if (idiomaAtual === "pt" || texto == null) return texto;
    return dicionarioQuestionarioP[texto] || texto;
}

// Aplica tradução nos textos estáticos marcados com data-pt/data-en
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

    // Reaplica os textos gerados dinamicamente (pergunta, contador, opções, botão)
    // sem resetar a pergunta atual nem a opção já selecionada
    atualizarTextoProgresso();
    atualizarTextoPergunta();
    renderOpcoes();
    atualizarTextoBotaoProximo();

    if (erroSalvar.style.display === "block") {
        erroSalvar.textContent = traduzir("Erro ao salvar. Tente novamente.");
    }
});

aplicarIdiomaEstatico();

// ==========================
// PERGUNTAS DO QUESTIONÁRIO
// ==========================

// Texto canônico (sempre em português) — é o que é enviado ao backend,
// independente do idioma que está sendo exibido na tela
const perguntasPt = [

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

// Apenas para exibição em inglês — nunca é enviado ao backend
const perguntasEn = [

    "How often is your child bothered by loud or unexpected noises?",

    "Does your child avoid certain food textures or fabrics?",

    "Does your child show excessive sensitivity to light or fast movement?",

    "Does your child seek out activities with lots of movement, like spinning or jumping?",

    "Does your child get distracted easily during activities?",

    "Does your child get bothered when someone touches them unexpectedly?",

    "Does your child enjoy watching spinning objects or lights?",

    "Does your child avoid very busy or crowded places?",

    "Does your child enjoy smelling objects often?",

    "Does your child have trouble sleeping due to environmental stimuli?"

];

// Alternativas fixas para todas as perguntas
// (mesma ideia: valor canônico em PT + exibição traduzida)
const alternativasPt = [
    "Sempre",
    "Quase sempre",
    "Raramente",
    "Nunca"
];

const alternativasEn = [
    "Always",
    "Almost always",
    "Rarely",
    "Never"
];

function textoPergunta(indice) {
    return idiomaAtual === "en" ? perguntasEn[indice] : perguntasPt[indice];
}

function textoAlternativa(indice) {
    return idiomaAtual === "en" ? alternativasEn[indice] : alternativasPt[indice];
}

// Variáveis de estado
let perguntaAtual    = 0;
let respostaSelecionada = null; // sempre guarda o valor canônico em PT

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

    for (let i = 0; i < perguntasPt.length; i++) {

        const ponto = document.createElement("span");
        ponto.id = `ponto-${i}`;
        barra.appendChild(ponto);

    }

}

function atualizarBarra() {

    for (let i = 0; i < perguntasPt.length; i++) {

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
// TEXTOS TRADUZÍVEIS (pergunta, contador, botão)
// ==========================

function atualizarTextoPergunta() {
    document.getElementById("pergunta-texto").textContent = textoPergunta(perguntaAtual);
}

function atualizarTextoProgresso() {

    const rotulo = idiomaAtual === "en" ? "Question" : "Pergunta";
    const conector = idiomaAtual === "en" ? "of" : "de";

    document.getElementById("texto-progresso").innerHTML =
        `${rotulo} <span class="questionario-progresso__numero">${perguntaAtual + 1}</span> ${conector} ${perguntasPt.length}`;

}

function atualizarTextoBotaoProximo() {
    const ultimaPergunta = perguntaAtual === perguntasPt.length - 1;
    btnProximo.textContent = ultimaPergunta
        ? traduzir("Finalizar")
        : traduzir("Próxima pergunta");
}

// ==========================
// RENDERIZAR ALTERNATIVAS
// (preserva a seleção atual — usado tanto ao trocar de pergunta
// quanto ao trocar de idioma no meio de uma pergunta)
// ==========================

function renderOpcoes() {

    const opcoes = document.getElementById("opcoes");
    opcoes.innerHTML = "";

    alternativasPt.forEach((valorCanonico, i) => {

        const botao = document.createElement("button");
        botao.type      = "button";
        botao.className = "opcao" + (respostaSelecionada === valorCanonico ? " selecionada" : "");
        botao.textContent = textoAlternativa(i);
        botao.dataset.valor = valorCanonico;

        botao.addEventListener("click", () => selecionarOpcao(botao, valorCanonico));

        opcoes.appendChild(botao);

    });

}

// ==========================
// ATUALIZAR PERGUNTA
// ==========================

function atualizarPergunta() {

    // Atualiza o texto da pergunta e o contador
    atualizarTextoPergunta();
    atualizarTextoProgresso();

    // Atualiza a barra de progresso
    atualizarBarra();

    // Reseta estado da pergunta (nova pergunta, ninguém selecionou nada ainda)
    respostaSelecionada   = null;
    renderOpcoes();

    btnProximo.disabled   = true;
    erroSalvar.style.display = "none";

    // Muda o texto do botão na última pergunta
    atualizarTextoBotaoProximo();

}

// ==========================
// SELECIONAR OPÇÃO
// ==========================

function selecionarOpcao(botao, valorCanonico) {

    // Remove seleção anterior
    document.querySelectorAll(".opcao").forEach(op => {
        op.classList.remove("selecionada");
    });

    // Marca a opção clicada
    botao.classList.add("selecionada");

    // Sempre guarda o valor canônico em português, independente do idioma exibido
    respostaSelecionada = valorCanonico;
    btnProximo.disabled = false;

}

// ==========================
// PRÓXIMA PERGUNTA
// ==========================

// 🔧 FIX 5: addEventListener em vez de onclick inline
btnProximo.addEventListener("click", async () => {

    if (respostaSelecionada === null) return;

    // 🔧 FIX 1: Guarda a resposta no array — sempre em português (canônico),
    // igual ao que o backend já espera receber
    respostasUsuario.push({
        pergunta: perguntasPt[perguntaAtual],
        resposta: respostaSelecionada
    });

    // Se ainda há perguntas, avança para a próxima
    if (perguntaAtual < perguntasPt.length - 1) {

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
    btnProximo.textContent = traduzir("Salvando...");

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
        erroSalvar.textContent   = traduzir("Erro ao salvar. Tente novamente.");
        erroSalvar.style.display = "block";

        btnProximo.disabled    = false;
        btnProximo.textContent = traduzir("Finalizar");

    }

}

// ==========================
// INICIALIZAÇÃO
// ==========================

// Cria a barra uma vez e carrega a primeira pergunta
criarBarra();
atualizarPergunta();