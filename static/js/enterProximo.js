// Enter avança para o próximo campo do formulário.
// No último campo, aciona o botão principal (Entrar / Continuar / Enviar).
document.addEventListener("keydown", function (e) {

    if (e.key !== "Enter" || e.isComposing || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;

    const campo = e.target;

    if (!(campo instanceof HTMLInputElement)) return;

    const tiposIgnorados = ["button", "submit", "reset", "checkbox", "radio", "hidden", "file", "image"];

    if (tiposIgnorados.includes(campo.type)) return;

    const form = campo.form;

    if (!form) return;

    e.preventDefault();

    // Campos que podem receber foco (visíveis, habilitados)
    const campos = Array.from(form.querySelectorAll("input, select, textarea")).filter(function (el) {
        return !el.disabled
            && !el.readOnly
            && !tiposIgnorados.includes(el.type)
            && el.getClientRects().length > 0;
    });

    const proximo = campos[campos.indexOf(campo) + 1];

    if (proximo) {
        proximo.focus();
        return;
    }

    // Último campo: clica no botão principal, se ele não estiver desabilitado
    const botao = form.querySelector('button[type="submit"], input[type="submit"]');

    if (botao && !botao.disabled) {
        botao.click();
    }

});