const form = document.getElementById("formNovidade");
const btnEnviar = document.getElementById("btnEnviar");
const statusEnvio = document.getElementById("statusEnvio");

function t(pt, en) {
  return window.traduzirPublico ? window.traduzirPublico(pt, en) : pt;
}

function mostrarStatus(texto, tipo) {
  statusEnvio.textContent = texto;
  statusEnvio.className = `status visivel ${tipo}`;
}

function traduzirErroBackend(texto) {
  const mapa = {
    "Escreva uma mensagem válida.": "Write a valid message.",
    "Erro interno ao publicar novidade.": "Internal error while publishing the update.",
  };

  if ((localStorage.getItem("idioma") || "pt") === "en") {
    return mapa[texto] || texto;
  }

  return texto;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const mensagem = document.getElementById("mensagemNovidade").value;

  btnEnviar.disabled = true;
  btnEnviar.textContent = t("Enviando...", "Sending...");

  try {
    const resposta = await fetch("/api/admin/novidade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(traduzirErroBackend(dados.erro || "Erro ao publicar novidade."));
    }

    if ((localStorage.getItem("idioma") || "pt") === "en") {
      const quantidade = String(dados.mensagem || "").match(/\d+/)?.[0];
      mostrarStatus(
        quantidade
          ? `Update sent to ${quantidade} user(s).`
          : "Update published successfully.",
        "sucesso"
      );
    } else {
      mostrarStatus(dados.mensagem, "sucesso");
    }

    form.reset();
  } catch (erro) {
    mostrarStatus(erro.message, "erro");
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = t("Publicar novidade", "Publish update");
  }
});
