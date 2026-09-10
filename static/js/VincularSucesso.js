// Respeita o tema salvo, já que essa tela não tem o toggle de tema
const temaSalvo = localStorage.getItem("tema") || "claro";
document.body.classList.add(`tema-${temaSalvo}`);

// Aplica a tradução manual salva, já que essa tela não tem botão de traduzir próprio
const idiomaAtual = localStorage.getItem("idioma") || "pt";
if (idiomaAtual === "en") {
document.querySelectorAll("[data-pt]").forEach(el => {
    el.textContent = el.dataset.en || el.dataset.pt;
});
}

document.getElementById('btn-inicio').addEventListener('click', () => {
window.location.href = '/home';
});