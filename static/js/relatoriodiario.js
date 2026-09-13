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
    "Realizou atividades propostas?": "Did she complete the proposed activities?",
    "Como foi a interação social?": "How was social interaction?",
    "Como você avaliaria o dia de hoje?": "How would you rate today?",
    "Ela conseguiu se acalmar com facilidade?": "Was she able to calm down easily?",
    "Qual foi o principal gatilho do episódio?": "What was the main trigger for the episode?",

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
        pergunta: "Como foi a comunicação hoje?",
        respostas: [
            "Muito boa",
            "Boa",
            "Pouca",
            "Nenhuma"
        ]
    },

    {
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
        pergunta: "Dormiu bem?",
        respostas: [
            "Muito bem",
            "Bem",
            "Pouco",
            "Muito pouco"
        ]
    },

    {
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

const respostasUsuario = [];

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

const cardRelatorio =
    document.getElementById("cardRelatorio");

const mensagemStatus =
    document.getElementById("mensagemStatus");

// ==========================
// MENSAGEM DE STATUS
// ==========================

function mostrarMensagem(texto, tipo) {

    // tipo: "sucesso" | "aviso" | "erro"
    mensagemStatus.textContent = traduzir(texto);
    mensagemStatus.className = `mensagem-status visivel ${tipo}`;

}

// ==========================
// CRIAR BARRA
// ==========================

function atualizarBarra() {

    barra.innerHTML = "";

    perguntas.forEach((item, index) => {

        const bolinha = document.createElement("span");

        bolinha.classList.add("bolinha");

        if (index < perguntaAtual) {

            bolinha.classList.add("respondida");

        } else if (index === perguntaAtual) {

            bolinha.classList.add("ativa");

        }

        barra.appendChild(bolinha);

    });

}

// ==========================
// CARREGAR PERGUNTA
// ==========================

function carregarPergunta() {

    respostaSelecionada = null;

    btnProxima.disabled = true;
    btnProxima.textContent = traduzir("Próxima pergunta");

    const atual = perguntas[perguntaAtual];

    // 🔧 Exibição traduzida — o texto da pergunta em si (atual.pergunta)
    // NUNCA é alterado, só o que aparece na tela
    textoPergunta.textContent = traduzir(atual.pergunta);

    contador.textContent =
        `${traduzir("Pergunta")} ${perguntaAtual + 1} ${traduzir("de")} ${perguntas.length}`;

    porcentagem.textContent =
        `${Math.round((perguntaAtual / perguntas.length) * 100)}% ${traduzir("concluído")}`;

    atualizarBarra();

    listaRespostas.innerHTML = "";

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

        listaRespostas.appendChild(botao);

    });

}

// ==========================
// BOTÃO PRÓXIMA
// ==========================

btnProxima.addEventListener("click", () => {

    // 🔧 FIX: se já passamos de todas as perguntas (o envio anterior
    // falhou e o botão virou "tentar novamente"), esse clique deve
    // só reenviar o relatório — sem tentar empilhar mais uma
    // resposta em perguntas[perguntaAtual], que já não existe
    if (perguntaAtual >= perguntas.length) {
        finalizarRelatorio();
        return;
    }

    if (respostaSelecionada === null) {
        return;
    }

    respostasUsuario.push({
        id: perguntas[perguntaAtual].id || null,
        pergunta: perguntas[perguntaAtual].pergunta,
        resposta: respostaSelecionada
    });

    perguntaAtual++;

    if (perguntaAtual >= perguntas.length) {

        finalizarRelatorio();
        return;

    }

    carregarPergunta();

});

// ==========================
// FINALIZAR
// ==========================

async function finalizarRelatorio() {

    // Desabilita o botão para evitar duplo envio enquanto salva
    btnProxima.disabled = true;
    btnProxima.textContent = traduzir("Salvando...");

    try {

        const resposta = await fetch("/api/relatorio", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                respostas: respostasUsuario,
                data: new Date().toISOString()
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

            // Esconde o card do questionário, já que não há mais o que fazer aqui hoje
            cardRelatorio.style.display = "none";

            return;

        }

        if (!resposta.ok) {
            throw new Error("Resposta do servidor com erro");
        }

        window.location.href = "/Transicao4";

    } catch (erro) {

        console.log("Erro ao salvar relatório:", erro);

        // Reabilita o botão para o usuário tentar de novo
        btnProxima.disabled = false;
        btnProxima.textContent = traduzir("Tentar novamente");

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

document.getElementById("btnTemaMobile").addEventListener("click", () => {
    const novoTema = document.body.classList.contains("tema-escuro") ? "claro" : "escuro";
    aplicarTema(novoTema);
});

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
        respostasUsuario.push({
            id: "alerta_estresse",
            pergunta: "Teve algum alerta de estresse hoje?",
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
                pergunta: "Qual foi o principal gatilho do episódio?",
                respostas: ["Ambientes barulhentos", "Locais lotados", "Mudança de rotina", "Não identificado"]
            }
        );

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
    await verificarAlertaHoje();
    carregarPergunta();
    carregarGraficosDiarios();
}

// Aplica o idioma salvo (ex: usuário trocou pra inglês em outra página)
// antes de montar a primeira pergunta
aplicarIdiomaEstatico();

carregarUsuario();
iniciarRelatorio();

// Substitui os antigos onclick/onerror inline (removidos por causa do CSP)
document.getElementById("fotoUsuario").addEventListener("click", () => {
    window.location.href = "/perfil";
});

document.getElementById("fotoUsuario").addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});