
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
    mensagemStatus.textContent = texto;
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

    const atual = perguntas[perguntaAtual];

    textoPergunta.textContent = atual.pergunta;

    contador.textContent =
        `Pergunta ${perguntaAtual + 1} de ${perguntas.length}`;

    porcentagem.textContent =
        `${Math.round((perguntaAtual / perguntas.length) * 100)}% concluído`;

    atualizarBarra();

    listaRespostas.innerHTML = "";

    atual.respostas.forEach(opcao => {

        const botao = document.createElement("button");

        botao.type = "button";

        botao.className = "opcao";

        botao.textContent = opcao;

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
    btnProxima.textContent = "Salvando...";

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
        btnProxima.textContent = "Tentar novamente";

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
            listaNotificacoes.innerHTML = `<div class="painel-vazio">Nenhuma notificação por enquanto.</div>`;
        } else {
            listaNotificacoes.innerHTML = itens.map(formatarItemNotificacao).join("");
        }

    } catch (erro) {
        console.log("Erro ao carregar notificações:", erro);
        listaNotificacoes.innerHTML = `<div class="painel-vazio">Não foi possível carregar as notificações.</div>`;
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
                            ? `Força: ${c.raw}${pontos[c.dataIndex].pico ? " — pico da crise" : ""}`
                            : "Sem força registrada"
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
                        label: (c) => c.raw === 1 ? "Ativo (com o Bixuco)" : "Inativo"
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 1,
                    ticks: {
                        stepSize: 1,
                        callback: (v) => v === 1 ? "Ativo" : "Inativo"
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

carregarUsuario();
iniciarRelatorio();

// Substitui os antigos onclick/onerror inline (removidos por causa do CSP)
document.getElementById("fotoUsuario").addEventListener("click", () => {
    window.location.href = "/perfil";
});

document.getElementById("fotoUsuario").addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});
