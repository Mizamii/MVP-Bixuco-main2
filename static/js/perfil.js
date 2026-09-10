function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

// ==========================
// ESTADO GLOBAL
// ==========================

let criancaAtual = null;
let perfilCarregado = false;
let ultimoUsuario = null;
let ultimoVinculo = null;
let planoCodigo = "gratis"; // valor padrão até /api/perfil responder

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

        if (!resposta.ok) {
            throw new Error("Erro ao carregar perfil");
        }

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

    // planoCodigo é o valor "cru" (gratis / medio / completo) usado
    // pra decidir o que mostrar no card do terapeuta — "plano" é
    // só o nome bonito pra exibir na tela.
    planoCodigo = usuario.planoCodigo || "gratis";

    const nome     = usuario.nome     || traduzir("Usuário");
    const tipoConta = traduzir(usuario.tipoConta || "Responsável");
    const plano    = usuario.plano    || traduzir("Plano gratuito");

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

    const diasSeguidos = usuario.diasConsecutivos || 0;
    const maiorSequencia = usuario.maiorOfensiva ?? usuario.diasConsecutivos ?? 0;

    document.getElementById("badgeDias").innerHTML = idiomaAtual === "en"
        ? `🔥 ${diasSeguidos}-day streak`
        : `🔥 ${diasSeguidos} dias seguidos`;

    document.getElementById("badgeMaiorOfensiva").innerHTML = idiomaAtual === "en"
        ? `🏆 Longest streak: ${maiorSequencia} days`
        : `🏆 Maior sequência: ${maiorSequencia} dias`;

    document.getElementById("badgePlano").textContent = plano;
    document.getElementById("nomePlano").textContent  = plano;

    if (usuario.crianca) {

        criancaAtual = usuario.crianca;

        document.getElementById("nomeCrianca").textContent =
            usuario.crianca.nome;

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

        document.getElementById("nomeCrianca").textContent =
            traduzir("Nenhuma criança");

        document.getElementById("idadeCrianca").textContent =
            traduzir("Cadastre uma criança");

    }

    // Terapeuta é tratado à parte por carregarVinculo(),
    // que decide entre os 5 estados (sem vínculo / pendente /
    // recusado / aceito / bloqueado por plano) usando planoCodigo
    // já preenchido aqui em cima.

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

const linkCrianca         = document.getElementById("linkCrianca");
const modalCrianca        = document.getElementById("modalCrianca");
const btnFecharModalCrianca = document.getElementById("btnFecharModalCrianca");
const criancaFotoWrapper  = document.getElementById("criancaFotoWrapper");
const inputFotoCrianca    = document.getElementById("inputFotoCrianca");
const fotoCriancaModal    = document.getElementById("fotoCriancaModal");
const inputNomeCrianca    = document.getElementById("inputNomeCrianca");
const idadeCriancaModal   = document.getElementById("idadeCriancaModal");
const btnSalvarCrianca    = document.getElementById("btnSalvarCrianca");
const statusCrianca       = document.getElementById("statusCrianca");

let fotoCriancaOriginal = null;
let arquivoFotoCrianca  = null;

// Sempre bloqueia a navegação padrão e só decide o que fazer
// depois de sabermos que os dados do perfil já chegaram
// (evita race condition levando para /adicionar-crianca por engano).
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

    fotoCriancaOriginal = criancaAtual.foto || "/img/perfilPadrao.png";
    fotoCriancaModal.src = fotoCriancaOriginal;

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
    leitor.onload = (e) => {
        fotoCriancaModal.src = e.target.result;
    };
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
// VÍNCULO COM TERAPEUTA
// ==========================

const modalVincular          = document.getElementById("modalVincular");
const btnAbrirModalVincular  = document.getElementById("btnAbrirModalVincular");
const btnTentarOutro         = document.getElementById("btnTentarOutroTerapeuta");
const btnFecharModalVincular = document.getElementById("btnFecharModalVincular");
const inputCodigoTerapeuta   = document.getElementById("inputCodigoTerapeuta");
const erroVincular           = document.getElementById("erroVincular");
const btnEnviarPedidoVinculo = document.getElementById("btnEnviarPedidoVinculo");
const btnCancelarPedido      = document.getElementById("btnCancelarPedido");

const estadoSemVinculo = document.getElementById("estadoSemVinculo");
const estadoPendente   = document.getElementById("estadoPendente");
const estadoRecusado   = document.getElementById("estadoRecusado");
const estadoAceito     = document.getElementById("estadoAceito");
const estadoBloqueado  = document.getElementById("estadoBloqueado");

async function carregarVinculo() {

    // Vínculo com terapeuta é exclusivo do plano Premium (completo).
    // O backend já bloqueia /solicitar, /cancelar e /remover pra
    // quem não tem o plano — isso aqui é só a parte visual, pra
    // nem mostrar o botão de vincular pra quem não pode usar, e
    // pra não gastar uma chamada de API à toa.
    if (!["completo", "terapeuta"].includes(planoCodigo)) {
        ultimoVinculo = { status: "bloqueado" };
        atualizarEstadoVinculo(ultimoVinculo);
        return;
    }

    try {

        const resposta = await fetch("/api/vinculos/status");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) throw new Error();

        const dados = await resposta.json();
        ultimoVinculo = dados;
        atualizarEstadoVinculo(dados);

    } catch (erro) {

        console.log("Erro ao carregar vínculo:", erro);
        ultimoVinculo = { status: "sem_vinculo" };
        atualizarEstadoVinculo(ultimoVinculo);

    }

}

function atualizarEstadoVinculo(dados) {

    estadoSemVinculo.style.display = "none";
    estadoPendente.style.display   = "none";
    estadoRecusado.style.display   = "none";
    estadoAceito.style.display     = "none";
    estadoBloqueado.style.display  = "none";

    if (dados.status === "bloqueado") {

        estadoBloqueado.style.display = "block";

    } else if (dados.status === "pendente") {

        document.getElementById("nomeTerapeutaPendente").textContent =
            dados.nomeTerapeuta || "...";

        estadoPendente.style.display = "block";

    } else if (dados.status === "aceito") {

        document.getElementById("nomeTerapeutaVinculado").textContent =
            dados.nomeTerapeuta || "...";

        document.getElementById("crpTerapeutaVinculado").textContent =
            `${traduzir("Código")}: ${dados.crpTerapeuta || "..."}`;

        if (dados.fotoTerapeuta) {
            document.getElementById("fotoTerapeutaVinculado").src =
                dados.fotoTerapeuta;
        }

        document.getElementById("confirmarRemocao").style.display = "none";
        document.getElementById("btnRemoverTerapeuta").style.display = "block";

        estadoAceito.style.display = "block";

    } else if (dados.status === "recusado") {

        estadoRecusado.style.display = "block";

    } else {

        estadoSemVinculo.style.display = "block";

    }

}

function abrirModalVincular() {
    inputCodigoTerapeuta.value    = "";
    erroVincular.style.display    = "none";
    modalVincular.classList.add("aberto");
    document.body.style.overflow  = "hidden";
}

function fecharModalVincular() {
    modalVincular.classList.remove("aberto");
    document.body.style.overflow = "";
}

if (btnAbrirModalVincular) {
    btnAbrirModalVincular.addEventListener("click", abrirModalVincular);
}

if (btnTentarOutro) {
    btnTentarOutro.addEventListener("click", abrirModalVincular);
}

btnFecharModalVincular.addEventListener("click", fecharModalVincular);

modalVincular.addEventListener("click", (e) => {
    if (e.target === modalVincular) fecharModalVincular();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalVincular.classList.contains("aberto")) {
        fecharModalVincular();
    }
});

inputCodigoTerapeuta.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        btnEnviarPedidoVinculo.click();
    }
});

btnEnviarPedidoVinculo.addEventListener("click", async () => {

    const codigo = inputCodigoTerapeuta.value.trim();

    erroVincular.style.display = "none";

    if (!codigo) {
        erroVincular.textContent   = traduzir("Digite o código do terapeuta.");
        erroVincular.style.display = "block";
        return;
    }

    btnEnviarPedidoVinculo.disabled    = true;
    btnEnviarPedidoVinculo.textContent = traduzir("Enviando...");

    try {

        const resposta = await fetch("/api/vinculos/solicitar", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ codigoTerapeuta: codigo })
        });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            erroVincular.textContent   = dados.erro || traduzir("Erro ao enviar pedido.");
            erroVincular.style.display = "block";
            return;
        }

        fecharModalVincular();
        atualizarEstadoVinculo({
            status: "pendente",
            nomeTerapeuta: dados.nomeTerapeuta
        });

    } catch (erro) {

        console.log("Erro ao enviar pedido de vínculo:", erro);
        erroVincular.textContent   = traduzir("Erro ao enviar pedido. Tente novamente.");
        erroVincular.style.display = "block";

    } finally {

        btnEnviarPedidoVinculo.disabled    = false;
        btnEnviarPedidoVinculo.textContent = traduzir("Enviar pedido");

    }

});

if (btnCancelarPedido) {

    btnCancelarPedido.addEventListener("click", async () => {

        try {

            const resposta = await fetch("/api/vinculos/cancelar", {
                method: "POST"
            });

            if (resposta.status === 401) {
                window.location.href = "/logar";
                return;
            }

            if (!resposta.ok) throw new Error();

            atualizarEstadoVinculo({ status: "sem_vinculo" });

        } catch (erro) {

            console.log("Erro ao cancelar pedido:", erro);
            alert("Erro ao cancelar pedido. Tente novamente.");

        }

    });

}

// ==========================
// REMOVER TERAPEUTA
// ==========================

const btnRemover       = document.getElementById("btnRemoverTerapeuta");
const confirmarRemocao = document.getElementById("confirmarRemocao");
const btnConfirmar     = document.getElementById("btnConfirmarRemover");
const btnCancelar      = document.getElementById("btnCancelarRemover");

if (btnRemover) {

    btnRemover.addEventListener("click", () => {
        confirmarRemocao.style.display = "block";
        btnRemover.style.display = "none";
    });

}

if (btnCancelar) {

    btnCancelar.addEventListener("click", () => {
        confirmarRemocao.style.display = "none";
        btnRemover.style.display = "block";
    });

}

if (btnConfirmar) {

    btnConfirmar.addEventListener("click", async () => {

        btnConfirmar.disabled    = true;
        btnConfirmar.textContent = traduzir("Removendo...");

        try {

            const resposta = await fetch("/api/vinculos/remover", {
                method: "POST"
            });

            if (resposta.status === 401) {
                window.location.href = "/logar";
                return;
            }

            if (resposta.ok) {

                confirmarRemocao.style.display = "none";
                atualizarEstadoVinculo({ status: "sem_vinculo" });

            } else {

                const dados = await resposta.json();
                alert(dados.erro || traduzir("Erro ao remover terapeuta."));

            }

        } catch (erro) {

            console.log("Erro ao remover terapeuta:", erro);

        } finally {

            btnConfirmar.disabled    = false;
            btnConfirmar.textContent = traduzir("Sim, remover");

        }

    });

}

// ==========================
// MODAL — TERAPEUTA REMOVIDO POR DOWNGRADE
// ==========================

const modalTerapeutaRemovido = document.getElementById("modalTerapeutaRemovido");
const btnFecharModalTerapeutaRemovido = document.getElementById("btnFecharModalTerapeutaRemovido");
const btnOkTerapeutaRemovido = document.getElementById("btnOkTerapeutaRemovido");

let notificacaoDowngradeId = null;

// Checa se existe uma notificação (não lida) avisando que o
// vínculo foi removido por causa de um downgrade de plano.
// Se existir, abre o modal contando isso pro usuário.
async function verificarRemocaoPorDowngrade() {

    try {

        const resposta = await fetch("/api/notificacoes");
        if (!resposta.ok) return;

        const dados = await resposta.json();

        const notificacao = (dados.notificacoes || []).find(
            n => n.tipo === "vinculo_removido_plano" && !n.lida
        );

        if (notificacao) {
            notificacaoDowngradeId = notificacao.id;
            modalTerapeutaRemovido.classList.add("aberto");
            document.body.style.overflow = "hidden";
        }

    } catch (erro) {

        console.log("Erro ao verificar remoção por downgrade:", erro);

    }

}

async function fecharModalTerapeutaRemovido() {

    modalTerapeutaRemovido.classList.remove("aberto");
    document.body.style.overflow = "";

    // Marca só essa notificação como lida — não mexe nas outras,
    // pra não zerar o sininho de notificações por engano.
    if (notificacaoDowngradeId) {

        try {
            await fetch(`/api/notificacoes/${notificacaoDowngradeId}/marcar-lida`, {
                method: "POST"
            });
        } catch (erro) {
            console.log("Erro ao marcar notificação como lida:", erro);
        }

        notificacaoDowngradeId = null;

    }

}

btnFecharModalTerapeutaRemovido.addEventListener("click", fecharModalTerapeutaRemovido);
btnOkTerapeutaRemovido.addEventListener("click", fecharModalTerapeutaRemovido);

modalTerapeutaRemovido.addEventListener("click", (e) => {
    if (e.target === modalTerapeutaRemovido) fecharModalTerapeutaRemovido();
});

// ==========================
// TRADUÇÃO MANUAL
// ==========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    "Usuário":                                  "User",
    "Responsável":                               "Guardian",
    "Plano gratuito":                            "Free plan",
    "Nenhuma criança":                           "No child",
    "Cadastre uma criança":                      "Register a child",
    "Membro desde":                              "Member since",
    "Código":                                    "Code",
    "anos":                                      "years old",
    "Digite um nome válido.":                    "Enter a valid name.",
    "Erro ao salvar. Tente novamente.":          "Error saving. Please try again.",
    "Erro ao salvar a foto. Tente novamente.":   "Error saving the photo. Please try again.",
    "Erro ao salvar o nome.":                    "Error saving the name.",
    "Erro ao salvar a foto.":                    "Error saving the photo.",
    "Erro ao salvar as alterações.":             "Error saving the changes.",
    "Digite o código do terapeuta.":             "Enter the therapist's code.",
    "Erro ao enviar pedido.":                    "Error sending request.",
    "Erro ao enviar pedido. Tente novamente.":   "Error sending request. Please try again.",
    "Erro ao remover terapeuta.":                "Error removing therapist.",
    "Alterações salvas com sucesso!":            "Changes saved successfully!",
    "Salvando...":                               "Saving...",
    "Enviando...":                               "Sending...",
    "Removendo...":                              "Removing...",
    "Salvar foto":                               "Save photo",
    "Salvar alterações":                         "Save changes",
    "Sim, remover":                              "Yes, remove",
    "Enviar pedido":                              "Send request",
    "Carregando...":                             "Loading..."
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

    atualizarTextoBotaoTraducao();

}

function atualizarTextoBotaoTraducao() {
    document.getElementById("textoTradutor").textContent = idiomaAtual === "en"
        ? "Voltar para português"
        : "Traduzir para inglês";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {

    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);

    aplicarIdiomaEstatico();

    // Reaplica a tradução em cima dos dados que já vieram da API,
    // sem precisar recarregar a página nem refazer as chamadas
    if (ultimoUsuario)  preencherPerfil(ultimoUsuario);
    if (ultimoVinculo)  atualizarEstadoVinculo(ultimoVinculo);

});

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
            ? `<div class="painel-vazio">Nenhuma notificação por enquanto.</div>`
            : itens.map(formatarItemNotificacao).join("");

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


// ==========================
// INICIAR
// ==========================

// carregarPerfil() precisa terminar ANTES de carregarVinculo(),
// porque é ela que preenche planoCodigo — sem esperar, o card do
// terapeuta pode decidir com o valor padrão ("gratis") por um
// instante, mesmo que o usuário seja premium.
async function iniciarPagina() {
    await carregarPerfil();
    carregarVinculo();
    verificarRemocaoPorDowngrade();
}

aplicarIdiomaEstatico();
carregarNotificacoes();
iniciarPagina();

// ==========================
// SUBSTITUI OS ONCLICK/ONERROR INLINE (removidos por causa do CSP)
// ==========================

document.getElementById("btnRelatorioDiario").addEventListener("click", () => {
    location.href = "/RelatorioDiario";
});

fotoUsuarioImg.addEventListener("click", () => {
    window.location.href = "/perfil";
});

fotoUsuarioImg.addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

document.getElementById("wrapperPerfilTopo").addEventListener("click", () => {
    window.location.href = "/perfil";
});

document.getElementById("fotoTerapeutaVinculado").addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});