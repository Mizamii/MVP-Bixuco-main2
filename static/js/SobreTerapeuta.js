let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    semNotificacoes:  { pt: "Nenhuma notificação por enquanto.", en: "No notifications yet." },
    erroNotificacoes: { pt: "Não foi possível carregar as notificações.", en: "Couldn't load notifications." }
};

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
                    A Bixuco nasceu da necessidade de oferecer mais suporte a crianças com
                    Transtorno do Processamento Sensorial (TPS) e às famílias e profissionais
                    que acompanham o desenvolvimento delas.
                </p>

                <p>
                    Somos uma solução de tecnologia assistiva que combina uma pelúcia com
                    sensores a uma plataforma digital. Para você, terapeuta, a plataforma
                    organiza as informações registradas pela família em relatórios e
                    indicadores, para apoiar o seu acompanhamento clínico.
                </p>

                <p>
                    Nosso objetivo é aproximar famílias e profissionais, com informações
                    mais organizadas e baseadas no que foi observado ao longo do tempo.
                </p>
            `,
            en: `
                <p>
                    Bixuco was born from the need to offer more support to children with
                    Sensory Processing Disorder (SPD) and to the families and professionals
                    who follow their development.
                </p>

                <p>
                    We are an assistive technology solution that combines a sensor-equipped
                    plush toy with a digital platform. For you, as a therapist, the platform
                    organizes the information recorded by the family into reports and
                    indicators to support your clinical follow-up.
                </p>

                <p>
                    Our goal is to bring families and professionals closer, with better
                    organized information based on what was observed over time.
                </p>
            `
        }
    },

    ajudamos: {
        titulo: { pt: "Como ajudamos", en: "How we help" },
        icone: "fa-regular fa-heart",
        texto: {
            pt: `
                <p>O Bixuco ajuda você a acompanhar seus pacientes entre uma sessão e outra:</p>

                <ul>
                    <li><strong>Informações organizadas</strong> — relatórios diários e episódios do paciente reunidos em um só lugar;</li>
                    <li><strong>Visão ao longo do tempo</strong> — gráficos de episódios, duração e gatilhos em diferentes períodos;</li>
                    <li><strong>Lista de pacientes</strong> — você vê rapidamente quem está com mais atividade e quem pede mais atenção;</li>
                    <li><strong>Mais contexto para as sessões</strong> — dados observados na rotina real da criança.</li>
                </ul>

                <p>
                    Essas informações complementam a sua avaliação clínica. A interpretação
                    e as decisões continuam sendo suas.
                </p>
            `,
            en: `
                <p>Bixuco helps you follow your patients between sessions:</p>

                <ul>
                    <li><strong>Organized information</strong> — daily reports and episodes gathered in one place;</li>
                    <li><strong>View over time</strong> — charts of episodes, duration, and triggers across different periods;</li>
                    <li><strong>Patient list</strong> — quickly see who has more activity and who needs more attention;</li>
                    <li><strong>More context for sessions</strong> — data observed in the child's real routine.</li>
                </ul>

                <p>
                    This information complements your clinical assessment. Interpretation
                    and decisions remain yours.
                </p>
            `
        }
    },

    funciona: {
        titulo: { pt: "Como funciona", en: "How it works" },
        icone: "fa-solid fa-gear",
        texto: {
            pt: `
                <p>O Bixuco reúne três partes que trabalham juntas:</p>

                <ul>
                    <li><strong>Pelúcia</strong> — a criança interage com a pelúcia, que registra os apertos e a localização;</li>
                    <li><strong>Aplicativo</strong> — o responsável acompanha a criança e preenche o relatório diário;</li>
                    <li><strong>Relatórios</strong> — as informações são organizadas e apresentadas em indicadores e gráficos.</li>
                </ul>

                <p>
                    <strong>Para começar:</strong> compartilhe o seu código de terapeuta com o
                    responsável. Quando ele fizer o vínculo, o paciente passa a aparecer na
                    sua lista de pacientes.
                </p>

                <p>
                    Apertos próximos no tempo são agrupados em um mesmo episódio, e os
                    relatórios do paciente ficam disponíveis para você na área de Relatórios.
                </p>
            `,
            en: `
                <p>Bixuco brings together three parts that work together:</p>

                <ul>
                    <li><strong>Plush toy</strong> — the child interacts with the plush, which records squeezes and location;</li>
                    <li><strong>App</strong> — the guardian follows the child and fills in the daily report;</li>
                    <li><strong>Reports</strong> — the information is organized and shown in indicators and charts.</li>
                </ul>

                <p>
                    <strong>To get started:</strong> share your therapist code with the guardian.
                    Once they link the account, the patient appears in your patient list.
                </p>

                <p>
                    Squeezes close in time are grouped into a single episode, and the
                    patient's reports are available to you in the Reports area.
                </p>
            `
        }
    },

    publico: {
        titulo: { pt: "Para quem é", en: "Who it's for" },
        icone: "fa-solid fa-users",
        texto: {
            pt: `
                <p>O Bixuco foi pensado para:</p>

                <ul>
                    <li><strong>Terapeutas</strong> — psicólogos com CRP que acompanham crianças com necessidades sensoriais e querem informações organizadas da rotina delas;</li>
                    <li><strong>Pais e responsáveis</strong> — que acompanham a criança de perto e podem compartilhar os dados com o profissional.</li>
                </ul>

                <p>
                    Por isso o cadastro de terapeuta exige a validação do CRP.
                </p>
            `,
            en: `
                <p>Bixuco was designed for:</p>

                <ul>
                    <li><strong>Therapists</strong> — psychologists with a CRP who follow children with sensory needs and want organized information about their routine;</li>
                    <li><strong>Parents and guardians</strong> — who follow the child closely and can share data with the professional.</li>
                </ul>

                <p>
                    That is why therapist registration requires CRP validation.
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
                    O Bixuco <strong>não</strong> faz diagnóstico, não substitui avaliação
                    ou tratamento profissional e não indica condutas clínicas.
                </p>

                <p>
                    Os dados apresentados são informações observadas e registradas na
                    rotina da criança. Eles servem de apoio, e a análise clínica é sempre
                    do profissional.
                </p>

                <p>
                    Também não compartilhamos informações do paciente com terapeutas que
                    não estejam vinculados a ele.
                </p>
            `,
            en: `
                <p>
                    Bixuco <strong>does not</strong> provide diagnoses, does not replace
                    professional evaluation or treatment, and does not recommend clinical
                    approaches.
                </p>

                <p>
                    The data shown is information observed and recorded in the child's
                    routine. It is meant as support, and the clinical analysis always
                    belongs to the professional.
                </p>

                <p>
                    We also do not share patient information with therapists who are not
                    linked to that patient.
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
                    A plataforma lida com dados de crianças, responsáveis e profissionais,
                    por isso a proteção das informações é parte central da solução.
                </p>

                <ul>
                    <li><strong>Acesso restrito</strong> — você acessa somente os pacientes vinculados a você;</li>
                    <li><strong>Consentimento</strong> — o vínculo é feito pelo responsável, que autoriza o compartilhamento das informações da criança;</li>
                    <li><strong>Sigilo profissional</strong> — use os dados apenas para o acompanhamento do paciente, conforme o seu código de ética;</li>
                    <li><strong>Sessão protegida</strong> — saia da conta sempre que usar um dispositivo compartilhado.</li>
                </ul>

                <p>
                    Mais detalhes estão nos Termos de Uso e na Política de Privacidade.
                </p>
            `,
            en: `
                <p>
                    The platform handles data about children, guardians, and professionals,
                    so protecting information is a core part of the solution.
                </p>

                <ul>
                    <li><strong>Restricted access</strong> — you only access patients linked to you;</li>
                    <li><strong>Consent</strong> — the link is made by the guardian, who authorizes sharing the child's information;</li>
                    <li><strong>Professional confidentiality</strong> — use the data only for the patient's follow-up, in line with your code of ethics;</li>
                    <li><strong>Protected session</strong> — log out whenever you use a shared device.</li>
                </ul>

                <p>
                    More details are in the Terms of Use and the Privacy Policy.
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

// ==========================
// MODAL DOS CARDS
// ==========================

const modal     = document.getElementById("modal");
const tituloModal = document.getElementById("tituloModal");
const textoModal  = document.getElementById("textoModal");
const iconModal = document.getElementById("iconModal");
const fecharBtn = document.getElementById("fecharModal");

let topicoAtual = null;

// resetarFoco = false quando é só uma re-renderização por troca de idioma
function abrirModal(id, resetarFoco = true) {

    const item = conteudo[id];
    if (!item || !modal) return;

    topicoAtual = id;

    iconModal.innerHTML     = `<i class="${item.icone}"></i>`;
    tituloModal.textContent = idiomaAtual === "en" ? item.titulo.en : item.titulo.pt;
    textoModal.innerHTML    = idiomaAtual === "en" ? item.texto.en : item.texto.pt;

    if (resetarFoco) {
        modal.classList.add("mostrar");
        document.body.style.overflow = "hidden";
        fecharBtn?.focus();
    }

}

function fecharModal() {

    modal?.classList.remove("mostrar");
    document.body.style.overflow = "";
    topicoAtual = null;

}

document.querySelectorAll(".cards .card").forEach(card => {
    card.addEventListener("click", () => abrirModal(card.dataset.topico));
});

fecharBtn?.addEventListener("click", fecharModal);

document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal?.classList.contains("mostrar")) fecharModal();
});


function t(chave) {
    const item = dicionario[chave];
    return idiomaAtual === "en" ? item.en : item.pt;
}

function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

function traduzirMensagemNotificacao(item) {
    const mensagem = String(item?.mensagem || "");
    if (idiomaAtual !== "en") return mensagem;

    switch (item?.tipo) {
        case "pedido_vinculo":
            return "You received a link request from a new guardian.";
        case "relatorio_concluido":
            return "You just completed a report. Great job! 🎉";
        case "lembrete_relatorio":
            return "Don't forget to complete today's report! 📋";
        case "vinculo_removido_plano":
            return "Your therapist link was removed because your current plan does not include this feature.";
        case "relatorio_finalizado": {
            const match = mensagem.match(/^(.+?) acabou de finalizar um relatório\. Clique para ver\.$/i);
            return match
                ? `${match[1]} just completed a report. Click to view.`
                : "A patient just completed a report. Click to view.";
        }
        default:
            return mensagem;
    }
}

function aplicarIdiomaEstatico() {
    document.querySelectorAll("[data-pt]").forEach(el => {
        el.textContent = idiomaAtual === "en"
            ? (el.dataset.en || el.dataset.pt)
            : el.dataset.pt;
    });

    const textoTradutor = document.getElementById("textoTradutor");
    if (textoTradutor) {
        textoTradutor.textContent = idiomaAtual === "en"
            ? "Traduzir para o português"
            : "Traduzir para o inglês";
    }
}

async function carregarUsuario() {
    try {
        const resposta = await fetch("/api/home-terapeuta");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) return;

        const dados = await resposta.json();

        const nome = document.getElementById("nomeUsuario");
        const codigo = document.getElementById("codigoTerapeuta");
        const foto = document.getElementById("fotoUsuario");
        const badge = document.getElementById("quantidadeNotificacoes");

        if (nome) nome.textContent = dados.nome || "Terapeuta";
        if (codigo) codigo.textContent = dados.codigoTerapeuta || "---";
        if (foto && dados.fotoPerfil) foto.src = dados.fotoPerfil;
        if (badge) badge.textContent = dados.notificacoes ?? 0;

    } catch (erro) {
        console.log("Erro ao carregar terapeuta:", erro);
    }
}

function copiarCodigo() {
    const codigo = document.getElementById("codigoTerapeuta")?.textContent;
    if (!codigo || codigo === "---") return;

    navigator.clipboard.writeText(codigo).then(() => {
        const icone = document.querySelector("#btnCodigoCopiar .fa-copy");
        if (!icone) return;

        icone.classList.remove("fa-regular", "fa-copy");
        icone.classList.add("fa-solid", "fa-check");

        setTimeout(() => {
            icone.classList.remove("fa-solid", "fa-check");
            icone.classList.add("fa-regular", "fa-copy");
        }, 1800);
    });
}

async function carregarNotificacoes() {
    const lista = document.getElementById("listaNotificacoes");
    if (!lista) return;

    try {
        const resposta = await fetch("/api/notificacoes");
        if (!resposta.ok) throw new Error();

        const dados = await resposta.json();
        const itens = dados.notificacoes || [];

        lista.innerHTML = itens.length === 0
            ? `<div class="painel-vazio">${t("semNotificacoes")}</div>`
            : itens.map(item => `
                <div class="item-notificacao ${item.lida ? "" : "nao-lida"}">
                    ${escaparHTML(traduzirMensagemNotificacao(item))}
                    <span class="tempo-notificacao">${escaparHTML(item.tempo)}</span>
                </div>
            `).join("");

        const badge = document.getElementById("quantidadeNotificacoes");
        if (badge) badge.textContent = itens.filter(item => !item.lida).length;

    } catch (_) {
        lista.innerHTML = `<div class="painel-vazio">${t("erroNotificacoes")}</div>`;
    }
}

function configurarEventos() {
    document.getElementById("btnTraduzir")?.addEventListener("click", () => {
        idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
        localStorage.setItem("idioma", idiomaAtual);
        aplicarIdiomaEstatico();

        if (modal?.classList.contains("mostrar") && topicoAtual) {
            abrirModal(topicoAtual, false);
        }
    });

    document.getElementById("btnCodigoCopiar")?.addEventListener("click", copiarCodigo);

    const btnNotif = document.getElementById("btnNotificacoes");
    const painel = document.getElementById("painelNotificacoes");

    btnNotif?.addEventListener("click", async e => {
        e.stopPropagation();
        const aberto = painel?.classList.toggle("aberto");
        if (!aberto) return;

        await carregarNotificacoes();
        fetch("/api/notificacoes/marcar-lidas", { method: "POST" }).catch(() => {});
    });

    document.addEventListener("click", e => {
        if (painel && !painel.contains(e.target) && e.target !== btnNotif) {
            painel.classList.remove("aberto");
        }
    });
}

aplicarIdiomaEstatico();
configurarEventos();
carregarUsuario();