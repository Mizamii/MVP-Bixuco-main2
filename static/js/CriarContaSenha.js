// ==========================
// TRADUÇÃO MANUAL
// ==========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionarioCriarContaSenha = {
    "Mostrar senha": "Show password",
    "Esconder senha": "Hide password",
    "Mostrar confirmação de senha": "Show password confirmation",
    "Esconder confirmação de senha": "Hide password confirmation",
    "A senha deve: ": "Password must: ",
    " -> A senha deve ter pelo menos 6 caracteres.": " -> Password must be at least 6 characters.",
    " -> A senha deve conter pelo menos uma letra maiúscula.": " -> Password must contain at least one uppercase letter.",
    " -> A senha deve conter pelo menos um caractere especial.": " -> Password must contain at least one special character.",
    "As senhas não coincidem.": "Passwords do not match.",
    "A senha ainda não atende aos requisitos.": "Password still doesn't meet the requirements.",
    "Criando conta...": "Creating account...",
    "Continuar": "Continue",
    "Erro ao criar conta. Tente novamente.": "Error creating account. Try again.",
    "Erro de conexão. Verifique sua internet e tente novamente.": "Connection error. Check your internet and try again."
};

function traduzir(texto) {
    if (idiomaAtual === "pt" || texto == null) return texto;
    return dicionarioCriarContaSenha[texto] || texto;
}

function aplicarIdiomaEstatico() {
    document.querySelectorAll("[data-pt]").forEach(el => {
        el.textContent = idiomaAtual === "en"
            ? (el.dataset.en || el.dataset.pt)
            : el.dataset.pt;
    });

    document.querySelectorAll("[data-pt-placeholder]").forEach(el => {
        el.placeholder = idiomaAtual === "en"
            ? (el.dataset.enPlaceholder || el.dataset.ptPlaceholder)
            : el.dataset.ptPlaceholder;
    });

    document.getElementById("textoTradutor").textContent =
        idiomaAtual === "en" ? "Traduzir para o português" : "Traduzir para o inglês";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);
    aplicarIdiomaEstatico();
});

aplicarIdiomaEstatico();

// ==========================
// MOSTRAR / ESCONDER SENHA
// ==========================

function toggleSenha(inputId, iconeId) {

    const input = document.getElementById(inputId);
    const icone = document.getElementById(iconeId);
    const botao = icone.closest("button");

    const ehConfirmacao = inputId === "confirmarSenha";
    const rotuloMostrar  = ehConfirmacao ? "Mostrar confirmação de senha" : "Mostrar senha";
    const rotuloEsconder = ehConfirmacao ? "Esconder confirmação de senha" : "Esconder senha";

    if (input.type === "password") {

        input.type = "text";
        icone.classList.remove("fa-eye");
        icone.classList.add("fa-eye-slash");
        if (botao) botao.setAttribute("aria-label", traduzir(rotuloEsconder));

    } else {

        input.type = "password";
        icone.classList.remove("fa-eye-slash");
        icone.classList.add("fa-eye");
        if (botao) botao.setAttribute("aria-label", traduzir(rotuloMostrar));

    }

}

// ==========================
// MOSTRAR / LIMPAR ERROS
// ==========================

// Usa innerHTML (em vez de textContent) para suportar a lista de
// requisitos da senha com quebras de linha (<br>) — ver validarCampos()
function mostrarErro(inputId, erroId, mensagem, permitirHTML = false) {

    const input = document.getElementById(inputId);
    const erro  = document.getElementById(erroId);

    if (!input || !erro) {
        const erroGeral = document.getElementById("erro-geral");
        if (erroGeral) {
            erroGeral.textContent   = mensagem;
            erroGeral.style.display = "block";
        }
        return;
    }

    input.classList.add("input-erro");

    // Só permite HTML quando explicitamente pedido (lista fixa de requisitos
    // de senha, escrita pelo próprio código). Qualquer mensagem vinda do
    // servidor ou de outro lugar usa textContent, sem risco de XSS.
    if (permitirHTML) {
        erro.innerHTML = mensagem;
    } else {
        erro.textContent = mensagem;
    }

    erro.style.display = "block";
    erro.dataset.jaTentou = "true";

    setTimeout(() => {
        input.classList.remove("input-erro");
    }, 500);

}

function limparErros() {

    ["senha", "confirmarSenha"].forEach(id => {

        const campo = document.getElementById(id);
        const erro  = document.getElementById("erro-" + id);

        if (campo) campo.classList.remove("input-erro");

        if (erro) {
            erro.style.display = "none";
            erro.textContent   = "";
        }

    });

    // Limpa o erro geral do servidor
    const erroGeral = document.getElementById("erro-geral");
    if (erroGeral) erroGeral.style.display = "none";

}

// ==========================
// VALIDAÇÃO LOCAL
// ==========================

function validarCampos() {

    limparErros();
    let valido = true;

    const senha          = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;
    let erros = [];

    if (senha.length < 6) {
        erros.push(traduzir(" -> A senha deve ter pelo menos 6 caracteres."));
    }

    if (!/[A-Z]/.test(senha)) {
        erros.push(traduzir(" -> A senha deve conter pelo menos uma letra maiúscula."));
    }

    if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\];'/+=]/.test(senha)) {
        erros.push(traduzir(" -> A senha deve conter pelo menos um caractere especial."));
    }

    if (erros.length > 0) {

        mostrarErro(
            "senha",
            "erro-senha",
            traduzir("A senha deve: ") + "<br>" + erros.join("<br>"),
            true
        );

        valido = false;

    }

    // Verifica confirmação só se a senha já passou nas validações acima
    // Evita mostrar dois erros ao mesmo tempo quando a senha é inválida
    if (valido && senha !== confirmarSenha) {

        mostrarErro(
            "confirmarSenha",
            "erro-confirmarSenha",
            traduzir("As senhas não coincidem.")
        );

        valido = false;

    }

    return valido;

}

// ==========================
// VALIDAÇÃO EM TEMPO REAL
// ==========================

const campoSenha = document.getElementById("senha");
const campoConfirmar = document.getElementById("confirmarSenha");

function senhaEhValida(valor) {
    return valor.length >= 6
        && /[A-Z]/.test(valor)
        && /[!@#$%^&*(),.?":{}|<>_\-\\[\];'/+=]/.test(valor);
}

campoSenha.addEventListener("input", () => {
    if (senhaEhValida(campoSenha.value)) {
        limparErroCampo("senha", "erro-senha");
    } else {
        // Se ja tinha passado por validacao (usuario tentou enviar) e agora ficou invalida de novo, mostra erro
        const erroEl = document.getElementById("erro-senha");
        if (erroEl && erroEl.dataset.jaTentou === "true") {
            mostrarErro("senha", "erro-senha", traduzir("A senha ainda não atende aos requisitos."));
        }
    }
});

campoConfirmar.addEventListener("input", () => {
    const senha = campoSenha.value;
    const confirmar = campoConfirmar.value;

    if (confirmar && senha === confirmar) {
        limparErroCampo("confirmarSenha", "erro-confirmarSenha");
    } else if (confirmar) {
        const erroEl = document.getElementById("erro-confirmarSenha");
        if (erroEl && erroEl.dataset.jaTentou === "true") {
            mostrarErro("confirmarSenha", "erro-confirmarSenha", traduzir("As senhas não coincidem."));
        }
    }
});

function limparErroCampo(inputId, erroId) {
    const input = document.getElementById(inputId);
    const erro  = document.getElementById(erroId);
    if (input) input.classList.remove("input-erro");
    if (erro) {
        erro.style.display = "none";
        erro.textContent   = "";
    }
}

// ==========================
// ENVIO DO FORMULÁRIO
// ==========================

// Intercepta o submit e envia via fetch.
// O backend responde em JSON com { sucesso, destino } no caso de êxito
// (destino é /AdicionarC para pai ou /home para psicólogo),
// ou { erro, campo } no caso de falha.
document.getElementById("formSenha").addEventListener("submit", async (evento) => {

    evento.preventDefault();

    if (!validarCampos()) return;

    const btnContinuar = document.getElementById("btnContinuar");
    const erroGeral    = document.getElementById("erro-geral");

    // Desabilita o botão enquanto processa
    btnContinuar.disabled    = true;
    btnContinuar.textContent = traduzir("Criando conta...");

    try {

        // 🔧 Gera o token do reCAPTCHA v3 — roda em segundo plano, sem desafio visual
        const tokenRecaptcha = await new Promise((resolve, reject) => {
            grecaptcha.ready(() => {
                grecaptcha
                    .execute("6LdPBrMtAAAAAHYhyE43BTtGCG1bpU_0CtPuHWmB", { action: "cadastro" })
                    .then(resolve)
                    .catch(reject);
            });
        });

        const resposta = await fetch("/cadastro-finalizar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                senha:           document.getElementById("senha").value,
                confirmarSenha:  document.getElementById("confirmarSenha").value,
                tokenRecaptcha:  tokenRecaptcha
            })
        });

        const dados = await resposta.json();

        if (dados.sucesso) {
            window.location.href = dados.destino;
            return;
        }

        if (!resposta.ok) {

            if (dados.campo) {
                mostrarErro(dados.campo, "erro-" + dados.campo, traduzir(dados.erro));
            } else {
                erroGeral.textContent   = traduzir(dados.erro) || traduzir("Erro ao criar conta. Tente novamente.");
                erroGeral.style.display = "block";
            }

        }

    } catch (erro) {

        console.log("Erro na requisição:", erro);

        erroGeral.textContent   = traduzir("Erro de conexão. Verifique sua internet e tente novamente.");
        erroGeral.style.display = "block";

    } finally {

        // Reabilita o botão independente do resultado
        btnContinuar.disabled    = false;
        btnContinuar.textContent = traduzir("Continuar");

    }

});

// ==========================
// LIGA OS BOTÕES DE MOSTRAR/ESCONDER SENHA
// ==========================

document.getElementById("btnToggleSenha").addEventListener("click", () => {
    toggleSenha("senha", "iconeSenha");
});

document.getElementById("btnToggleConfirmarSenha").addEventListener("click", () => {
    toggleSenha("confirmarSenha", "iconeConfirmarSenha");
});