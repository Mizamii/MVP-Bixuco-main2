const emailUsuario = document.getElementById("emailUsuario");
const btnBuscar = document.getElementById("btnBuscar");
const resultadoPedido = document.getElementById("resultadoPedido");
const nomeUsuarioEl = document.getElementById("nomeUsuarioEncontrado");
const statusAtualEl = document.getElementById("statusAtual");
const etapas = document.getElementById("etapas");
const statusEnvio = document.getElementById("statusEnvio");

function t(pt, en) {
  return window.traduzirPublico ? window.traduzirPublico(pt, en) : pt;
}

const nomesStatus = {
  em_producao: ["Em produção", "In production"],
  enviado: ["Enviado", "Shipped"],
  em_transito: ["Em trânsito", "In transit"],
  entregue: ["Entregue", "Delivered"],
};

function nomeStatus(status) {
  const item = nomesStatus[status];
  return item ? t(item[0], item[1]) : status;
}

function traduzirErroBackend(texto) {
  const mapa = {
    "Informe o e-mail do usuário.": "Enter the user's email.",
    "Usuário não encontrado.": "User not found.",
    "Esse usuário ainda não tem pedido.": "This user does not have an order yet.",
    "Status inválido.": "Invalid status.",
    "Erro interno.": "Internal error.",
  };

  if ((localStorage.getItem("idioma") || "pt") === "en") {
    return mapa[texto] || texto;
  }

  return texto;
}

function mostrarStatus(texto, tipo) {
  statusEnvio.textContent = texto;
  statusEnvio.className = `status visivel ${tipo}`;
}

function marcarEtapaAtual(status) {
  etapas.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("atual", btn.dataset.status === status);
  });
  statusAtualEl.textContent = nomeStatus(status);
}

btnBuscar.addEventListener("click", async () => {
  if (!emailUsuario.value.trim()) {
    mostrarStatus(t("Informe o e-mail do usuário.", "Enter the user's email."), "erro");
    return;
  }

  btnBuscar.disabled = true;
  btnBuscar.textContent = t("Buscando...", "Searching...");

  try {
    const resposta = await fetch("/api/admin/pedido-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailUsuario.value.trim(),
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(traduzirErroBackend(dados.erro || "Erro ao buscar pedido."));
    }

    nomeUsuarioEl.textContent = dados.nome;
    marcarEtapaAtual(dados.status);
    resultadoPedido.classList.add("visivel");
    statusEnvio.className = "status";
  } catch (erro) {
    resultadoPedido.classList.remove("visivel");
    mostrarStatus(erro.message, "erro");
  } finally {
    btnBuscar.disabled = false;
    btnBuscar.textContent = t("Buscar pedido", "Find order");
  }
});

etapas.addEventListener("click", async (e) => {
  const botao = e.target.closest("button[data-status]");
  if (!botao) return;

  const novoStatus = botao.dataset.status;

  etapas.querySelectorAll("button").forEach((b) => (b.disabled = true));

  try {
    const resposta = await fetch("/api/admin/pedido-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailUsuario.value.trim(),
        novoStatus,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(traduzirErroBackend(dados.erro || "Erro ao atualizar status."));
    }

    marcarEtapaAtual(novoStatus);
    mostrarStatus(
      t(
        `Status atualizado para "${nomeStatus(novoStatus)}".`,
        `Status updated to "${nomeStatus(novoStatus)}".`
      ),
      "sucesso"
    );
  } catch (erro) {
    mostrarStatus(erro.message, "erro");
  } finally {
    etapas.querySelectorAll("button").forEach((b) => (b.disabled = false));
  }
});

window.addEventListener("bixuco:idioma-alterado", () => {
  const statusAtual = etapas.querySelector("button.atual")?.dataset.status;
  if (statusAtual) statusAtualEl.textContent = nomeStatus(statusAtual);
  if (!btnBuscar.disabled) btnBuscar.textContent = t("Buscar pedido", "Find order");
});
