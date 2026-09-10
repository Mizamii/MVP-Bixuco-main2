
// ==========================
// EXIBIR / LIMPAR ERROS
// ==========================

function mostrarErro(inputId, erroId, mensagem) {

    const input = document.getElementById(inputId);
    const erro = document.getElementById(erroId);

    input.classList.add("recuperar-form__input--erro");
    erro.textContent = mensagem;
    erro.style.display = "block";

    setTimeout(() => {
        input.classList.remove("recuperar-form__input--erro");
    }, 500);

}

function limparErros() {

    const input = document.getElementById("email");
    const erro = document.getElementById("erro-email");
    const feedback = document.getElementById("feedback-geral");

    input.classList.remove("recuperar-form__input--erro");
    erro.style.display = "none";
    erro.textContent = "";

    // Limpa também o feedback geral do servidor
    feedback.style.display = "none";
    feedback.textContent = "";
    feedback.className = "recuperar-form__feedback";

}

// ==========================
// VALIDAÇÃO LOCAL
// ==========================

function validarCampos() {

    limparErros();

    let valido = true;

    const email = document.getElementById("email").value.trim();

    // Expressão regular para validar e-mail
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regexEmail.test(email)) {

        mostrarErro(
            "email",
            "erro-email",
            "Digite um e-mail válido."
        );

        valido = false;

    }

    return valido;

}

// ==========================
// ENVIO DO FORMULÁRIO
// ==========================

// Envio via fetch: mostra erro/sucesso do servidor sem recarregar a página
document.getElementById("formRecuperar").addEventListener("submit", async (evento) => {

    evento.preventDefault();

    if (!validarCampos()) {
        return;
    }

    const btnEnviar = document.getElementById("btnEnviar");
    const feedback = document.getElementById("feedback-geral");
    const email = document.getElementById("email").value.trim();

    // Desabilita botão enquanto o servidor processa
    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviando...";

    try {

        // Chama a rota do backend que envia o e-mail via Nodemailer
        const resposta = await fetch("/esqueceu-senha", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const dados = await resposta.json();

        if (resposta.ok) {

            // Mostra mensagem de sucesso na tela
            // e desabilita o formulário para evitar reenvio
            feedback.textContent = "✅ " + dados.mensagem;
            feedback.classList.add("recuperar-form__feedback--sucesso");
            feedback.style.display = "block";

            // Limpa o campo de e-mail e desabilita após sucesso
            document.getElementById("email").value = "";
            document.getElementById("email").disabled = true;
            btnEnviar.disabled = true;
            btnEnviar.textContent = "Link enviado!";

        } else {

            // Mostra o erro do servidor na tela
            feedback.textContent = "❌ " + (dados.erro || "Erro ao enviar. Tente novamente.");
            feedback.classList.add("recuperar-form__feedback--erro");
            feedback.style.display = "block";

            // Reabilita o botão para tentar novamente
            btnEnviar.disabled = false;
            btnEnviar.textContent = "Enviar link de recuperação";

        }

    } catch (erro) {

        console.log("Erro na requisição:", erro);

        feedback.textContent = "❌ Erro de conexão. Verifique sua internet e tente novamente.";
        feedback.classList.add("recuperar-form__feedback--erro");
        feedback.style.display = "block";

        btnEnviar.disabled = false;
        btnEnviar.textContent = "Enviar link de recuperação";

    }

});