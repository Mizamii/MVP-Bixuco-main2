let tipoSelecionado = null;

function t(pt, en) {
    return localStorage.getItem("idioma") === "en" ? en : pt;
}

function selecionarTipo(tipo) {
    tipoSelecionado = tipo;

    const campoCrp = document.getElementById("campoCrpGoogle");

    if (tipo === "psicologo") {
        campoCrp.style.display = "block";
    } else {
        campoCrp.style.display = "none";
        document.getElementById("inputCrpGoogle").value = "";
    }

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

document.getElementById("btnContinuar").addEventListener("click", async () => {
    if (!tipoSelecionado) {
        const erroEl = document.getElementById("erro-selecao");
        erroEl.textContent = t("Selecione como deseja utilizar o Bixuco.", "Select how you want to use Bixuco.");
        erroEl.style.display = "block";
        return;
    }

    if (tipoSelecionado === "psicologo") {
        const crp = document.getElementById("inputCrpGoogle").value.trim();

        if (!crp) {
            const erroEl = document.getElementById("erro-selecao");
            erroEl.textContent = t("Informe seu CRP para continuar.", "Enter your CRP to continue.");
            erroEl.style.display = "block";
            return;
        }
    }

    const btn = document.getElementById("btnContinuar");
    btn.disabled = true;
    btn.textContent = t("Salvando...", "Saving...");

    try {
        const resposta = await fetch("/api/onboarding-google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tipo: tipoSelecionado,
                crp: tipoSelecionado === "psicologo"
                    ? document.getElementById("inputCrpGoogle").value.trim()
                    : null
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || t("Erro ao salvar.", "Could not save."));
        }

        window.location.href = dados.destino;

    } catch (erro) {
        console.log("Erro no onboarding:", erro);

        const erroEl = document.getElementById("erro-selecao");
        erroEl.textContent = erro.message || t("Erro ao continuar. Tente novamente.", "Could not continue. Try again.");
        erroEl.style.display = "block";

        btn.disabled = false;
        btn.textContent = t("Continuar", "Continue");
    }
});

document.getElementById("cardResponsavel").addEventListener("click", () => {
    selecionarTipo("pai");
});

document.getElementById("cardPsicologo").addEventListener("click", () => {
    selecionarTipo("psicologo");
});
