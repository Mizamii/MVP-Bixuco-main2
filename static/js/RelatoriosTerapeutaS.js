
function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

// =========================
// TRADUÇÃO MANUAL — dicionário para textos montados via JS
// =========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    responsavel:       { pt: "Responsável",                                    en: "Guardian" },
    semRelatorios:      { pt: "Sem relatórios",                                 en: "No reports" },
    crianca:             { pt: "Criança",                                       en: "Child" },
    erroPacientes:        { pt: "Erro ao carregar os pacientes. Tente recarregar a página.",
                                en: "Error loading patients. Try reloading the page." },
    semNotificacoes:       { pt: "Nenhuma notificação por enquanto.",           en: "No notifications yet." },
    erroCarregarNotif:      { pt: "Não foi possível carregar.",                 en: "Couldn't load notifications." },
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
// CARREGAR DADOS DO TOPO
// =========================
async function carregarUsuario() {
    try {
        const resposta = await fetch("/api/home-terapeuta");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) return;

        const dados = await resposta.json();

        document.getElementById("nomeTerapeuta").textContent = dados.nome || "Terapeuta";
        document.getElementById("codigoTerapeuta").textContent = dados.codigoTerapeuta || "---";

        if (dados.fotoPerfil) {
            document.getElementById("fotoUsuario").src = dados.fotoPerfil;
        }

        const badge = document.getElementById("badgeNotificacoes");
        if ((dados.notificacoes ?? 0) > 0) {
            badge.textContent   = dados.notificacoes;
            badge.style.display = "inline";
        }

    } catch (_) {}
}


// =========================
// CARREGAR LISTA DE PACIENTES COM ÚLTIMO RELATÓRIO
// =========================
async function carregarRelatorios() {
    const lista       = document.getElementById("listaRelatorios");
    const semPacientes = document.getElementById("semPacientes");

    try {
        const resposta = await fetch("/api/pacientes-relatorios");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) throw new Error();

        const dados   = await resposta.json();
        const pacientes = dados.pacientes || [];

        lista.innerHTML = "";

        if (pacientes.length === 0) {
            semPacientes.style.display = "block";
            return;
        }

        semPacientes.style.display = "none";

        pacientes.forEach(p => {
            const card = document.createElement("div");
            card.classList.add("card-relatorio");
            card.style.cursor = "pointer";

            // inicial do nome para o avatar
            const inicial = (p.nomeCrianca || p.nomeResponsavel || "?").charAt(0).toUpperCase();

            // data do último relatório formatada
            const dataRelatorio = p.ultimoRelatorio
                ? new Date(p.ultimoRelatorio).toLocaleDateString(idiomaAtual === "en" ? "en-US" : "pt-BR")
                : t("semRelatorios");

            card.innerHTML = `
                <div class="info">
                    <div class="avatar">
                        ${p.fotoCrianca
                            ? `<img src="${escaparHTML(p.fotoCrianca)}" alt="${escaparHTML(p.nomeCrianca)}" onerror="this.parentElement.textContent='${escaparHTML(inicial)}'">`
                            : escaparHTML(inicial)
                        }
                    </div>
                    <div>
                        <strong>${escaparHTML(p.nomeCrianca || t("crianca"))}</strong>
                        <span>${t("responsavel")}: ${escaparHTML(p.nomeResponsavel)}</span>
                        <span class="data-relatorio">${escaparHTML(dataRelatorio)}</span>
                    </div>
                </div>
                <button type="button" aria-label="Ver relatório">
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            `;

            // ao clicar em qualquer parte do card vai para os relatórios desse paciente
            card.addEventListener("click", () => {
                window.location.href = `/relatoriosTerapeuta?paciente=${p.responsavelId}`;
            });

            lista.appendChild(card);
        });

    } catch (_) {
        lista.innerHTML = `
            <div class="erro-relatorios">
                <i class="fa-solid fa-triangle-exclamation"></i>
                ${t("erroPacientes")}
            </div>
        `;
    }
}


// =========================
// NOTIFICAÇÕES
// =========================
const painelNotificacoes = document.getElementById("painelNotificacoes");
const listaNotificacoes  = document.getElementById("listaNotificacoes");

async function carregarNotificacoes() {
    try {
        const resposta = await fetch("/api/notificacoes");
        if (!resposta.ok) throw new Error();
        const dados = await resposta.json();
        const itens = dados.notificacoes || [];

        listaNotificacoes.innerHTML = itens.length === 0
            ? `<div class="painel-vazio">${t("semNotificacoes")}</div>`
            : itens.map(item => `
                <div class="item-notificacao ${item.lida ? "" : "nao-lida"}">
                    <p>${escaparHTML(item.mensagem)}</p>
                    <span class="tempo-notificacao">${escaparHTML(item.tempo)}</span>
                </div>
            `).join("");
    } catch (_) {
        listaNotificacoes.innerHTML = `<div class="painel-vazio">${t("erroCarregarNotif")}</div>`;
    }
}

document.getElementById("btnNotificacoes").addEventListener("click", async (e) => {
    e.stopPropagation();
    const estaAberto = painelNotificacoes.classList.toggle("aberto");
    if (estaAberto) {
        await carregarNotificacoes();
        fetch("/api/notificacoes/marcar-lidas", { method: "POST" });
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
    // Lista de pacientes é montada via JS (t()) — recarrega pra refletir o novo idioma
    carregarRelatorios();
});

// Aplica o idioma salvo ao carregar
aplicarIdiomaEstatico();


// =========================
// TEMA
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
carregarUsuario();
carregarRelatorios();

document.getElementById("fotoUsuario").addEventListener("click", () => {
    window.location.href = "/perfilTerapeuta";
});
document.getElementById("nomeTerapeuta").addEventListener("click", () => {
    window.location.href = "/perfilTerapeuta";
});

document.getElementById("btnCodigoCopiar").addEventListener("click", copiarCodigo);

document.getElementById("fotoUsuario").addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

document.querySelector(".cabecalho-pagina img").addEventListener("error", function () {
    this.style.display = "none";
});