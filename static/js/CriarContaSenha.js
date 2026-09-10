
// ==========================
// MOSTRAR / ESCONDER SENHA
// ==========================

function toggleSenha(inputId, iconeId) {

    const input = document.getElementById(inputId);
    const icone = document.getElementById(iconeId);

    if (input.type === "password") {

        input.type = "text";
        icone.classList.remove("fa-eye");
        icone.classList.add("fa-eye-slash");

    } else {

        input.type = "password";
        icone.classList.remove("fa-eye-slash");
        icone.classList.add("fa-eye");

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
        erros.push(" -> A senha deve ter pelo menos 6 caracteres.");
    }

    if (!/[A-Z]/.test(senha)) {
        erros.push(" -> A senha deve conter pelo menos uma letra maiúscula.");
    }

    if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\];'/+=]/.test(senha)) {
        erros.push(" -> A senha deve conter pelo menos um caractere especial.");
    }

    if (erros.length > 0) {

        mostrarErro(
            "senha",
            "erro-senha",
            "A senha deve: " + "<br>" + erros.join("<br>"),
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
            "As senhas não coincidem."
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
            mostrarErro("senha", "erro-senha", "A senha ainda não atende aos requisitos.");
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
            mostrarErro("confirmarSenha", "erro-confirmarSenha", "As senhas não coincidem.");
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
    btnContinuar.textContent = "Criando conta...";

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
                mostrarErro(dados.campo, "erro-" + dados.campo, dados.erro);
            } else {
                erroGeral.textContent   = dados.erro || "Erro ao criar conta. Tente novamente.";
                erroGeral.style.display = "block";
            }

        }

    } catch (erro) {

        console.log("Erro na requisição:", erro);

        erroGeral.textContent   = "Erro de conexão. Verifique sua internet e tente novamente.";
        erroGeral.style.display = "block";

    } finally {

        // Reabilita o botão independente do resultado
        btnContinuar.disabled    = false;
        btnContinuar.textContent = "Continuar";

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