function calcularPrevisao() {
    const hoje = new Date();
    const entrega = new Date(hoje);
    entrega.setDate(hoje.getDate() + 25);

    const idioma = localStorage.getItem("idioma") === "en" ? "en" : "pt";
    const locale = idioma === "en" ? "en-US" : "pt-BR";

    document.getElementById("data-previsao").textContent =
        entrega.toLocaleDateString(locale, {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
}

calcularPrevisao();
window.addEventListener("bixuco:idioma-alterado", calcularPrevisao);

document.getElementById("btn-rastreamento").addEventListener("click", () => {
    window.location.href = "/AcompanharPedido";
});
