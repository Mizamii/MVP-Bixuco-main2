
const chaveAdmin      = document.getElementById("chaveAdmin");
const emailUsuario    = document.getElementById("emailUsuario");
const btnBuscar       = document.getElementById("btnBuscar");
const resultadoPedido = document.getElementById("resultadoPedido");
const nomeUsuarioEl   = document.getElementById("nomeUsuarioEncontrado");
const statusAtualEl   = document.getElementById("statusAtual");
const etapas          = document.getElementById("etapas");
const statusEnvio     = document.getElementById("statusEnvio");

function mostrarStatus(texto, tipo) {
    statusEnvio.textContent = texto;
    statusEnvio.className   = `status visivel ${tipo}`;
}

function marcarEtapaAtual(status) {
    etapas.querySelectorAll("button").forEach(btn => {
        btn.classList.toggle("atual", btn.dataset.status === status);
    });
}

btnBuscar.addEventListener("click", async () => {

    if (!chaveAdmin.value || !emailUsuario.value) {
        mostrarStatus("Preencha a senha de admin e o e-mail.", "erro");
        return;
    }

    btnBuscar.disabled    = true;
    btnBuscar.textContent = "Buscando...";

    try {
        const resposta = await fetch("/api/admin/pedido-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chave: chaveAdmin.value,
                email: emailUsuario.value
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) throw new Error(dados.erro || "Erro ao buscar pedido.");

        nomeUsuarioEl.textContent = dados.nome;
        statusAtualEl.textContent = dados.status;
        marcarEtapaAtual(dados.status);
        resultadoPedido.classList.add("visivel");
        statusEnvio.className = "status";

    } catch (erro) {
        resultadoPedido.classList.remove("visivel");
        mostrarStatus(erro.message, "erro");
    } finally {
        btnBuscar.disabled    = false;
        btnBuscar.textContent = "Buscar pedido";
    }

});

etapas.addEventListener("click", async (e) => {

    const botao = e.target.closest("button[data-status]");
    if (!botao) return;

    const novoStatus = botao.dataset.status;

    etapas.querySelectorAll("button").forEach(b => b.disabled = true);

    try {
        const resposta = await fetch("/api/admin/pedido-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chave: chaveAdmin.value,
                email: emailUsuario.value,
                novoStatus
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) throw new Error(dados.erro || "Erro ao atualizar status.");

        statusAtualEl.textContent = novoStatus;
        marcarEtapaAtual(novoStatus);
        mostrarStatus(dados.mensagem, "sucesso");

    } catch (erro) {
        mostrarStatus(erro.message, "erro");
    } finally {
        etapas.querySelectorAll("button").forEach(b => b.disabled = false);
    }

});