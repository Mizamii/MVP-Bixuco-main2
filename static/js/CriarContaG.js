                             
                  
                             

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionarioCriarContaG = {
    "Digite seu nome completo.": "Enter your full name.",
    "Digite um e-mail válido.": "Enter a valid email.",
    "Telefone inválido.": "Invalid phone number.",
    "Informe sua data de nascimento.": "Enter your date of birth.",
    "Você precisa ter pelo menos 18 anos.": "You must be at least 18 years old.",
    "CPF inválido. Verifique os números digitados.": "Invalid CPF. Check the numbers entered.",
    "Este e-mail já está cadastrado.": "This email is already registered.",
    "Este CPF já está cadastrado.": "This CPF is already registered.",
    "Erro ao continuar. Tente novamente.": "Error continuing. Try again.",
    "Erro de conexão. Verifique sua internet e tente novamente.": "Connection error. Check your internet and try again.",
    "Enviando...": "Sending...",
    "Continuar": "Continue"
};

function traduzir(texto) {
    if (idiomaAtual === "pt" || texto == null) return texto;
    return dicionarioCriarContaG[texto] || texto;
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

                                
    const erroGeral = document.getElementById("erro-geral");
    if (erroGeral) erroGeral.style.display = "none";

}

                             
                                
                                                             
                             

function limparErroCampo(inputId, erroId) {

    const input = document.getElementById(inputId);
    const erro  = document.getElementById(erroId);

    if (input) input.classList.remove("input-erro");

    if (erro) {
        erro.style.display = "none";
        erro.textContent   = "";
    }

}

                             
                                               
                                
                             

function debounce(funcao, atraso = 600) {

    let temporizador;

    return (...args) => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => funcao(...args), atraso);
    };

}

                             
                                                  
                             

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
        return true;                                           

    }

}

                             
                                                  
                                                      
                             

function cpfFormatoValido(cpfLimpo) {
    return cpfLimpo.length === 11 && !/^(\d)\1{10}$/.test(cpfLimpo);
}

                             
                           
                             

function idadeAdultoValida(data) {

    if (!data) return false;

    const nascimento = new Date(data + "T12:00:00");

    if (Number.isNaN(nascimento.getTime())) {
        return false;
    }

    const hoje = new Date();

                                
    if (nascimento > hoje) {
        return false;
    }

    let idade =
        hoje.getFullYear() -
        nascimento.getFullYear();

    const mes =
        hoje.getMonth() -
        nascimento.getMonth();

    if (
        mes < 0 ||
        (
            mes === 0 &&
            hoje.getDate() < nascimento.getDate()
        )
    ) {
        idade--;
    }

    return idade >= 18 && idade <= 120;
}
                             
                  
                             

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
        mostrarErro("nome", "erro-nome", traduzir("Digite seu nome completo."));
        valido = false;
    }

    if (!regexEmail.test(email)) {
        mostrarErro("email", "erro-email", traduzir("Digite um e-mail válido."));
        valido = false;
    }

    if (telefone && telefone.replace(/\D/g, "").length < 10) {
        mostrarErro("telefone", "erro-telefone", traduzir("Telefone inválido."));
        valido = false;
    }

    if (!data) {
        mostrarErro("dataNascimento", "erro-dataNascimento", traduzir("Informe sua data de nascimento."));
        valido = false;
    } else if (!idadeAdultoValida(data)) {
        mostrarErro("dataNascimento", "erro-dataNascimento", traduzir("Informe uma data de nascimento válida."));
        valido = false;
    }

                                       
                                                               
                                                   
    if (!cpfFormatoValido(cpf)) {
        mostrarErro("cpf", "erro-cpf", traduzir("CPF inválido. Verifique os números digitados."));
        valido = false;
    }


    return valido;

}

                             
                          
                                                           
                                         
                             

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

                                                                 
                                                      
const checarEmailDisponivel = debounce(async () => {

    const valor = campoEmail.value.trim();
    if (!regexEmailLive.test(valor)) return;

    const disponivel = await verificarDisponibilidade("email", valor);

                                                                        
    if (campoEmail.value.trim() !== valor) return;

    if (!disponivel) {
        mostrarErro("email", "erro-email", traduzir("Este e-mail já está cadastrado."));
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
    if (campoData.value && idadeAdultoValida(campoData.value)) {
        limparErroCampo("dataNascimento", "erro-dataNascimento");
    }
});

                                                                
                                         
const checarCPFDisponivel = debounce(async () => {

    const valor   = campoCPF.value.trim();
    const numeros = valor.replace(/\D/g, "");
    if (!cpfFormatoValido(numeros)) return;

    const disponivel = await verificarDisponibilidade("cpf", valor);

    if (campoCPF.value.trim() !== valor) return;

    if (!disponivel) {
        mostrarErro("cpf", "erro-cpf", traduzir("Este CPF já está cadastrado."));
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

                             
                      
                             

                                        
                                                                    
                                                               

document.getElementById("formCadastro").addEventListener("submit", async (evento) => {

    evento.preventDefault();

    if (!validarCampos()) return;

    const btnContinuar = document.getElementById("btnContinuar");
    const erroGeral    = document.getElementById("erro-geral");

                                           
    btnContinuar.disabled    = true;
    btnContinuar.textContent = traduzir("Enviando...");

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

                                                                                    
        if (resposta.redirected) {
            window.location.href = resposta.url;
            return;
        }

                                                    
        if (!resposta.ok) {

            const dados = await resposta.json();

                                                                       
            if (dados.campo) {
                mostrarErro(dados.campo, "erro-" + dados.campo, traduzir(dados.erro));
            } else {
                erroGeral.textContent  = traduzir(dados.erro) || traduzir("Erro ao continuar. Tente novamente.");
                erroGeral.style.display = "block";
            }

        }

    } catch (erro) {

        console.log("Erro na requisição:", erro);

        erroGeral.textContent  = traduzir("Erro de conexão. Verifique sua internet e tente novamente.");
        erroGeral.style.display = "block";

    } finally {

                                                      
        btnContinuar.disabled    = false;
        btnContinuar.textContent = traduzir("Continuar");

    }

});

document.getElementById("cpf").addEventListener("input", function () {
    mascaraCPF(this);
});