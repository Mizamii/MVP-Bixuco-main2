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

// 🔧 Cada pergunta agora carrega suas próprias alternativas. As duas
// primeiras têm "id" — são as mesmas que o relatório diário usa
// (gatilho_principal e crises_sensoriais), pra esse primeiro
// preenchimento já alimentar os gráficos de relatórios e servir de
// base pras primeiras dicas geradas pela IA.
const perguntasPt = [

    {
        id: "gatilho_principal",
        texto: "Qual desses fatores mais incomoda ou agita sua criança no dia a dia?",
        alternativas: ["Ambientes barulhentos", "Locais lotados", "Mudança de rotina", "Não identificado"]
    },
    {
        id: "crises_sensoriais",
        texto: "Nas últimas semanas, com que frequência você percebeu crises sensoriais na sua criança (chorar, tapar os ouvidos, se agitar)?",
        alternativas: ["Nenhuma", "Poucas", "Algumas", "Sim, várias"]
    },
    {
        texto: "Sua criança evita certas texturas de alimentos ou tecidos?",
        alternativas: ["Sempre", "Quase sempre", "Raramente", "Nunca"]
    },
    {
        texto: "Ela demonstra sensibilidade excessiva à luz ou movimentos rápidos?",
        alternativas: ["Sempre", "Quase sempre", "Raramente", "Nunca"]
    },
    {
        texto: "Sua criança procura atividades com bastante movimento, como girar ou pular?",
        alternativas: ["Sempre", "Quase sempre", "Raramente", "Nunca"]
    },
    {
        texto: "Sua criança se distrai facilmente durante atividades?",
        alternativas: ["Sempre", "Quase sempre", "Raramente", "Nunca"]
    },
    {
        texto: "Ela se incomoda quando alguém encosta nela inesperadamente?",
        alternativas: ["Sempre", "Quase sempre", "Raramente", "Nunca"]
    },
    {
        texto: "Sua criança gosta de observar objetos girando ou luzes?",
        alternativas: ["Sempre", "Quase sempre", "Raramente", "Nunca"]
    },
    {
        texto: "Ela evita lugares muito movimentados ou cheios de pessoas?",
        alternativas: ["Sempre", "Quase sempre", "Raramente", "Nunca"]
    },
    {
        texto: "Ela apresenta dificuldade para dormir devido aos estímulos do ambiente?",
        alternativas: ["Sempre", "Quase sempre", "Raramente", "Nunca"]
    }

];

// Apenas para exibição em inglês — nunca é enviado ao backend
const perguntasEn = [

    {
        texto: "Which of these factors most bothers or upsets your child day-to-day?",
        alternativas: ["Noisy environments", "Crowded places", "Routine changes", "Not identified"]
    },
    {
        texto: "In the past few weeks, how often did you notice sensory crises in your child (crying, covering ears, becoming agitated)?",
        alternativas: ["None", "A few", "Some", "Yes, several"]
    },
    {
        texto: "Does your child avoid certain food textures or fabrics?",
        alternativas: ["Always", "Almost always", "Rarely", "Never"]
    },
    {
        texto: "Does your child show excessive sensitivity to light or fast movement?",
        alternativas: ["Always", "Almost always", "Rarely", "Never"]
    },
    {
        texto: "Does your child seek out activities with lots of movement, like spinning or jumping?",
        alternativas: ["Always", "Almost always", "Rarely", "Never"]
    },
    {
        texto: "Does your child get distracted easily during activities?",
        alternativas: ["Always", "Almost always", "Rarely", "Never"]
    },
    {
        texto: "Does your child get bothered when someone touches them unexpectedly?",
        alternativas: ["Always", "Almost always", "Rarely", "Never"]
    },
    {
        texto: "Does your child enjoy watching spinning objects or lights?",
        alternativas: ["Always", "Almost always", "Rarely", "Never"]
    },
    {
        texto: "Does your child avoid very busy or crowded places?",
        alternativas: ["Always", "Almost always", "Rarely", "Never"]
    },
    {
        texto: "Does your child have trouble sleeping due to environmental stimuli?",
        alternativas: ["Always", "Almost always", "Rarely", "Never"]
    }

];

function textoPergunta(indice) {
    return idiomaAtual === "en" ? perguntasEn[indice].texto : perguntasPt[indice].texto;
}

// Recebe o índice da PERGUNTA e o índice da ALTERNATIVA dentro dela,
// já que cada pergunta pode ter opções diferentes
function textoAlternativa(indicePergunta, indiceAlternativa) {
    const lista = idiomaAtual === "en"
        ? perguntasEn[indicePergunta].alternativas
        : perguntasPt[indicePergunta].alternativas;
    return lista[indiceAlternativa];
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

    const alternativasCanonicas = perguntasPt[perguntaAtual].alternativas;

    alternativasCanonicas.forEach((valorCanonico, i) => {

        const botao = document.createElement("button");
        botao.type      = "button";
        botao.className = "opcao" + (respostaSelecionada === valorCanonico ? " selecionada" : "");
        botao.textContent = textoAlternativa(perguntaAtual, i);
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
    // igual ao que o backend já espera receber. Perguntas com "id" (as duas
    // primeiras) mandam o id junto, pra alimentar os gráficos do relatório.
    const perguntaAtualObj = perguntasPt[perguntaAtual];

    respostasUsuario.push({
        ...(perguntaAtualObj.id ? { id: perguntaAtualObj.id } : {}),
        pergunta: perguntaAtualObj.texto,
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