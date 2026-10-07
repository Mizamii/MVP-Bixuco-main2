let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    semNotificacoes:  { pt: "Nenhuma notificação por enquanto.", en: "No notifications yet." },
    erroNotificacoes: { pt: "Não foi possível carregar as notificações.", en: "Couldn't load notifications." }
};

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
