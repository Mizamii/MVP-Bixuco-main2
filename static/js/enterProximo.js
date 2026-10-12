                                                   
                                                                           
document.addEventListener("keydown", function (e) {

    if (e.key !== "Enter" || e.isComposing || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;

    const campo = e.target;

    if (!(campo instanceof HTMLInputElement)) return;

    const tiposIgnorados = ["button", "submit", "reset", "checkbox", "radio", "hidden", "file", "image"];

    if (tiposIgnorados.includes(campo.type)) return;

    const form = campo.form;

    if (!form) return;

    e.preventDefault();

                                                            
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

                                                                              
    const botao = form.querySelector('button[type="submit"], input[type="submit"]');

    if (botao && !botao.disabled) {
        botao.click();
    }

});