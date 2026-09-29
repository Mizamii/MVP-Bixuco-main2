const inputCodigo = document.getElementById("codigo");
const btnConfirmar = document.getElementById("confirmar");
const btnReenviar = document.getElementById("reenviar");
const mensagem = document.getElementById("mensagem");

let cooldownReenvio = 0;
let timerReenvio = null;

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = tipo || "";
}

inputCodigo.addEventListener("input", () => {
  inputCodigo.value = inputCodigo.value.replace(/\D/g, "").slice(0, 6);
});

inputCodigo.addEventListener("keydown", (e) => {
  if (e.key === "Enter") confirmarCodigo();
});

btnConfirmar.addEventListener("click", confirmarCodigo);

async function confirmarCodigo() {
  const codigo = inputCodigo.value.trim();

  if (codigo.length !== 6) {
    mostrarMensagem("Digite os 6 dígitos do código.", "erro");
    return;
  }

  btnConfirmar.disabled = true;
  mostrarMensagem("Verificando...", "");

  try {
    const resp = await fetch("/api/2fa/verificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo })
    });

    const dados = await resp.json();

    if (!resp.ok) {
      mostrarMensagem(dados.erro || "Código incorreto.", "erro");
      btnConfirmar.disabled = false;
      return;
    }

    mostrarMensagem("Código confirmado! Redirecionando...", "sucesso");
    window.location.href = dados.destino || "/home";

  } catch (erro) {
    mostrarMensagem("Erro ao verificar. Tente novamente.", "erro");
    btnConfirmar.disabled = false;
  }
}

btnReenviar.addEventListener("click", async () => {
  if (cooldownReenvio > 0) return;

  btnReenviar.disabled = true;
  mostrarMensagem("Enviando novo código...", "");

  try {
    const resp = await fetch("/api/2fa/reenviar", { method: "POST" });
    const dados = await resp.json();

    if (!resp.ok) {
      mostrarMensagem(dados.erro || "Não foi possível reenviar agora.", "erro");
    } else {
      mostrarMensagem(dados.mensagem || "Novo código enviado!", "sucesso");
      iniciarCooldown(60);
      return;
    }

  } catch (erro) {
    mostrarMensagem("Erro ao reenviar código.", "erro");
  }

  btnReenviar.disabled = false;
});

function iniciarCooldown(segundos) {
  cooldownReenvio = segundos;
  btnReenviar.disabled = true;

  timerReenvio = setInterval(() => {
    cooldownReenvio--;
    btnReenviar.textContent = `Reenviar código (${cooldownReenvio}s)`;

    if (cooldownReenvio <= 0) {
      clearInterval(timerReenvio);
      btnReenviar.disabled = false;
      btnReenviar.textContent = "Reenviar código";
    }
  }, 1000);
}