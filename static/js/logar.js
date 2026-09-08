


// ==========================
// MOSTRAR / ESCONDER SENHA
// ==========================

function toggleSenha() {
    const senha = document.getElementById("senha");
    const icone = document.getElementById("iconeSenha");
    const botao = icone.closest("button");

    if (senha.type === "password") {
        senha.type = "text";
        icone.classList.remove("fa-eye");
        icone.classList.add("fa-eye-slash");
        if (botao) botao.setAttribute("aria-label", "Esconder senha");
    } else {
        senha.type = "password";
        icone.classList.remove("fa-eye-slash");
        icone.classList.add("fa-eye");
        if (botao) botao.setAttribute("aria-label", "Mostrar senha");
    }
}

// ==========================
// EXIBIR / LIMPAR ERROS
// ==========================

function mostrarErro(inputId, erroId, mensagem) {
    const input = document.getElementById(inputId);
    const erro  = document.getElementById(erroId);

    if (!input || !erro) return;

    input.classList.add("login-form__input--erro");
    erro.textContent   = mensagem;
    erro.style.display = "block";

    setTimeout(() => {
        input.classList.remove("login-form__input--erro");
    }, 500);
}

function limparErros() {
    ["email", "senha"].forEach(id => {
        const input = document.getElementById(id);
        const erro  = document.getElementById("erro-" + id);

        if (input) input.classList.remove("login-form__input--erro");
        if (erro)  erro.style.display = "none";
    });

    const erroGeral = document.getElementById("erro-geral");
    if (erroGeral) erroGeral.style.display = "none";
}

// ==========================
// VALIDAÇÃO LOCAL
// ==========================

function validarCampos() {
    limparErros();
    let valido = true;

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const regexEmail = /\S+@\S+\.\S+/;

    if (!regexEmail.test(email)) {
        mostrarErro("email", "erro-email", "Digite um e-mail válido.");
        valido = false;
    }

    if (senha.length < 6) {
        mostrarErro("senha", "erro-senha", "A senha deve possuir pelo menos 6 caracteres.");
        valido = false;
    }

    return valido;
}

// ==========================
// VALIDAÇÃO EM TEMPO REAL (some o erro assim que corrigir)
// ==========================

document.getElementById("email").addEventListener("input", () => {
    const email = document.getElementById("email").value.trim();
    const regexEmail = /\S+@\S+\.\S+/;

    if (regexEmail.test(email)) {
        document.getElementById("email").classList.remove("login-form__input--erro");
        document.getElementById("erro-email").style.display = "none";
    }

    // Some tambem o erro geral (ex: "email ou senha invalidos") ao editar
    document.getElementById("erro-geral").style.display = "none";
});

document.getElementById("senha").addEventListener("input", () => {
    const senha = document.getElementById("senha").value;

    if (senha.length >= 6) {
        document.getElementById("senha").classList.remove("login-form__input--erro");
        document.getElementById("erro-senha").style.display = "none";
    }

    document.getElementById("erro-geral").style.display = "none";
});

// ==========================
// ENVIO DO FORMULÁRIO
// ==========================

document.getElementById("formLogin").addEventListener("submit", async (evento) => {

    evento.preventDefault();

    if (!validarCampos()) return;

    const btnEntrar = document.getElementById("btnEntrar");
    const erroGeral = document.getElementById("erro-geral");

    btnEntrar.disabled    = true;
    btnEntrar.textContent = "Entrando...";

    try {

        const resposta = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: document.getElementById("email").value.trim(),
                senha: document.getElementById("senha").value
            })
        });

        // Redirect bem-sucedido (login manual ou Google callback)
        if (resposta.redirected) {
            window.location.href = resposta.url;
            return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
            erroGeral.textContent   = dados.erro || "Erro ao fazer login. Tente novamente.";
            erroGeral.style.display = "block";
        }

    } catch (erro) {

        console.log("Erro na requisição de login:", erro);
        erroGeral.textContent   = "Erro de conexão. Verifique sua internet e tente novamente.";
        erroGeral.style.display = "block";

    } finally {

        btnEntrar.disabled    = false;
        btnEntrar.textContent = "Entrar";

    }

});

// ==========================
// LOGIN COM GOOGLE
// ==========================

function loginGoogle() {
    var ehApp = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    window.location.href = ehApp ? "/auth/google?origem=app" : "/auth/google";
}


// Substitui os antigos onclick inline (removidos por causa do CSP)
document.getElementById("btnToggleSenha").addEventListener("click", toggleSenha);
document.getElementById("btnLoginGoogle").addEventListener("click", loginGoogle);