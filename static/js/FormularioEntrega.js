
// ==========================
// TEMA — mesma implementação da relatorios.html
// ==========================

function aplicarTema(tema) {
    document.body.classList.remove("tema-claro", "tema-escuro");
    document.body.classList.add(`tema-${tema}`);
    document.getElementById("btnClaro").classList.toggle("ativo", tema === "claro");
    document.getElementById("btnEscuro").classList.toggle("ativo", tema === "escuro");
    localStorage.setItem("tema", tema);
}

document.getElementById("btnClaro").addEventListener("click", () => aplicarTema("claro"));
document.getElementById("btnEscuro").addEventListener("click", () => aplicarTema("escuro"));

const temaSalvo = localStorage.getItem("tema") || "claro";
aplicarTema(temaSalvo);

// ==========================
// TRADUÇÃO MANUAL — mesmo sistema da relatorios.html
// ==========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    "CEP não encontrado.":                                      "ZIP code not found.",
    "Digite um CEP válido.":                                    "Enter a valid ZIP code.",
    "Informe a rua.":                                           "Enter the street.",
    "Informe o número.":                                        "Enter the number.",
    "Informe o bairro.":                                        "Enter the neighborhood.",
    "Informe a cidade.":                                        "Enter the city.",
    "Selecione o estado.":                                      "Select the state.",
    "Enviando...":                                              "Sending...",
    "Continuar":                                                "Continue",
    "Não foi possível salvar o endereço. Confira os campos e tente novamente.":
                                                                    "Couldn't save the address. Check the fields and try again.",
    "Não foi possível conectar. Verifique sua internet e tente novamente.":
                                                                    "Couldn't connect. Check your internet and try again."
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
        idiomaAtual === "en" ? "Traduzir para o português" : "Translate to English";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);
    aplicarIdiomaEstatico();
});

aplicarIdiomaEstatico();

// =========================
// DADOS DO USUÁRIO NO TOPO
// =========================

async function carregarDadosUsuario() {
    try {
        const resposta = await fetch("/api/home");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) throw new Error(`Falha ao carregar dados do usuário (status ${resposta.status})`);

        const dados = await resposta.json();

        document.getElementById("nomeUsuario").textContent = dados.nome || "Usuário";
        document.getElementById("tipoConta").textContent   = dados.tipoConta || "Responsável";

        if (dados.fotoPerfil) {
            document.getElementById("fotoUsuario").src = dados.fotoPerfil;
        }

    } catch (erro) {
        console.log("Erro ao carregar dados do usuário:", erro);
        document.getElementById("nomeUsuario").textContent = "Usuário";
        document.getElementById("tipoConta").textContent   = "Responsável";
    }
}

carregarDadosUsuario();

// =========================
// NOTIFICAÇÕES
// =========================

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

carregarNotificacoes();

// =========================
// MÁSCARA E BUSCA DO CEP
// =========================

function mascaraCEP(valor) {
    valor = valor.replace(/\D/g, "").slice(0, 8);
    if (valor.length > 5) valor = valor.replace(/(\d{5})(\d{0,3})/, "$1-$2");
    return valor;
}

const campoCep = document.getElementById("cep");

campoCep.addEventListener("input", () => {
    campoCep.value = mascaraCEP(campoCep.value);
});

campoCep.addEventListener("blur", async () => {

    const cep = campoCep.value.replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await resposta.json();

        if (dados.erro) {
            mostrarErro("cep", "erro-cep", traduzir("CEP não encontrado."));
            return;
        }

        document.getElementById("rua").value    = dados.logradouro || "";
        document.getElementById("bairro").value = dados.bairro || "";
        document.getElementById("cidade").value = dados.localidade || "";
        document.getElementById("estado").value = dados.uf || "";

        limparErroCampo("cep", "erro-cep");

    } catch (erro) {
        console.log("Erro ao buscar CEP:", erro);
    }
});

// =========================
// ERROS
// =========================

function mostrarErro(inputId, erroId, mensagem) {
    const input = document.getElementById(inputId);
    const erro  = document.getElementById(erroId);
    if (!input || !erro) return;
    erro.textContent = mensagem;
}

function limparErroCampo(inputId, erroId) {
    const erro = document.getElementById(erroId);
    if (erro) erro.textContent = "";
}

function limparErros() {
    ["cep", "rua", "numero", "bairro", "cidade", "estado"].forEach(id => limparErroCampo(id, "erro-" + id));
    document.getElementById("erro-geral").style.display = "none";
}

function validarCampos() {
    limparErros();
    let valido = true;

    const cep     = campoCep.value.replace(/\D/g, "");
    const rua     = document.getElementById("rua").value.trim();
    const numero  = document.getElementById("numero").value.trim();
    const bairro  = document.getElementById("bairro").value.trim();
    const cidade  = document.getElementById("cidade").value.trim();
    const estado  = document.getElementById("estado").value;

    if (cep.length !== 8) {
        mostrarErro("cep", "erro-cep", traduzir("Digite um CEP válido."));
        valido = false;
    }
    if (!rua) {
        mostrarErro("rua", "erro-rua", traduzir("Informe a rua."));
        valido = false;
    }
    if (!numero) {
        mostrarErro("numero", "erro-numero", traduzir("Informe o número."));
        valido = false;
    }
    if (!bairro) {
        mostrarErro("bairro", "erro-bairro", traduzir("Informe o bairro."));
        valido = false;
    }
    if (!cidade) {
        mostrarErro("cidade", "erro-cidade", traduzir("Informe a cidade."));
        valido = false;
    }
    if (!estado) {
        mostrarErro("estado", "erro-estado", traduzir("Selecione o estado."));
        valido = false;
    }

    return valido;
}

// =========================
// ENVIO
// =========================

document.getElementById("formEndereco").addEventListener("submit", async (evento) => {

    evento.preventDefault();
    if (!validarCampos()) return;

    const btnContinuar = document.getElementById("btnContinuar");
    const textoBtn     = document.getElementById("textoBtnContinuar");
    const erroGeral    = document.getElementById("erro-geral");

    btnContinuar.disabled = true;
    textoBtn.textContent  = traduzir("Enviando...");

    const endereco = {
        cep:         campoCep.value,
        rua:         document.getElementById("rua").value.trim(),
        numero:      document.getElementById("numero").value.trim(),
        complemento: document.getElementById("complemento").value.trim(),
        bairro:      document.getElementById("bairro").value.trim(),
        cidade:      document.getElementById("cidade").value.trim(),
        estado:      document.getElementById("estado").value
    };

    try {
        const resposta = await fetch("/api/pedidos/endereco", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(endereco)
        });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) {
            erroGeral.textContent   = traduzir("Não foi possível salvar o endereço. Confira os campos e tente novamente.");
            erroGeral.style.display = "block";
            return;
        }

        window.location.href = "/PedidoConfirmado";

    } catch (erro) {
        console.log("Erro ao salvar endereço:", erro);
        erroGeral.textContent   = traduzir("Não foi possível conectar. Verifique sua internet e tente novamente.");
        erroGeral.style.display = "block";
    } finally {
        btnContinuar.disabled = false;
        textoBtn.textContent  = traduzir("Continuar");
    }
});

// ==========================
// LIGA BOTÃO DE RELATÓRIO E ACESSO AO PERFIL
// ==========================

document.getElementById("btnRelatorioDiario").addEventListener("click", () => {
    location.href = "/RelatorioDiario";
});

document.getElementById("fotoUsuario").addEventListener("click", () => {
    window.location.href = "/perfil";
});

document.getElementById("wrapperPerfilTopo").addEventListener("click", () => {
    window.location.href = "/perfil";
});