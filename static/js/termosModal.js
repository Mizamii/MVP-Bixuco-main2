// ==========================
// MODAL COMPARTILHADO — TERMOS DE USO / POLÍTICA DE PRIVACIDADE
// Usado nas telas CriarContaG, CriarContaP e CriarContaSenha.
// Cria o modal dinamicamente e liga nos botões #btnAbrirTermos
// e #btnAbrirPrivacidade, se existirem na página.
// ==========================

// ⚠️ TEXTO PLACEHOLDER — troque pelo texto real dos Termos de Uso
// e da Política de Privacidade do Bixuco antes de publicar.
const textoTermos = {
    pt: {
        titulo: "Termos de uso",
        corpo: `
            <p>Estes Termos de Uso regulam a utilização do aplicativo Bixuco.
            Ao criar sua conta, você concorda com as condições descritas abaixo.</p>
            <h4>1. Uso do serviço</h4>
            <p>O Bixuco é destinado ao acompanhamento de crianças com hipersensibilidade
            sensorial por seus responsáveis e terapeutas vinculados.</p>
            <h4>2. Conta do usuário</h4>
            <p>Você é responsável por manter a confidencialidade da sua senha e por
            todas as atividades realizadas na sua conta.</p>
            <h4>3. Alterações</h4>
            <p>Podemos atualizar estes termos periodicamente. Mudanças relevantes
            serão comunicadas por e-mail ou dentro do aplicativo.</p>
        `
    },
    en: {
        titulo: "Terms of use",
        corpo: `
            <p>These Terms of Use govern the use of the Bixuco app.
            By creating your account, you agree to the conditions described below.</p>
            <h4>1. Use of the service</h4>
            <p>Bixuco is intended for tracking children with sensory hypersensitivity
            by their guardians and linked therapists.</p>
            <h4>2. User account</h4>
            <p>You are responsible for keeping your password confidential and for
            all activities carried out on your account.</p>
            <h4>3. Changes</h4>
            <p>We may update these terms periodically. Relevant changes will be
            communicated by email or within the app.</p>
        `
    }
};

const textoPrivacidade = {
    pt: {
        titulo: "Política de privacidade",
        corpo: `
            <p>Esta Política de Privacidade explica como o Bixuco coleta, usa e
            protege as informações de responsáveis, terapeutas e crianças.</p>
            <h4>1. Dados coletados</h4>
            <p>Coletamos dados de cadastro (nome, e-mail, CPF/CRP), dados da criança
            e eventos registrados pelo dispositivo Bixuco, sempre com a finalidade
            de oferecer o acompanhamento sensorial.</p>
            <h4>2. Compartilhamento</h4>
            <p>Dados da criança são compartilhados apenas com o terapeuta vinculado
            pelo responsável, e nunca com terceiros para fins comerciais.</p>
            <h4>3. Segurança</h4>
            <p>Utilizamos criptografia e boas práticas de segurança para proteger
            as informações armazenadas.</p>
        `
    },
    en: {
        titulo: "Privacy policy",
        corpo: `
            <p>This Privacy Policy explains how Bixuco collects, uses and protects
            information from guardians, therapists and children.</p>
            <h4>1. Data collected</h4>
            <p>We collect registration data (name, email, CPF/CRP), child data and
            events recorded by the Bixuco device, always for the purpose of providing
            sensory tracking.</p>
            <h4>2. Sharing</h4>
            <p>Child data is shared only with the therapist linked by the guardian,
            and never with third parties for commercial purposes.</p>
            <h4>3. Security</h4>
            <p>We use encryption and security best practices to protect stored
            information.</p>
        `
    }
};

function idiomaModalAtual() {
    return localStorage.getItem("idioma") || "pt";
}

function criarModalTermos(id, conteudo) {

    const modal = document.createElement("div");
    modal.id = id;
    modal.className = "modal-termos";
    modal.style.display = "none";

    modal.innerHTML = `
        <div class="modal-termos__conteudo">
            <div class="modal-termos__header">
                <h3 id="${id}-titulo"></h3>
                <button type="button" class="modal-termos__fechar" aria-label="Fechar">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="modal-termos__corpo" id="${id}-corpo"></div>
        </div>
    `;

    document.body.appendChild(modal);

    function preencherTexto() {
        const idioma = idiomaModalAtual() === "en" ? "en" : "pt";
        document.getElementById(`${id}-titulo`).textContent = conteudo[idioma].titulo;
        document.getElementById(`${id}-corpo`).innerHTML = conteudo[idioma].corpo;
    }

    function abrir() {
        preencherTexto();
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    function fechar() {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }

    modal.querySelector(".modal-termos__fechar").addEventListener("click", fechar);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) fechar();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "flex") fechar();
    });

    return { abrir, fechar };
}

document.addEventListener("DOMContentLoaded", () => {

    const btnTermos      = document.getElementById("btnAbrirTermos");
    const btnPrivacidade = document.getElementById("btnAbrirPrivacidade");

    if (btnTermos) {
        const modalTermos = criarModalTermos("modalTermos", textoTermos);
        btnTermos.addEventListener("click", modalTermos.abrir);
    }

    if (btnPrivacidade) {
        const modalPrivacidade = criarModalTermos("modalPrivacidade", textoPrivacidade);
        btnPrivacidade.addEventListener("click", modalPrivacidade.abrir);
    }

}); 