function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

// ==========================
// TRADUÇÃO MANUAL — mesmo padrão do resto do app
// (antes esta página usava Google Translate via cookie + reload;
// trocado pelo dicionário manual, sem reload e consistente)
// ==========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    "Terapeuta":                          "Therapist",
    "Membro desde":                       "Member since",
    "Digite um nome válido.":             "Enter a valid name.",
    "Erro ao salvar. Tente novamente.":   "Error saving. Please try again.",
    "Erro ao salvar o nome.":             "Error saving the name.",
    "Erro ao salvar a foto.":             "Error saving the photo.",
    "Salvando...":                        "Saving...",
    "Salvar foto":                        "Save photo",
    "Carregando...":                      "Loading...",
    "Nenhuma notificação por enquanto.":  "No notifications yet.",
    "Não foi possível carregar.":         "Could not load."
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
        idiomaAtual === "en" ? "Traduzir para português" : "Traduzir para inglês";

}

document.getElementById("btnTraduzir").addEventListener("click", () => {

    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);

    aplicarIdiomaEstatico();

    // Reaplica a descrição (que tem texto dinâmico interpolado)
    if (ultimoUsuario) preencherDescricao(ultimoUsuario);

});


// ==========================
// CARREGAR DADOS DO PERFIL
// ==========================

let ultimoUsuario = null;

function preencherDescricao(usuario) {
    document.getElementById("perfilDescricao").textContent =
        `${traduzir("Terapeuta")} • ${traduzir("Membro desde")} ${usuario.anoCadastro || "2026"}`;
}

async function carregarPerfil() {

    try {

        const resposta = await fetch("/api/perfil");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) throw new Error("Erro ao carregar perfil");

        const usuario = await resposta.json();
        ultimoUsuario = usuario;

        // Topo
        document.getElementById("nomeUsuario").textContent =
            usuario.nome || "Terapeuta";

        // Card de perfil
        document.getElementById("perfilNome").textContent =
            usuario.nome || "Terapeuta";

        preencherDescricao(usuario);

        if (usuario.fotoPerfil) {
            document.getElementById("fotoUsuario").src = usuario.fotoPerfil;
            document.getElementById("fotoPerfil").src  = usuario.fotoPerfil;
            fotoOriginalSrc = usuario.fotoPerfil;
        }

        // Código de vínculo — no card E no header
        const codigo = usuario.codigoVinculo || "---";
        document.getElementById("codigoVinculo").textContent       = codigo;
        document.getElementById("codigoTerapeutaHeader").textContent = codigo;

        // Badge de notificações
        const qtd = usuario.notificacoes ?? 0;
        document.getElementById("quantidadeNotificacoes").textContent = qtd;

    } catch (erro) {

        console.log("Erro ao carregar perfil:", erro);

    }

}


// ==========================
// FOTO DE PERFIL
// ==========================

const perfilFotoWrapper = document.getElementById("perfilFotoWrapper");
const inputFotoPerfil   = document.getElementById("inputFotoPerfil");
const perfilFotoAcoes   = document.getElementById("perfilFotoAcoes");
const btnSalvarFoto     = document.getElementById("btnSalvarFoto");
const btnCancelarFoto   = document.getElementById("btnCancelarFoto");
const fotoPerfilImg     = document.getElementById("fotoPerfil");
const fotoUsuarioImg    = document.getElementById("fotoUsuario");

let fotoOriginalSrc = fotoPerfilImg.src;

perfilFotoWrapper.addEventListener("click", () => {
    inputFotoPerfil.click();
});

inputFotoPerfil.addEventListener("change", () => {

    const arquivo = inputFotoPerfil.files && inputFotoPerfil.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = (e) => {
        fotoPerfilImg.src = e.target.result;
        perfilFotoAcoes.style.display = "flex";
    };
    leitor.readAsDataURL(arquivo);

});

btnCancelarFoto.addEventListener("click", () => {
    fotoPerfilImg.src = fotoOriginalSrc;
    inputFotoPerfil.value = "";
    perfilFotoAcoes.style.display = "none";
});

btnSalvarFoto.addEventListener("click", async () => {

    const arquivo = inputFotoPerfil.files && inputFotoPerfil.files[0];
    if (!arquivo) return;

    btnSalvarFoto.disabled    = true;
    btnSalvarFoto.textContent = traduzir("Salvando...");

    try {

        const formData = new FormData();
        formData.append("fotoPerfil", arquivo);

        // Mesma rota do responsável
        const resposta = await fetch("/api/perfil/atualizar", {
            method: "POST",
            body: formData
        });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.erro || traduzir("Erro ao salvar a foto."));
        }

        const novaFoto = dados.fotoPerfil || fotoPerfilImg.src;
        fotoPerfilImg.src  = novaFoto;
        fotoUsuarioImg.src = novaFoto;
        fotoOriginalSrc    = novaFoto;

        inputFotoPerfil.value = "";
        perfilFotoAcoes.style.display = "none";

    } catch (erro) {

        console.log("Erro ao salvar foto:", erro);

        // Mensagem inline em vez de alert()
        const msg = document.createElement("p");
        msg.style.color    = "#E53E3E";
        msg.style.fontSize = "0.8rem";
        msg.textContent    = erro.message || traduzir("Erro ao salvar a foto.");
        perfilFotoAcoes.after(msg);
        setTimeout(() => msg.remove(), 3000);

    } finally {

        btnSalvarFoto.disabled    = false;
        btnSalvarFoto.textContent = traduzir("Salvar foto");

    }

});


// ==========================
// EDITAR NOME
// ==========================

const perfilNomeLinha  = document.getElementById("perfilNomeLinha");
const perfilNomeEditar = document.getElementById("perfilNomeEditar");
const perfilNomeH2     = document.getElementById("perfilNome");
const btnEditarNome    = document.getElementById("btnEditarNome");
const inputNome        = document.getElementById("inputNome");
const btnSalvarNome    = document.getElementById("btnSalvarNome");
const btnCancelarNome  = document.getElementById("btnCancelarNome");
const erroNome         = document.getElementById("erroNome");

btnEditarNome.addEventListener("click", () => {
    inputNome.value = perfilNomeH2.textContent.trim();
    erroNome.style.display = "none";
    perfilNomeLinha.style.display  = "none";
    perfilNomeEditar.style.display = "flex";
    inputNome.focus();
    inputNome.select();
});

btnCancelarNome.addEventListener("click", () => {
    perfilNomeEditar.style.display = "none";
    perfilNomeLinha.style.display  = "flex";
    erroNome.style.display = "none";
});

btnSalvarNome.addEventListener("click", async () => {

    const novoNome = inputNome.value.trim();

    if (novoNome.length < 2) {
        erroNome.textContent   = traduzir("Digite um nome válido.");
        erroNome.style.display = "block";
        return;
    }

    btnSalvarNome.disabled = true;

    try {

        const formData = new FormData();
        formData.append("nome", novoNome);

        const resposta = await fetch("/api/perfil/atualizar", {
            method: "POST",
            body: formData
        });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.erro || traduzir("Erro ao salvar o nome."));
        }

        const nomeFinal = dados.nome || novoNome;

        perfilNomeH2.textContent = nomeFinal;
        document.getElementById("nomeUsuario").textContent = nomeFinal;

        perfilNomeEditar.style.display = "none";
        perfilNomeLinha.style.display  = "flex";

    } catch (erro) {

        console.log("Erro ao salvar nome:", erro);
        erroNome.textContent   = erro.message || traduzir("Erro ao salvar. Tente novamente.");
        erroNome.style.display = "block";

    } finally {

        btnSalvarNome.disabled = false;

    }

});

inputNome.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        btnSalvarNome.click();
    } else if (e.key === "Escape") {
        btnCancelarNome.click();
    }
});


// ==========================
// COPIAR CÓDIGO DE VÍNCULO
// Genérica pra funcionar tanto no botão do header quanto no card
// ==========================

function copiarCodigoGenerico(idCodigo, idIcone, idMensagem) {

    const codigo   = document.getElementById(idCodigo).textContent;
    const icone    = document.getElementById(idIcone);

    if (!codigo || codigo === "---") return;

    navigator.clipboard.writeText(codigo).then(() => {

        if (icone) {
            icone.classList.remove("fa-copy");
            icone.classList.add("fa-check");
        }

        const mensagem = idMensagem ? document.getElementById(idMensagem) : null;
        if (mensagem) mensagem.style.display = "block";

        setTimeout(() => {
            if (icone) {
                icone.classList.remove("fa-check");
                icone.classList.add("fa-copy");
            }
            if (mensagem) mensagem.style.display = "none";
        }, 2000);

    });

}


// ==========================
// COMPARTILHAR COM PACIENTE
// ==========================

document.getElementById("btnNovoPaciente").addEventListener("click", () => {
    const codigo = document.getElementById("codigoVinculo").textContent;
    const mensagem = encodeURIComponent(
        "Olá! Venha conhecer o Bixuco, um aplicativo que ajuda no acompanhamento de crianças com hipersensibilidade sensorial. 🐱\n\n" +
        `Use meu código de vínculo: ${codigo}\n\n` +
        "https://mvp-bixuco.onrender.com"
    );
    window.open(`https://wa.me/?text=${mensagem}`, "_blank");
});


// ==========================
// PAINEL DE NOTIFICAÇÕES
// ==========================

const painelNotificacoes = document.getElementById("painelNotificacoes");
const listaNotificacoes  = document.getElementById("listaNotificacoes");

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
            ? `<div class="painel-vazio">${traduzir("Nenhuma notificação por enquanto.")}</div>`
            : itens.map(formatarItemNotificacao).join("");

        const naoLidas = itens.filter(i => !i.lida).length;
        document.getElementById("quantidadeNotificacoes").textContent = naoLidas;

    } catch (erro) {
        console.log("Erro ao carregar notificações:", erro);
        listaNotificacoes.innerHTML =
            `<div class="painel-vazio">${traduzir("Não foi possível carregar.")}</div>`;
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


// ==========================
// TEMA CLARO / ESCURO
// (faltava esta parte inteira — por isso os botões não faziam nada)
// ==========================

function aplicarTema(tema) {
    document.body.classList.remove("tema-claro", "tema-escuro");
    document.body.classList.add(`tema-${tema}`);
    document.getElementById("btnClaro").classList.toggle("ativo", tema === "claro");
    document.getElementById("btnEscuro").classList.toggle("ativo", tema === "escuro");
    localStorage.setItem("tema", tema);
}

document.getElementById("btnClaro").addEventListener("click",  () => aplicarTema("claro"));
document.getElementById("btnEscuro").addEventListener("click", () => aplicarTema("escuro"));


// ==========================
// INICIALIZAR
// ==========================

const temaSalvo = localStorage.getItem("tema") || "claro";
aplicarTema(temaSalvo);

aplicarIdiomaEstatico();
carregarPerfil();
carregarNotificacoes();

// ==========================
// LIGA OS BOTÕES DE COPIAR (header e card)
// ==========================

document.getElementById("btnCodigoCopiarHeader").addEventListener("click", () => {
    copiarCodigoGenerico("codigoTerapeutaHeader", "iconeCopiarHeader");
});

document.getElementById("btnCopiarCodigo").addEventListener("click", () => {
    copiarCodigoGenerico("codigoVinculo", "iconeCopiar", "mensagemCopiado");
});