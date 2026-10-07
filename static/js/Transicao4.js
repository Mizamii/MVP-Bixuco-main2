function t(pt, en) {
    return localStorage.getItem("idioma") === "en" ? en : pt;
}

let ultimosDadosHome = null;

function renderizarSequencia(dados) {
    if (!dados) return;

    if (dados.nomeCrianca) {
        document.getElementById("nomeCrianca").textContent = dados.nomeCrianca;
    }

    const dias = dados.diasConsecutivos ?? 0;
    const diasEl = document.getElementById("diasSeguidos");
    const textoDias = document.getElementById("textoDias");
    const textoApoio = document.getElementById("textoApoioSequencia");

    diasEl.textContent = dias;

    if (dias === 0) {
        diasEl.textContent = "";
        textoDias.textContent = t("Hoje foi um dia mais difícil.", "Today was a more difficult day.");
        textoApoio.textContent = t(
            "Registrar o dia já ajuda a entender os padrões. Amanhã a ofensiva recomeça, um dia de cada vez.",
            "Recording the day already helps reveal patterns. Tomorrow the streak starts again, one day at a time."
        );
    } else if (dias === 1) {
        textoDias.textContent = t("dia sem nenhuma crise! Parabéns!", "crisis-free day! Well done!");
        textoApoio.textContent = t("Cada dia sem crise conta para a sua ofensiva", "Every crisis-free day counts toward your streak");
    } else {
        textoDias.textContent = t("dias sem nenhuma crise! Parabéns!", "crisis-free days! Well done!");
        textoApoio.textContent = t("Cada dia sem crise conta para a sua ofensiva", "Every crisis-free day counts toward your streak");
    }
}

async function carregarDados() {
    try {
        const resposta = await fetch("/api/home");
        if (!resposta.ok) throw new Error();

        ultimosDadosHome = await resposta.json();
        renderizarSequencia(ultimosDadosHome);
    } catch (erro) {
        console.log(erro);
    }
}

document.getElementById("btnInicio").addEventListener("click", () => {
    window.location.href = "/home";
});

window.addEventListener("bixuco:idioma-alterado", () => {
    renderizarSequencia(ultimosDadosHome);
});

carregarDados();
