document.getElementById("fotoUsuario").addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

// ==========================
// IDIOMA
// ==========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

// ==========================
// CARREGA DADOS DO USUÁRIO
// ==========================

async function carregarUsuario() {

    try {

        const resposta = await fetch("/api/home");

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
// CONTEÚDO DOS CARDS (PT/EN)
// ==========================

const conteudo = {

    sobre: {
        titulo: { pt: "Sobre nós", en: "About us" },
        icone: "fa-solid fa-circle-info",
        texto: {
            pt: `
                <p>
                    A Bixuco nasceu a partir da identificação de uma necessidade crescente:
                    oferecer mais suporte para crianças com Transtorno do Processamento Sensorial
                    (TPS) e para as famílias que acompanham seu desenvolvimento diariamente.
                </p>

                <p>
                    Como uma startup de tecnologia assistiva, buscamos unir inovação, inclusão
                    e impacto social para criar uma solução que facilite a compreensão das
                    necessidades sensoriais e comportamentais da criança.
                </p>

                <p>
                    Nossa proposta combina uma pelúcia inteligente, equipada com sensores,
                    a uma plataforma digital capaz de organizar informações, gerar relatórios
                    e apresentar indicadores que auxiliam responsáveis e profissionais durante
                    o acompanhamento.
                </p>

                <p>
                    Dessa forma, a Bixuco busca transformar tecnologia em apoio, aproximando
                    famílias e profissionais e contribuindo para um acompanhamento mais
                    personalizado, acessível e baseado nas informações observadas ao longo do tempo.
                </p>
            `,
            en: `
                <p>
                    Bixuco was born out of identifying a growing need: to offer more support
                    to children with Sensory Processing Disorder (SPD) and to the families
                    who follow their development day by day.
                </p>

                <p>
                    As an assistive technology startup, we aim to combine innovation, inclusion,
                    and social impact to create a solution that makes it easier to understand
                    a child's sensory and behavioral needs.
                </p>

                <p>
                    Our approach combines a smart plush toy, equipped with sensors, with a
                    digital platform capable of organizing information, generating reports,
                    and presenting indicators that support caregivers and professionals
                    throughout the process.
                </p>

                <p>
                    In this way, Bixuco seeks to turn technology into support, bringing families
                    and professionals closer together and contributing to a more personalized,
                    accessible form of tracking based on information observed over time.
                </p>
            `
        }
    },

    ajudamos: {
        titulo: { pt: "Como ajudamos", en: "How we help" },
        icone: "fa-regular fa-heart",
        texto: {
            pt: `
                <p>
                    A rotina de uma criança pode apresentar diferentes comportamentos,
                    emoções e situações que nem sempre são fáceis de identificar ou registrar.
                    Por isso, a Bixuco foi desenvolvida para transformar essas experiências
                    em informações mais organizadas e compreensíveis.
                </p>

                <p>
                    Por meio dos relatórios diários, os responsáveis podem registrar
                    acontecimentos, emoções, comportamentos e situações importantes
                    vivenciadas pela criança.
                </p>

                <p>
                    Ao mesmo tempo, a pelúcia inteligente utiliza sensores para identificar
                    padrões de interação física, como a intensidade e a velocidade dos apertos.
                    Essas informações podem ser processadas pelo sistema e utilizadas na geração
                    de alertas, gráficos, históricos e indicadores.
                </p>

                <p>
                    Com isso, a plataforma ajuda os responsáveis a perceber padrões ao longo
                    do tempo e, quando houver autorização, permite compartilhar informações
                    com terapeutas e profissionais vinculados, facilitando um acompanhamento
                    mais completo e baseado em dados.
                </p>
            `,
            en: `
                <p>
                    A child's routine can involve different behaviors, emotions, and situations
                    that aren't always easy to identify or record. That's why Bixuco was
                    designed to turn these experiences into more organized, understandable
                    information.
                </p>

                <p>
                    Through the daily reports, caregivers can log events, emotions, behaviors,
                    and important situations experienced by the child.
                </p>

                <p>
                    At the same time, the smart plush toy uses sensors to identify patterns
                    in physical interaction, such as the intensity and speed of the squeezes.
                    This information can be processed by the system and used to generate
                    alerts, charts, histories, and indicators.
                </p>

                <p>
                    With this, the platform helps caregivers notice patterns over time and,
                    when authorized, allows information to be shared with linked therapists
                    and professionals, supporting a more complete, data-driven follow-up.
                </p>
            `
        }
    },

    funciona: {
        titulo: { pt: "Como funciona", en: "How it works" },
        icone: "fa-solid fa-gear",
        texto: {
            pt: `
                <p>
                    A Bixuco funciona por meio da integração entre a pelúcia inteligente,
                    a plataforma digital e os usuários responsáveis pelo acompanhamento
                    da criança. Cada parte possui uma função específica dentro desse processo.
                </p>

                <ol>
                    <li>
                        O responsável cria sua conta e cadastra o perfil da criança.
                    </li>

                    <li>
                        As informações iniciais são utilizadas para criar um perfil
                        sensorial personalizado.
                    </li>

                    <li>
                        A pelúcia Bixuco é conectada ao sistema por meio de tecnologias
                        como Bluetooth e Wi-Fi.
                    </li>

                    <li>
                        Durante o uso, os sensores da pelúcia registram informações
                        relacionadas às interações físicas da criança.
                    </li>

                    <li>
                        O responsável também pode preencher relatórios diários com
                        informações sobre o comportamento, humor, rotina e acontecimentos
                        importantes.
                    </li>

                    <li>
                        O sistema organiza essas informações e apresenta relatórios,
                        gráficos, históricos e possíveis alertas.
                    </li>

                    <li>
                        Quando autorizado pelo responsável, os dados podem ser
                        compartilhados com o terapeuta vinculado à criança.
                    </li>
                </ol>

                <p>
                    Dessa maneira, diferentes fontes de informação são reunidas em um
                    único ambiente, permitindo acompanhar a evolução da criança ao longo
                    do tempo.
                </p>
            `,
            en: `
                <p>
                    Bixuco works through the integration of the smart plush toy, the digital
                    platform, and the users responsible for the child's care. Each part plays
                    a specific role in this process.
                </p>

                <ol>
                    <li>
                        The caregiver creates an account and registers the child's profile.
                    </li>

                    <li>
                        The initial information is used to create a personalized sensory
                        profile.
                    </li>

                    <li>
                        The Bixuco plush toy is connected to the system through technologies
                        such as Bluetooth and Wi-Fi.
                    </li>

                    <li>
                        During use, the plush toy's sensors record information related to
                        the child's physical interactions.
                    </li>

                    <li>
                        The caregiver can also fill in daily reports with information about
                        behavior, mood, routine, and important events.
                    </li>

                    <li>
                        The system organizes this information and presents reports, charts,
                        histories, and possible alerts.
                    </li>

                    <li>
                        When authorized by the caregiver, the data can be shared with the
                        therapist linked to the child.
                    </li>
                </ol>

                <p>
                    This way, different sources of information are brought together in one
                    place, making it possible to track the child's progress over time.
                </p>
            `
        }
    },

    publico: {
        titulo: { pt: "Para quem é", en: "Who it's for" },
        icone: "fa-solid fa-users",
        texto: {
            pt: `
                <p>
                    A Bixuco foi desenvolvida pensando principalmente nas pessoas que
                    participam do acompanhamento e desenvolvimento da criança, criando
                    uma conexão entre família, tecnologia e profissionais especializados.
                </p>

                <ul>
                    <li>
                        <strong>Responsáveis</strong> — pais, mães ou tutores que acompanham
                        a rotina da criança e registram informações importantes sobre seu dia a dia.
                    </li>

                    <li>
                        <strong>Terapeutas</strong> — profissionais que acompanham a criança
                        e podem utilizar os relatórios compartilhados como apoio ao seu trabalho.
                    </li>

                    <li>
                        <strong>Profissionais da saúde infantil</strong> — que podem se beneficiar
                        de informações organizadas para compreender melhor os padrões observados
                        durante o acompanhamento.
                    </li>

                    <li>
                        <strong>Crianças</strong> — que participam da solução principalmente
                        por meio da interação com a pelúcia inteligente.
                    </li>
                </ul>

                <p>
                    Assim, a Bixuco não é pensada apenas como uma ferramenta tecnológica,
                    mas como um ambiente de integração entre as pessoas envolvidas no
                    desenvolvimento e acompanhamento infantil.
                </p>
            `,
            en: `
                <p>
                    Bixuco was designed mainly for the people involved in following and
                    supporting the child's development, creating a connection between
                    family, technology, and specialized professionals.
                </p>

                <ul>
                    <li>
                        <strong>Caregivers</strong> — parents or guardians who follow the
                        child's routine and record important information about their
                        day-to-day life.
                    </li>

                    <li>
                        <strong>Therapists</strong> — professionals who follow the child and
                        can use the shared reports to support their work.
                    </li>

                    <li>
                        <strong>Child health professionals</strong> — who can benefit from
                        organized information to better understand the patterns observed
                        during follow-up.
                    </li>

                    <li>
                        <strong>Children</strong> — who take part in the solution mainly
                        through interacting with the smart plush toy.
                    </li>
                </ul>

                <p>
                    In this sense, Bixuco is not meant to be just a technological tool, but
                    an environment for integration among the people involved in a child's
                    development and care.
                </p>
            `
        }
    },

    naofazemos: {
        titulo: { pt: "O que não fazemos", en: "What we don't do" },
        icone: "fa-solid fa-ban",
        texto: {
            pt: `
                <p>
                    A Bixuco foi criada para ser uma ferramenta de apoio ao acompanhamento
                    infantil e, por isso, é importante deixar claro quais são seus limites.
                </p>

                <p>
                    A plataforma organiza informações, apresenta padrões, gera indicadores
                    e pode utilizar inteligência artificial para auxiliar na análise dos
                    dados registrados. Entretanto, essas informações não devem ser
                    interpretadas como um diagnóstico.
                </p>

                <ul>
                    <li>
                        Não realizamos diagnósticos médicos ou psicológicos.
                    </li>

                    <li>
                        Não substituímos psicólogos, terapeutas, médicos ou outros
                        profissionais especializados.
                    </li>

                    <li>
                        Não oferecemos tratamento clínico por meio da plataforma.
                    </li>

                    <li>
                        Os alertas e análises produzidos pelo sistema possuem caráter
                        informativo e de apoio, não sendo conclusões clínicas.
                    </li>
                </ul>

                <p>
                    Nosso objetivo é facilitar a observação e a organização das informações
                    do cotidiano, permitindo que responsáveis e profissionais tenham mais
                    elementos para acompanhar o desenvolvimento da criança.
                </p>
            `,
            en: `
                <p>
                    Bixuco was created to be a support tool for tracking child development,
                    so it's important to be clear about its limits.
                </p>

                <p>
                    The platform organizes information, presents patterns, generates
                    indicators, and may use artificial intelligence to help analyze the
                    recorded data. However, this information should not be interpreted as
                    a diagnosis.
                </p>

                <ul>
                    <li>
                        We do not provide medical or psychological diagnoses.
                    </li>

                    <li>
                        We do not replace psychologists, therapists, doctors, or other
                        specialized professionals.
                    </li>

                    <li>
                        We do not offer clinical treatment through the platform.
                    </li>

                    <li>
                        The alerts and analyses produced by the system are informative and
                        supportive in nature, not clinical conclusions.
                    </li>
                </ul>

                <p>
                    Our goal is to make it easier to observe and organize everyday
                    information, giving caregivers and professionals more elements to
                    follow the child's development.
                </p>
            `
        }
    },

    privacidade: {
        titulo: { pt: "Privacidade", en: "Privacy" },
        icone: "fa-solid fa-shield-halved",
        texto: {
            pt: `
                <p>
                    Na Bixuco, a proteção das informações é uma parte fundamental da
                    solução, especialmente porque a plataforma trabalha com dados
                    relacionados a crianças, responsáveis e profissionais.
                </p>

                <p>
                    Por isso, o sistema foi planejado considerando princípios de segurança,
                    privacidade e controle de acesso, buscando garantir que as informações
                    sejam acessadas somente por pessoas autorizadas.
                </p>

                <ul>
                    <li>
                        <strong>Proteção dos dados</strong> — informações sensíveis devem
                        ser protegidas por mecanismos de criptografia.
                    </li>

                    <li>
                        <strong>Controle de acesso</strong> — responsáveis acessam os dados
                        de suas crianças, enquanto profissionais acessam somente informações
                        de pacientes vinculados e autorizados.
                    </li>

                    <li>
                        <strong>Consentimento</strong> — o responsável deve autorizar a
                        coleta e o compartilhamento das informações da criança.
                    </li>

                    <li>
                        <strong>Privacidade</strong> — o sistema segue os princípios
                        estabelecidos pela Lei Geral de Proteção de Dados (LGPD).
                    </li>

                    <li>
                        <strong>Exclusão de dados</strong> — o projeto prevê mecanismos
                        para que o usuário possa solicitar a exclusão de suas informações.
                    </li>
                </ul>

                <p>
                    Dessa forma, a Bixuco busca oferecer não apenas uma solução inovadora,
                    mas também um ambiente confiável e responsável para o tratamento das
                    informações utilizadas durante o acompanhamento.
                </p>
            `,
            en: `
                <p>
                    At Bixuco, protecting information is a core part of the solution,
                    especially since the platform handles data related to children,
                    caregivers, and professionals.
                </p>

                <p>
                    That's why the system was designed with principles of security, privacy,
                    and access control in mind, aiming to ensure that information is only
                    accessed by authorized people.
                </p>

                <ul>
                    <li>
                        <strong>Data protection</strong> — sensitive information is protected
                        through encryption mechanisms.
                    </li>

                    <li>
                        <strong>Access control</strong> — caregivers access their own
                        children's data, while professionals only access information for
                        linked and authorized patients.
                    </li>

                    <li>
                        <strong>Consent</strong> — the caregiver must authorize the
                        collection and sharing of the child's information.
                    </li>

                    <li>
                        <strong>Privacy</strong> — the system follows the principles set out
                        in Brazil's General Data Protection Law (LGPD).
                    </li>

                    <li>
                        <strong>Data deletion</strong> — the project includes mechanisms for
                        users to request the deletion of their information.
                    </li>
                </ul>

                <p>
                    In this way, Bixuco aims to offer not just an innovative solution, but
                    also a trustworthy, responsible environment for handling the information
                    used during follow-up.
                </p>
            `
        }
    },

    proposito: {
        titulo: { pt: "Nosso propósito", en: "Our purpose" },
        icone: "fa-solid fa-trophy",
        texto: {
            pt: `
                <h3>Missão</h3>

                <p>
                    Utilizar tecnologia, inovação e empatia para facilitar o acompanhamento
                    do desenvolvimento infantil, aproximando famílias e profissionais e
                    oferecendo informações que possam contribuir para uma compreensão mais
                    ampla das necessidades da criança.
                </p>

                <h3>Visão</h3>

                <p>
                    Tornar-se uma referência nacional no desenvolvimento de soluções
                    tecnológicas voltadas ao acompanhamento de crianças com necessidades
                    sensoriais, contribuindo para um futuro mais inclusivo, acessível
                    e conectado.
                </p>

                <h3>Valores</h3>

                <ul>
                    <li>Empatia com as crianças e suas famílias;</li>
                    <li>Inovação na criação de soluções tecnológicas;</li>
                    <li>Segurança e responsabilidade no tratamento de dados;</li>
                    <li>Transparência nas informações apresentadas;</li>
                    <li>Respeito às necessidades individuais;</li>
                    <li>Inclusão e acessibilidade.</li>
                </ul>

                <p>
                    Mais do que desenvolver uma tecnologia, nosso propósito é contribuir
                    para que famílias tenham mais apoio e profissionais tenham informações
                    mais organizadas para acompanhar o desenvolvimento infantil.
                </p>
            `,
            en: `
                <h3>Mission</h3>

                <p>
                    To use technology, innovation, and empathy to support the tracking of
                    child development, bringing families and professionals closer together
                    and offering information that can contribute to a broader understanding
                    of the child's needs.
                </p>

                <h3>Vision</h3>

                <p>
                    To become a national reference in developing technology solutions for
                    tracking children with sensory needs, contributing to a more inclusive,
                    accessible, and connected future.
                </p>

                <h3>Values</h3>

                <ul>
                    <li>Empathy for children and their families;</li>
                    <li>Innovation in creating technological solutions;</li>
                    <li>Security and responsibility in handling data;</li>
                    <li>Transparency in the information presented;</li>
                    <li>Respect for individual needs;</li>
                    <li>Inclusion and accessibility.</li>
                </ul>

                <p>
                    More than developing a technology, our purpose is to help families get
                    more support and give professionals more organized information to
                    follow a child's development.
                </p>
            `
        }
    },

    contato: {
        titulo: { pt: "Contato e suporte", en: "Contact and support" },
        icone: "fa-solid fa-headset",
        texto: {
            pt: `
                <p>
                    A Bixuco busca manter uma relação próxima com seus usuários,
                    oferecendo suporte para dúvidas, dificuldades e situações
                    relacionadas ao uso da plataforma.
                </p>

                <p>
                    Caso tenha alguma dúvida sobre o funcionamento do sistema,
                    cadastro, relatórios, conexão com a pelúcia ou utilização das
                    funcionalidades, entre em contato com nossa equipe de suporte.
                </p>

                <p>
                    <strong>📧 E-mail:</strong> bixucooficial@gmail.com
                </p>

                <p>
                    <strong>📱 Telefone:</strong> +55 11 999030212
                </p>

                <p>
                    <strong>🕐 Horário de atendimento:</strong>
                    segunda a sexta, das 08h às 18h.
                </p>

                <p>
                    Também é possível buscar suporte diretamente pelo aplicativo,
                    utilizando as opções disponíveis nas configurações da conta.
                </p>

                <p>
                    Nossa equipe está preparada para auxiliar os usuários e contribuir
                    para que a experiência com a Bixuco seja simples, segura e acessível.
                </p>
            `,
            en: `
                <p>
                    Bixuco aims to stay close to its users, offering support for questions,
                    difficulties, and situations related to using the platform.
                </p>

                <p>
                    If you have any questions about how the system works, registration,
                    reports, connecting with the plush toy, or using its features, get in
                    touch with our support team.
                </p>

                <p>
                    <strong>📧 Email:</strong> bixucooficial@gmail.com
                </p>

                <p>
                    <strong>📱 Phone:</strong> +55 11 999030212
                </p>

                <p>
                    <strong>🕐 Support hours:</strong>
                    Monday to Friday, 8am to 6pm.
                </p>

                <p>
                    You can also reach support directly through the app, using the options
                    available in your account settings.
                </p>

                <p>
                    Our team is ready to help users and make sure the Bixuco experience is
                    simple, secure, and accessible.
                </p>
            `
        }
    }

};

// Frase final (contém tags <strong>, por isso fica fora dos data-pt/data-en)
const fraseFinal = {
    pt: `
        Mais do que tecnologia, entregamos
        <strong>conexão</strong>,
        <strong>empatia</strong> e
        <strong>inteligência</strong>
        para apoiar o desenvolvimento infantil.
    `,
    en: `
        More than technology, we deliver
        <strong>connection</strong>,
        <strong>empathy</strong>, and
        <strong>intelligence</strong>
        to support child development.
    `
};


// ==========================
// APLICAR IDIOMA
// ==========================

function aplicarIdiomaEstatico() {

    document.querySelectorAll("[data-pt]").forEach(el => {
        el.textContent = idiomaAtual === "en"
            ? (el.dataset.en || el.dataset.pt)
            : el.dataset.pt;
    });

    document.getElementById("textoTradutor").textContent =
        idiomaAtual === "en" ? "Traduzir para o português" : "Traduzir para o inglês";

    const fraseFinalEl = document.getElementById("fraseFinalTexto");
    if (fraseFinalEl) {
        fraseFinalEl.innerHTML = idiomaAtual === "en" ? fraseFinal.en : fraseFinal.pt;
    }

}

document.getElementById("btnTraduzir").addEventListener("click", () => {

    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);

    aplicarIdiomaEstatico();

    // Se o modal estiver aberto, atualiza o conteúdo dele também
    if (modal.classList.contains("mostrar") && topicoAtual) {
        abrirModal(topicoAtual, false);
    }

    if (painelNotificacoes.classList.contains("aberto")) {
        carregarNotificacoes();
    }

});


// ==========================
// MODAL
// ==========================

const modal    = document.getElementById("modal");
const titulo   = document.getElementById("tituloModal");
const texto    = document.getElementById("textoModal");
const iconModal = document.getElementById("iconModal");
const fechar   = document.getElementById("fecharModal");

let topicoAtual = null;

// Abre o modal com o conteúdo do card clicado
// resetarFoco = false quando é só uma re-renderização por troca de idioma
function abrirModal(id, resetarFoco = true) {

    const item = conteudo[id];

    if (!item) return;

    topicoAtual = id;

    // Preenche o ícone, título e texto do modal
    iconModal.innerHTML = `<i class="${item.icone}"></i>`;
    titulo.textContent  = idiomaAtual === "en" ? item.titulo.en : item.titulo.pt;
    texto.innerHTML     = idiomaAtual === "en" ? item.texto.en : item.texto.pt;

    if (resetarFoco) {
        // Mostra o modal e trava o scroll da página
        modal.classList.add("mostrar");
        document.body.style.overflow = "hidden";

        // Coloca o foco no botão de fechar para acessibilidade
        fechar.focus();
    }

}

// Fecha o modal e devolve o scroll
function fecharModal() {

    modal.classList.remove("mostrar");
    document.body.style.overflow = "";
    topicoAtual = null;

}

// Cada card abre o modal com seu tópico
document.querySelectorAll(".card").forEach(card => {

    card.addEventListener("click", () => {
        abrirModal(card.dataset.topico);
    });

});

// Botão X fecha o modal
fechar.addEventListener("click", fecharModal);

// Clique fora do modal NÃO fecha — só o botão X (pedido do usuário)


// ==========================
// NOTIFICAÇÕES
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
        if (!resposta.ok) throw new Error();

        const dados = await resposta.json();
        const itens = dados.notificacoes || [];

        listaNotificacoes.innerHTML = itens.length === 0
            ? `<div class="painel-vazio">${idiomaAtual === "en" ? "No notifications for now." : "Nenhuma notificação por enquanto."}</div>`
            : itens.map(formatarItemNotificacao).join("");

        const naoLidas = itens.filter(item => !item.lida).length;
        document.getElementById("quantidadeNotificacoes").textContent = naoLidas;

    } catch (erro) {
        console.log("Erro ao carregar notificações:", erro);
        listaNotificacoes.innerHTML = `<div class="painel-vazio">${idiomaAtual === "en" ? "Could not load notifications." : "Não foi possível carregar as notificações."}</div>`;
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

// Tecla Escape não fecha o modal — só o botão X (pedido do usuário)


// ==========================
// INICIALIZAÇÃO
// ==========================

aplicarIdiomaEstatico();
carregarNotificacoes();

document.getElementById("btnRelatorioDiario").addEventListener("click", () => {
    location.href = "/RelatorioDiario";
});