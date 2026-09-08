document.getElementById("fotoUsuario").addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

// ==========================
// CARREGA DADOS DO USUÁRIO
// ==========================

async function carregarUsuario() {

    try {

        // 🔧 FIX 5: Rota corrigida de /dados-usuario para /api/home
        const resposta = await fetch("/api/home");

        // 🔧 FIX 6: Redireciona para login se não autenticado
        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) {
            throw new Error();
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

carregarUsuario();


// ==========================
// CONTEÚDO DOS CARDS
// ==========================

const conteudo = {

    sobre: {
        titulo: "Sobre nós",
        icone: "fa-solid fa-circle-info",
        texto: `
            <p>
                A Bixuco nasceu de uma pergunta simples: como ajudar pais
                a entender o que seus filhos estão sentindo, mesmo quando
                as palavras não chegam?
            </p>
            <p>
                Somos uma startup de tecnologia focada no bem-estar infantil,
                criada para apoiar famílias que convivem com a hipersensibilidade
                sensorial — também conhecida como Transtorno do Processamento
                Sensorial (TPS).
            </p>
            <p>
                Nossa solução une um objeto afetivo, a pelúcia Bixuco, a um
                aplicativo inteligente que transforma interações físicas em dados
                compreensíveis para pais e terapeutas.
            </p>
            <p>
                Não somos um diagnóstico. Somos um ponto de apoio no dia a dia.
            </p>
        `
    },

    ajudamos: {
        titulo: "Como ajudamos",
        icone: "fa-regular fa-heart",
        texto: `
            <p>
                O Bixuco registra informações importantes da rotina da criança
                através dos relatórios diários preenchidos pelo responsável.
            </p>
            <p>
                Esses dados são transformados em gráficos e indicadores que
                auxiliam os responsáveis a perceber padrões de comportamento
                ao longo do tempo.
            </p>
            <p>
                A pelúcia inteligente detecta sinais de estresse através de
                interações físicas e envia alertas em tempo real para o aplicativo.
            </p>
            <p>
                Quando autorizado, as informações também podem ser compartilhadas
                com terapeutas para facilitar o acompanhamento profissional.
            </p>
        `
    },

    funciona: {
        titulo: "Como funciona",
        icone: "fa-solid fa-gear",
        texto: `
            <ol>
                <li>Cadastre sua conta como responsável ou terapeuta.</li>
                <li>Cadastre a criança e responda ao questionário de perfil sensorial.</li>
                <li>Conecte a pelúcia Bixuco via Wi-Fi.</li>
                <li>Registre os acontecimentos do dia no relatório diário.</li>
                <li>Visualize relatórios e gráficos automaticamente.</li>
                <li>Compartilhe os dados com seu terapeuta quando quiser.</li>
            </ol>
        `
    },

    publico: {
        titulo: "Para quem é",
        icone: "fa-solid fa-users",
        texto: `
            <p>O Bixuco foi desenvolvido para:</p>
            <ul>
                <li><strong>Responsáveis</strong> — pais e mães que acompanham o dia a dia da criança.</li>
                <li><strong>Terapeutas</strong> — psicólogos e terapeutas ocupacionais que acompanham o desenvolvimento.</li>
                <li><strong>Profissionais da saúde infantil</strong> — que buscam dados organizados para embasar seu trabalho.</li>
            </ul>
            <p>
                Qualquer pessoa que conviva com uma criança com TPS ou
                hipersensibilidade sensorial pode se beneficiar do Bixuco.
            </p>
        `
    },

    naofazemos: {
        titulo: "O que não fazemos",
        icone: "fa-solid fa-ban",
        texto: `
            <p>
                É muito importante que fique claro o que o Bixuco <strong>não faz</strong>:
            </p>
            <ul>
                <li>Não realizamos diagnósticos médicos ou psicológicos.</li>
                <li>Não substituímos psicólogos, médicos ou terapeutas.</li>
                <li>Não oferecemos orientação clínica ou tratamento.</li>
            </ul>
            <p>
                Nossa função é organizar informações do dia a dia e facilitar
                o acompanhamento profissional — sempre como uma ferramenta
                de apoio, nunca como substituto.
            </p>
        `
    },

    privacidade: {
        titulo: "Privacidade",
        icone: "fa-solid fa-shield-halved",
        texto: `
            <p>
                Levamos a privacidade das famílias muito a sério,
                especialmente por lidarmos com dados de crianças.
            </p>
            <ul>
                <li>Dados protegidos com criptografia.</li>
                <li>Compartilhamento apenas com autorização expressa do responsável.</li>
                <li>Informações armazenadas com segurança em servidores protegidos.</li>
                <li>Seguimos as diretrizes da LGPD (Lei Geral de Proteção de Dados).</li>
                <li>Você pode excluir seus dados a qualquer momento.</li>
            </ul>
        `
    },

    proposito: {
        titulo: "Nosso propósito",
        icone: "fa-solid fa-trophy",
        texto: `
            <h3>Missão</h3>
            <p>
                Facilitar o acompanhamento do desenvolvimento infantil utilizando
                tecnologia e empatia, promovendo conexão entre famílias e profissionais.
            </p>

            <h3>Visão</h3>
            <p>
                Ser referência nacional em soluções tecnológicas para acompanhamento
                de crianças com hipersensibilidade sensorial.
            </p>

            <h3>Valores</h3>
            <ul>
                <li>Empatia</li>
                <li>Inovação</li>
                <li>Segurança</li>
                <li>Transparência</li>
                <li>Respeito às famílias</li>
            </ul>
        `
    },

    contato: {
        titulo: "Contato e suporte",
        icone: "fa-solid fa-headset",
        texto: `
            <p>Precisa de ajuda? Nossa equipe está aqui para você.</p>
            <p>📧 <strong>suporte@bixuco.com</strong></p>
            <p>📱 <strong>(11) 99999-9999</strong></p>
            <p>Segunda a sexta, das 08h às 18h.</p>
            <p>
                Também é possível abrir um chamado diretamente pelo
                aplicativo nas configurações da sua conta.
            </p>
        `
    }

};


// ==========================
// MODAL
// ==========================

const modal    = document.getElementById("modal");
const titulo   = document.getElementById("tituloModal");
const texto    = document.getElementById("textoModal");
const iconModal = document.getElementById("iconModal");
const fechar   = document.getElementById("fecharModal");

// Abre o modal com o conteúdo do card clicado
function abrirModal(id) {

    const item = conteudo[id];

    if (!item) return;

    // Preenche o ícone, título e texto do modal
    iconModal.innerHTML = `<i class="${item.icone}"></i>`;
    titulo.textContent  = item.titulo;
    texto.innerHTML     = item.texto;

    // Mostra o modal e trava o scroll da página
    modal.classList.add("mostrar");
    document.body.style.overflow = "hidden";

    // Coloca o foco no botão de fechar para acessibilidade
    fechar.focus();

}

// Fecha o modal e devolve o scroll
function fecharModal() {

    modal.classList.remove("mostrar");
    document.body.style.overflow = "";

}

// Cada card abre o modal com seu tópico
document.querySelectorAll(".card").forEach(card => {

    card.addEventListener("click", () => {
        abrirModal(card.dataset.topico);
    });

});

// Botão X fecha o modal
fechar.addEventListener("click", fecharModal);

function lerCookie(nome) {
    const valor = `; ${document.cookie}`;
    const partes = valor.split(`; ${nome}=`);
    if (partes.length === 2) return partes.pop().split(";").shift();
    return null;
}

function definirCookieTraducao(destino) {
    document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    document.cookie = `googtrans=; path=/; domain=${location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC`;

    if (destino) {
        const valor = `/pt/${destino}`;
        document.cookie = `googtrans=${valor}; path=/`;
        document.cookie = `googtrans=${valor}; path=/; domain=${location.hostname}`;
    }
}

function iniciarTradutor() {
    new google.translate.TranslateElement(
        { pageLanguage: "pt", includedLanguages: "en", autoDisplay: false },
        "google_translate_element"
    );
}

function atualizarTextoBotaoTraducao() {
    const cookieAtual = lerCookie("googtrans");
    const textoBotao = document.getElementById("textoTradutor");
    textoBotao.textContent = (cookieAtual && cookieAtual.includes("/en"))
        ? "Voltar para português"
        : "Traduzir para inglês";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    const cookieAtual = lerCookie("googtrans");
    const estaTraduzido = cookieAtual && cookieAtual.includes("/en");
    definirCookieTraducao(estaTraduzido ? null : "en");
    window.location.reload();
});

// Clique fora do modal NÃO fecha mais — só o botão X (pedido do usuário)

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
        if (!resposta.ok) throw new Error();

        const dados = await resposta.json();
        const itens = dados.notificacoes || [];

        listaNotificacoes.innerHTML = itens.length === 0
            ? `<div class="painel-vazio">Nenhuma notificação por enquanto.</div>`
            : itens.map(formatarItemNotificacao).join("");

        // se a página não tiver outra fonte pra esse número (ver 3.3),
        // calcula aqui mesmo a partir da lista
        const naoLidas = itens.filter(item => !item.lida).length;
        document.getElementById("quantidadeNotificacoes").textContent = naoLidas;

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

// Tecla Escape não fecha mais o modal — só o botão X (pedido do usuário)

atualizarTextoBotaoTraducao();
carregarNotificacoes();

document.getElementById("btnRelatorioDiario").addEventListener("click", () => {
    location.href = "/RelatorioDiario";
});