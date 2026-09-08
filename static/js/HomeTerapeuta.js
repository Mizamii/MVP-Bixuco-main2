
function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

// =========================
// TRADUÇÃO MANUAL — dicionário para textos montados via JS
// =========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

// Dicionário de textos usados em template strings (fora do HTML estático)
const dicionario = {
    crianca:            { pt: "Criança",                                  en: "Child" },
    anos:               { pt: "anos",                                     en: "years old" },
    aceitar:             { pt: "Aceitar",                                 en: "Accept" },
    confirmarRecusa:     { pt: (nome) => `Tem certeza que deseja recusar a solicitação de ${nome}?`,
                            en: (nome) => `Are you sure you want to decline ${nome}'s request?` },
    erroProcessar:        { pt: "Erro ao processar. Tente novamente.",     en: "Something went wrong. Please try again." },
    ver:                  { pt: "Ver",                                    en: "View" },
    semNotificacoes:      { pt: "Nenhuma notificação por enquanto.",       en: "No notifications yet." },
    erroCarregarNotif:    { pt: "Não foi possível carregar.",              en: "Couldn't load notifications." },
};

function t(chave, ...args) {
    const entrada = dicionario[chave];
    const valor   = idiomaAtual === "en" ? entrada.en : entrada.pt;
    return typeof valor === "function" ? valor(...args) : valor;
}


// =========================
// COPIAR CÓDIGO DO TERAPEUTA
// =========================

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


// =========================
// CARREGAR DADOS DO TERAPEUTA
// =========================

    async function carregarDados(atualizacaoSilenciosa = false) {

    try {

        const resposta = await fetch("/api/home-terapeuta");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) throw new Error("Falha ao carregar dados");

        const dados = await resposta.json();

        document.getElementById("nomeTerapeuta").textContent =
            dados.nome || "Terapeuta";

        document.getElementById("codigoTerapeuta").textContent =
            dados.codigoTerapeuta || "---";

        if (dados.fotoPerfil) {
            document.getElementById("fotoUsuario").src = dados.fotoPerfil;
        }

        document.getElementById("totalPacientes").textContent      = dados.totalPacientes   ?? 0;
        document.getElementById("totalPendentes").textContent      = dados.totalPendentes   ?? 0;
        document.getElementById("totalRelatoriosHoje").textContent = dados.relatoriosHoje   ?? 0;

        const badge = document.getElementById("badgeNotificacoes");
        if (dados.notificacoes > 0) {
            badge.textContent   = dados.notificacoes;
            badge.style.display = "inline";
        } else {
            badge.style.display = "none";
        }

        renderSolicitacoes(dados.solicitacoes    || []);
        renderAtividade(dados.atividadeRecente   || []);

    } catch (erro) {

        console.log("Erro ao carregar dados do terapeuta:", erro);

        // Numa atualização silenciosa (polling em segundo plano), não
        // reseta a tela pra zero por causa de uma falha de rede
        // passageira — só loga o erro e mantém o que já estava na tela.
        if (atualizacaoSilenciosa) return;

        document.getElementById("nomeTerapeuta").textContent       = "Terapeuta";
        document.getElementById("totalPacientes").textContent      = "0";
        document.getElementById("totalPendentes").textContent      = "0";
        document.getElementById("totalRelatoriosHoje").textContent = "0";

        renderSolicitacoes([]);
        renderAtividade([]);

    }

}


// =========================
// RENDERIZAR SOLICITAÇÕES
// =========================

function renderSolicitacoes(lista) {

    const ul              = document.getElementById("listaSolicitacoes");
    const semSolicitacoes = document.getElementById("semSolicitacoes");

    ul.innerHTML = "";

    if (lista.length === 0) {
        semSolicitacoes.style.display = "block";
        return;
    }

    semSolicitacoes.style.display = "none";

    lista.forEach(item => {

        const li = document.createElement("li");
        li.classList.add("solicitacao-item");
        li.dataset.id = item.id;

        const foto = document.createElement("img");
        foto.classList.add("solicitacao-foto");
        foto.src = item.fotoPerfil || "/img/perfilPadrao.png";
        foto.alt = item.nomeResponsavel;
        foto.onerror = () => { foto.src = "/img/perfilPadrao.png"; };

        const info = document.createElement("div");
        info.classList.add("solicitacao-info");
        info.innerHTML = `
            <strong>${escaparHTML(item.nomeResponsavel)}</strong>
            <span>${t("crianca")}: ${escaparHTML(item.nomeCrianca)}, ${escaparHTML(item.idadeCrianca)} ${t("anos")}</span>
            <span class="solicitacao-tempo">${escaparHTML(item.tempo)}</span>
        `;

        const acoes = document.createElement("div");
        acoes.classList.add("solicitacao-acoes");

        const btnAceitar = document.createElement("button");
        btnAceitar.type = "button";
        btnAceitar.classList.add("btn-aceitar");
        btnAceitar.innerHTML = `<i class="fa-solid fa-check"></i> ${t("aceitar")}`;

        // Aceitar direto — ação positiva, não precisa de confirmação
        btnAceitar.addEventListener("click", () => {
            responderSolicitacao(item.id, "aceitar", li);
        });

        const btnRecusar = document.createElement("button");
        btnRecusar.type = "button";
        btnRecusar.classList.add("btn-recusar");
        btnRecusar.innerHTML = '<i class="fa-solid fa-xmark"></i>';

        // Recusar pede confirmação inline
        btnRecusar.addEventListener("click", () => {
            abrirConfirmacao(
                t("confirmarRecusa", item.nomeResponsavel),
                () => responderSolicitacao(item.id, "recusar", li)
            );
        });

        acoes.appendChild(btnAceitar);
        acoes.appendChild(btnRecusar);

        li.appendChild(foto);
        li.appendChild(info);
        li.appendChild(acoes);
        ul.appendChild(li);

    });

}


// =========================
// MODAL DE CONFIRMAÇÃO INLINE
// =========================

let callbackConfirmacao = null;

function abrirConfirmacao(texto, callback) {
    document.getElementById("modalConfirmacaoTexto").textContent = texto;
    document.getElementById("modalConfirmacao").style.display    = "flex";
    callbackConfirmacao = callback;
}

function fecharConfirmacao() {
    document.getElementById("modalConfirmacao").style.display = "none";
    callbackConfirmacao = null;
}

document.getElementById("modalBtnConfirmar").addEventListener("click", () => {
    if (callbackConfirmacao) callbackConfirmacao();
    fecharConfirmacao();
});

document.getElementById("modalBtnCancelar").addEventListener("click", fecharConfirmacao);


// =========================
// ACEITAR OU RECUSAR SOLICITAÇÃO
// =========================

async function responderSolicitacao(vinculoId, acao, itemEl) {

    itemEl.querySelectorAll("button").forEach(b => b.disabled = true);

    try {

        const resposta = await fetch("/api/vinculos/responder", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ vinculoId, acao })
        });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) throw new Error("Falha ao responder solicitação");

        itemEl.remove();

        const ul = document.getElementById("listaSolicitacoes");
        if (ul.children.length === 0) {
            document.getElementById("semSolicitacoes").style.display = "block";
        }

        const totalPendentes = document.getElementById("totalPendentes");
        const atual = parseInt(totalPendentes.textContent) || 0;
        if (atual > 0) totalPendentes.textContent = atual - 1;

    } catch (erro) {

        console.log("Erro ao responder solicitação:", erro);

        itemEl.querySelectorAll("button").forEach(b => b.disabled = false);

        const erroEl = document.createElement("p");
        erroEl.style.color    = "#E53E3E";
        erroEl.style.fontSize = "12px";
        erroEl.textContent    = t("erroProcessar");
        itemEl.appendChild(erroEl);
        setTimeout(() => erroEl.remove(), 3000);

    }

}


// =========================
// RENDERIZAR ATIVIDADE RECENTE
// =========================

function renderAtividade(lista) {

    const ul          = document.getElementById("listaAtividade");
    const semAtividade = document.getElementById("semAtividade");

    ul.innerHTML = "";

    if (lista.length === 0) {
        semAtividade.style.display = "block";
        return;
    }

    semAtividade.style.display = "none";

    lista.forEach(item => {

        const li = document.createElement("li");
        li.classList.add("atividade-item");

                    if (!item.visto) {
            li.classList.add("atividade-item--nao-visto");
        }

        li.innerHTML = `
            <div class="atividade-icone atividade-icone--${escaparHTML(item.cor || "verde")}">
                <i class="fa-solid fa-clipboard-list"></i>
            </div>

            <div class="atividade-info">
                <strong>
                    Relatório de ${escaparHTML(item.nomeCrianca)}
                    ${!item.visto ? '<span class="bolinha-nao-visto"></span>' : ''}
                </strong>
                <span>${escaparHTML(item.nomeResponsavel)} · ${escaparHTML(item.tempo)}</span>
            </div>

            <button type="button" class="btn-ver">
                <i class="fa-regular fa-eye"></i>
                ${t("ver")}
            </button>
        `;

        // Anexa o listener em vez de usar onclick inline (evita injeção via atributo)
        li.querySelector(".btn-ver").addEventListener("click", () => {
            marcarVistoEAbrir(item.id, item.responsavelId, item.dataISO);
        });

        ul.appendChild(li);

    });

}

// Marca o relatório como visto antes de abrir
        // Marca o relatório como visto antes de abrir, e leva direto
    // pra tela do paciente certo (não pra seleção)
        // Marca o relatório como visto antes de abrir, leva direto pro
    // paciente certo E já no dia certo do calendário
async function marcarVistoEAbrir(relatorioId, responsavelId, dataISO) {
    try {
        await fetch(`/api/relatorios/${relatorioId}/marcar-visto`, { method: "POST" });
    } catch (_) {}
    window.location.href = `/relatoriosTerapeuta?paciente=${responsavelId}&data=${dataISO}`;
}


// =========================
// NOTIFICAÇÕES
// =========================

const painelNotificacoes = document.getElementById("painelNotificacoes");
const listaNotificacoesEl = document.getElementById("listaNotificacoes");

// Delegação de clique: como os itens de notificação são recriados toda
// vez que a lista é montada, o listener fica no container (que sempre
// existe) em vez de em cada item individual
listaNotificacoesEl.addEventListener("click", (e) => {
    const item = e.target.closest(".item-notificacao[data-tipo='relatorio_finalizado']");
    if (item) window.location.href = "/relatoriosTerapeutaS";
});

// Ícones diferentes por tipo de notificação
function formatarItemNotificacao(item) {
    const classeExtra = item.lida ? "" : "nao-lida";
    const icones = {
        pedido_vinculo:       "fa-link",
        relatorio_finalizado: "fa-clipboard-check",
        relatorio_concluido:  "fa-check-circle",
        lembrete_relatorio:   "fa-bell"
    };
    const icone  = icones[item.tipo] || "fa-bell";
    const clicavel = item.tipo === "relatorio_finalizado" ? "notificacao-clicavel" : "";

    return `
        <div class="item-notificacao ${classeExtra} ${clicavel}" data-tipo="${escaparHTML(item.tipo)}">
            <div class="notificacao-linha">
                <i class="fa-solid ${icone} notificacao-icone"></i>
                <div>
                    <p>${escaparHTML(item.mensagem)}</p>
                    <span class="tempo-notificacao">${escaparHTML(item.tempo)}</span>
                </div>
            </div>
        </div>
    `;
}

async function carregarNotificacoes() {
    try {
        const resposta = await fetch("/api/notificacoes");
        if (!resposta.ok) throw new Error();
        const dados = await resposta.json();
        const itens = dados.notificacoes || [];
        

        listaNotificacoesEl.innerHTML = itens.length === 0
            ? `<div class="painel-vazio">${t("semNotificacoes")}</div>`
            : itens.map(formatarItemNotificacao).join("");

        const naoLidas = itens.filter(i => !i.lida).length;
        const badge    = document.getElementById("badgeNotificacoes");
        if (naoLidas > 0) {
            badge.textContent   = naoLidas;
            badge.style.display = "inline";
        } else {
            badge.style.display = "none";
        }
    } catch (_) {
        listaNotificacoesEl.innerHTML = `<div class="painel-vazio">${t("erroCarregarNotif")}</div>`;
    }
}

// Carrega só o badge sem abrir o painel (chamado na inicialização)
async function carregarBadgeNotificacoes() {
    try {
        const resposta = await fetch("/api/notificacoes");
        if (!resposta.ok) return;
        const dados    = await resposta.json();
        const itens    = dados.notificacoes || [];
        const naoLidas = itens.filter(i => !i.lida).length;
        const badge    = document.getElementById("badgeNotificacoes");
        if (naoLidas > 0) {
            badge.textContent   = naoLidas;
            badge.style.display = "inline";
        }
    } catch (_) {}
}

document.getElementById("btnNotificacoes").addEventListener("click", async (e) => {
    e.stopPropagation();
    const estaAberto = painelNotificacoes.classList.toggle("aberto");
    if (estaAberto) {
        await carregarNotificacoes();
        fetch("/api/notificacoes/marcar-lidas", { method: "POST" }).catch(() => {});
        document.getElementById("badgeNotificacoes").style.display = "none";
    }
});

document.addEventListener("click", (e) => {
    if (!painelNotificacoes.contains(e.target)) {
        painelNotificacoes.classList.remove("aberto");
    }
});


// =========================
// TRADUÇÃO MANUAL
// =========================

function aplicarIdiomaEstatico() {
    document.querySelectorAll("[data-pt]").forEach(el => {
        el.textContent = idiomaAtual === "en"
            ? (el.dataset.en || el.dataset.pt)
            : el.dataset.pt;
    });

    document.getElementById("textoTradutor").textContent =
        idiomaAtual === "en" ? "Traduzir para português" : "Traduzir para inglês";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);
    aplicarIdiomaEstatico();
    // Solicitações e atividade são montadas via JS (t()) — recarrega para refletir o novo idioma
    carregarDados();
});

// Aplica o idioma salvo ao carregar
aplicarIdiomaEstatico();


// =========================
// TEMA CLARO / ESCURO
// =========================

function aplicarTema(tema) {
    document.body.classList.remove("tema-claro", "tema-escuro");
    document.body.classList.add(`tema-${tema}`);
    document.getElementById("btnClaro").classList.toggle("ativo", tema === "claro");
    document.getElementById("btnEscuro").classList.toggle("ativo", tema === "escuro");
    localStorage.setItem("tema", tema);
}

document.getElementById("btnClaro").addEventListener("click",  () => aplicarTema("claro"));
document.getElementById("btnEscuro").addEventListener("click", () => aplicarTema("escuro"));


// =========================
// INICIALIZAÇÃO
// =========================

const temaSalvo = localStorage.getItem("tema") || "claro";
aplicarTema(temaSalvo);

carregarDados();
carregarBadgeNotificacoes();

// Verifica solicitações novas a cada 15s, sem precisar recarregar a
// página — atualização "silenciosa" (não reseta a tela em caso de
// falha passageira de rede)
setInterval(() => carregarDados(true), 15000);

document.getElementById("fotoUsuario").addEventListener("click", () => {
    window.location.href = "/perfilTerapeuta";
});

document.getElementById("nomeTerapeuta").addEventListener("click", () => {
    window.location.href = "/perfilTerapeuta";
});

document.getElementById("btnCodigoCopiar").addEventListener("click", copiarCodigo);