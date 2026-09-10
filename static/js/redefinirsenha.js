
// ==========================
// TOKEN DA URL
// ==========================
// O link do e-mail chega como /redefinir-senha?token=XXXX.
// O servidor já validou o token antes de servir esta página —
// aqui só precisamos reaproveitar o mesmo valor pra mandar
// junto no POST.

const parametros = new URLSearchParams(window.location.search);
const token = parametros.get("token");

if (!token) {
    // Sem token não tem como redefinir nada — volta pro login
    window.location.href = "/logar";
}

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

    if (permitirHTML) {
        erro.innerHTML = mensagem;
    } else {
        erro.textContent = mensagem;
    }

    erro.style.display = "block";

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

    const erroGeral = document.getElementById("erro-geral");
    if (erroGeral) {
        erroGeral.style.display = "none";
        erroGeral.className = "cadastro-form__erro cadastro-form__erro--geral";
    }

}

// ==========================
// VALIDAÇÃO LOCAL
// ==========================
// Mesma regra que o backend realmente aplica em POST /redefinir-senha:
// mínimo 6 caracteres e as duas senhas iguais.
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

    if (valido && senha !== confirmarSenha) {
        mostrarErro("confirmarSenha", "erro-confirmarSenha", "As senhas não coincidem.");
        valido = false;
    }

    return valido;

}

// ==========================
// ENVIO DO FORMULÁRIO
// ==========================

document.getElementById("formRedefinir").addEventListener("submit", async (evento) => {

    evento.preventDefault();

    if (!validarCampos()) return;

    const btnContinuar = document.getElementById("btnContinuar");
    const erroGeral    = document.getElementById("erro-geral");

    btnContinuar.disabled    = true;
    btnContinuar.textContent = "Salvando...";

    try {

        const resposta = await fetch("/redefinir-senha", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token:           token,
                senha:           document.getElementById("senha").value,
                confirmarSenha:  document.getElementById("confirmarSenha").value
            })
        });

        const dados = await resposta.json();

        if (resposta.ok) {

            // Senha realmente trocada no banco — avisa e manda pro login
            erroGeral.textContent   = dados.mensagem || "Senha redefinida com sucesso!";
            erroGeral.className     = "cadastro-form__erro cadastro-form__erro--geral cadastro-form__erro--sucesso";
            erroGeral.style.display = "block";

            btnContinuar.textContent = "Redirecionando...";

            setTimeout(() => {
                window.location.href = "/logar";
            }, 1800);

            return;

        }

        erroGeral.textContent   = dados.erro || "Erro ao redefinir a senha. Tente novamente.";
        erroGeral.style.display = "block";

        btnContinuar.disabled    = false;
        btnContinuar.textContent = "Continuar";

    } catch (erro) {

        console.log("Erro na requisição:", erro);

        erroGeral.textContent   = "Erro de conexão. Verifique sua internet e tente novamente.";
        erroGeral.style.display = "block";

        btnContinuar.disabled    = false;
        btnContinuar.textContent = "Continuar";

    }

});

document.getElementById("btnToggleSenha").addEventListener("click", () => {
    toggleSenha("senha", "iconeSenha");
});

document.getElementById("btnToggleConfirmarSenha").addEventListener("click", () => {
    toggleSenha("confirmarSenha", "iconeConfirmarSenha");
});