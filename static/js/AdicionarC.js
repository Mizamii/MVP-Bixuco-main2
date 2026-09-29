let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionarioAdicionarC = {
  "Digite o nome da criança.": "Enter the child's name.",
  "Informe a data de nascimento.": "Enter the date of birth.",
  "A data não pode ser no futuro.": "The date cannot be in the future.",
  "Selecione o sexo.": "Select the gender.",
  "Salvando...": "Saving...",
  "Ir para o Perfil sensorial": "Go to Sensory Profile",
  "Erro ao salvar. Tente novamente.": "Error saving. Try again.",
  "Erro de conexão. Verifique sua internet e tente novamente.":
    "Connection error. Check your internet and try again.",
};

function traduzir(texto) {
  if (idiomaAtual === "pt" || texto == null) return texto;
  return dicionarioAdicionarC[texto] || texto;
}

function aplicarIdiomaEstatico() {
  document.querySelectorAll("[data-pt]").forEach((el) => {
    el.textContent =
      idiomaAtual === "en" ? el.dataset.en || el.dataset.pt : el.dataset.pt;
  });

  document.querySelectorAll("[data-pt-placeholder]").forEach((el) => {
    el.placeholder =
      idiomaAtual === "en"
        ? el.dataset.enPlaceholder || el.dataset.ptPlaceholder
        : el.dataset.ptPlaceholder;
  });

  document.querySelectorAll("[data-pt-title]").forEach((el) => {
    el.title =
      idiomaAtual === "en"
        ? el.dataset.enTitle || el.dataset.ptTitle
        : el.dataset.ptTitle;
  });

  document.getElementById("textoTradutor").textContent =
    idiomaAtual === "en"
      ? "Traduzir para o português"
      : "Traduzir para o inglês";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
  idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
  localStorage.setItem("idioma", idiomaAtual);
  aplicarIdiomaEstatico();
});

aplicarIdiomaEstatico();

function previewFoto(input) {
  const preview = document.getElementById("previewFotoCrianca");
  const icone = document.getElementById("iconeCamera");

  if (input.files && input.files[0]) {
    const reader = new FileReader();

    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = "block";
      icone.style.display = "none";
    };

    reader.readAsDataURL(input.files[0]);
  }
}

function mostrarErro(inputId, erroId, mensagem) {
  const input = document.getElementById(inputId);
  const erro = document.getElementById(erroId);

  if (!input || !erro) return;

  input.classList.add("input-erro");
  erro.textContent = mensagem;
  erro.style.display = "block";

  setTimeout(() => {
    input.classList.remove("input-erro");
  }, 500);
}

function limparErros() {
  ["nomeCrianca", "dataNascimento", "sexo"].forEach((id) => {
    const campo = document.getElementById(id);
    const erro = document.getElementById("erro-" + id);

    if (campo) campo.classList.remove("input-erro");

    if (erro) {
      erro.style.display = "none";
      erro.textContent = "";
    }
  });

  const erroGeral = document.getElementById("erro-geral");
  if (erroGeral) erroGeral.style.display = "none";
}

function dataNoFuturo(data) {
  return new Date(data) > new Date();
}

function validarCampos() {
  limparErros();
  let valido = true;

  const nome = document.getElementById("nomeCrianca").value.trim();
  const data = document.getElementById("dataNascimento").value;
  const sexo = document.getElementById("sexo").value;

  if (nome.length < 2) {
    mostrarErro(
      "nomeCrianca",
      "erro-nomeCrianca",
      traduzir("Digite o nome da criança."),
    );
    valido = false;
  }

  if (!data) {
    mostrarErro(
      "dataNascimento",
      "erro-dataNascimento",
      traduzir("Informe a data de nascimento."),
    );
    valido = false;
  } else if (dataNoFuturo(data)) {
    mostrarErro(
      "dataNascimento",
      "erro-dataNascimento",
      traduzir("A data não pode ser no futuro."),
    );
    valido = false;
  }

  if (!sexo) {
    mostrarErro("sexo", "erro-sexo", traduzir("Selecione o sexo."));
    valido = false;
  }

  return valido;
}

document
  .getElementById("formCrianca")
  .addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (!validarCampos()) return;

    const btnIr = document.getElementById("btnIr");
    const erroGeral = document.getElementById("erro-geral");

    btnIr.disabled = true;
    btnIr.textContent = traduzir("Salvando...");

    try {
      const formData = new FormData();

      formData.append(
        "nomeCrianca",
        document.getElementById("nomeCrianca").value.trim(),
      );
      formData.append(
        "dataNascimento",
        document.getElementById("dataNascimento").value,
      );
      formData.append("sexo", document.getElementById("sexo").value);
      formData.append(
        "nomePelucia",
        document.getElementById("nomePelucia").value.trim(),
      );

      const fotoInput = document.getElementById("fotoCrianca");
      if (fotoInput.files && fotoInput.files[0]) {
        formData.append("fotoCrianca", fotoInput.files[0]);
      }

      const resposta = await fetch("/api/adicionar-crianca", {
        method: "POST",
        body: formData,
      });

      if (resposta.status === 401) {
        window.location.href = "/logar";
        return;
      }

      if (resposta.redirected) {
        window.location.href = resposta.url;
        return;
      }

      if (!resposta.ok) {
        const dados = await resposta.json();

        if (dados.campo) {
          mostrarErro(dados.campo, "erro-" + dados.campo, traduzir(dados.erro));
        } else {
          erroGeral.textContent =
            traduzir(dados.erro) ||
            traduzir("Erro ao salvar. Tente novamente.");
          erroGeral.style.display = "block";
        }
      }
    } catch (erro) {
      console.log("Erro ao adicionar criança:", erro);

      erroGeral.textContent = traduzir(
        "Erro de conexão. Verifique sua internet e tente novamente.",
      );
      erroGeral.style.display = "block";
    } finally {
      btnIr.disabled = false;
      btnIr.textContent = traduzir("Ir para o Perfil sensorial");
    }
  });

document.getElementById("wrapperFotoCrianca").addEventListener("click", () => {
  document.getElementById("fotoCrianca").click();
});

document.getElementById("fotoCrianca").addEventListener("change", function () {
  previewFoto(this);
});
