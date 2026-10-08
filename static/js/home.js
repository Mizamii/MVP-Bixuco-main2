// =========================
// TRADUÇÃO MANUAL
// =========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    "A ofensiva recomeça a cada dia sem crise. Um dia de cada vez.": "The streak restarts with each crisis-free day. One day at a time.",
    "Um dia sem crise! Continue acompanhando o dia a dia.": "One crisis-free day! Keep tracking day by day.",
    "Muito bom! Dias tranquilos seguidos.": "Great! Calm days in a row.",
    "Ótimo progresso! Mais de uma semana sem crises.": "Great progress! More than a week without crises.",
    "Parabéns! Mais de um mês sem nenhuma crise.": "Congrats! More than a month without any crisis.",
    "Carregando localização...": "Loading location...",
    "Última localização conhecida": "Last known location",
    "Nenhuma localização registrada ainda": "No location registered yet",
    "Não foi possível carregar a localização": "Could not load location",
    "Rastreamento em tempo real disponível em breve": "Real-time tracking available soon",
    "Atualizado em": "Updated on",
    "Localização desatualizada": "Location outdated",
    "Nenhuma notificação por enquanto.": "No notifications for now.",
    "Não foi possível carregar as notificações.": "Could not load notifications.",
    "Erro ao gerar dicas.": "Error generating tips.",
    "Erro ao gerar dica. Tente novamente.": "Error generating tip. Try again.",
    "Erro interno ao gerar dica.": "Internal error generating tip.",
    "Preencha o Perfil Sensorial ou um relatório diário para receber dicas personalizadas.": "Complete the Sensory Profile or a daily report to receive personalized tips.",
    "Já gerou as dicas dessa semana. Espere até a próxima semana.": "You have already generated this week's tips. Please wait until next week.",
    "Erro de conexão. Tente novamente.": "Connection error. Try again.",
    "Ver dicas personalizadas": "View personalized tips",
    "Gerando...": "Generating...",
    "Gerar novas dicas": "Generate new tips",
    "Tentar novamente": "Try again",
    "Carregando...": "Loading...",
    "Peça seu Bixuco": "Order your Bixuco",
    "Comece a jornada de acompanhamento com a pelúcia sensorizada.": "Start your tracking journey with the sensory plush.",
    "Seu Bixuco está a caminho": "Your Bixuco is on the way",
    "Acompanhe o status da entrega.": "Track your delivery status.",
    "Vincular meu Bixuco": "Link my Bixuco",
    "Seu Bixuco chegou! Vincule para começar a jornada.": "Your Bixuco has arrived! Link it to start the journey.",
    "Responsável": "Guardian",
    "Usuário": "User"
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
        idiomaAtual === "en"
            ? "Traduzir para o português"
            : "Traduzir para o inglês";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";

    localStorage.setItem(
        "idioma",
        idiomaAtual
    );

    aplicarIdiomaEstatico();

    const tipoContaHome = document.getElementById("tipoConta");
    if (tipoContaHome) {
        tipoContaHome.textContent = traduzir(ultimoTipoContaHome);
    }

    atualizarTextoSequencia(
        diasConsecutivosAtual
    );

    renderizarStatusMapa();

    if (dicasAtuais.length > 0) {
        renderizarDicas(dicasAtuais);

        if (dicaAberta && modalDica.style.display === "flex") {
            abrirModalDica(dicaAberta);
        }
    }

    atualizarTextoBotaoDicas();

    if (
        painelNotificacoes
            .classList
            .contains("aberto")
    ) {
        carregarNotificacoes();
    }

    if (ultimoEstadoBixuco) {
        renderizarWidgetBixuco(
            ultimoEstadoBixuco
        );
    }
});


// =========================
// CARREGAR DADOS DO USUÁRIO
// =========================

let diasConsecutivosAtual = 0;
let ultimoTipoContaHome = "Responsável";

async function carregarDadosUsuario() {

    try {

        const resposta =
            await fetch("/api/home");

        if (
            resposta.status === 401
        ) {
            window.location.href =
                "/logar";

            return;
        }

        if (!resposta.ok) {
            throw new Error(
                `Falha ao carregar dados do usuário (status ${resposta.status})`
            );
        }

        const dados =
            await resposta.json();

        const nomeCompleto =
            dados.nome || "Usuário";

        const primeiroNome =
            nomeCompleto.split(" ")[0];

        document.getElementById(
            "nomeUsuario"
        ).textContent =
            nomeCompleto;

        document.getElementById(
            "primeiroNome"
        ).textContent =
            primeiroNome;

        document.getElementById(
            "nomeBixuco"
        ).textContent =
            dados.nomeBixuco || "Bixuco";

        document.getElementById(
            "nomeBixucoDicas"
        ).textContent =
            dados.nomeBixuco || "Bixuco";

        ultimoTipoContaHome =
            dados.tipoConta || "Responsável";

        document.getElementById(
            "tipoConta"
        ).textContent =
            traduzir(ultimoTipoContaHome);

        document.getElementById(
            "quantidadeNotificacoes"
        ).textContent =
            dados.notificacoes ?? 0;

        document.getElementById(
            "diasConsecutivos"
        ).textContent =
            dados.diasConsecutivos ?? 0;

        if (dados.fotoPerfil) {

            document.getElementById(
                "fotoUsuario"
            ).src =
                dados.fotoPerfil;

        }

        diasConsecutivosAtual =
            dados.diasConsecutivos ?? 0;

        atualizarTextoSequencia(
            diasConsecutivosAtual
        );

    } catch (erro) {

        console.log(
            "Erro ao carregar dados do usuário:",
            erro
        );

        document.getElementById(
            "nomeUsuario"
        ).textContent =
            "Usuário";

        document.getElementById(
            "primeiroNome"
        ).textContent =
            "Usuário";

        document.getElementById(
            "nomeBixuco"
        ).textContent =
            "Bixuco";

        document.getElementById(
            "nomeBixucoDicas"
        ).textContent =
            "Bixuco";

        ultimoTipoContaHome = "Responsável";

        document.getElementById(
            "tipoConta"
        ).textContent =
            traduzir(ultimoTipoContaHome);

        document.getElementById(
            "quantidadeNotificacoes"
        ).textContent =
            "0";

        document.getElementById(
            "diasConsecutivos"
        ).textContent =
            "0";

        diasConsecutivosAtual = 0;

        atualizarTextoSequencia(0);
    }
}


function atualizarTextoSequencia(dias) {

    diasConsecutivosAtual =
        dias;

    const texto =
        document.getElementById(
            "textoSequencia"
        );

    let chave;

    if (dias <= 0) {

        chave =
            "A ofensiva recomeça a cada dia sem crise. Um dia de cada vez.";

    } else if (dias === 1) {

        chave =
            "Um dia sem crise! Continue acompanhando o dia a dia.";

    } else if (dias < 7) {

        chave =
            "Muito bom! Dias tranquilos seguidos.";

    } else if (dias < 30) {

        chave =
            "Ótimo progresso! Mais de uma semana sem crises.";

    } else {

        chave =
            "Parabéns! Mais de um mês sem nenhuma crise.";

    }

    texto.textContent =
        traduzir(chave);
}


// =========================
// STATUS DO BIXUCO FÍSICO
// =========================

let ultimoEstadoBixuco = null;


async function carregarStatusBixuco() {

    const widget =
        document.getElementById(
            "bixuco-widget"
        );

    try {

        const resposta =
            await fetch(
                "/api/bixuco/status"
            );

        if (
            resposta.status === 401
        ) {

            window.location.href =
                "/logar";

            return;
        }

        if (!resposta.ok) {

            throw new Error(
                "Falha ao carregar status do Bixuco"
            );

        }

        const dados =
            await resposta.json();

        ultimoEstadoBixuco =
            dados.estado;

        renderizarWidgetBixuco(
            dados.estado
        );

    } catch (erro) {

        console.log(
            "Erro ao carregar status do Bixuco:",
            erro
        );

        widget.innerHTML = "";
    }
}


function renderizarWidgetBixuco(estado) {

    const widget =
        document.getElementById(
            "bixuco-widget"
        );

    if (estado === "vinculado") {

        widget.innerHTML = "";

        return;
    }

    if (estado === "sem_pedido") {

        widget.innerHTML = `
            <article class="card card-relatorio" id="cardBixuco">
                <div class="icone">
                    <i class="fa-solid fa-box"></i>
                </div>

                <div>
                    <h2>
                        ${traduzir("Peça seu Bixuco")}
                    </h2>

                    <p>
                        ${traduzir("Comece a jornada de acompanhamento com a pelúcia sensorizada.")}
                    </p>
                </div>

                <i class="fa-solid fa-chevron-right seta"></i>
            </article>
        `;

        document
            .getElementById(
                "cardBixuco"
            )
            .addEventListener(
                "click",
                () => {

                    window.location.href =
                        "/FormularioEntrega";

                }
            );

        return;
    }

    if (estado === "em_andamento") {

        widget.innerHTML = `
            <article class="card card-relatorio" id="cardBixuco">
                <div class="icone">
                    <i class="fa-solid fa-truck"></i>
                </div>

                <div>
                    <h2>
                        ${traduzir("Seu Bixuco está a caminho")}
                    </h2>

                    <p>
                        ${traduzir("Acompanhe o status da entrega.")}
                    </p>
                </div>

                <i class="fa-solid fa-chevron-right seta"></i>
            </article>
        `;

        document
            .getElementById(
                "cardBixuco"
            )
            .addEventListener(
                "click",
                () => {

                    window.location.href =
                        "/AcompanharPedido";

                }
            );

        return;
    }

    if (
        estado ===
        "entregue_nao_vinculado"
    ) {

        widget.innerHTML = `
            <article class="card card-relatorio" id="cardBixuco">
                <div class="icone">
                    <i class="fa-solid fa-link"></i>
                </div>

                <div>
                    <h2>
                        ${traduzir("Vincular meu Bixuco")}
                    </h2>

                    <p>
                        ${traduzir("Seu Bixuco chegou! Vincule para começar a jornada.")}
                    </p>
                </div>

                <i class="fa-solid fa-chevron-right seta"></i>
            </article>
        `;

        document
            .getElementById(
                "cardBixuco"
            )
            .addEventListener(
                "click",
                () => {

                    window.location.href =
                        "/VincularIdentidade";

                }
            );
    }
}


// =========================
// DICAS
// =========================

const btnGerarDicas =
    document.getElementById(
        "btnGerarDicas"
    );

const listaDicas =
    document.getElementById(
        "listaDicas"
    );

const textoBtnDicas =
    document.getElementById(
        "textoBtnDicas"
    );

const modalDica =
    document.getElementById(
        "modalDica"
    );

let dicasJaGeradas = false;


function atualizarTextoBotaoDicas() {

    textoBtnDicas.textContent =
        dicasJaGeradas
            ? traduzir(
                "Gerar novas dicas"
            )
            : traduzir(
                "Ver dicas personalizadas"
            );

}


function escaparHTML(texto) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        texto ?? "";

    return div.innerHTML;
}


// Dicas atuais na tela (para re-renderizar quando o idioma mudar)
let dicasAtuais = [];
let dicaAberta = null;

// Escolhe o idioma da dica. Dicas antigas (sem _en) continuam em português.
function textoDica(dica, campo) {
    if (idiomaAtual === "en" && dica[`${campo}_en`]) {
        return dica[`${campo}_en`];
    }
    return dica[campo];
}

function renderizarDicas(dicas) {

    dicasAtuais = dicas;

    listaDicas.innerHTML = "";

    dicas.forEach(dica => {

        const artigo =
            document.createElement(
                "article"
            );

        artigo.className =
            "dica";

        artigo.innerHTML = `
            <div class="icone-dica">
                <i class="fa-solid fa-lightbulb"></i>
            </div>

            <div>
                <h4>
                    ${escaparHTML(textoDica(dica, "titulo"))}
                </h4>

                <p>
                    ${escaparHTML(textoDica(dica, "texto"))}
                </p>
            </div>
        `;

        artigo.addEventListener(
            "click",
            () =>
                abrirModalDica(
                    dica
                )
        );

        listaDicas.appendChild(
            artigo
        );

    });

    dicasJaGeradas = true;

    atualizarTextoBotaoDicas();
}


function abrirModalDica(dica) {

    dicaAberta = dica;

    document.getElementById(
        "modalDicaTitulo"
    ).textContent =
        textoDica(dica, "titulo");

    document.getElementById(
        "modalDicaTexto"
    ).textContent =
        textoDica(dica, "texto");

    modalDica.style.display =
        "flex";
}


document
    .getElementById(
        "fecharModalDica"
    )
    .addEventListener(
        "click",
        () => {

            modalDica.style.display =
                "none";

        }
    );


modalDica.addEventListener(
    "click",
    e => {

        if (
            e.target === modalDica
        ) {

            modalDica.style.display =
                "none";

        }

    }
);


// Carrega automaticamente ao abrir a página,
// sem gastar crédito.
async function carregarDicasSalvas() {

    try {

        const resposta =
            await fetch(
                "/api/dicas"
            );

        const dados =
            await resposta.json();

        if (dados.disponivel) {

            renderizarDicas(
                dados.dicas
            );

        }

    } catch (erro) {

        console.log(
            "Erro ao carregar dicas salvas:",
            erro
        );

    }
}


btnGerarDicas.addEventListener(
    "click",
    async () => {

        textoBtnDicas.textContent =
            traduzir(
                "Gerando..."
            );

        btnGerarDicas.disabled =
            true;

        try {

            const resposta =
                await fetch(
                    "/api/dicas/gerar",
                    {
                        method: "POST"
                    }
                );

            const dados =
                await resposta.json();

            if (
                resposta.status === 429
            ) {

                if (dados.dicas) {

                    renderizarDicas(
                        dados.dicas
                    );

                }

                alert(
                    traduzir(dados.erro)
                );

                return;
            }

            if (!resposta.ok) {

                listaDicas.innerHTML =
                    `<p class="sem-dados">${traduzir(dados.erro || "Erro ao gerar dicas.")}</p>`;

                textoBtnDicas.textContent =
                    traduzir(
                        "Tentar novamente"
                    );

                return;
            }

            renderizarDicas(
                dados.dicas
            );

        } catch (erro) {

            console.log(
                "Erro ao gerar dicas:",
                erro
            );

            listaDicas.innerHTML =
                `<p class="sem-dados">${traduzir("Erro de conexão. Tente novamente.")}</p>`;

        } finally {

            btnGerarDicas.disabled =
                false;

        }

    }
);


// Chama junto com as outras
// inicializações da página.
carregarDicasSalvas();


// =========================
// CALENDÁRIO
// =========================

let dataAtual =
    new Date();

let diasComRelatorio = [];


const mesesPt = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];


const mesesEn = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];


async function carregarDiasRelatorio() {

    try {

        const mes =
            dataAtual.getMonth() + 1;

        const ano =
            dataAtual.getFullYear();

        const resposta =
            await fetch(
                `/api/relatorios/dias?mes=${mes}&ano=${ano}`
            );

        if (!resposta.ok) {

            throw new Error(
                "Falha ao carregar dias"
            );

        }

        const dados =
            await resposta.json();

        diasComRelatorio =
            dados.dias || [];

        atualizarCalendario();

    } catch (erro) {

        console.log(
            "Erro ao carregar dias de relatório:",
            erro
        );

        diasComRelatorio = [];

        atualizarCalendario();

    }
}


function atualizarCalendario() {

    const titulo =
        document.getElementById(
            "tituloCalendario"
        );

    const dias =
        document.getElementById(
            "diasCalendario"
        );

    dias.innerHTML = "";

    const meses =
        idiomaAtual === "en"
            ? mesesEn
            : mesesPt;

    titulo.textContent =
        `${meses[dataAtual.getMonth()]} ${dataAtual.getFullYear()}`;

    const primeiroDia =
        new Date(
            dataAtual.getFullYear(),
            dataAtual.getMonth(),
            1
        ).getDay();

    const ultimoDia =
        new Date(
            dataAtual.getFullYear(),
            dataAtual.getMonth() + 1,
            0
        ).getDate();

    for (
        let i = 0;
        i < primeiroDia;
        i++
    ) {

        dias.appendChild(
            document.createElement(
                "div"
            )
        );

    }

    const hoje =
        new Date();

    for (
        let dia = 1;
        dia <= ultimoDia;
        dia++
    ) {

        const botao =
            document.createElement(
                "button"
            );

        botao.type =
            "button";

        botao.textContent =
            dia;

        if (
            dia === hoje.getDate() &&
            dataAtual.getMonth() === hoje.getMonth() &&
            dataAtual.getFullYear() === hoje.getFullYear()
        ) {

            botao.classList.add(
                "hoje"
            );

        }

        if (
            diasComRelatorio
                .includes(dia)
        ) {

            botao.classList.add(
                "com-relatorio"
            );

        }

        dias.appendChild(
            botao
        );

    }
}


document.getElementById(
    "mesAnterior"
).onclick = () => {

    dataAtual.setMonth(
        dataAtual.getMonth() - 1
    );

    carregarDiasRelatorio();

};


document.getElementById(
    "proximoMes"
).onclick = () => {

    dataAtual.setMonth(
        dataAtual.getMonth() + 1
    );

    carregarDiasRelatorio();

};


// Tema claro/escuro vem de /js/tema.js.


// =========================
// PAINEL DE NOTIFICAÇÕES
// =========================

const painelNotificacoes =
    document.getElementById(
        "painelNotificacoes"
    );

const listaNotificacoes =
    document.getElementById(
        "listaNotificacoes"
    );


function formatarItemNotificacao(item) {

    const classeExtra =
        item.lida
            ? ""
            : "nao-lida";

    return `
        <div class="item-notificacao ${classeExtra}">
            ${escaparHTML(item.mensagem)}

            <span class="tempo-notificacao">
                ${escaparHTML(item.tempo)}
            </span>
        </div>
    `;
}


async function carregarNotificacoes() {

    try {

        const resposta =
            await fetch(
                "/api/notificacoes"
            );

        if (!resposta.ok) {

            throw new Error(
                "Falha ao carregar notificações"
            );

        }

        const dados =
            await resposta.json();

        const itens =
            dados.notificacoes || [];

        if (
            itens.length === 0
        ) {

            listaNotificacoes.innerHTML =
                `<div class="painel-vazio">${traduzir("Nenhuma notificação por enquanto.")}</div>`;

        } else {

            listaNotificacoes.innerHTML =
                itens
                    .map(
                        formatarItemNotificacao
                    )
                    .join("");

        }

    } catch (erro) {

        console.log(
            "Erro ao carregar notificações:",
            erro
        );

        listaNotificacoes.innerHTML =
            `<div class="painel-vazio">${traduzir("Não foi possível carregar as notificações.")}</div>`;

    }
}


async function marcarNotificacoesComoLidas() {

    try {

        await fetch(
            "/api/notificacoes/marcar-lidas",
            {
                method: "POST"
            }
        );

        atualizarBadgeNotificacoes(0);

    } catch (erro) {

        console.log(
            "Erro ao marcar notificações como lidas:",
            erro
        );

    }
}


document
    .getElementById(
        "btnNotificacoes"
    )
    .addEventListener(
        "click",
        async e => {

            e.stopPropagation();

            const estaAberto =
                painelNotificacoes
                    .classList
                    .contains(
                        "aberto"
                    );

            if (estaAberto) {

                painelNotificacoes
                    .classList
                    .remove(
                        "aberto"
                    );

                return;
            }

            painelNotificacoes
                .classList
                .add(
                    "aberto"
                );

            await carregarNotificacoes();

            marcarNotificacoesComoLidas();

        }
    );


document.addEventListener(
    "click",
    e => {

        if (
            !painelNotificacoes
                .contains(
                    e.target
                )
        ) {

            painelNotificacoes
                .classList
                .remove(
                    "aberto"
                );

        }

    }
);


// =========================
// MAPA DO BIXUCO
// =========================

let mapaLeaflet = null;

let marcador = null;

let camadaMapa = null;


// Usamos Leaflet puro com tiles raster.
// Isso evita o problema da camada MapLibre
// aparecer em branco.
const URL_MAPA =
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png";


// Centro inicial.
// Não representa a localização do Bixuco.
let latAtual =
    -14.2350;

let lngAtual =
    -51.9253;

let temLocalizacaoReal =
    false;


function iniciarMapa() {

    const containerMapa =
        document.getElementById(
            "mapaBixuco"
        );

    if (
        !containerMapa ||
        typeof L === "undefined"
    ) {

        console.log(
            "Leaflet ou o container do mapa não está disponível."
        );

        return;
    }

    mapaLeaflet =
        L.map(
            "mapaBixuco"
        ).setView(
            [
                latAtual,
                lngAtual
            ],
            13
        );


    camadaMapa =
        L.tileLayer(
            URL_MAPA,
            {
                maxZoom: 19,

                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }
        );


    camadaMapa.addTo(
        mapaLeaflet
    );


    // Quando o layout termina de montar,
    // recalcula o tamanho real do mapa.
    setTimeout(
        () => {

            if (mapaLeaflet) {

                mapaLeaflet
                    .invalidateSize();

            }

        },
        200
    );


    // Recalcula o tamanho caso o card
    // mude por causa da janela ou zoom.
    if (
        typeof ResizeObserver !==
        "undefined"
    ) {

        const observadorTamanho =
            new ResizeObserver(
                () => {

                    if (
                        mapaLeaflet
                    ) {

                        mapaLeaflet
                            .invalidateSize();

                    }

                }
            );


        observadorTamanho.observe(
            containerMapa
        );

    }


    carregarLocalizacaoReal();


    setInterval(
        carregarLocalizacaoReal,
        10000
    );

}


// tema.js ainda chama esta função.
// Como não usamos mais MapLibre,
// só precisamos recalcular o mapa.
function trocarEstiloMapa() {

    if (!mapaLeaflet) {
        return;
    }


    setTimeout(
        () => {

            mapaLeaflet
                .invalidateSize();

        },
        100
    );

}


// Guarda o último status recebido
// para a tradução poder atualizar
// sem fazer uma nova requisição.
let ultimoStatusMapa = {
    tipo: "inicial"
};


function renderizarStatusMapa() {

    const el =
        document.getElementById(
            "textoMapaStatus"
        );

    const iconeStatus =
        document.querySelector(
            ".mapa-status i"
        );

    if (!el) {
        return;
    }


    if (
        ultimoStatusMapa.tipo ===
        "inicial"
    ) {

        el.textContent =
            traduzir(
                "Rastreamento em tempo real disponível em breve"
            );

        if (iconeStatus) {

            iconeStatus.style.color =
                "#C2C2C2";

        }

    } else if (
        ultimoStatusMapa.tipo ===
        "sem-local"
    ) {

        el.textContent =
            traduzir(
                "Nenhuma localização registrada ainda"
            );

        if (iconeStatus) {

            iconeStatus.style.color =
                "#C2C2C2";

        }

    } else if (
        ultimoStatusMapa.tipo ===
        "atualizado"
    ) {

        el.textContent =
            `${traduzir("Atualizado em")} ${ultimoStatusMapa.dataFormatada}, ${ultimoStatusMapa.horario}`;

        if (iconeStatus) {

            iconeStatus.style.color =
                "#32C26D";

        }

    } else if (
        ultimoStatusMapa.tipo ===
        "desatualizado"
    ) {

        el.textContent =
            `${traduzir("Localização desatualizada")} · ${traduzir("Atualizado em")} ${ultimoStatusMapa.dataFormatada}, ${ultimoStatusMapa.horario}`;

        if (iconeStatus) {

            iconeStatus.style.color =
                "#C2C2C2";

        }

    } else if (
        ultimoStatusMapa.tipo ===
        "erro"
    ) {

        el.textContent =
            traduzir(
                "Não foi possível carregar a localização"
            );

        if (iconeStatus) {

            iconeStatus.style.color =
                "#C2C2C2";

        }

    }

}


async function carregarLocalizacaoReal() {

    if (!mapaLeaflet) {
        return;
    }

    try {

        const resposta =
            await fetch(
                "/api/bixuco/localizacao"
            );

        if (!resposta.ok) {

            throw new Error(
                "Falha ao buscar localização"
            );

        }

        const dados =
            await resposta.json();


        if (!dados.disponivel) {

            temLocalizacaoReal =
                false;

            if (marcador) {

                mapaLeaflet
                    .removeLayer(
                        marcador
                    );

                marcador =
                    null;

            }


            ultimoStatusMapa = {
                tipo: "sem-local"
            };


            renderizarStatusMapa();

            return;
        }


        if (dados.nomePelucia) {

            const tituloEl =
                document.getElementById(
                    "nomeBixucoTitulo"
                );

            if (tituloEl) {

                tituloEl.textContent =
                    dados.nomePelucia;

            }

        }


        latAtual =
            dados.latitude;

        lngAtual =
            dados.longitude;

        temLocalizacaoReal =
            true;


        mapaLeaflet.setView(
            [
                latAtual,
                lngAtual
            ],
            15
        );

        const corMarcador =
    dados.desatualizada
        ? "#C2C2C2"
        : "#32C26D";


        const iconeBixuco =
            dados.fotoUrl
                ? L.divIcon(
                    {
                        html: `
                            <div style="
                                width:40px;
                                height:40px;
                                border-radius:50%;
                                border:3px solid ${corMarcador};
                                box-shadow:0 2px 8px rgba(0,0,0,0.3);
                                overflow:hidden;
                                background:#FFFFFF;
                            ">
                                <img
                                    src="${dados.fotoUrl}"
                                    style="
                                        width:100%;
                                        height:100%;
                                        object-fit:cover;
                                    "
                                />
                            </div>
                        `,

                        iconSize: [
                            40,
                            40
                        ],

                        iconAnchor: [
                            20,
                            20
                        ],

                        className: ""
                    }
                )
                : L.divIcon(
                    {
                        html: `
                            <div style="
                                background:${corMarcador};
                                width:36px;
                                height:36px;
                                border-radius:50%;
                                border:3px solid white;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                box-shadow:0 2px 8px rgba(0,0,0,0.3);
                                font-size:18px;
                            ">
                                🐱
                            </div>
                        `,

                        iconSize: [
                            36,
                            36
                        ],

                        iconAnchor: [
                            18,
                            18
                        ],

                        className: ""
                    }
                );


        if (!marcador) {

            marcador =
                L.marker(
                    [
                        latAtual,
                        lngAtual
                    ],
                    {
                        icon:
                            iconeBixuco
                    }
                )
                .addTo(
                    mapaLeaflet
                );

        } else {

            marcador.setLatLng(
                [
                    latAtual,
                    lngAtual
                ]
            );

            marcador.setIcon(
                iconeBixuco
            );

        }


        



        marcador.setPopupContent(
            `<b>Bixuco</b><br>${
                dados.desatualizada
                    ? traduzir("Localização desatualizada")
                    : traduzir("Última localização conhecida")
            }`
        );


        marcador.openPopup();


        if (
            dados.bateria !== null &&
            dados.bateria !== undefined
        ) {

            const bateriaEl =
                document.getElementById(
                    "bateriaBixuco"
                );

            const valorEl =
                document.getElementById(
                    "bateriaValor"
                );


            if (
                bateriaEl &&
                valorEl
            ) {

                valorEl.textContent =
                    dados.bateria;

                bateriaEl.style.display =
                    "flex";


                const icone =
                    bateriaEl.querySelector(
                        "i"
                    );


                if (icone) {

                    icone.className =
                        dados.bateria > 60
                            ? "fa-solid fa-battery-full"
                            : dados.bateria > 30
                                ? "fa-solid fa-battery-half"
                                : "fa-solid fa-battery-quarter";

                }


                bateriaEl
                    .classList
                    .toggle(
                        "baixa",
                        dados.bateria <= 20
                    );

            }

        }


        ultimoStatusMapa = {

            tipo:
                dados.desatualizada
                    ? "desatualizado"
                    : "atualizado",

            dataFormatada:
                dados.dataFormatada,

            horario:
                dados.horario

        };


        renderizarStatusMapa();


    } catch (erro) {

        console.log(
            "Erro ao carregar localização:",
            erro
        );


        ultimoStatusMapa = {
            tipo: "erro"
        };


        renderizarStatusMapa();

    }

}


// =========================
// BADGE DE NOTIFICAÇÕES
// =========================

function atualizarBadgeNotificacoes(
    quantidade
) {

    const badge =
        document.getElementById(
            "quantidadeNotificacoes"
        );

    badge.textContent =
        quantidade;

    badge.classList.toggle(
        "escondido",
        quantidade === 0
    );

}


async function carregarContagemInicial() {

    try {

        const resposta =
            await fetch(
                "/api/notificacoes"
            );

        if (!resposta.ok) {
            return;
        }


        const dados =
            await resposta.json();


        const itens =
            dados.notificacoes || [];


        const naoLidas =
            itens.filter(
                item =>
                    !item.lida
            ).length;


        atualizarBadgeNotificacoes(
            naoLidas
        );


    } catch (erro) {

        console.log(
            "Erro ao carregar contagem de notificações:",
            erro
        );

    }

}


// =========================
// CENTRALIZAR MAPA
// =========================

const btnCentralizar =
    document.getElementById(
        "btnCentralizar"
    );


if (btnCentralizar) {

    btnCentralizar.addEventListener(
        "click",
        () => {

            if (
                mapaLeaflet &&
                temLocalizacaoReal &&
                marcador
            ) {

                mapaLeaflet.setView(
                    [
                        latAtual,
                        lngAtual
                    ],
                    15
                );


                marcador.openPopup();

            }

        }
    );

}


// =========================
// INICIALIZAÇÃO
// =========================

aplicarIdiomaEstatico();

carregarDadosUsuario();

carregarDiasRelatorio();

iniciarMapa();

carregarContagemInicial();

carregarStatusBixuco();


// ==========================
// LIGA BOTÃO/CARD DE RELATÓRIO
// ==========================

const btnRelatorioDiario =
    document.getElementById(
        "btnRelatorioDiario"
    );


if (btnRelatorioDiario) {

    btnRelatorioDiario
        .addEventListener(
            "click",
            () => {

                location.href =
                    "/RelatorioDiario";

            }
        );

}