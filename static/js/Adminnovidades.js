
const form         = document.getElementById("formNovidade");
const btnEnviar     = document.getElementById("btnEnviar");
const statusEnvio   = document.getElementById("statusEnvio");

function mostrarStatus(texto, tipo) {
    statusEnvio.textContent = texto;
    statusEnvio.className   = `status visivel ${tipo}`;
}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const chave     = document.getElementById("chaveAdmin").value;
    const mensagem  = document.getElementById("mensagemNovidade").value;

    btnEnviar.disabled    = true;
    btnEnviar.textContent = "Enviando...";

    try {

        const resposta = await fetch("/api/admin/novidade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chave, mensagem })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao publicar novidade.");
        }

        mostrarStatus(dados.mensagem, "sucesso");
        form.reset();

    } catch (erro) {

        mostrarStatus(erro.message, "erro");

    } finally {

        btnEnviar.disabled    = false;
        btnEnviar.textContent = "Publicar novidade";

    }

});