// Calcula a previsão de entrega: hoje + 25 dias
function calcularPrevisao() {
    const hoje    = new Date();
    const entrega = new Date(hoje);
    entrega.setDate(hoje.getDate() + 25);

    const meses = [
        "janeiro","fevereiro","março","abril","maio","junho",
        "julho","agosto","setembro","outubro","novembro","dezembro"
    ];

    const dia  = entrega.getDate();
    const mes  = meses[entrega.getMonth()];
    const ano  = entrega.getFullYear();

    document.getElementById("data-previsao").textContent =
        `${dia} de ${mes} de ${ano}`;
}

calcularPrevisao();

document.getElementById("btn-rastreamento").addEventListener("click", () => {
    window.location.href = "/AcompanharPedido";
});