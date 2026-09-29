let tipoSelecionado = null;

// ==========================
// SELECIONAR TIPO
// ==========================

function selecionarTipo(tipo) {

    tipoSelecionado = tipo;

    document.querySelectorAll(".tipo-card").forEach(card => {
        card.classList.remove("tipo-card--ativo");
        card.setAttribute("aria-pressed", "false");
    });

    const cardSelecionado = tipo === "pai"
        ? document.getElementById("cardResponsavel")
        : document.getElementById("cardPsicologo");

    cardSelecionado.classList.add("tipo-card--ativo");
    cardSelecionado.setAttribute("aria-pressed", "true");

    document.getElementById("btnContinuar").disabled = false;
    document.getElementById("erro-selecao").style.display = "none";

}

// ==========================
// CONTINUAR
// ==========================

document.getElementById("btnContinuar").addEventListener("click", async () => {

    if (!tipoSelecionado) {
        document.getElementById("erro-selecao").style.display = "block";
        return;
    }

    const btn = document.getElementById("btnContinuar");
    btn.disabled    = true;
    btn.textContent = "Salvando...";

    try {

        const resposta = await fetch("/api/onboarding-google", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ tipo: tipoSelecionado })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao salvar.");
        }

        // Redireciona para o destino retornado pelo backend
        // pai → /AdicionarC | psicologo → /homeTerapeuta
        window.location.href = dados.destino;

    } catch (erro) {

        console.log("Erro no onboarding:", erro);

        const erroEl = document.getElementById("erro-selecao");
        erroEl.textContent   = erro.message || "Erro ao continuar. Tente novamente.";
        erroEl.style.display = "block";

        btn.disabled    = false;
        btn.textContent = "Continuar";

    }

});

// ==========================
// LIGA OS CARDS (removido o onclick por causa do CSP)
// ==========================

document.getElementById("cardResponsavel").addEventListener("click", () => {
    selecionarTipo("pai");
});

document.getElementById("cardPsicologo").addEventListener("click", () => {
    selecionarTipo("psicologo");
});