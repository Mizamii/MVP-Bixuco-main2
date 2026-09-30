// ==========================
// MODAL COMPARTILHADO — TERMOS DE USO / POLÍTICA DE PRIVACIDADE
// Usado nas telas CriarContaG, CriarContaP e CriarContaSenha.
// Cria o modal dinamicamente e liga nos botões #btnAbrirTermos
// e #btnAbrirPrivacidade, se existirem na página.
// ==========================


const textoTermos = {

    pt: {

        titulo: "Termos de Uso",

        corpo: `
            <p>
                Ao acessar ou utilizar a plataforma Bixuco, o usuário declara
                que leu, compreendeu e concorda com estes Termos de Uso.
            </p>

            <h4>1. Sobre o Bixuco</h4>

            <p>
                O Bixuco é uma plataforma de apoio ao acompanhamento do
                bem-estar e da rotina sensorial de crianças, integrada a um
                dispositivo físico capaz de registrar interações e eventos
                durante o uso.
            </p>

            <p>
                A plataforma permite que responsáveis acompanhem informações,
                preencham relatórios, visualizem dados do dispositivo e,
                quando desejarem, compartilhem informações com profissionais
                cadastrados.
            </p>


            <h4>2. O Bixuco não realiza diagnóstico</h4>

            <p>
                O Bixuco não substitui avaliação, diagnóstico, tratamento ou
                acompanhamento realizado por profissionais habilitados da
                área da saúde.
            </p>

            <p>
                Os dados, gráficos, alertas e classificações apresentados pela
                plataforma possuem caráter informativo e de apoio ao
                acompanhamento cotidiano e não devem ser interpretados
                isoladamente como diagnóstico clínico.
            </p>


            <h4>3. Cadastro e responsabilidade pelas informações</h4>

            <p>
                O usuário é responsável por fornecer informações verdadeiras
                e atualizadas durante o cadastro e a utilização da plataforma.
            </p>

            <p>
                No caso de contas de responsáveis, poderão ser cadastradas
                informações relacionadas à criança sob sua responsabilidade.
            </p>

            <p>
                Contas profissionais poderão exigir informações como número
                de registro profissional para validação do cadastro.
            </p>


            <h4>4. Conta e segurança</h4>

            <p>
                O usuário é responsável por manter suas credenciais de acesso
                em segurança e não deve compartilhar sua senha com terceiros.
            </p>

            <p>
                Caso identifique acesso não autorizado ou comportamento
                suspeito em sua conta, o usuário deverá alterar suas
                credenciais e comunicar o ocorrido pelos canais de contato
                disponibilizados pela Bixuco.
            </p>


            <h4>5. Compartilhamento com profissionais</h4>

            <p>
                O compartilhamento de relatórios e informações com terapeutas
                ou outros profissionais depende da autorização e do vínculo
                realizado pelo responsável.
            </p>

            <p>
                O cadastro ou presença de um profissional na plataforma não
                representa garantia, certificação de qualidade ou recomendação
                profissional por parte da Bixuco.
            </p>


            <h4>6. Uso adequado da plataforma</h4>

            <p>
                O usuário concorda em não utilizar a plataforma para atividades
                ilícitas, fraudulentas ou que possam comprometer o
                funcionamento, a segurança ou os dados de outros usuários.
            </p>


            <h4>7. Disponibilidade do serviço</h4>

            <p>
                Por se tratar de uma plataforma tecnológica em desenvolvimento,
                determinadas funcionalidades poderão ser modificadas,
                atualizadas, temporariamente indisponíveis ou substituídas
                durante a evolução do projeto.
            </p>


            <h4>8. Exclusão da conta</h4>

            <p>
                O usuário poderá solicitar ou realizar a exclusão de sua conta
                por meio das funcionalidades disponibilizadas pela plataforma.
            </p>

            <p>
                A exclusão poderá remover ou desvincular dados associados à
                conta, respeitando eventuais obrigações técnicas ou legais
                aplicáveis.
            </p>


            <h4>9. Alterações destes Termos</h4>

            <p>
                Estes Termos poderão ser atualizados quando houver mudanças
                relevantes nas funcionalidades ou no funcionamento da
                plataforma.
            </p>

            <p>
                A versão mais recente será disponibilizada dentro do próprio
                Bixuco.
            </p>
        `
    },


    en: {

        titulo: "Terms of Use",

        corpo: `
            <p>
                By accessing or using the Bixuco platform, the user declares
                that they have read, understood and agreed to these Terms of Use.
            </p>

            <h4>1. About Bixuco</h4>

            <p>
                Bixuco is a platform designed to support the monitoring of
                children's well-being and sensory routines, integrated with a
                physical device capable of recording interactions and events
                during its use.
            </p>

            <p>
                The platform allows guardians to monitor information, complete
                reports, view device data and, when desired, share information
                with registered professionals.
            </p>


            <h4>2. Bixuco does not provide diagnoses</h4>

            <p>
                Bixuco does not replace assessment, diagnosis, treatment or
                follow-up performed by qualified healthcare professionals.
            </p>

            <p>
                The data, charts, alerts and classifications presented by the
                platform are intended for informational and everyday monitoring
                support purposes and should not be interpreted independently
                as a clinical diagnosis.
            </p>


            <h4>3. Registration and responsibility for information</h4>

            <p>
                Users are responsible for providing truthful and updated
                information when registering and using the platform.
            </p>

            <p>
                Guardian accounts may register information related to the
                child under their responsibility.
            </p>

            <p>
                Professional accounts may require information such as a
                professional registration number for account validation.
            </p>


            <h4>4. Account and security</h4>

            <p>
                Users are responsible for keeping their login credentials
                secure and should not share their passwords with third parties.
            </p>

            <p>
                If unauthorized access or suspicious activity is identified,
                the user should change their credentials and contact Bixuco
                through the available support channels.
            </p>


            <h4>5. Sharing with professionals</h4>

            <p>
                Sharing reports and information with therapists or other
                professionals depends on authorization and linking performed
                by the guardian.
            </p>

            <p>
                A professional being registered or present on the platform
                does not represent a guarantee, quality certification or
                professional recommendation by Bixuco.
            </p>


            <h4>6. Appropriate use of the platform</h4>

            <p>
                Users agree not to use the platform for illegal or fraudulent
                activities or in ways that may compromise its operation,
                security or other users' data.
            </p>


            <h4>7. Service availability</h4>

            <p>
                As Bixuco is a technology platform under development, certain
                features may be modified, updated, temporarily unavailable or
                replaced as the project evolves.
            </p>


            <h4>8. Account deletion</h4>

            <p>
                Users may request or perform account deletion through the
                features made available by the platform.
            </p>

            <p>
                Account deletion may remove or unlink associated information,
                subject to applicable technical or legal obligations.
            </p>


            <h4>9. Changes to these Terms</h4>

            <p>
                These Terms may be updated whenever relevant changes are made
                to the platform's features or operation.
            </p>

            <p>
                The latest version will be made available within Bixuco.
            </p>
        `
    }
};



const textoPrivacidade = {

    pt: {

        titulo: "Política de Privacidade",

        corpo: `
            <p>
                A Bixuco valoriza a privacidade de seus usuários e busca tratar
                os dados pessoais de maneira responsável, transparente e
                compatível com as finalidades da plataforma.
            </p>


            <h4>1. Dados que podem ser coletados</h4>

            <p>
                Dependendo das funcionalidades utilizadas, a Bixuco poderá
                tratar informações como:
            </p>

            <ul>
                <li>nome, e-mail e dados necessários para criação da conta;</li>

                <li>
                    data de nascimento e outras informações de cadastro;
                </li>

                <li>
                    dados da criança cadastrada pelo responsável;
                </li>

                <li>
                    respostas do Perfil Sensorial;
                </li>

                <li>
                    respostas e observações registradas nos relatórios diários;
                </li>

                <li>
                    eventos registrados pelo dispositivo Bixuco;
                </li>

                <li>
                    dados de localização do dispositivo, quando essa
                    funcionalidade estiver disponível e ativa;
                </li>

                <li>
                    preferências de notificações e configurações da conta;
                </li>

                <li>
                    dados relacionados à assinatura e ao plano contratado;
                </li>

                <li>
                    informações de vínculo entre responsáveis e profissionais;
                </li>

                <li>
                    CRP e outras informações necessárias ao cadastro de
                    profissionais.
                </li>
            </ul>


            <h4>2. Para que utilizamos esses dados</h4>

            <p>
                As informações poderão ser utilizadas para:
            </p>

            <ul>
                <li>
                    permitir o funcionamento da conta e das funcionalidades
                    da plataforma;
                </li>

                <li>
                    registrar e apresentar relatórios e históricos;
                </li>

                <li>
                    exibir informações provenientes do dispositivo Bixuco;
                </li>

                <li>
                    personalizar determinados conteúdos e funcionalidades;
                </li>

                <li>
                    permitir o compartilhamento autorizado entre responsável
                    e profissional;
                </li>

                <li>
                    enviar comunicações e lembretes quando autorizados pelo
                    usuário;
                </li>

                <li>
                    processar e gerenciar assinaturas;
                </li>

                <li>
                    prevenir uso indevido e manter o funcionamento adequado
                    do sistema.
                </li>
            </ul>


            <h4>3. Dados de crianças</h4>

            <p>
                Informações relacionadas à criança devem ser cadastradas e
                administradas por seu responsável.
            </p>

            <p>
                Esses dados são utilizados para as funcionalidades de
                acompanhamento disponibilizadas pelo Bixuco e não devem ser
                utilizados para substituir avaliações profissionais.
            </p>


            <h4>4. Compartilhamento de dados</h4>

            <p>
                A Bixuco não disponibiliza informações da criança para
                terapeutas automaticamente.
            </p>

            <p>
                O acesso do profissional depende de vínculo e autorização
                realizados pelo responsável dentro da plataforma.
            </p>

            <p>
                Também poderão ser utilizados serviços de terceiros necessários
                ao funcionamento da plataforma, como serviços de autenticação,
                hospedagem, envio de e-mails e processamento de pagamentos.
            </p>

            <p>
                Nesses casos, somente as informações necessárias para a
                execução de cada serviço deverão ser utilizadas.
            </p>


            <h4>5. Localização do Bixuco</h4>

            <p>
                Quando a funcionalidade de localização estiver habilitada,
                a plataforma poderá armazenar a última localização registrada
                pelo dispositivo para permitir sua visualização pelo responsável.
            </p>

            <p>
                Uma localização antiga ou indisponível não representa
                necessariamente a posição atual do dispositivo.
            </p>


            <h4>6. Profissionais cadastrados</h4>

            <p>
                Informações profissionais, como nome e CRP, poderão ser
                utilizadas para identificação e validação de contas
                profissionais.
            </p>

            <p>
                A validação do cadastro não significa que a Bixuco garante
                a qualidade, adequação ou resultado dos serviços prestados
                pelo profissional.
            </p>


            <h4>7. Armazenamento e segurança</h4>

            <p>
                A Bixuco busca adotar medidas técnicas e organizacionais
                adequadas para reduzir riscos de acesso não autorizado,
                perda, alteração ou uso indevido das informações armazenadas.
            </p>

            <p>
                Nenhum sistema conectado à internet pode garantir segurança
                absoluta. As medidas de proteção poderão ser atualizadas
                conforme a evolução da plataforma.
            </p>


            <h4>8. Controle de notificações</h4>

            <p>
                O usuário poderá alterar determinadas preferências de
                notificações nas configurações da plataforma.
            </p>

            <p>
                Comunicações essenciais relacionadas à segurança,
                autenticação ou funcionamento da conta poderão ser tratadas
                separadamente.
            </p>


            <h4>9. Direitos do usuário</h4>

            <p>
                O usuário poderá solicitar informações sobre seus dados,
                corrigir informações incorretas e, quando aplicável,
                solicitar a exclusão de sua conta e dos dados associados.
            </p>


            <h4>10. Exclusão e retenção</h4>

            <p>
                Quando uma conta for excluída, os dados associados poderão
                ser removidos ou desvinculados conforme a estrutura e as
                necessidades técnicas da plataforma, observadas eventuais
                obrigações legais aplicáveis.
            </p>


            <h4>11. Atualizações desta Política</h4>

            <p>
                Esta Política de Privacidade poderá ser atualizada para
                acompanhar alterações nas funcionalidades e no funcionamento
                do Bixuco.
            </p>

            <p>
                A versão atualizada ficará disponível dentro da plataforma.
            </p>
        `
    },


    en: {

        titulo: "Privacy Policy",

        corpo: `
            <p>
                Bixuco values the privacy of its users and seeks to process
                personal information responsibly, transparently and in
                accordance with the purposes of the platform.
            </p>


            <h4>1. Data that may be collected</h4>

            <p>
                Depending on the features used, Bixuco may process information
                such as:
            </p>

            <ul>
                <li>
                    name, email and information required to create an account;
                </li>

                <li>
                    date of birth and other registration information;
                </li>

                <li>
                    information about the child registered by the guardian;
                </li>

                <li>
                    Sensory Profile responses;
                </li>

                <li>
                    responses and observations recorded in daily reports;
                </li>

                <li>
                    events recorded by the Bixuco device;
                </li>

                <li>
                    device location information when this feature is available
                    and enabled;
                </li>

                <li>
                    notification preferences and account settings;
                </li>

                <li>
                    subscription and plan information;
                </li>

                <li>
                    information about links between guardians and professionals;
                </li>

                <li>
                    professional registration information required to validate
                    professional accounts.
                </li>
            </ul>


            <h4>2. How we use this information</h4>

            <p>
                Information may be used to:
            </p>

            <ul>
                <li>
                    provide account and platform functionality;
                </li>

                <li>
                    record and display reports and histories;
                </li>

                <li>
                    display information received from the Bixuco device;
                </li>

                <li>
                    personalize certain content and features;
                </li>

                <li>
                    enable authorized sharing between guardians and
                    professionals;
                </li>

                <li>
                    send communications and reminders when authorized by
                    the user;
                </li>

                <li>
                    process and manage subscriptions;
                </li>

                <li>
                    prevent misuse and maintain the proper operation of
                    the system.
                </li>
            </ul>


            <h4>3. Children's information</h4>

            <p>
                Information related to a child should be registered and
                managed by their guardian.
            </p>

            <p>
                This information is used for the monitoring features provided
                by Bixuco and should not be used as a replacement for
                professional assessment.
            </p>


            <h4>4. Data sharing</h4>

            <p>
                Bixuco does not automatically make a child's information
                available to therapists.
            </p>

            <p>
                Professional access depends on authorization and linking
                performed by the guardian within the platform.
            </p>

            <p>
                Third-party services required for the operation of the platform
                may also be used, including authentication, hosting, email
                delivery and payment processing services.
            </p>

            <p>
                In such cases, only information necessary to provide each
                service should be used.
            </p>


            <h4>5. Bixuco location</h4>

            <p>
                When location features are enabled, the platform may store
                the most recently recorded device location so that it can
                be viewed by the guardian.
            </p>

            <p>
                An old or unavailable location does not necessarily represent
                the device's current position.
            </p>


            <h4>6. Registered professionals</h4>

            <p>
                Professional information, such as name and professional
                registration number, may be used to identify and validate
                professional accounts.
            </p>

            <p>
                Account validation does not mean that Bixuco guarantees the
                quality, suitability or results of services provided by a
                professional.
            </p>


            <h4>7. Storage and security</h4>

            <p>
                Bixuco seeks to adopt appropriate technical and organizational
                measures to reduce the risks of unauthorized access, loss,
                alteration or misuse of stored information.
            </p>

            <p>
                No internet-connected system can guarantee absolute security.
                Protection measures may be updated as the platform evolves.
            </p>


            <h4>8. Notification controls</h4>

            <p>
                Users may change certain notification preferences through
                the platform settings.
            </p>

            <p>
                Essential communications related to security, authentication
                or account operation may be handled separately.
            </p>


            <h4>9. User rights</h4>

            <p>
                Users may request information about their data, correct
                inaccurate information and, when applicable, request the
                deletion of their account and associated data.
            </p>


            <h4>10. Deletion and retention</h4>

            <p>
                When an account is deleted, associated information may be
                removed or unlinked according to the platform's structure
                and technical requirements, subject to applicable legal
                obligations.
            </p>


            <h4>11. Updates to this Policy</h4>

            <p>
                This Privacy Policy may be updated to reflect changes to
                Bixuco's features and operation.
            </p>

            <p>
                The updated version will remain available within the platform.
            </p>
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

                <button
                    type="button"
                    class="modal-termos__fechar"
                    aria-label="Fechar"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>

            <div
                class="modal-termos__corpo"
                id="${id}-corpo"
            ></div>

        </div>
    `;


    document.body.appendChild(modal);


    function preencherTexto() {

        const idioma =
            idiomaModalAtual() === "en"
                ? "en"
                : "pt";

        document.getElementById(
            `${id}-titulo`
        ).textContent = conteudo[idioma].titulo;

        document.getElementById(
            `${id}-corpo`
        ).innerHTML = conteudo[idioma].corpo;
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


    modal
        .querySelector(".modal-termos__fechar")
        .addEventListener("click", fechar);


    modal.addEventListener("click", (e) => {

        if (e.target === modal) {
            fechar();
        }

    });


    document.addEventListener("keydown", (e) => {

        if (
            e.key === "Escape" &&
            modal.style.display === "flex"
        ) {
            fechar();
        }

    });


    return {
        abrir,
        fechar
    };
}



document.addEventListener(
    "DOMContentLoaded",
    () => {

        const btnTermos =
            document.getElementById(
                "btnAbrirTermos"
            );

        const btnPrivacidade =
            document.getElementById(
                "btnAbrirPrivacidade"
            );


        if (btnTermos) {

            const modalTermos =
                criarModalTermos(
                    "modalTermos",
                    textoTermos
                );

            btnTermos.addEventListener(
                "click",
                modalTermos.abrir
            );
        }


        if (btnPrivacidade) {

            const modalPrivacidade =
                criarModalTermos(
                    "modalPrivacidade",
                    textoPrivacidade
                );

            btnPrivacidade.addEventListener(
                "click",
                modalPrivacidade.abrir
            );
        }

    }
);