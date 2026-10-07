// ==========================
// TRADUÇÃO
// ==========================

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionarioVerificacao = {
  "Digite os 6 dígitos do código.": "Enter the 6-digit code.",
  "Verificando...": "Verifying...",
  "Código incorreto.": "Incorrect code.",
  "Código confirmado! Redirecionando...": "Code confirmed! Redirecting...",
  "Erro ao verificar. Tente novamente.": "Error verifying the code. Try again.",
  "Enviando novo código...": "Sending a new code...",
  "Não foi possível reenviar agora.": "Unable to resend the code right now.",
  "Novo código enviado!": "New code sent!",
  "Erro ao reenviar código.": "Error resending the code.",
  "Sessão expirada. Faça login novamente.": "Session expired. Please log in again.",
  "Digite o código recebido por e-mail.": "Enter the code received by email."
};

function traduzir(texto) {
  if (idiomaAtual === "pt" || texto == null) return texto;
  return dicionarioVerificacao[texto] || texto;
}

function aplicarIdiomaEstatico() {
  document.querySelectorAll("[data-pt]").forEach(el => {
    el.textContent = idiomaAtual === "en"
      ? (el.dataset.en || el.dataset.pt)
      : el.dataset.pt;
  });

  const textoTradutor = document.getElementById("textoTradutor");
  if (textoTradutor) {
    textoTradutor.textContent = idiomaAtual === "en"
      ? "Traduzir para o português"
      : "Traduzir para o inglês";
  }

  document.documentElement.lang = idiomaAtual === "en" ? "en" : "pt-BR";
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
  idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
  localStorage.setItem("idioma", idiomaAtual);
  aplicarIdiomaEstatico();

  if (cooldownReenvio > 0) {
    btnReenviar.textContent = idiomaAtual === "en"
      ? `Resend code (${cooldownReenvio}s)`
      : `Reenviar código (${cooldownReenvio}s)`;
  }
});

aplicarIdiomaEstatico();

// ==========================
// VERIFICAÇÃO 2FA
// ==========================

const inputCodigo = document.getElementById("codigo");
const btnConfirmar = document.getElementById("confirmar");
const btnReenviar = document.getElementById("reenviar");
const mensagem = document.getElementById("mensagem");

let cooldownReenvio = 0;
let timerReenvio = null;

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = traduzir(texto);
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
    btnReenviar.textContent = idiomaAtual === "en"
      ? `Resend code (${cooldownReenvio}s)`
      : `Reenviar código (${cooldownReenvio}s)`;

    if (cooldownReenvio <= 0) {
      clearInterval(timerReenvio);
      btnReenviar.disabled = false;
      btnReenviar.textContent = idiomaAtual === "en"
        ? "Resend code"
        : "Reenviar código";
    }
  }, 1000);
}
