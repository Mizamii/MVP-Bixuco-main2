
// ==========================
// PREVIEW DA FOTO
// ==========================

function previewFoto(input) {

    const preview = document.getElementById("previewFotoCrianca");
    const icone   = document.getElementById("iconeCamera");

    if (input.files && input.files[0]) {

        const reader = new FileReader();

        reader.onload = function (e) {
            preview.src          = e.target.result;
            preview.style.display = "block";
            icone.style.display   = "none";
        };

        reader.readAsDataURL(input.files[0]);

    }

}

// ==========================
// MOSTRAR / LIMPAR ERROS
// ==========================

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

    ["nomeCrianca", "dataNascimento", "sexo"].forEach(id => {

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

// ==========================
// VERIFICAR DATA FUTURA
// ==========================

function dataNoFuturo(data) {
    return new Date(data) > new Date();
}

// ==========================
// VALIDAÇÃO LOCAL
// ==========================

function validarCampos() {

    limparErros();
    let valido = true;

    const nome = document.getElementById("nomeCrianca").value.trim();
    const data = document.getElementById("dataNascimento").value;
    const sexo = document.getElementById("sexo").value;

    if (nome.length < 2) {
        mostrarErro("nomeCrianca", "erro-nomeCrianca", "Digite o nome da criança.");
        valido = false;
    }

    if (!data) {
        mostrarErro("dataNascimento", "erro-dataNascimento", "Informe a data de nascimento.");
        valido = false;
    } else if (dataNoFuturo(data)) {
        mostrarErro("dataNascimento", "erro-dataNascimento", "A data não pode ser no futuro.");
        valido = false;
    }

    if (!sexo) {
        mostrarErro("sexo", "erro-sexo", "Selecione o sexo.");
        valido = false;
    }

    return valido;

}

// ==========================
// ENVIO DO FORMULÁRIO
// ==========================

// Usa FormData para enviar os dados incluindo a foto
// FormData suporta arquivos — não é possível usar JSON.stringify com imagem
// O backend precisa do multer para processar o arquivo (ver rotas_adicionarc.js)

document.getElementById("formCrianca").addEventListener("submit", async (evento) => {

    evento.preventDefault();

    if (!validarCampos()) return;

    const btnIr     = document.getElementById("btnIr");
    const erroGeral = document.getElementById("erro-geral");

    // Desabilita o botão enquanto processa
    btnIr.disabled    = true;
    btnIr.textContent = "Salvando...";

    try {

        // Monta o FormData com todos os campos incluindo a foto
        const formData = new FormData();

        formData.append("nomeCrianca",  document.getElementById("nomeCrianca").value.trim());
        formData.append("dataNascimento", document.getElementById("dataNascimento").value);
        formData.append("sexo",          document.getElementById("sexo").value);
        formData.append("nomePelucia",   document.getElementById("nomePelucia").value.trim());

        // Adiciona a foto só se o usuário tiver selecionado uma
        const fotoInput = document.getElementById("fotoCrianca");
        if (fotoInput.files && fotoInput.files[0]) {
            formData.append("fotoCrianca", fotoInput.files[0]);
        }

        // Não definir Content-Type manualmente com FormData
        // O fetch define automaticamente com o boundary correto para multipart
        const resposta = await fetch("/api/adicionar-crianca", {
            method: "POST",
            body: formData
        });

        // Redireciona para login se não autenticado
        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        // Backend redireciona para /QuestionarioP após salvar
        if (resposta.redirected) {
            window.location.href = resposta.url;
            return;
        }

        if (!resposta.ok) {

            const dados = await resposta.json();

            // Exibe erro do servidor no campo correto
            if (dados.campo) {
                mostrarErro(dados.campo, "erro-" + dados.campo, dados.erro);
            } else {
                erroGeral.textContent   = dados.erro || "Erro ao salvar. Tente novamente.";
                erroGeral.style.display = "block";
            }

        }

    } catch (erro) {

        console.log("Erro ao adicionar criança:", erro);

        erroGeral.textContent   = "Erro de conexão. Verifique sua internet e tente novamente.";
        erroGeral.style.display = "block";

    } finally {

        btnIr.disabled    = false;
        btnIr.textContent = "Ir para o Perfil sensorial";

    }

});

// ==========================
// SUBSTITUI OS ONCLICK/ONCHANGE INLINE (removidos por causa do CSP)
// ==========================

document.getElementById("wrapperFotoCrianca").addEventListener("click", () => {
    document.getElementById("fotoCrianca").click();
});

document.getElementById("fotoCrianca").addEventListener("change", function () {
    previewFoto(this);
});