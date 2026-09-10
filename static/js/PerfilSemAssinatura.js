
function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

// ==========================
// ESTADO GLOBAL
// ==========================

let criancaAtual   = null;
let perfilCarregado = false;
let ultimoUsuario  = null;

// ==========================
// TRADUÇÃO MANUAL (mesmo padrão da versão com assinatura)
// ==========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    "Usuário":                                "User",
    "Responsável":                             "Guardian",
    "Nenhuma criança":                         "No child",
    "Cadastre uma criança":                    "Register a child",
    "Membro desde":                            "Member since",
    "anos":                                    "years old",
    "Digite um nome válido.":                  "Enter a valid name.",
    "Erro ao salvar. Tente novamente.":        "Error saving. Please try again.",
    "Erro ao salvar a foto. Tente novamente.": "Error saving the photo. Please try again.",
    "Erro ao salvar o nome.":                  "Error saving the name.",
    "Erro ao salvar a foto.":                  "Error saving the photo.",
    "Erro ao salvar as alterações.":           "Error saving the changes.",
    "Alterações salvas com sucesso!":          "Changes saved successfully!",
    "Salvando...":                             "Saving...",
    "Salvar foto":                             "Save photo",
    "Salvar alterações":                       "Save changes",
    "Carregando...":                           "Loading..."
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

    document.querySelectorAll("[data-pt-title]").forEach(el => {
        el.title = idiomaAtual === "en"
            ? (el.dataset.enTitle || el.dataset.ptTitle)
            : el.dataset.ptTitle;
    });

    document.getElementById("textoTradutor").textContent =
        idiomaAtual === "en" ? "Voltar para português" : "Traduzir para inglês";

}

document.getElementById("btnTraduzir").addEventListener("click", () => {

    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);

    aplicarIdiomaEstatico();

    // Reaplica a tradução em cima dos dados já carregados,
    // sem precisar recarregar a página nem refazer as chamadas
    if (ultimoUsuario) preencherPerfil(ultimoUsuario);

});

// ==========================
// CARREGAR DADOS DO PERFIL
// ==========================

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
        preencherPerfil(usuario);

    } catch (erro) {

        console.log("Erro ao carregar perfil:", erro);

    } finally {

        perfilCarregado = true;

    }

}

function preencherPerfil(usuario) {

    const nome      = usuario.nome      || traduzir("Usuário");
    const tipoConta = traduzir(usuario.tipoConta || "Responsável");

    document.getElementById("nomeUsuario").textContent = nome;
    document.getElementById("perfilNome").textContent  = nome;
    document.getElementById("tipoConta").textContent   = tipoConta;

    document.getElementById("perfilDescricao").textContent =
        `${tipoConta} • ${traduzir("Membro desde")} ${usuario.anoCadastro || "2026"}`;

    if (usuario.fotoPerfil) {
        document.getElementById("fotoUsuario").src = usuario.fotoPerfil;
        document.getElementById("fotoPerfil").src  = usuario.fotoPerfil;
        fotoOriginalSrc = usuario.fotoPerfil;
    }

    // 🔧 FIX: bloco "Sobre a conta"
    // ⚠️ usuario.email só vem preenchido depois de você adicionar
    // "email: usuario.email," no res.json() da rota /api/perfil no server.js
    document.getElementById("infoEmail").textContent       = usuario.email || "—";
    document.getElementById("infoTipoConta").textContent   = tipoConta;
    document.getElementById("infoAnoCadastro").textContent = usuario.anoCadastro || "—";

    if (usuario.crianca) {

        criancaAtual = usuario.crianca;

        document.getElementById("nomeCrianca").textContent = usuario.crianca.nome;

        document.getElementById("idadeCrianca").textContent = idiomaAtual === "en"
            ? `${usuario.crianca.idade} years old`
            : `${usuario.crianca.idade} anos`;

        if (usuario.crianca.foto) {
            document.getElementById("avatarCrianca").innerHTML =
                `<img src="${escaparHTML(usuario.crianca.foto)}" alt="${escaparHTML(usuario.crianca.nome)}">`;
        } else {
            document.getElementById("avatarCrianca").textContent =
                usuario.crianca.nome.charAt(0).toUpperCase();
        }

    } else {

        criancaAtual = null;

        document.getElementById("nomeCrianca").textContent  = traduzir("Nenhuma criança");
        document.getElementById("idadeCrianca").textContent = traduzir("Cadastre uma criança");

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

        console.log("Erro ao salvar foto de perfil:", erro);
        alert(erro.message || traduzir("Erro ao salvar a foto. Tente novamente."));

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
// MODAL DA CRIANÇA
// ==========================

const linkCrianca           = document.getElementById("linkCrianca");
const modalCrianca          = document.getElementById("modalCrianca");
const btnFecharModalCrianca = document.getElementById("btnFecharModalCrianca");
const criancaFotoWrapper    = document.getElementById("criancaFotoWrapper");
const inputFotoCrianca      = document.getElementById("inputFotoCrianca");
const fotoCriancaModal      = document.getElementById("fotoCriancaModal");
const inputNomeCrianca      = document.getElementById("inputNomeCrianca");
const idadeCriancaModal     = document.getElementById("idadeCriancaModal");
const btnSalvarCrianca      = document.getElementById("btnSalvarCrianca");
const statusCrianca         = document.getElementById("statusCrianca");

let arquivoFotoCrianca = null;

// Bloqueia a navegação padrão e só decide o que fazer depois
// que os dados do perfil chegarem (evita ir para /AdicionarC por engano)
linkCrianca.addEventListener("click", (e) => {

    e.preventDefault();

    if (!perfilCarregado) return;

    if (criancaAtual) {
        abrirModalCrianca();
    } else {
        window.location.href = "/AdicionarC";
    }

});

function abrirModalCrianca() {

    inputNomeCrianca.value  = criancaAtual.nome || "";
    idadeCriancaModal.value = idiomaAtual === "en"
        ? `${criancaAtual.idade ?? "0"} years old`
        : `${criancaAtual.idade ?? "0"} anos`;

    fotoCriancaModal.src = criancaAtual.foto || "/img/perfilPadrao.png";

    arquivoFotoCrianca = null;
    inputFotoCrianca.value = "";

    statusCrianca.className = "status-crianca";

    modalCrianca.classList.add("aberto");
    document.body.style.overflow = "hidden";

}

function fecharModalCrianca() {
    modalCrianca.classList.remove("aberto");
    document.body.style.overflow = "";
}

btnFecharModalCrianca.addEventListener("click", fecharModalCrianca);

modalCrianca.addEventListener("click", (e) => {
    if (e.target === modalCrianca) fecharModalCrianca();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalCrianca.classList.contains("aberto")) {
        fecharModalCrianca();
    }
});

criancaFotoWrapper.addEventListener("click", () => {
    inputFotoCrianca.click();
});

inputFotoCrianca.addEventListener("change", () => {

    const arquivo = inputFotoCrianca.files && inputFotoCrianca.files[0];
    if (!arquivo) return;

    arquivoFotoCrianca = arquivo;

    const leitor = new FileReader();
    leitor.onload = (e) => { fotoCriancaModal.src = e.target.result; };
    leitor.readAsDataURL(arquivo);

});

function mostrarStatusCrianca(texto, tipo) {
    statusCrianca.textContent = texto;
    statusCrianca.className   = `status-crianca visivel ${tipo}`;
}

btnSalvarCrianca.addEventListener("click", async () => {

    const novoNome = inputNomeCrianca.value.trim();

    if (novoNome.length < 2) {
        mostrarStatusCrianca(traduzir("Digite um nome válido."), "erro");
        return;
    }

    btnSalvarCrianca.disabled    = true;
    btnSalvarCrianca.textContent = traduzir("Salvando...");

    try {

        const formData = new FormData();
        formData.append("nome", novoNome);

        if (arquivoFotoCrianca) {
            formData.append("fotoCrianca", arquivoFotoCrianca);
        }

        const resposta = await fetch("/api/crianca/atualizar", {
            method: "POST",
            body: formData
        });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.erro || traduzir("Erro ao salvar as alterações."));
        }

        criancaAtual.nome = dados.nome || novoNome;
        if (dados.fotoUrl) criancaAtual.foto = dados.fotoUrl;

        document.getElementById("nomeCrianca").textContent = criancaAtual.nome;

        if (criancaAtual.foto) {
            document.getElementById("avatarCrianca").innerHTML =
                `<img src="${escaparHTML(criancaAtual.foto)}" alt="${escaparHTML(criancaAtual.nome)}">`;
        } else {
            document.getElementById("avatarCrianca").textContent =
                criancaAtual.nome.charAt(0).toUpperCase();
        }

        mostrarStatusCrianca(traduzir("Alterações salvas com sucesso!"), "sucesso");

        setTimeout(fecharModalCrianca, 1400);

    } catch (erro) {

        console.log("Erro ao salvar criança:", erro);
        mostrarStatusCrianca(erro.message, "erro");

    } finally {

        btnSalvarCrianca.disabled    = false;
        btnSalvarCrianca.textContent = traduzir("Salvar alterações");

    }

});

// ==========================
// PAINEL DE NOTIFICAÇÕES (SININHO)
// Só mostra notificações do tipo "novidade" (promoções)
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
        const itens = (dados.notificacoes || []).filter(n => n.tipo === "novidade");

        listaNotificacoes.innerHTML = itens.length === 0
            ? `<div class="painel-vazio">Nenhuma promoção por enquanto.</div>`
            : itens.map(formatarItemNotificacao).join("");

        const naoLidas = itens.filter(item => !item.lida).length;
        document.getElementById("quantidadeNotificacoes").textContent = naoLidas;

    } catch (erro) {
        console.log("Erro ao carregar notificações:", erro);
        listaNotificacoes.innerHTML = `<div class="painel-vazio">Não foi possível carregar.</div>`;
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
});

document.addEventListener("click", (e) => {
    if (!painelNotificacoes.contains(e.target)) {
        painelNotificacoes.classList.remove("aberto");
    }
});

// ==========================
// TEMA
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
// INICIAR
// ==========================

const temaSalvo = localStorage.getItem("tema") || "claro";
aplicarTema(temaSalvo);

aplicarIdiomaEstatico();
carregarNotificacoes();
carregarPerfil();