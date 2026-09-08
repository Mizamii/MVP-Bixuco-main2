
let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    semNotificacoes:    { pt: "Nenhuma notificação por enquanto.",         en: "No notifications yet." },
    erroCarregarNotif:   { pt: "Não foi possível carregar as notificações.", en: "Couldn't load notifications." },
};

function t(chave) {
    const entrada = dicionario[chave];
    return idiomaAtual === "en" ? entrada.en : entrada.pt;
}


function copiarCodigo() {
    const codigo = document.getElementById("codigoTerapeuta").textContent;
    if (!codigo || codigo === "---") return;

    navigator.clipboard.writeText(codigo).then(() => {
        const icone = document.querySelector("#btnCodigoCopiar .fa-copy");
        if (icone) {
            icone.classList.remove("fa-regular", "fa-copy");
            icone.classList.add("fa-solid", "fa-check");
            setTimeout(() => {
                icone.classList.remove("fa-solid", "fa-check");
                icone.classList.add("fa-regular", "fa-copy");
            }, 2000);
        }
    });
}


async function carregarUsuario() {
    try {
        const resposta = await fetch("/api/home-terapeuta");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) throw new Error();

        const dados = await resposta.json();

        document.getElementById("nomeUsuario").textContent     = dados.nome || "Terapeuta";
        document.getElementById("codigoTerapeuta").textContent = dados.codigoTerapeuta || "---";

        if (dados.fotoPerfil) {
            document.getElementById("fotoUsuario").src = dados.fotoPerfil;
        }

        const badge = document.getElementById("quantidadeNotificacoes");
        if ((dados.notificacoes ?? 0) > 0) {
            badge.textContent = dados.notificacoes;
        }

    } catch (erro) {
        console.log("Erro ao carregar usuário:", erro);
    }
}

carregarUsuario();


const conteudo = {

    pt: {

        sobre: {
            titulo: "Sobre nós",
            icone:  "fa-solid fa-circle-info",
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
            icone:  "fa-regular fa-heart",
            texto: `
                <p>
                    Para terapeutas, o Bixuco oferece uma visão estruturada
                    do cotidiano dos pacientes entre as sessões.
                </p>
                <p>
                    Você recebe relatórios diários preenchidos pelos responsáveis,
                    com dados organizados sobre comportamento, gatilhos e nível de estresse.
                </p>
                <p>
                    A pelúcia inteligente detecta sinais de estresse em tempo real
                    e envia alertas para o aplicativo — informações valiosas para
                    embasar o acompanhamento clínico.
                </p>
                <p>
                    Você também pode registrar notas clínicas diretamente na plataforma,
                    mantendo um histórico completo e acessível.
                </p>
            `
        },

        funciona: {
            titulo: "Como funciona",
            icone:  "fa-solid fa-gear",
            texto: `
                <ol>
                    <li>Crie sua conta como terapeuta e informe seu CRP.</li>
                    <li>Compartilhe seu código de vínculo com os responsáveis dos seus pacientes.</li>
                    <li>Aceite as solicitações de vínculo no painel de notificações.</li>
                    <li>Acompanhe os relatórios diários dos pacientes na tela de Relatórios.</li>
                    <li>Adicione notas clínicas e acompanhe a evolução ao longo do tempo.</li>
                    <li>Visualize gráficos de estresse e principais gatilhos por paciente.</li>
                </ol>
            `
        },

        publico: {
            titulo: "Para quem é",
            icone:  "fa-solid fa-users",
            texto: `
                <p>O Bixuco foi desenvolvido para:</p>
                <ul>
                    <li><strong>Terapeutas</strong> — psicólogos e terapeutas ocupacionais que acompanham o desenvolvimento.</li>
                    <li><strong>Responsáveis</strong> — pais e mães que registram o dia a dia da criança.</li>
                    <li><strong>Profissionais da saúde infantil</strong> — que buscam dados organizados para embasar seu trabalho.</li>
                </ul>
                <p>
                    Qualquer profissional que acompanhe crianças com TPS ou
                    hipersensibilidade sensorial pode se beneficiar do Bixuco.
                </p>
            `
        },

        naofazemos: {
            titulo: "O que não fazemos",
            icone:  "fa-solid fa-ban",
            texto: `
                <p>
                    É muito importante que fique claro o que o Bixuco <strong>não faz</strong>:
                </p>
                <ul>
                    <li>Não realizamos diagnósticos médicos ou psicológicos.</li>
                    <li>Não substituímos a avaliação clínica do terapeuta.</li>
                    <li>Não oferecemos laudos ou pareceres técnicos.</li>
                </ul>
                <p>
                    Nossa função é organizar as informações do cotidiano e facilitar
                    o acompanhamento profissional — sempre como ferramenta de apoio,
                    nunca como substituto da expertise clínica.
                </p>
            `
        },

        privacidade: {
            titulo: "Privacidade",
            icone:  "fa-solid fa-shield-halved",
            texto: `
                <p>
                    Levamos a privacidade das famílias e dos profissionais muito a sério,
                    especialmente por lidarmos com dados sensíveis de crianças.
                </p>
                <ul>
                    <li>Dados protegidos com criptografia de ponta.</li>
                    <li>Acesso aos relatórios apenas mediante vínculo autorizado pelo responsável.</li>
                    <li>Informações armazenadas com segurança em servidores protegidos.</li>
                    <li>Seguimos as diretrizes da LGPD (Lei Geral de Proteção de Dados).</li>
                    <li>O responsável pode revogar o acesso a qualquer momento.</li>
                </ul>
            `
        },

        proposito: {
            titulo: "Nosso propósito",
            icone:  "fa-solid fa-trophy",
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
                    <li>Respeito às famílias e profissionais</li>
                </ul>
            `
        },

        contato: {
            titulo: "Contato e suporte",
            icone:  "fa-solid fa-headset",
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

    },

    en: {

        sobre: {
            titulo: "About us",
            icone:  "fa-solid fa-circle-info",
            texto: `
                <p>
                    Bixuco was born from a simple question: how can we help parents
                    understand what their children are feeling, even when words
                    don't come easily?
                </p>
                <p>
                    We're a technology startup focused on children's well-being,
                    created to support families living with sensory hypersensitivity —
                    also known as Sensory Processing Disorder (SPD).
                </p>
                <p>
                    Our solution pairs an affective object, the Bixuco plush toy,
                    with a smart app that turns physical interactions into data
                    parents and therapists can understand.
                </p>
                <p>
                    We are not a diagnosis. We're a daily support tool.
                </p>
            `
        },

        ajudamos: {
            titulo: "How we help",
            icone:  "fa-regular fa-heart",
            texto: `
                <p>
                    For therapists, Bixuco offers a structured view of
                    patients' daily life between sessions.
                </p>
                <p>
                    You receive daily reports filled out by guardians, with
                    organized data on behavior, triggers, and stress levels.
                </p>
                <p>
                    The smart plush detects signs of stress in real time and
                    sends alerts to the app — valuable information to support
                    clinical follow-up.
                </p>
                <p>
                    You can also record clinical notes directly on the platform,
                    keeping a complete and accessible history.
                </p>
            `
        },

        funciona: {
            titulo: "How it works",
            icone:  "fa-solid fa-gear",
            texto: `
                <ol>
                    <li>Create your therapist account and provide your license number.</li>
                    <li>Share your linking code with your patients' guardians.</li>
                    <li>Accept link requests in the notifications panel.</li>
                    <li>Track patients' daily reports on the Reports screen.</li>
                    <li>Add clinical notes and track progress over time.</li>
                    <li>View stress and main-trigger charts per patient.</li>
                </ol>
            `
        },

        publico: {
            titulo: "Who it's for",
            icone:  "fa-solid fa-users",
            texto: `
                <p>Bixuco was built for:</p>
                <ul>
                    <li><strong>Therapists</strong> — psychologists and occupational therapists tracking development.</li>
                    <li><strong>Guardians</strong> — parents who log the child's daily life.</li>
                    <li><strong>Child health professionals</strong> — looking for organized data to support their work.</li>
                </ul>
                <p>
                    Any professional working with children with SPD or sensory
                    hypersensitivity can benefit from Bixuco.
                </p>
            `
        },

        naofazemos: {
            titulo: "What we don't do",
            icone:  "fa-solid fa-ban",
            texto: `
                <p>
                    It's important to be clear about what Bixuco <strong>does not</strong> do:
                </p>
                <ul>
                    <li>We do not perform medical or psychological diagnoses.</li>
                    <li>We do not replace the therapist's clinical assessment.</li>
                    <li>We do not issue clinical reports or technical opinions.</li>
                </ul>
                <p>
                    Our role is to organize everyday information and support
                    professional follow-up — always as a support tool, never
                    a substitute for clinical expertise.
                </p>
            `
        },

        privacidade: {
            titulo: "Privacy",
            icone:  "fa-solid fa-shield-halved",
            texto: `
                <p>
                    We take the privacy of families and professionals very
                    seriously, especially since we handle sensitive data about children.
                </p>
                <ul>
                    <li>Data protected with end-to-end encryption.</li>
                    <li>Report access only through a link authorized by the guardian.</li>
                    <li>Information securely stored on protected servers.</li>
                    <li>We follow LGPD guidelines (Brazil's data protection law).</li>
                    <li>The guardian can revoke access at any time.</li>
                </ul>
            `
        },

        proposito: {
            titulo: "Our purpose",
            icone:  "fa-solid fa-trophy",
            texto: `
                <h3>Mission</h3>
                <p>
                    Make it easier to track child development through technology
                    and empathy, fostering connection between families and professionals.
                </p>

                <h3>Vision</h3>
                <p>
                    Be the national reference in technology solutions for
                    supporting children with sensory hypersensitivity.
                </p>

                <h3>Values</h3>
                <ul>
                    <li>Empathy</li>
                    <li>Innovation</li>
                    <li>Security</li>
                    <li>Transparency</li>
                    <li>Respect for families and professionals</li>
                </ul>
            `
        },

        contato: {
            titulo: "Contact and support",
            icone:  "fa-solid fa-headset",
            texto: `
                <p>Need help? Our team is here for you.</p>
                <p>📧 <strong>suporte@bixuco.com</strong></p>
                <p>📱 <strong>(11) 99999-9999</strong></p>
                <p>Monday to Friday, 8 AM to 6 PM.</p>
                <p>
                    You can also open a support ticket directly from the
                    app, under your account settings.
                </p>
            `
        }

    }

};


const modal     = document.getElementById("modal");
const titulo    = document.getElementById("tituloModal");
const texto     = document.getElementById("textoModal");
const iconModal = document.getElementById("iconModal");
const fechar    = document.getElementById("fecharModal");

let topicoAberto = null;

function abrirModal(id) {
    const item = conteudo[idiomaAtual][id];
    if (!item) return;

    topicoAberto = id;

    iconModal.innerHTML = `<i class="${item.icone}"></i>`;
    titulo.textContent  = item.titulo;
    texto.innerHTML     = item.texto;

    modal.classList.add("mostrar");
    document.body.style.overflow = "hidden";
    fechar.focus();
}

function fecharModal() {
    modal.classList.remove("mostrar");
    document.body.style.overflow = "";
    topicoAberto = null;
}

document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
        abrirModal(card.dataset.topico);
    });
});

fechar.addEventListener("click", fecharModal);


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
            ? `<div class="painel-vazio">${t("semNotificacoes")}</div>`
            : itens.map(formatarItemNotificacao).join("");

        const naoLidas = itens.filter(item => !item.lida).length;
        document.getElementById("quantidadeNotificacoes").textContent = naoLidas;

    } catch (erro) {
        console.log("Erro ao carregar notificações:", erro);
        listaNotificacoes.innerHTML = `<div class="painel-vazio">${t("erroCarregarNotif")}</div>`;
    }
}

async function marcarNotificacoesComoLidas() {
    try {
        await fetch("/api/notificacoes/marcar-lidas", { method: "POST" });
        document.getElementById("quantidadeNotificacoes").textContent = "0";
    } catch (_) {}
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


function aplicarIdiomaEstatico() {
    document.querySelectorAll("[data-pt]").forEach(el => {
        el.textContent = idiomaAtual === "en"
            ? (el.dataset.en || el.dataset.pt)
            : el.dataset.pt;
    });

    document.getElementById("textoTradutor").textContent =
        idiomaAtual === "en" ? "Traduzir para português" : "Traduzir para inglês";

    if (topicoAberto) {
        abrirModal(topicoAberto);
    }
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);
    aplicarIdiomaEstatico();
});


function aplicarTema(tema) {
    document.body.classList.remove("tema-claro", "tema-escuro");
    document.body.classList.add(`tema-${tema}`);
    document.getElementById("btnClaro").classList.toggle("ativo", tema === "claro");
    document.getElementById("btnEscuro").classList.toggle("ativo", tema === "escuro");
    localStorage.setItem("tema", tema);
}

document.getElementById("btnClaro").addEventListener("click",  () => aplicarTema("claro"));
document.getElementById("btnEscuro").addEventListener("click", () => aplicarTema("escuro"));


const temaSalvo = localStorage.getItem("tema") || "claro";
aplicarTema(temaSalvo);
aplicarIdiomaEstatico();
carregarNotificacoes();

document.getElementById("btnCodigoCopiar").addEventListener("click", copiarCodigo);

document.getElementById("fotoUsuario").addEventListener("click", () => {
    window.location.href = "/PerfilTerapeuta";
});
document.getElementById("nomeUsuario").addEventListener("click", () => {
    window.location.href = "/PerfilTerapeuta";
});

document.getElementById("fotoUsuario").addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});