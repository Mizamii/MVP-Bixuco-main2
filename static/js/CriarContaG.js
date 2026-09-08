
// ==========================
// MÁSCARA DO CPF
// ==========================

function mascaraCPF(input) {

    let valor = input.value.replace(/\D/g, "").slice(0, 11);

    if (valor.length > 9) {
        valor = valor.replace(
            /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
            "$1.$2.$3-$4"
        );
    } else if (valor.length > 6) {
        valor = valor.replace(
            /(\d{3})(\d{3})(\d{0,3})/,
            "$1.$2.$3"
        );
    } else if (valor.length > 3) {
        valor = valor.replace(
            /(\d{3})(\d{0,3})/,
            "$1.$2"
        );
    }

    input.value = valor;

}

// ==========================
// MÁSCARA DO TELEFONE
// ==========================

document.getElementById("telefone").addEventListener("input", function () {

    let valor = this.value.replace(/\D/g, "").slice(0, 11);

    if (valor.length > 10) {
        valor = valor.replace(
            /(\d{2})(\d{5})(\d{4})/,
            "($1) $2-$3"
        );
    } else if (valor.length > 6) {
        valor = valor.replace(
            /(\d{2})(\d{4})(\d+)/,
            "($1) $2-$3"
        );
    } else if (valor.length > 2) {
        valor = valor.replace(
            /(\d{2})(\d+)/,
            "($1) $2"
        );
    }

    this.value = valor;

});



// ==========================
// MOSTRAR / LIMPAR ERROS
// ==========================

function mostrarErro(inputId, erroId, mensagem) {

    const input = document.getElementById(inputId);
    const erro  = document.getElementById(erroId);

    if (!input || !erro) return;

    input.classList.add("input-erro");
    erro.textContent  = mensagem;
    erro.style.display = "block";

    setTimeout(() => {
        input.classList.remove("input-erro");
    }, 500);

}

function limparErros() {

    [
        "nome",
        "email",
        "telefone",
        "dataNascimento",
        "cpf"

    ].forEach(id => {

        const campo = document.getElementById(id);
        const erro  = document.getElementById("erro-" + id);

        if (campo) campo.classList.remove("input-erro");
        if (erro) {
            erro.style.display = "none";
            erro.textContent   = "";
        }

    });

    // Limpa também o erro geral
    const erroGeral = document.getElementById("erro-geral");
    if (erroGeral) erroGeral.style.display = "none";

}

// ==========================
// LIMPAR ERRO DE UM ÚNICO CAMPO
// (usado na validação em tempo real, sem precisar dar Enter)
// ==========================

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
// DEBOUNCE — espera o usuário parar de digitar
// antes de consultar o servidor
// ==========================

function debounce(funcao, atraso = 600) {

    let temporizador;

    return (...args) => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => funcao(...args), atraso);
    };

}

// ==========================
// CHECAR NO SERVIDOR SE EMAIL/CPF JÁ ESTÃO EM USO
// ==========================

async function verificarDisponibilidade(campo, valor) {

    try {

        const resposta = await fetch("/api/verificar-disponibilidade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campo, valor })
        });

        if (!resposta.ok) return true;

        const dados = await resposta.json();
        return dados.disponivel !== false;

    } catch (erro) {

        console.log("Erro ao verificar disponibilidade:", erro);
        return true; // não trava o usuário por erro de conexão

    }

}

// ==========================
// FORMATO DO CPF (sem checar dígito verificador —
// isso o backend já faz com a lib cpf-cnpj-validator)
// ==========================

function cpfFormatoValido(cpfLimpo) {
    return cpfLimpo.length === 11 && !/^(\d)\1{10}$/.test(cpfLimpo);
}

// ==========================
// VERIFICAR MAIOR DE IDADE
// ==========================

function maiorIdade(data) {

    const hoje       = new Date();
    const nascimento = new Date(data);
    let   idade      = hoje.getFullYear() - nascimento.getFullYear();
    const mes        = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }

    return idade >= 18;

}

// ==========================
// VALIDAÇÃO LOCAL
// ==========================

function validarCampos() {

    limparErros();
    let valido = true;

    const nome          = document.getElementById("nome").value.trim();
    const email         = document.getElementById("email").value.trim();
    const telefone      = document.getElementById("telefone").value.trim();
    const data          = document.getElementById("dataNascimento").value;
    const cpf           = document.getElementById("cpf").value.replace(/\D/g, "");

    const regexEmail    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (nome.split(" ").filter(p => p).length < 2) {
        mostrarErro("nome", "erro-nome", "Digite seu nome completo.");
        valido = false;
    }

    if (!regexEmail.test(email)) {
        mostrarErro("email", "erro-email", "Digite um e-mail válido.");
        valido = false;
    }

    if (telefone && telefone.replace(/\D/g, "").length < 10) {
        mostrarErro("telefone", "erro-telefone", "Telefone inválido.");
        valido = false;
    }

    if (!data) {
        mostrarErro("dataNascimento", "erro-dataNascimento", "Informe sua data de nascimento.");
        valido = false;
    } else if (!maiorIdade(data)) {
        mostrarErro("dataNascimento", "erro-dataNascimento", "Você precisa ter pelo menos 18 anos.");
        valido = false;
    }

    // Validação mais descritiva do CPF
    // O backend tem a validação real com dígitos verificadores
    // aqui garantimos pelo menos o formato correto
    if (!cpfFormatoValido(cpf)) {
        mostrarErro("cpf", "erro-cpf", "CPF inválido. Verifique os números digitados.");
        valido = false;
    }


    return valido;

}

// ==========================
// VALIDAÇÃO EM TEMPO REAL
// (o erro some assim que o campo fica válido — não precisa
// apertar Enter nem clicar em Continuar)
// ==========================

const campoNome  = document.getElementById("nome");
const campoEmail = document.getElementById("email");
const campoTel   = document.getElementById("telefone");
const campoData  = document.getElementById("dataNascimento");
const campoCPF   = document.getElementById("cpf");

const regexEmailLive = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

campoNome.addEventListener("input", () => {
    const partes = campoNome.value.trim().split(" ").filter(p => p);
    if (partes.length >= 2) limparErroCampo("nome", "erro-nome");
});

// Checa disponibilidade do email só depois que o formato já está
// válido e o usuário parou de digitar por um instante
const checarEmailDisponivel = debounce(async () => {

    const valor = campoEmail.value.trim();
    if (!regexEmailLive.test(valor)) return;

    const disponivel = await verificarDisponibilidade("email", valor);

    // se o usuário já mudou o valor enquanto a resposta chegava, ignora
    if (campoEmail.value.trim() !== valor) return;

    if (!disponivel) {
        mostrarErro("email", "erro-email", "Este e-mail já está cadastrado.");
    } else {
        limparErroCampo("email", "erro-email");
    }

});

campoEmail.addEventListener("input", () => {
    if (regexEmailLive.test(campoEmail.value.trim())) {
        limparErroCampo("email", "erro-email");
        checarEmailDisponivel();
    }
});

campoTel.addEventListener("input", () => {
    const numeros = campoTel.value.replace(/\D/g, "");
    if (numeros.length === 0 || numeros.length >= 10) {
        limparErroCampo("telefone", "erro-telefone");
    }
});

campoData.addEventListener("input", () => {
    if (campoData.value && maiorIdade(campoData.value)) {
        limparErroCampo("dataNascimento", "erro-dataNascimento");
    }
});

// Mesma ideia para o CPF: valida o formato e, se estiver certo,
// pergunta ao servidor se já está em uso
const checarCPFDisponivel = debounce(async () => {

    const valor   = campoCPF.value.trim();
    const numeros = valor.replace(/\D/g, "");
    if (!cpfFormatoValido(numeros)) return;

    const disponivel = await verificarDisponibilidade("cpf", valor);

    if (campoCPF.value.trim() !== valor) return;

    if (!disponivel) {
        mostrarErro("cpf", "erro-cpf", "Este CPF já está cadastrado.");
    } else {
        limparErroCampo("cpf", "erro-cpf");
    }

});

campoCPF.addEventListener("input", () => {
    const numeros = campoCPF.value.replace(/\D/g, "");
    if (cpfFormatoValido(numeros)) {
        limparErroCampo("cpf", "erro-cpf");
        checarCPFDisponivel();
    }
});

// ==========================
// ENVIO DO FORMULÁRIO
// ==========================

// Intercepta o submit e envia via fetch
// Antes o form fazia POST direto e erros chegavam via ?erro= na URL
// Agora os erros aparecem direto nos campos sem sair da página

document.getElementById("formCadastro").addEventListener("submit", async (evento) => {

    evento.preventDefault();

    if (!validarCampos()) return;

    const btnContinuar = document.getElementById("btnContinuar");
    const erroGeral    = document.getElementById("erro-geral");

    // Desabilita o botão enquanto processa
    btnContinuar.disabled    = true;
    btnContinuar.textContent = "Enviando...";

    try {

        const resposta = await fetch("/continuar-cadastro-pai", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome:           document.getElementById("nome").value.trim(),
                email:          document.getElementById("email").value.trim(),
                telefone:       document.getElementById("telefone").value.trim(),
                dataNascimento: document.getElementById("dataNascimento").value,
                cpfUser:        document.getElementById("cpf").value
            })
        });

        // Redirecionamento bem-sucedido (backend redireciona para /CriarContaSenha)
        if (resposta.redirected) {
            window.location.href = resposta.url;
            return;
        }

        // Exibe erros do servidor direto nos campos
        if (!resposta.ok) {

            const dados = await resposta.json();

            // Tenta mostrar no campo específico, senão mostra no geral
            if (dados.campo) {
                mostrarErro(dados.campo, "erro-" + dados.campo, dados.erro);
            } else {
                erroGeral.textContent  = dados.erro || "Erro ao continuar. Tente novamente.";
                erroGeral.style.display = "block";
            }

        }

    } catch (erro) {

        console.log("Erro na requisição:", erro);

        erroGeral.textContent  = "Erro de conexão. Verifique sua internet e tente novamente.";
        erroGeral.style.display = "block";

    } finally {

        // Reabilita o botão independente do resultado
        btnContinuar.disabled    = false;
        btnContinuar.textContent = "Continuar";

    }

});

document.getElementById("cpf").addEventListener("input", function () {
    mascaraCPF(this);
});