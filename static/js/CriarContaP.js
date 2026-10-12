                             
                  
                             

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionarioCriarContaP = {
    "Digite seu nome completo.": "Enter your full name.",
    "Digite um e-mail válido.": "Enter a valid email.",
    "Telefone inválido.": "Invalid phone number.",
    "Informe sua data de nascimento.": "Enter your date of birth.",
    "Você precisa ter pelo menos 18 anos.": "You must be at least 18 years old.",
    "Digite um CRP válido. Ex: CRP-06/12345": "Enter a valid CRP. E.g.: CRP-06/12345",
    "Este e-mail já está cadastrado.": "This email is already registered.",
    "Este CRP já está cadastrado.": "This CRP is already registered.",
    "Erro ao continuar. Tente novamente.": "Error continuing. Try again.",
    "Erro de conexão. Verifique sua internet e tente novamente.": "Connection error. Check your internet and try again.",
    "Enviando...": "Sending...",
    "Continuar": "Continue"
};

function traduzir(texto) {
    if (idiomaAtual === "pt" || texto == null) return texto;
    return dicionarioCriarContaP[texto] || texto;
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

                             
                 
                             

document.getElementById("crp").addEventListener("input", function () {

                                     
    let valor = this.value.replace(/\D/g, "").slice(0, 8);

                                        
    if (valor.length > 2) {
        valor = valor.replace(/^(\d{2})(\d+)/, "$1/$2");
    }

    this.value = "CRP-" + valor;

                                         
    const pos = this.value.length;
    this.setSelectionRange(pos, pos);

});

                                             
document.getElementById("crp").addEventListener("keydown", function (e) {

    if (
        (e.key === "Backspace" || e.key === "Delete") &&
        this.selectionStart <= 4
    ) {
        e.preventDefault();
    }

});

                                                         
document.getElementById("crp").addEventListener("focus", function () {

    if (!this.value) {
        this.value = "CRP-";
    }

    const pos = this.value.length;
    this.setSelectionRange(pos, pos);

});

                             
                      
                             

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
    erro.textContent   = mensagem;
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
        "crp"
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

                             
              
                             

function validarCRP(crp) {

                                                      
    const regex = /^CRP-\d{2}\/\d{4,6}$/;
    return regex.test(crp);

}

                             
                  
                             

function validarCampos() {

    limparErros();
    let valido = true;

    const nome     = document.getElementById("nome").value.trim();
    const email    = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const data     = document.getElementById("dataNascimento").value;
    const crp      = document.getElementById("crp").value.trim();

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    if (!validarCRP(crp)) {
        mostrarErro("crp", "erro-crp", traduzir("Digite um CRP válido. Ex: CRP-06/12345"));
        valido = false;
    }

    return valido;

}

                             
                          
                                                           
                                         
                             

const campoNome  = document.getElementById("nome");
const campoEmail = document.getElementById("email");
const campoTel   = document.getElementById("telefone");
const campoData  = document.getElementById("dataNascimento");
const campoCRP   = document.getElementById("crp");

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

                                                                
                                         
const checarCRPDisponivel = debounce(async () => {

    const valor = campoCRP.value.trim();
    if (!validarCRP(valor)) return;

    const disponivel = await verificarDisponibilidade("crp", valor);

    if (campoCRP.value.trim() !== valor) return;

    if (!disponivel) {
        mostrarErro("crp", "erro-crp", traduzir("Este CRP já está cadastrado."));
    } else {
        limparErroCampo("crp", "erro-crp");
    }

});

campoCRP.addEventListener("input", () => {
    if (validarCRP(campoCRP.value.trim())) {
        limparErroCampo("crp", "erro-crp");
        checarCRPDisponivel();
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

        const resposta = await fetch("/continuar-cadastro-psicologo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome:           document.getElementById("nome").value.trim(),
                email:          document.getElementById("email").value.trim(),
                telefone:       document.getElementById("telefone").value.trim(),
                dataNascimento: document.getElementById("dataNascimento").value,
                crp:            document.getElementById("crp").value.trim()
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
                erroGeral.textContent   = traduzir(dados.erro) || traduzir("Erro ao continuar. Tente novamente.");
                erroGeral.style.display = "block";
            }

        }

    } catch (erro) {

        console.log("Erro na requisição:", erro);

        erroGeral.textContent   = traduzir("Erro de conexão. Verifique sua internet e tente novamente.");
        erroGeral.style.display = "block";

    } finally {

        btnContinuar.disabled    = false;
        btnContinuar.textContent = traduzir("Continuar");

    }

});