// ==========================
// TRADUÇÃO MANUAL
// (mesmo padrão do home.js — idioma salvo no localStorage,
// aplicado nos textos estáticos via data-pt/data-en e nos
// textos dinâmicos via traduzir())
// ==========================
let idiomaAtual = localStorage.getItem("idioma") || "pt";



const dicionario = {



    // ---- Notificações (mesmas chaves do home.js) ----
    "Carregando...": "Loading...",

    "Nenhuma notificação por enquanto.": "No notifications for now.",

    "Não foi possível carregar as notificações.": "Could not load notifications.",



    // ---- Contador / barra de progresso ----
    "Pergunta": "Question",

    "de": "of",

    "concluído": "completed",



    // ---- Botão "próxima pergunta" ----
    "Próxima pergunta": "Next question",

    "Salvando...": "Saving...",

    "Tentar novamente": "Try again",



    "Finalizar relatório": "Finish report",



    "Não foi possível salvar o progresso. Tente novamente.":

        "Could not save your progress. Please try again.",



    // ---- Mensagens de status do envio do relatório ----
    "Você já preencheu o relatório de hoje. Volte amanhã!": "You've already filled in today's report. Come back tomorrow!",

    "Erro ao salvar o relatório. Tente novamente.": "Error saving the report. Please try again.",



    // ---- Tooltips dos gráficos ----
    "Sem força registrada": "No strength recorded",

    " — pico da crise": " — crisis peak",

    "Força": "Strength",

    "Ativo (com o Bixuco)": "Active (with Bixuco)",

    "Inativo": "Inactive",



    // ---- Perguntas do questionário ----
    "Teve algum alerta de estresse hoje?": "Was there a stress alert today?",

    "Ela demonstra desconforto com texturas de roupas ou alimentos?": "Does she show discomfort with clothing or food textures?",

    "Hoje ela evitou contato visual?": "Did she avoid eye contact today?",

    "Como foi a comunicação hoje?": "How was communication today?",

    "Como estava o humor durante o dia?": "How was her mood during the day?",

    "Apresentou crises sensoriais?": "Did she have sensory meltdowns?",

    "Dormiu bem?": "Did she sleep well?",

    "Como foi a alimentação?": "How was eating today?",

    "Nenhum relatório preenchido hoje.": "No report filled in today.",

    "Realizou atividades propostas?": "Did she complete the proposed activities?",

    "Como foi a interação social?": "How was social interaction?",

    "Como você avaliaria o dia de hoje?": "How would you rate today?",

    "Ela conseguiu se acalmar com facilidade?": "Was she able to calm down easily?",

    "Qual foi o principal gatilho do episódio?": "What was the main trigger for the episode?",

    "Descreva em poucas palavras (ex: barulho alto, mudança de rotina...)": "Describe in a few words (e.g. loud noise, routine change...)",



    // ---- Respostas do questionário ----
    // (a tradução é só visual — o valor salvo/enviado pra API
    // continua sempre em português, ver comentário em carregarPergunta)
    "Sim": "Yes",

    "Não": "No",

    "Sempre": "Always",

    "Quase sempre": "Almost always",

    "Raramente": "Rarely",

    "Nunca": "Never",

    "Muito boa": "Very good",

    "Boa": "Good",

    "Pouca": "Little",

    "Nenhuma": "None",

    "Muito calmo": "Very calm",

    "Calmo": "Calm",

    "Agitado": "Agitated",

    "Muito agitado": "Very agitated",

    "Sim, várias": "Yes, several",

    "Algumas": "Some",

    "Poucas": "A few",

    "Muito bem": "Very well",

    "Bem": "Well",

    "Pouco": "Little",

    "Muito pouco": "Very little",

    "Regular": "Fair",

    "Ruim": "Poor",

    "Todas": "All",

    "Quase todas": "Almost all",

    "Excelente": "Excellent",

    "Bom": "Good",

    "Difícil": "Difficult",

    "Sim, rapidamente": "Yes, quickly",

    "Sim, mas demorou": "Yes, but it took a while",

    "Não, precisou de ajuda": "No, she needed help",

    "Não se acalmou": "She didn't calm down",

    "Ambientes barulhentos": "Noisy environments",

    "Locais lotados": "Crowded places",

    "Mudança de rotina": "Change in routine",

    "Não identificado": "Not identified"







};



function traduzir(texto) {

    if (idiomaAtual === "pt" || texto == null) return texto;

    return dicionario[texto] || texto;

}



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

    atualizarTextosChat();

    // Reconstrói a pergunta atual e o painel de notificações já traduzidos,
    // sem perder o progresso do questionário
    carregarPergunta();



    if (painelNotificacoes.classList.contains("aberto")) {

        carregarNotificacoes();

    }



});



// ==========================
// DADOS DO RELATÓRIO
// ==========================
let perguntas = [



    // 🔧 Pergunta temporária de controle: enquanto não existe conexão
    // real com o Bixuco (IoT), é essa resposta que define se o dia
    // teve ou não um alerta de estresse — usada pelos gráficos da
    // aba Relatórios. O "id" fixo garante que o backend sempre
    // encontre essa resposta, mesmo se o texto da pergunta mudar.
    {

        id: "alerta_estresse",

        pergunta: "Teve algum alerta de estresse hoje?",

        respostas: [

            "Sim",

            "Não"

        ]

    },



    {

        id: "desconforto_texturas",

        pergunta: "Ela demonstra desconforto com texturas de roupas ou alimentos?",

        respostas: [

            "Sempre",

            "Quase sempre",

            "Raramente",

            "Nunca"

        ]

    },



    {

        id: "evitou_contato_visual",

        pergunta: "Hoje ela evitou contato visual?",

        respostas: [

            "Sempre",

            "Quase sempre",

            "Raramente",

            "Nunca"

        ]

    },



    {

        id: "comunicacao",

        pergunta: "Como foi a comunicação hoje?",

        respostas: [

            "Muito boa",

            "Boa",

            "Pouca",

            "Nenhuma"

        ]

    },



    {

        id: "humor",

        pergunta: "Como estava o humor durante o dia?",

        respostas: [

            "Muito calmo",

            "Calmo",

            "Agitado",

            "Muito agitado"

        ]

    },



    {

        id: "crises_sensoriais",

        pergunta: "Apresentou crises sensoriais?",

        respostas: [

            "Sim, várias",

            "Algumas",

            "Poucas",

            "Nenhuma"

        ]

    },



    {

        id: "sono",

        pergunta: "Dormiu bem?",

        respostas: [

            "Muito bem",

            "Bem",

            "Pouco",

            "Muito pouco"

        ]

    },



    {

        id: "alimentacao",

        pergunta: "Como foi a alimentação?",

        respostas: [

            "Muito boa",

            "Boa",

            "Regular",

            "Ruim"

        ]

    },



    {

        id: "atividades_propostas",

        pergunta: "Realizou atividades propostas?",

        respostas: [

            "Todas",

            "Quase todas",

            "Poucas",

            "Nenhuma"

        ]

    },



    {

        id: "interacao_social",

        pergunta: "Como foi a interação social?",

        respostas: [

            "Excelente",

            "Boa",

            "Pouca",

            "Nenhuma"

        ]

    },



    {

        id: "avaliacao_dia",

        pergunta: "Como você avaliaria o dia de hoje?",

        respostas: [

            "Excelente",

            "Bom",

            "Regular",

            "Difícil"

        ]

    }



];



// ==========================
// VARIÁVEIS
// ==========================
let perguntaAtual = 0;



let respostaSelecionada = null;



let respostasUsuario = [];

let mensagensChatUsuario = [];
let enviandoMensagemChat = false;
let inicializandoChat = false;



// ==========================
// RASCUNHO DO RELATÓRIO
// ==========================
function buscarRespostaPorId(id) {



    return respostasUsuario.find(

        item => item.id === id

    ) || null;



}





function salvarOuAtualizarResposta(novaResposta) {



    const indice = respostasUsuario.findIndex(

        item => item.id === novaResposta.id

    );



    if (indice >= 0) {



        // Mantém possíveis campos extras que futuramente
        // podem vir do chat/IA e altera apenas o necessário.
        respostasUsuario[indice] = {

            ...respostasUsuario[indice],

            ...novaResposta

        };



    } else {



        respostasUsuario.push(novaResposta);



    }



}





async function salvarRascunho() {



    const resposta = await fetch(

        "/api/relatorio/rascunho",

        {

            method: "PUT",



            headers: {

                "Content-Type": "application/json"

            },



            body: JSON.stringify({

                respostas: respostasUsuario

            })

        }

    );





    if (resposta.status === 401) {



        window.location.href = "/logar";

        return false;



    }





    if (resposta.status === 409) {



        const dados = await resposta.json();



        mostrarMensagem(

            dados.erro ||

            "Você já preencheu o relatório de hoje. Volte amanhã!",

            "aviso"

        );



        bloquearPreenchimentoRelatorio();



        return false;



    }





    if (!resposta.ok) {



        throw new Error(

            "Não foi possível salvar o rascunho."

        );



    }





    return true;



}





async function carregarRascunho() {



    try {



        const resposta = await fetch(

            "/api/relatorio/rascunho"

        );





        if (resposta.status === 401) {



            window.location.href = "/logar";

            return true;



        }





        if (!resposta.ok) {



            throw new Error(

                "Erro ao carregar rascunho."

            );



        }





        const dados = await resposta.json();





        // Já terminou o relatório hoje.
        if (dados.finalizado) {



            mostrarMensagem(

                "Você já preencheu o relatório de hoje. Volte amanhã!",

                "aviso"

            );



            bloquearPreenchimentoRelatorio();



            return true;



        }





        respostasUsuario =

            Array.isArray(dados.respostas)

                ? dados.respostas

                : [];

        mensagensChatUsuario =
            Array.isArray(dados.mensagensChat)
                ? dados.mensagensChat
                : [];





        return false;





    } catch (erro) {



        console.log(

            "Erro ao carregar rascunho:",

            erro

        );



        // Se o carregamento do rascunho falhar,
        // não bloqueamos totalmente o relatório.
        respostasUsuario = [];
        mensagensChatUsuario = [];



        return false;



    }



}





function descobrirPerguntaParaRetomar() {



    const primeiraNaoRespondida =

        perguntas.findIndex(

            pergunta =>

                !buscarRespostaPorId(pergunta.id)

        );





    // Ainda existem perguntas faltando.
    if (primeiraNaoRespondida !== -1) {



        return primeiraNaoRespondida;



    }





    // Todas estão respondidas no rascunho.
    // Volta para a última para a pessoa confirmar
    // e finalizar, em vez de finalizar automaticamente.
    return Math.max(

        perguntas.length - 1,

        0

    );



}



const textoPergunta =

    document.getElementById("textoPergunta");



const listaRespostas =

    document.getElementById("listaRespostas");



const contador =

    document.getElementById("contadorPergunta");



const porcentagem =

    document.getElementById("porcentagem");



const barra =

    document.getElementById("barraProgresso");



const btnProxima =

    document.getElementById("btnProxima");



const btnVoltar =

    document.getElementById("btnVoltar");



const cardRelatorio =

    document.getElementById("cardRelatorio");



const mensagemStatus =
    document.getElementById("mensagemStatus");

const escolhaModoRelatorio = document.getElementById("escolhaModoRelatorio");
const btnModoFormulario = document.getElementById("btnModoFormulario");
const btnModoChat = document.getElementById("btnModoChat");
const cardChatRelatorio = document.getElementById("cardChatRelatorio");
const mensagensChatRelatorio = document.getElementById("mensagensChatRelatorio");
const progressoChat = document.getElementById("progressoChat");
const chatFinalizacao = document.getElementById("chatFinalizacao");
const btnFinalizarChat = document.getElementById("btnFinalizarChat");
const formChatRelatorio = document.getElementById("formChatRelatorio");
const inputChatRelatorio = document.getElementById("inputChatRelatorio");
const btnEnviarChat = document.getElementById("btnEnviarChat");



// ==========================
// MENSAGEM DE STATUS
// ==========================
function mostrarMensagem(texto, tipo) {



    // tipo: "sucesso" | "aviso" | "erro"
    mensagemStatus.textContent = traduzir(texto);

    mensagemStatus.className = `mensagem-status visivel ${tipo}`;



}



// ==========================
// CHAT DO RELATÓRIO
// ==========================
function obterIdsNecessariosHoje() {
    const ids = perguntas.map(pergunta => pergunta.id);

    if (!ids.includes("alerta_estresse")) {
        ids.unshift("alerta_estresse");
    }

    return ids;
}

function relatorioChatCompleto() {
    return obterIdsNecessariosHoje().every(id => {
        const resposta = buscarRespostaPorId(id);
        return Boolean(resposta && String(resposta.resposta || "").trim());
    });
}

function atualizarProgressoChat() {
    const ids = obterIdsNecessariosHoje();

    const respondidas = ids.filter(id => {
        const resposta = buscarRespostaPorId(id);
        return Boolean(resposta && String(resposta.resposta || "").trim());
    }).length;

    progressoChat.textContent =
        idiomaAtual === "en"
            ? `${respondidas} of ${ids.length} details`
            : `${respondidas} de ${ids.length} informações`;

    const completo = respondidas === ids.length;
    chatFinalizacao.classList.toggle("oculto-chat", !completo);

    return completo;
}

function criarBolhaChat(role, texto, classeExtra = "") {
    const linha = document.createElement("div");
    linha.className = `chat-mensagem ${role} ${classeExtra}`.trim();

    const bolha = document.createElement("div");
    bolha.className = "chat-bolha";
    bolha.textContent = texto;

    linha.appendChild(bolha);
    mensagensChatRelatorio.appendChild(linha);
    mensagensChatRelatorio.scrollTop = mensagensChatRelatorio.scrollHeight;

    return linha;
}

async function salvarHistoricoInicialChat() {
    const resposta = await fetch("/api/relatorio/rascunho", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            respostas: respostasUsuario,
            mensagensChat: mensagensChatUsuario
        })
    });

    if (resposta.status === 401) {
        window.location.href = "/logar";
        return false;
    }

    if (resposta.status === 409) {
        const dados = await resposta.json();
        mostrarMensagem(
            dados.erro || "Você já preencheu o relatório de hoje. Volte amanhã!",
            "aviso"
        );
        bloquearPreenchimentoRelatorio();
        return false;
    }

    if (!resposta.ok) {
        throw new Error("Não foi possível salvar o início da conversa.");
    }

    return true;
}

async function renderizarHistoricoChat() {
    mensagensChatRelatorio.innerHTML = "";

    if (mensagensChatUsuario.length > 0) {
        mensagensChatUsuario
            .filter(item =>
                item &&
                (item.role === "user" || item.role === "assistant") &&
                typeof item.content === "string"
            )
            .forEach(item => criarBolhaChat(item.role, item.content));

        atualizarProgressoChat();
        return;
    }

    if (relatorioChatCompleto()) {
        criarBolhaChat(
            "assistant",
            idiomaAtual === "en"
                ? "Your report is already filled out. You can review the answers or finish the report."
                : "Seu relatório já está preenchido. Você pode revisar as respostas ou finalizar o relatório."
        );
        atualizarProgressoChat();
        return;
    }

    const quantidadeJaRegistrada =
        obterIdsNecessariosHoje()
            .filter(id => {

                const resposta =
                    buscarRespostaPorId(id);

                return Boolean(
                    resposta &&
                    String(
                        resposta.resposta || ""
                    ).trim()
                );

            }).length;


    let mensagemInicial;


    if (idiomaAtual === "en") {

        mensagemInicial =
            quantidadeJaRegistrada > 0
                ? "Hi! I already have some information from today's report. Tell me how the rest of the day went in your own words — you can mention several things at once. If you remember something differently later, just correct me."
                : "Hi! Let's make today's report feel more like a conversation. Tell me how the day went in your own words — you can mention several things at once. If you remember something differently later, just correct me.";

    } else {

        mensagemInicial =
            quantidadeJaRegistrada > 0
                ? "Oi! Já tenho algumas informações do relatório de hoje. Me conta como foi o restante do dia do seu jeito — pode falar de várias coisas de uma vez. Se lembrar de algo diferente depois, é só me corrigir."
                : "Oi! Vamos fazer o relatório de hoje de um jeito mais leve. Me conta como foi o dia dela do seu jeito — pode falar de várias coisas de uma vez. Se lembrar de algo diferente depois, é só me corrigir.";

    }

    if (proximaPergunta) {
        mensagemInicial += `\n\n${traduzir(proximaPergunta.pergunta)}`;
    }

    mensagensChatUsuario.push({
        role: "assistant",
        content: mensagemInicial
    });

    criarBolhaChat("assistant", mensagemInicial);
    atualizarProgressoChat();

    inicializandoChat = true;
    inputChatRelatorio.disabled = true;
    btnEnviarChat.disabled = true;

    try {
        await salvarHistoricoInicialChat();
    } catch (erro) {
        console.log("Erro ao salvar início do chat:", erro);
    } finally {
        inicializandoChat = false;
        inputChatRelatorio.disabled = false;
        btnEnviarChat.disabled = false;
    }
}

function atualizarTextosChat() {
    if (!inputChatRelatorio) return;

    inputChatRelatorio.placeholder =
        idiomaAtual === "en"
            ? "Tell me how the day went..."
            : "Conte como foi o dia...";

    btnEnviarChat.setAttribute(
        "aria-label",
        idiomaAtual === "en" ? "Send message" : "Enviar mensagem"
    );

    atualizarProgressoChat();
}

async function definirModoRelatorio(modo) {
    const usandoChat = modo === "chat";

    btnModoFormulario.classList.toggle("ativo", !usandoChat);
    btnModoChat.classList.toggle("ativo", usandoChat);

    cardRelatorio.style.display = usandoChat ? "none" : "";
    cardChatRelatorio.classList.toggle("oculto-chat", !usandoChat);

    sessionStorage.setItem(
        "modoRelatorioHoje",
        usandoChat ? "chat" : "formulario"
    );

    if (usandoChat) {
        await renderizarHistoricoChat();
        atualizarTextosChat();

        setTimeout(() => {

            if (
                !inputChatRelatorio.disabled
            ) {

                inputChatRelatorio.focus({
                    preventScroll: true
                });

            }

        }, 100);

        return;
    }

    perguntaAtual = descobrirPerguntaParaRetomar();
    carregarPergunta();
}

function bloquearPreenchimentoRelatorio() {
    cardRelatorio.style.display = "none";
    cardChatRelatorio.classList.add("oculto-chat");
    escolhaModoRelatorio.style.display = "none";
}

async function enviarMensagemChat(texto) {
    if (enviandoMensagemChat || inicializandoChat || !texto) return;

    enviandoMensagemChat = true;
    inputChatRelatorio.disabled = true;
    btnEnviarChat.disabled = true;

    criarBolhaChat("user", texto);

    const digitando = criarBolhaChat(
        "assistant",
        idiomaAtual === "en" ? "Organizing..." : "Organizando...",
        "chat-digitando"
    );

    try {
        const resposta = await fetch("/api/relatorio-chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mensagem: texto,
                idioma: idiomaAtual
            })
        });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        const dados = await resposta.json();

        if (resposta.status === 409) {
            digitando.remove();
            mostrarMensagem(
                dados.erro || "Você já preencheu o relatório de hoje. Volte amanhã!",
                "aviso"
            );
            bloquearPreenchimentoRelatorio();
            return;
        }

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro no chat.");
        }

        digitando.remove();

        if (Array.isArray(dados.respostas)) {
            respostasUsuario = dados.respostas;
        }

        mensagensChatUsuario.push(
            { role: "user", content: texto },
            { role: "assistant", content: dados.mensagem }
        );

        criarBolhaChat("assistant", dados.mensagem);
        atualizarProgressoChat();

    } catch (erro) {
        digitando.remove();
        console.log("Erro no chat do relatório:", erro);

        criarBolhaChat(
            "assistant",
            idiomaAtual === "en"
                ? "I couldn't respond right now. Please try again."
                : "Não consegui responder agora. Tente novamente.",
            "erro"
        );

    } finally {
        enviandoMensagemChat = false;
        inputChatRelatorio.disabled = false;
        btnEnviarChat.disabled = false;
        inputChatRelatorio.focus({
            preventScroll: true
        });
    }
}

function ajustarAlturaInputChat() {

    if (!inputChatRelatorio) {
        return;
    }


    inputChatRelatorio.style.height =
        "auto";


    inputChatRelatorio.style.height =
        `${Math.min(
            inputChatRelatorio.scrollHeight,
            130
        )}px`;

}

btnModoFormulario.addEventListener("click", async () => {
    await definirModoRelatorio("formulario");
});

btnModoChat.addEventListener("click", async () => {
    await definirModoRelatorio("chat");
});

formChatRelatorio.addEventListener("submit", async evento => {
    evento.preventDefault();

    const texto = inputChatRelatorio.value.trim();
    if (!texto || inicializandoChat) return;

    inputChatRelatorio.value = "";

    ajustarAlturaInputChat();

    await enviarMensagemChat(
        texto
    );
});

inputChatRelatorio.addEventListener(
    "input",
    ajustarAlturaInputChat
);

inputChatRelatorio.addEventListener("keydown", evento => {
    if (evento.key === "Enter" && !evento.shiftKey) {
        evento.preventDefault();
        formChatRelatorio.requestSubmit();
    }
});

btnFinalizarChat.addEventListener("click", () => {
    finalizarRelatorio(btnFinalizarChat);
});

// ==========================
// CRIAR BARRA
// ==========================
function atualizarBarra() {



    barra.innerHTML = "";



    perguntas.forEach((item, index) => {



        const bolinha = document.createElement("span");



        bolinha.classList.add("bolinha");



        if (index === perguntaAtual) {



            bolinha.classList.add("ativa");



        } else if (buscarRespostaPorId(item.id)) {



            bolinha.classList.add("respondida");



        }



        barra.appendChild(bolinha);



    });



}



// ==========================
// CARREGAR PERGUNTA
// ==========================
function carregarPergunta(respostaAnterior = null) {



    respostaSelecionada = null;



    btnProxima.disabled = true;



    btnVoltar.classList.toggle(

        "oculto",

        perguntaAtual === 0

    );



    const atual = perguntas[perguntaAtual];





    // Se não recebemos uma resposta manualmente,
    // procura a resposta já salva no rascunho.
    if (respostaAnterior === null) {



        const respostaSalva =

            buscarRespostaPorId(atual.id);



        if (respostaSalva) {



            respostaAnterior =

                respostaSalva.resposta;



        }



    }





    // Na última pergunta deixa claro que o próximo
    // clique concluirá o relatório.
    btnProxima.textContent =

        traduzir(

            perguntaAtual === perguntas.length - 1

                ? "Finalizar relatório"

                : "Próxima pergunta"

        );

    // 🔧 Exibição traduzida — o texto da pergunta em si (atual.pergunta)
    // NUNCA é alterado, só o que aparece na tela
    textoPergunta.textContent = traduzir(atual.pergunta);



    contador.textContent =

        `${traduzir("Pergunta")} ${perguntaAtual + 1} ${traduzir("de")} ${perguntas.length}`;



    porcentagem.textContent =

        `${Math.round((perguntaAtual / perguntas.length) * 100)}% ${traduzir("concluído")}`;



    atualizarBarra();



    listaRespostas.innerHTML = "";



    // 🔧 Pergunta de texto livre (ex: gatilho_principal) — renderiza uma
    // textarea em vez dos botões de múltipla escolha
    if (atual.tipo === "texto") {



        const caixaTexto = document.createElement("textarea");



        caixaTexto.className = "resposta-texto";

        caixaTexto.rows = 3;

        caixaTexto.maxLength = 300;

        caixaTexto.placeholder = traduzir(atual.placeholder || "");



        if (respostaAnterior !== null) {

            caixaTexto.value = respostaAnterior;

            respostaSelecionada = respostaAnterior;

            btnProxima.disabled = false;

        }



        caixaTexto.addEventListener("input", () => {

            const valor = caixaTexto.value.trim();

            respostaSelecionada = valor.length > 0 ? valor : null;

            btnProxima.disabled = valor.length === 0;

        });



        listaRespostas.appendChild(caixaTexto);



        return;



    }



    atual.respostas.forEach(opcao => {



        const botao = document.createElement("button");



        botao.type = "button";



        botao.className = "opcao";



        // 🔧 Só o texto exibido é traduzido — "opcao" (o valor real,
        // em português) continua sendo o que vai pra respostaSelecionada
        // e, depois, pro backend. Isso é necessário porque o server.js
        // compara essas respostas literalmente (ex: "Ambientes barulhentos")
        // pros gráficos de gatilhos — traduzir o valor quebraria essa lógica.
        botao.textContent = traduzir(opcao);



        botao.onclick = () => {



            document

                .querySelectorAll(".opcao")

                .forEach(btn => {

                    btn.classList.remove("selecionada");

                });



            botao.classList.add("selecionada");



            respostaSelecionada = opcao;



            btnProxima.disabled = false;



        };



                // Ao voltar pra uma pergunta já respondida, mantém a opção
        // marcada e o botão de próxima já habilitado
        if (respostaAnterior !== null && opcao === respostaAnterior) {

            botao.classList.add("selecionada");

            respostaSelecionada = opcao;

            btnProxima.disabled = false;

        }



        listaRespostas.appendChild(botao);



    });



}



// ==========================
// BOTÃO PRÓXIMA
// ==========================
btnProxima.addEventListener(

    "click",

    async () => {



        // Caso uma tentativa anterior de finalizar
        // tenha falhado, tenta somente finalizar de novo.
        if (perguntaAtual >= perguntas.length) {



            finalizarRelatorio();

            return;



        }





        if (respostaSelecionada === null) {



            return;



        }





        const pergunta =

            perguntas[perguntaAtual];





        // Em vez de sempre adicionar outra resposta,
        // atualiza a existente caso ela já tenha sido
        // respondida anteriormente.
        salvarOuAtualizarResposta({



            id: pergunta.id,



            pergunta: pergunta.pergunta,



            resposta: respostaSelecionada



        });





        // Evita dois cliques enquanto salva.
        btnProxima.disabled = true;

        btnProxima.textContent =

            traduzir("Salvando...");





        try {



            const salvou =

                await salvarRascunho();



            if (!salvou) {

                return;

            }





        } catch (erro) {



            console.log(

                "Erro ao salvar progresso:",

                erro

            );



            btnProxima.disabled = false;



            btnProxima.textContent =

                traduzir(

                    perguntaAtual ===

                    perguntas.length - 1

                        ? "Finalizar relatório"

                        : "Próxima pergunta"

                );



            mostrarMensagem(

                "Não foi possível salvar o progresso. Tente novamente.",

                "erro"

            );



            return;



        }





        perguntaAtual++;





        // Última resposta salva.
        // Agora finaliza o relatório oficial.
        if (

            perguntaAtual >=

            perguntas.length

        ) {



            finalizarRelatorio();

            return;



        }





        carregarPergunta();



    }

);



// ==========================
// BOTÃO VOLTAR
// ==========================
btnVoltar.addEventListener(

    "click",

    () => {



        if (perguntaAtual <= 0) {

            return;

        }





        if (

            mensagemStatus.classList.contains(

                "visivel"

            )

        ) {



            mensagemStatus.classList.remove(

                "visivel"

            );



            cardRelatorio.style.display = "";



        }





        perguntaAtual--;





        const pergunta =

            perguntas[perguntaAtual];



        const respostaAnterior =

            buscarRespostaPorId(

                pergunta.id

            );





        carregarPergunta(

            respostaAnterior

                ? respostaAnterior.resposta

                : null

        );



    }

);



// ==========================
// FINALIZAR
// ==========================
async function finalizarRelatorio(botaoOrigem = btnProxima) {



    // Desabilita o botão de origem para evitar duplo envio enquanto salva
    botaoOrigem.disabled = true;
    botaoOrigem.textContent = traduzir("Salvando...");



    try {



        const resposta = await fetch("/api/relatorio", {



            method: "POST",



            headers: {

                "Content-Type": "application/json"

            },



            body: JSON.stringify({

                respostas: respostasUsuario

            })



        });



        if (resposta.status === 401) {

            window.location.href = "/logar";

            return;

        }



        // 🔧 FIX: Trata o caso de relatório duplicado no mesmo dia
        // O backend retorna 409 quando o usuário já preencheu hoje
        if (resposta.status === 409) {



            const dados = await resposta.json();



            mostrarMensagem(

                dados.erro || "Você já preencheu o relatório de hoje. Volte amanhã!",

                "aviso"

            );



            // Não permite iniciar outro preenchimento no mesmo dia.
            bloquearPreenchimentoRelatorio();



            return;



        }



        if (!resposta.ok) {

            throw new Error("Resposta do servidor com erro");

        }



        window.location.href = "/Transicao4";



    } catch (erro) {



        console.log("Erro ao salvar relatório:", erro);



        // Reabilita o botão que iniciou a finalização.
        botaoOrigem.disabled = false;
        botaoOrigem.textContent =
            botaoOrigem === btnFinalizarChat
                ? traduzir("Finalizar relatório")
                : traduzir("Tentar novamente");



        mostrarMensagem(

            "Erro ao salvar o relatório. Tente novamente.",

            "erro"

        );



    }



}



// ==========================
// PAINEL DE NOTIFICAÇÕES (SININHO)
// ==========================
const painelNotificacoes = document.getElementById("painelNotificacoes");

const listaNotificacoes  = document.getElementById("listaNotificacoes");



function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto ?? "";

    return div.innerHTML;

}



function formatarItemNotificacao(item) {

    const classeExtra = item.lida ? "" : "nao-lida";

    return `

        <div class="item-notificacao ${classeExtra}">

            ${escaparHTML(item.mensagem)}

            <span class="tempo-notificacao">${escaparHTML(item.tempo)}</span>

        </div>

    `;

}



async function carregarNotificacoes() {



    try {



        const resposta = await fetch("/api/notificacoes");



        if (!resposta.ok) throw new Error("Falha ao carregar notificações");



        const dados = await resposta.json();

        const itens = dados.notificacoes || [];



        if (itens.length === 0) {

            listaNotificacoes.innerHTML = `<div class="painel-vazio">${traduzir("Nenhuma notificação por enquanto.")}</div>`;

        } else {

            listaNotificacoes.innerHTML = itens.map(formatarItemNotificacao).join("");

        }



    } catch (erro) {

        console.log("Erro ao carregar notificações:", erro);

        listaNotificacoes.innerHTML = `<div class="painel-vazio">${traduzir("Não foi possível carregar as notificações.")}</div>`;

    }



}



async function marcarNotificacoesComoLidas() {



    try {

        await fetch("/api/notificacoes/marcar-lidas", { method: "POST" });

        document.getElementById("quantidadeNotificacoes").textContent = "0";

    } catch (erro) {

        console.log("Erro ao marcar notificações como lidas:", erro);

    }



}



document.getElementById("btnNotificacoes").addEventListener("click", async (e) => {



    e.stopPropagation();



    const estaAberto = painelNotificacoes.classList.contains("aberto");



    if (estaAberto) {

        painelNotificacoes.classList.remove("aberto");

        return;

    }



    painelNotificacoes.classList.add("aberto");



    await carregarNotificacoes();

    marcarNotificacoesComoLidas();



});



document.addEventListener("click", (e) => {

    if (!painelNotificacoes.contains(e.target)) {

        painelNotificacoes.classList.remove("aberto");

    }

});



// ==========================
// DADOS DO USUÁRIO
// ==========================
async function carregarUsuario() {



    try {



        const resposta = await fetch("/api/home");



        if (resposta.status === 401) {

            window.location.href = "/logar";

            return;

        }



        if (!resposta.ok) {

            return;

        }



        const usuario = await resposta.json();



        document.getElementById("nomeUsuario").textContent =

            usuario.nome || "Usuário";



        document.getElementById("tipoConta").textContent =

            usuario.tipoConta || "Responsável";



        if (usuario.fotoPerfil) {

            document.getElementById("fotoUsuario").src = usuario.fotoPerfil;

        }



    } catch (erro) {



        console.log("Erro ao carregar usuário:", erro);



    }



}



// ==========================
// TEMA
// ==========================
// ==========================
// VERIFICA SE HOUVE ALERTA REAL DO BIXUCO HOJE
// ==========================
// ==========================
// GRÁFICOS DO DIA (força + atividade)
// ==========================
let graficoForcaChart = null;

let graficoAtividadeChart = null;



async function carregarGraficosDiarios() {



    try {



        const resposta = await fetch("/api/relatorio-diario/grafico");



        if (!resposta.ok) return;



        const dados = await resposta.json();



        desenharGraficoForca(dados.forca || []);

        desenharGraficoAtividade(dados.atividade || []);



    } catch (erro) {

        console.log("Erro ao carregar gráficos do dia:", erro);

    }



}



function desenharGraficoForca(pontos) {



    const ctx = document.getElementById("graficoForca").getContext("2d");



    if (graficoForcaChart) graficoForcaChart.destroy();



    const gradiente = ctx.createLinearGradient(0, 0, 0, 300);

    gradiente.addColorStop(0, "rgba(50, 194, 109, 0.35)");

    gradiente.addColorStop(1, "rgba(50, 194, 109, 0)");



    graficoForcaChart = new Chart(ctx, {

        type: "line",

        data: {

            labels: pontos.map(p => p.horario),

            datasets: [{

                label: "Força",

                data: pontos.map(p => p.forca),

                borderColor: "#32C26D",

                backgroundColor: gradiente,

                pointBackgroundColor: pontos.map(p => p.pico ? "#E53E3E" : "#32C26D"),

                pointRadius: pontos.map(p => p.pico ? 6 : 2),

                pointHoverRadius: 7,

                tension: 0.3,

                borderWidth: 2,

                fill: true,

                segment: {

                    borderColor: (contexto) => {

                        const p0 = pontos[contexto.p0DataIndex];

                        const p1 = pontos[contexto.p1DataIndex];

                        return (p0.crise && p1.crise) ? "#E53E3E" : "#32C26D";

                    }

                }

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: { display: false },

                tooltip: {

                    callbacks: {

                        label: (c) => c.raw > 0

                            ? `${traduzir("Força")}: ${c.raw}${pontos[c.dataIndex].pico ? traduzir(" — pico da crise") : ""}`

                            : traduzir("Sem força registrada")

                    }

                }

            },

            scales: {

                y: { beginAtZero: true }

            }

        }

    });



}



function desenharGraficoAtividade(pontos) {



    const ctx = document.getElementById("graficoAtividade").getContext("2d");



    if (graficoAtividadeChart) graficoAtividadeChart.destroy();



    graficoAtividadeChart = new Chart(ctx, {

        type: "line",

        data: {

            labels: pontos.map(p => p.horario),

            datasets: [{

                label: "Status",

                data: pontos.map(p => p.ativo),

                borderColor: "#0AB7FB",

                backgroundColor: "rgba(10, 183, 251, 0.2)",

                stepped: true,

                pointRadius: 0,

                borderWidth: 2,

                fill: true

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: { display: false },

                tooltip: {

                    callbacks: {

                        label: (c) => c.raw === 1 ? traduzir("Ativo (com o Bixuco)") : traduzir("Inativo")

                    }

                }

            },

            scales: {

                x: {

                    ticks: { autoSkip: true, maxTicksLimit: 13 }

                },

                y: {

                    min: 0,

                    max: 1,

                    ticks: {

                        stepSize: 1,

                        callback: (v) => v === 1 ? traduzir("Ativo (com o Bixuco)") : traduzir("Inativo")

                    }

                }

            }

        }

    });



}



async function verificarAlertaHoje() {



    try {



        const resposta = await fetch("/api/bixuco/eventos-hoje");

        if (!resposta.ok) return;



        const dados = await resposta.json();



        if (!dados.houveAlerta) {

            return; // segue o fluxo normal, com a pergunta manual de Sim/Não

        }



        // Remove a pergunta manual "Teve algum alerta hoje?" — já sabemos que sim
        perguntas = perguntas.filter(p => p.id !== "alerta_estresse");



        // Ja registra a resposta automaticamente, pros graficos continuarem funcionando
        salvarOuAtualizarResposta({



            id: "alerta_estresse",



            pergunta:

                "Teve algum alerta de estresse hoje?",



            resposta: "Sim"



        });



        // Insere as duas perguntas extras logo no inicio do questionario
        perguntas.unshift(

            {

                id: "acalmou_facilidade",

                pergunta: "Ela conseguiu se acalmar com facilidade?",

                respostas: ["Sim, rapidamente", "Sim, mas demorou", "Não, precisou de ajuda", "Não se acalmou"]

            },

            {

                id: "gatilho_principal",

                tipo: "texto",

                pergunta: "Qual foi o principal gatilho do episódio?",

                placeholder: "Descreva em poucas palavras (ex: barulho alto, mudança de rotina...)"

            }

        );



        // Guarda também a resposta automática
        // dentro do rascunho do dia.
        try {



            await salvarRascunho();



        } catch (erro) {



            console.log(

                "Não foi possível salvar a resposta automática:",

                erro

            );



        }



        // Mensagem visual removida a pedido — a lógica de auto-resposta
        // e as perguntas extras (acalmou_facilidade, gatilho_principal)
        // continuam funcionando normalmente, só não aparece mais o aviso.
    } catch (erro) {

        console.log("Erro ao verificar alerta do dia:", erro);

    }



}



// ==========================
// INICIAR
// ==========================
// Aplica o tema salvo ao carregar a página
async function iniciarRelatorio() {



    // 1. Recupera o que já foi respondido.
    const jaFinalizado =

        await carregarRascunho();





    // Se já concluiu hoje, não inicia
    // um segundo relatório.
    if (jaFinalizado) {

        bloquearPreenchimentoRelatorio();
        carregarGraficosDiarios();
        return;

    }





    // 2. Confere os eventos reais do Bixuco.
    // Se houve alerta, pode adicionar as perguntas
    // extras e registrar alerta_estresse = Sim.
    await verificarAlertaHoje();





    // 3. Descobre automaticamente onde o responsável parou.
    perguntaAtual = descobrirPerguntaParaRetomar();

    // 4. Restaura o último modo usado nesta aba.
    const modoSalvo = sessionStorage.getItem("modoRelatorioHoje");

    await definirModoRelatorio(
        modoSalvo === "chat"
            ? "chat"
            : "formulario"
    );

    carregarGraficosDiarios();



}



// Aplica o idioma salvo (ex: usuário trocou pra inglês em outra página)
// antes de montar a primeira pergunta
aplicarIdiomaEstatico();



carregarUsuario();

iniciarRelatorio();



// Substitui os antigos onclick/onerror inline (removidos por causa do CSP)
document.getElementById("fotoUsuario").addEventListener("error", function () {

    this.src = "/img/perfilPadrao.png";

});