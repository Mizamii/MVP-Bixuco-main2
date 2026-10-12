                                                                   
const temaSalvo = localStorage.getItem("tema") || "claro";
document.body.classList.add(`tema-${temaSalvo}`);

                                                                                     
const idiomaAtual = localStorage.getItem("idioma") || "pt";
if (idiomaAtual === "en") {
document.querySelectorAll("[data-pt]").forEach(el => {
    el.textContent = el.dataset.en || el.dataset.pt;
});
}

document.getElementById('btn-inicio').addEventListener('click', () => {
window.location.href = '/home';
});