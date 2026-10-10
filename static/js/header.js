// ==========================================================
// header.js
// Monta o cabeçalho ÚNICO do app dentro de <header id="topoApp">
// (usado no mobile) e, se existir, também dentro de
// <div id="sidebarUsuario"> na sidebar (usado no desktop).
//
//   Esquerda/foto : leva direto pro perfil com 1 clique
//                   (não abre mais menu nenhum sozinha)
//   Menu da conta : agora só abre no mobile — tradução, alternar
//                   tema e sair (perfil deixou de ser um item à
//                   parte, o bloco de nome/cargo já é o link)
//   Sininho       : abre o painel de notificações de sempre
//
// Como usar na página (antes do JS da própria página):
//
//   <link rel="stylesheet" href="/css/header.css">
//   <header class="topo" id="topoApp"
//           data-perfil="/perfilSemAssinatura"
//           data-notif-pt="Promoções" data-notif-en="Promotions"></header>
//   ...
//   <script src="/js/header.js"></script>
//   <script src="/js/MinhaPagina.js"></script>
//
// Pra também mostrar o bloco reduzido (foto+nome+sino) na sidebar
// no desktop, basta colocar em qualquer lugar dentro da <aside
// class="sidebar">:
//
//   <div class="sidebar-usuario" id="sidebarUsuario"></div>
//
// e marcar `<body class="layout-sidebar-perfil">` na página — essa
// classe é o que faz o CSS esconder a barra "topo" a partir de
// 769px (ver layout.css). Sem essa <div>, a página continua
// exatamente como era (só a .topo, sem nada na sidebar).
//
// Atributos opcionais no <header>:
//   data-perfil       → URL da tela de perfil
//   data-pagina       → "perfil" marca o bloco de conta como página atual
//   data-notif-pt/en  → título do painel de notificações
//
// Os IDs abaixo são os MESMOS que os JS das páginas já usam
// (fotoUsuario, nomeUsuario, tipoConta, btnTraduzir, textoTradutor,
//  btnTemaMobile, btnNotificacoes, quantidadeNotificacoes,
//  painelNotificacoes, listaNotificacoes), então a lógica de
// tradução, tema e notificações de cada página continua funcionando
// sem precisar mudar nada nos outros arquivos .js.
// ==========================================================
(function () {

    const topo = document.getElementById("topoApp");
    if (!topo) return;

    const urlPerfil   = topo.dataset.perfil || "/perfil";
    const paginaAtual = topo.dataset.pagina || "";
    const notifPt     = topo.dataset.notifPt || "Notificações";
    const notifEn     = topo.dataset.notifEn || "Notifications";

    // IDs configuráveis — algumas páginas (as do terapeuta) usam
    // nomes de id diferentes dos padrões (ex.: "nomeTerapeuta" em vez
    // de "nomeUsuario", "badgeNotificacoes" em vez de
    // "quantidadeNotificacoes"), então o próprio JS de cada página
    // continua funcionando sem precisar ser reescrito.
    const idBadge = topo.dataset.badgeId || "quantidadeNotificacoes";
    const idNome  = topo.dataset.nomeId  || "nomeUsuario";

    // Conta cujo tipo é sempre o mesmo (não vem da API) — ex.: as
    // telas do terapeuta, que nunca chamam algo como
    // `tipoConta.textContent = dados.tipoConta`.
    const tipoContaPt = topo.dataset.tipoPt || "";
    const tipoContaEn = topo.dataset.tipoEn || "";

    // Chip do "código do terapeuta" (pra compartilhar com o
    // responsável) dentro do menu da conta:
    //   "padrao" → ids btnCodigoCopiar / codigoTerapeuta
    //   "header" → ids btnCodigoCopiarHeader / codigoTerapeutaHeader / iconeCopiarHeader
    //              (usado só no PerfilTerapeuta, que já tem outro
    //              código igual dentro do corpo da página)
    const codigo = topo.dataset.codigo || "";

    const ehPerfil = paginaAtual === "perfil";
    const ehResponsavelAssinante = urlPerfil === "/perfil";

    // Removido o item separado "Meu perfil": agora é o próprio bloco
    // com foto+nome (menu-perfil__conta, virou um <a>) que leva pro
    // perfil com um clique só — em vez de abrir o menu e ainda ter
    // que clicar em "Meu perfil" depois.
    topo.innerHTML = `
        <div class="topo-perfil">

            <button type="button" class="topo-avatar" id="btnMenuPerfil"
                    aria-haspopup="true" aria-expanded="false" aria-controls="menuPerfil"
                    aria-label="Menu da conta">
                <img id="fotoUsuario" src="/img/perfilPadrao.png" alt="Foto do usuário">
            </button>

            <div class="menu-perfil" id="menuPerfil" role="menu">

                <a class="menu-perfil__conta" id="itemMeuPerfil" role="menuitem" href="${urlPerfil}">
                    <strong id="${idNome}">Carregando...</strong>
                    ${tipoContaPt
                        ? `<span id="tipoConta" data-pt="${tipoContaPt}" data-en="${tipoContaEn || tipoContaPt}">${tipoContaPt}</span>`
                        : `<span id="tipoConta">...</span>`}
                </a>
                ${codigo ? `
                <button type="button" class="menu-perfil__codigo" id="${codigo === "header" ? "btnCodigoCopiarHeader" : "btnCodigoCopiar"}" title="Copiar código para compartilhar">
                    <span><span data-pt="Código" data-en="Code">Código</span>: <strong id="${codigo === "header" ? "codigoTerapeutaHeader" : "codigoTerapeuta"}">...</strong></span>
                    <i class="fa-regular fa-copy" ${codigo === "header" ? 'id="iconeCopiarHeader"' : ""}></i>
                </button>` : ""}

                <a class="menu-perfil__item menu-perfil__item--so-mobile" role="menuitem" id="itemMeuPerfilMobile" href="${urlPerfil}">
                    <i class="fa-regular fa-user"></i>
                    <span data-pt="Meu perfil" data-en="My profile">Meu perfil</span>
                </a>

                <button type="button" class="menu-perfil__item" role="menuitem" id="btnTraduzir">
                    <i class="fa-solid fa-language"></i>
                    <span id="textoTradutor">Traduzir para o inglês</span>
                </button>

                <button type="button" class="menu-perfil__item menu-perfil__item--so-mobile"
                        role="menuitem" id="btnTemaMobile">
                    <i class="fa-regular fa-sun"></i>
                    <span data-pt="Alternar tema" data-en="Switch theme">Alternar tema</span>
                </button>

                <div class="menu-perfil__divisor"></div>

                <a class="menu-perfil__item menu-perfil__item--sair menu-perfil__item--so-mobile"
                   role="menuitem" href="/logout">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    <span data-pt="Sair" data-en="Log out">Sair</span>
                </a>

            </div>
        </div>

        <div class="topo-acoes">
            ${ehResponsavelAssinante ? `
            <div class="assistente-atalho-wrapper">
                <button type="button" class="assistente-atalho" id="btnAssistenteTopo"
                        aria-label="Abrir Assistente Bixuco" aria-expanded="false">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                </button>
                <span class="assistente-atalho__dica" data-pt="Tem dúvidas?" data-en="Questions?">Tem dúvidas?</span>
            </div>` : ""}

            <div class="notificacoes-wrapper">
                <button class="notificacoes" type="button" id="btnNotificacoes" aria-label="Notificações">
                    <i class="fa-regular fa-bell"></i>
                    <span id="${idBadge}" class="badge"${idBadge === "badgeNotificacoes" ? ' style="display:none"' : ""}>0</span>
                </button>

                <div class="painel-notificacoes" id="painelNotificacoes">
                    <div class="painel-header" data-pt="${notifPt}" data-en="${notifEn}">${notifPt}</div>
                    <div id="listaNotificacoes">
                        <div class="painel-vazio" data-pt="Carregando..." data-en="Loading...">Carregando...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Bolinha vermelha do sininho: só aparece quando há notificação.
    // Some quando o contador é 0 ou vazio (vale pra todas as telas,
    // porque as páginas só mudam o texto do badge).
    const badgeTopo = document.getElementById(idBadge);
    function atualizarBadgeTopo() {
        const qtd = parseInt(badgeTopo.textContent, 10);
        badgeTopo.classList.toggle("escondido", !(qtd > 0));
    }
    atualizarBadgeTopo();
    new MutationObserver(atualizarBadgeTopo).observe(badgeTopo, { childList: true, characterData: true, subtree: true });

    // Já está na tela de perfil: o bloco só fecha o menu, sem recarregar.
    if (ehPerfil) {
        document.getElementById("itemMeuPerfil").addEventListener("click", (e) => e.preventDefault());
        document.getElementById("itemMeuPerfilMobile").addEventListener("click", (e) => e.preventDefault());
    }

    // ==========================================================
    // BLOCO DO USUÁRIO NA SIDEBAR (só desktop)
    //
    // Em páginas com <div id="sidebarUsuario"> dentro da <aside
    // class="sidebar">, montamos ali uma versão reduzida — que
    // substitui visualmente a barra "topo" no desktop (o CSS
    // esconde a .topo a partir de 769px nas páginas marcadas com a
    // classe "layout-sidebar-perfil" no <body>). No mobile a barra
    // "topo" de sempre continua 100% igual, sem nenhuma mudança.
    //
    //   Foto            → link direto pro perfil (1 clique só)
    //   Nome/cargo      → abre um modal com código do terapeuta
    //                     (se a página tiver), Traduzir, Alternar
    //                     tema e Sair — os mesmos itens que hoje
    //                     ficam soltos no corpo da sidebar (por
    //                     isso eles somem de lá no desktop, ver
    //                     layout.css)
    //   Sino            → mesmo painel de notificações de sempre,
    //                     só que abrindo nesse mesmo cantinho
    //
    // Nenhum dos botões daqui duplica lógica: cada um só repassa o
    // clique (.click()) pro elemento original escondido dentro da
    // .topo, que continua sendo quem de fato busca dados/traduz/
    // troca tema/sai — e o texto/foto/contador são só espelhados
    // (MutationObserver) pros elementos novos daqui.
    // ==========================================================
    const sidebarUsuario = document.getElementById("sidebarUsuario");

    if (sidebarUsuario) {
        sidebarUsuario.innerHTML = `
            <a class="sidebar-usuario__foto" id="fotoLinkSidebar" href="${urlPerfil}" aria-label="Meu perfil">
                <img id="fotoUsuarioSidebar" src="/img/perfilPadrao.png" alt="">
            </a>

            <button type="button" class="sidebar-usuario__texto" id="btnMenuPerfilSidebar"
                    aria-haspopup="true" aria-expanded="false" aria-controls="menuPerfilSidebar">
                <strong id="nomeUsuarioSidebar">Carregando...</strong>
                <small id="tipoContaSidebar"></small>
            </button>

            <button type="button" class="notificacoes" id="btnNotificacoesSidebar" aria-label="Notificações">
                <i class="fa-regular fa-bell"></i>
                <span id="quantidadeNotificacoesSidebar" class="badge" style="display:none">0</span>
            </button>

            <div class="menu-perfil menu-perfil--sidebar" id="menuPerfilSidebar" role="menu">
                ${codigo ? `
                <button type="button" class="menu-perfil__codigo" id="btnCodigoCopiarSidebar" title="Copiar código para compartilhar">
                    <span><span data-pt="Código" data-en="Code">Código</span>: <strong id="codigoTerapeutaSidebar">...</strong></span>
                    <i class="fa-regular fa-copy"></i>
                </button>` : ""}

                <button type="button" class="menu-perfil__item" role="menuitem" id="btnTraduzirSidebar">
                    <i class="fa-solid fa-language"></i>
                    <span id="textoTradutorSidebar">Traduzir para o inglês</span>
                </button>

                <button type="button" class="menu-perfil__item" role="menuitem" id="btnTemaSidebar">
                    <i class="fa-regular fa-moon"></i>
                    <span data-pt="Alternar tema" data-en="Switch theme">Alternar tema</span>
                </button>

                <div class="menu-perfil__divisor"></div>

                <a class="menu-perfil__item menu-perfil__item--sair" role="menuitem" href="/logout">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    <span data-pt="Sair" data-en="Log out">Sair</span>
                </a>
            </div>
        `;

        // ---------- espelhar foto / nome / cargo / contador ----------

        function espelhar(origem, destino, tipo) {
            if (!origem || !destino) return;

            function copiar() {
                if (tipo === "texto") destino.textContent = origem.textContent;
                else if (tipo === "src") destino.src = origem.src;
                else if (tipo === "classe") destino.className = origem.className;
            }

            copiar();

            const config = tipo === "texto"
                ? { childList: true, characterData: true, subtree: true }
                : { attributes: true, attributeFilter: [tipo === "src" ? "src" : "class"] };

            new MutationObserver(copiar).observe(origem, config);
        }

        espelhar(document.getElementById("fotoUsuario"), document.getElementById("fotoUsuarioSidebar"), "src");
        espelhar(document.getElementById(idNome), document.getElementById("nomeUsuarioSidebar"), "texto");
        espelhar(document.getElementById("tipoConta"), document.getElementById("tipoContaSidebar"), "texto");
        espelhar(document.getElementById("textoTradutor"), document.getElementById("textoTradutorSidebar"), "texto");

        const iconeTemaOrigem = document.getElementById("btnTemaMobile")?.querySelector("i");
        const iconeTemaDestino = document.getElementById("btnTemaSidebar")?.querySelector("i");
        espelhar(iconeTemaOrigem, iconeTemaDestino, "classe");

        if (codigo) {
            const idCodigoOrigem = codigo === "header" ? "codigoTerapeutaHeader" : "codigoTerapeuta";
            espelhar(document.getElementById(idCodigoOrigem), document.getElementById("codigoTerapeutaSidebar"), "texto");
        }

        const badgeOrigem  = document.getElementById(idBadge);
        const badgeDestino = document.getElementById("quantidadeNotificacoesSidebar");
        if (badgeOrigem && badgeDestino) {
            function copiarBadge() {
                badgeDestino.textContent = badgeOrigem.textContent;
                const qtd = parseInt(badgeOrigem.textContent, 10);
                badgeDestino.style.display = (badgeOrigem.style.display === "none" || !(qtd > 0)) ? "none" : "flex";
            }
            copiarBadge();
            new MutationObserver(copiarBadge).observe(badgeOrigem, {
                childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["style"],
            });
        }

        // ---------- repassar cliques pros elementos originais ----------

        function repassar(idNovo, idOriginal) {
            const el = document.getElementById(idNovo);
            if (el) el.addEventListener("click", (e) => {
                e.stopPropagation();
                document.getElementById(idOriginal).click();
            });
        }

        repassar("btnNotificacoesSidebar", "btnNotificacoes");
        repassar("btnTraduzirSidebar", "btnTraduzir");
        repassar("btnTemaSidebar", "btnTemaMobile");
        if (codigo) {
            repassar("btnCodigoCopiarSidebar", codigo === "header" ? "btnCodigoCopiarHeader" : "btnCodigoCopiar");
        }

        // ---------- abrir/fechar o modal deste cantinho ----------

        const btnMenuSidebar = document.getElementById("btnMenuPerfilSidebar");
        const menuSidebar    = document.getElementById("menuPerfilSidebar");

        function abrirMenuSidebar() {
            document.getElementById("painelNotificacoes")?.classList.remove("aberto");

            // A sidebar tem scroll (overflow-y: auto), então um modal
            // "absolute" ficava cortado por ela. Agora ele é "fixed" e a
            // posição é calculada na hora de abrir, com base na tela.
            const rect = sidebarUsuario.getBoundingClientRect();
            menuSidebar.style.left = `${rect.left}px`;
            menuSidebar.style.bottom = `${window.innerHeight - rect.top + 10}px`;

            menuSidebar.classList.add("aberto");
            btnMenuSidebar.setAttribute("aria-expanded", "true");
        }

        function fecharMenuSidebar() {
            menuSidebar.classList.remove("aberto");
            btnMenuSidebar.setAttribute("aria-expanded", "false");
        }

        btnMenuSidebar.addEventListener("click", (e) => {
            e.stopPropagation();
            menuSidebar.classList.contains("aberto") ? fecharMenuSidebar() : abrirMenuSidebar();
        });

        document.addEventListener("click", (e) => {
            if (!menuSidebar.classList.contains("aberto")) return;
            if (menuSidebar.contains(e.target) || btnMenuSidebar.contains(e.target)) return;
            fecharMenuSidebar();
        }, true);

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && menuSidebar.classList.contains("aberto")) {
                fecharMenuSidebar();
                btnMenuSidebar.focus();
            }
        });

        // O sininho da sidebar fecha esse modal ao abrir, e vice-versa
        // (o clique real de abrir o painel é repassado pro original
        // acima; aqui só garante que os dois não ficam abertos juntos).
        document.getElementById("btnNotificacoesSidebar").addEventListener("click", () => {
            fecharMenuSidebar();

            // Mesmo problema do menu do nome: a sidebar tem scroll,
            // então o painel "absolute" ficava cortado. Agora ele é
            // "fixed" e a posição é calculada com base na tela.
            const painel = document.getElementById("painelNotificacoes");
            if (painel) {
                const rect = sidebarUsuario.getBoundingClientRect();
                painel.style.left = `${rect.left}px`;
                painel.style.bottom = `${window.innerHeight - rect.top + 10}px`;
            }
        });

        // O painel de notificações é UM SÓ elemento (#painelNotificacoes),
        // reaproveitado nos dois lugares — mas como ele é filho da .topo
        // (que some no desktop) ou do cantinho da sidebar (que some no
        // mobile), ele precisa fisicamente "morar" no lugar certo pra
        // não ficar escondido atrás de um pai com display:none.
        const wrapperNotifTopo = document.querySelector(".notificacoes-wrapper");
        const painelNotif = document.getElementById("painelNotificacoes");

        function posicionarPainelNotificacoes() {
            if (!painelNotif) return;
            const alvo = window.matchMedia("(min-width: 769px)").matches ? sidebarUsuario : wrapperNotifTopo;
            if (alvo && painelNotif.parentElement !== alvo) alvo.appendChild(painelNotif);
        }

        posicionarPainelNotificacoes();

        let timerResize;
        window.addEventListener("resize", () => {
            clearTimeout(timerResize);
            timerResize = setTimeout(posicionarPainelNotificacoes, 150);
        });
    }

    // ==========================================================
    // ASSISTENTE BIXUCO — JANELA CENTRAL
    // ==========================================================
    if (ehResponsavelAssinante) {
        // Na Home, o acesso fica ao lado do mascote, sem ocupar a sidebar.
        // Nas demais páginas, um atalho discreto preserva acesso no desktop.
        // No celular o ícone do cabeçalho continua disponível.
        const saudacaoHome = document.querySelector(".saudacao");
        const mascoteHome = saudacaoHome?.querySelector(":scope > img");
        if (saudacaoHome && mascoteHome) {
            const botaoHome = document.createElement("button");
            botaoHome.type = "button";
            botaoHome.id = "btnAssistenteHome";
            botaoHome.className = "assistente-acesso-home";
            botaoHome.setAttribute("aria-haspopup", "dialog");
            botaoHome.setAttribute("aria-controls", "painelAssistenteBixuco");
            botaoHome.setAttribute("aria-expanded", "false");
            botaoHome.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span data-pt="Conversar com Bixuco" data-en="Chat with Bixuco">Conversar com Bixuco</span>`;
            saudacaoHome.insertBefore(botaoHome, mascoteHome);
        } else {
            const botaoOutras = document.createElement("button");
            botaoOutras.type = "button";
            botaoOutras.id = "btnAssistenteOutras";
            botaoOutras.className = "assistente-acesso-outras";
            botaoOutras.setAttribute("aria-haspopup", "dialog");
            botaoOutras.setAttribute("aria-controls", "painelAssistenteBixuco");
            botaoOutras.setAttribute("aria-expanded", "false");
            botaoOutras.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span data-pt="Conversar com Bixuco" data-en="Chat with Bixuco">Conversar com Bixuco</span>`;
            document.body.appendChild(botaoOutras);
        }

        const fundo = document.createElement("div");
        fundo.id = "fundoAssistenteBixuco";
        fundo.className = "assistente-sobreposicao";
        fundo.hidden = true;
        document.body.appendChild(fundo);

        const painel = document.createElement("section");
        painel.id = "painelAssistenteBixuco";
        painel.className = "assistente-painel-flutuante";
        painel.setAttribute("aria-hidden", "true");
        painel.setAttribute("role", "dialog");
        painel.setAttribute("aria-modal", "true");
        painel.setAttribute("aria-labelledby", "tituloAssistenteBixuco");
        painel.setAttribute("tabindex", "-1");
        painel.innerHTML = `
            <div class="assistente-painel__cabecalho">
                <div class="assistente-painel__marca">
                    <span class="assistente-painel__icone"><img src="/img/Bixuco_home.png" alt=""></span>
                    <div>
                        <strong id="tituloAssistenteBixuco" data-pt="Assistente Bixuco" data-en="Bixuco Assistant">Assistente Bixuco</strong>
                        <small><span class="assistente-painel__status" aria-hidden="true"></span>
                            <span id="statusAssistenteBixuco" data-pt="Seu apoio no dia a dia" data-en="Here to help every day">Seu apoio no dia a dia</span>
                        </small>
                    </div>
                </div>
                <div class="assistente-painel__acoes">
                    <button type="button" id="btnNovaConversaBixuco" title="Nova conversa" aria-label="Nova conversa">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button type="button" id="btnFecharAssistenteBixuco" title="Fechar" aria-label="Fechar">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
            <div class="assistente-painel__sugestoes" id="sugestoesAssistenteBixuco" aria-label="Perguntas sugeridas">
                <button type="button" data-pergunta-pt="Quais são as minhas dicas personalizadas desta semana?" data-pergunta-en="What are my personalized tips for this week?">
                    <i class="fa-regular fa-lightbulb"></i><span data-pt="Minhas dicas" data-en="My tips">Minhas dicas</span>
                </button>
                <button type="button" data-pergunta-pt="O que o Bixuco registrou hoje?" data-pergunta-en="What did Bixuco record today?">
                    <i class="fa-regular fa-calendar"></i><span data-pt="Registros de hoje" data-en="Today's records">Registros de hoje</span>
                </button>
                <button type="button" data-pergunta-pt="Meu Bixuco está com comunicação recente?" data-pergunta-en="Has my Bixuco communicated recently?">
                    <i class="fa-solid fa-wifi"></i><span data-pt="Conexão" data-en="Connection">Conexão</span>
                </button>
            </div>
            <div class="assistente-painel__mensagens" id="mensagensAssistenteBixuco" aria-live="polite" aria-relevant="additions text"></div>
            <div class="assistente-painel__rodape">
                <form class="assistente-painel__form" id="formAssistenteBixuco">
                    <textarea id="inputAssistenteBixuco" rows="1" maxlength="1000"
                              placeholder="Escreva sua mensagem..." aria-label="Mensagem para o Assistente Bixuco"></textarea>
                    <button type="submit" id="btnEnviarAssistenteBixuco" aria-label="Enviar mensagem">
                        <i class="fa-solid fa-arrow-up"></i>
                    </button>
                </form>
                <p class="assistente-painel__aviso" data-pt="O Bixuco não realiza diagnósticos nem substitui um profissional." data-en="Bixuco does not diagnose or replace a professional.">O Bixuco não realiza diagnósticos nem substitui um profissional.</p>
            </div>
        `;
        document.body.appendChild(painel);

        const mensagensEl = painel.querySelector("#mensagensAssistenteBixuco");
        const form = painel.querySelector("#formAssistenteBixuco");
        const input = painel.querySelector("#inputAssistenteBixuco");
        const btnEnviar = painel.querySelector("#btnEnviarAssistenteBixuco");
        const btnFechar = painel.querySelector("#btnFecharAssistenteBixuco");
        const btnNova = painel.querySelector("#btnNovaConversaBixuco");
        const sugestoesEl = painel.querySelector("#sugestoesAssistenteBixuco");
        const botoesSugestao = [...sugestoesEl.querySelectorAll("button")];
        const botoesAbrir = [
            document.getElementById("btnAssistenteTopo"),
            document.getElementById("btnAssistenteHome"),
            document.getElementById("btnAssistenteOutras")
        ].filter(Boolean);
        let historicoCarregado = false;
        let enviando = false;
        let carregandoHistorico = null;
        let ultimoBotaoAbrir = null;
        let ultimoAvisoLimpeza = null;

        const idiomaAssistente = () => localStorage.getItem("idioma") === "en" ? "en" : "pt";
        const tAssistente = (pt, en) => idiomaAssistente() === "en" ? en : pt;

        function atualizarIdiomaAssistente() {
            input.placeholder = tAssistente("Escreva sua mensagem...", "Type your message...");
            input.setAttribute("aria-label", tAssistente("Mensagem para o Assistente Bixuco", "Message to the Bixuco Assistant"));
            btnNova.title = tAssistente("Nova conversa", "New conversation");
            btnFechar.title = tAssistente("Fechar", "Close");
            btnNova.setAttribute("aria-label", btnNova.title);
            btnFechar.setAttribute("aria-label", btnFechar.title);
            btnEnviar.setAttribute("aria-label", tAssistente("Enviar mensagem", "Send message"));
            painel.setAttribute("aria-label", tAssistente("Conversa com o Assistente Bixuco", "Chat with Bixuco Assistant"));
            sugestoesEl.setAttribute("aria-label", tAssistente("Perguntas sugeridas", "Suggested questions"));
            botoesAbrir.forEach(btn => {
                btn.setAttribute("aria-label", tAssistente("Conversar com Assistente Bixuco", "Chat with Bixuco Assistant"));
                btn.title = tAssistente("Conversar com Bixuco", "Chat with Bixuco");
                btn.querySelectorAll("[data-pt][data-en]").forEach(elemento => {
                    elemento.textContent = tAssistente(elemento.dataset.pt, elemento.dataset.en);
                });
            });
            painel.querySelectorAll("[data-pt][data-en]").forEach(elemento => {
                elemento.textContent = tAssistente(elemento.dataset.pt, elemento.dataset.en);
            });
        }
        atualizarIdiomaAssistente();

        const btnTradutorAssistente = document.getElementById("btnTraduzir");
        if (btnTradutorAssistente) {
            btnTradutorAssistente.addEventListener("click", () => {
                setTimeout(atualizarIdiomaAssistente, 0);
            });
        }

        function rolarFimAssistente() {
            mensagensEl.scrollTop = mensagensEl.scrollHeight;
        }

        function adicionarBolhaAssistente(role, content, status = "ok") {
            const linha = document.createElement("div");
            linha.className = `assistente-painel__linha ${role === "user" ? "usuario" : "bixuco"}${status === "erro" ? " erro" : ""}`;
            const bolha = document.createElement("div");
            bolha.className = "assistente-painel__bolha";
            bolha.textContent = String(content || "");
            linha.appendChild(bolha);
            mensagensEl.appendChild(linha);
            rolarFimAssistente();
            return linha;
        }

        function mostrarBoasVindasAssistente() {
            sugestoesEl.hidden = false;
            adicionarBolhaAssistente(
                "assistant",
                tAssistente(
                    "Olá! 💚 Sou o Assistente Bixuco. Posso ajudar com os registros, as dicas personalizadas e suas dúvidas sobre o Bixuco. Como posso ajudar hoje?",
                    "Hello! 💚 I'm the Bixuco Assistant. I can help with records, personalized tips, and questions about Bixuco. How can I help today?"
                )
            );
        }

        // Distingue HTTP, sessão expirada, servidor fora do ar e JSON inválido.
        // Evita mostrar a mesma mensagem genérica para causas diferentes.
        async function lerRespostaAssistente(resposta) {
            const tipo = resposta.headers?.get?.("content-type") || "";
            const pareceJson = tipo.includes("json") || !tipo;
            if (!pareceJson) {
                throw new Error(tAssistente(
                    `O servidor retornou uma página em vez de dados do chat (HTTP ${resposta.status}). Verifique o servidor ou a sessão.`,
                    `The server returned a page instead of chat data (HTTP ${resposta.status}). Check the server or your session.`
                ));
            }
            let dados;
            try { dados = await resposta.json(); }
            catch (_) {
                throw new Error(tAssistente(
                    `O servidor retornou uma resposta inválida (HTTP ${resposta.status}).`,
                    `The server returned an invalid response (HTTP ${resposta.status}).`
                ));
            }
            if (!resposta.ok) {
                const padrao = resposta.status === 401
                    ? tAssistente("Sua sessão expirou. Entre na conta novamente.", "Your session expired. Please sign in again.")
                    : resposta.status === 403
                        ? tAssistente("Seu acesso ao assistente não está autorizado.", "You don't have access to this assistant.")
                        : resposta.status === 429
                            ? tAssistente("O assistente atingiu o limite de requisições. Aguarde e tente novamente.", "The assistant reached a rate limit. Please wait and retry.")
                            : tAssistente("O servidor não conseguiu concluir a operação.", "The server couldn't complete the request.");
                const erro = new Error(`${dados?.erro || padrao} (HTTP ${resposta.status})`);
                erro.status = resposta.status;
                erro.mensagemSalva = Boolean(dados?.mensagemSalva);
                throw erro;
            }
            return dados || {};
        }

        function mensagemFalhaConexaoAssistente(erro) {
            if (erro?.message && !(erro instanceof TypeError)) return erro.message;
            return tAssistente(
                "Não consegui conectar ao servidor. Verifique sua conexão e se o Bixuco está no ar. Sua mensagem pode ter sido salva; reabra o chat antes de reenviar.",
                "I couldn't reach the server. Check your connection and the Bixuco service. Your message may have been saved; reopen the chat before resending."
            );
        }

        async function carregarHistoricoFlutuante(forcar = false) {
            if (historicoCarregado && !forcar) return;
            if (carregandoHistorico) return carregandoHistorico;

            carregandoHistorico = (async () => {
                mensagensEl.innerHTML = `<div class="assistente-painel__carregando">${tAssistente("Carregando conversa...", "Loading conversation...")}</div>`;
                btnEnviar.disabled = true;
                botoesSugestao.forEach(btn => btn.disabled = true);
                try {
                    const resposta = await fetch("/api/assistente/historico");
                    if (resposta.status === 401) {
                        window.location.href = "/logar";
                        return;
                    }
                    const dados = await lerRespostaAssistente(resposta);
                    mensagensEl.innerHTML = "";
                    const mensagens = Array.isArray(dados.mensagens) ? dados.mensagens : [];
                    sugestoesEl.hidden = mensagens.length > 0;
                    if (!mensagens.length) mostrarBoasVindasAssistente();
                    else mensagens.forEach(item => adicionarBolhaAssistente(item.role, item.content, item.status));
                    historicoCarregado = true;
                } catch (erro) {
                    console.warn("Falha ao carregar o histórico do assistente:", erro);
                    mensagensEl.innerHTML = "";
                    sugestoesEl.hidden = false;
                    adicionarBolhaAssistente("assistant", mensagemFalhaConexaoAssistente(erro), "erro");
                } finally {
                    btnEnviar.disabled = enviando;
                    botoesSugestao.forEach(btn => btn.disabled = enviando);
                }
            })();
            try { await carregandoHistorico; }
            finally { carregandoHistorico = null; }
        }

        function abrirAssistente() {
            if (painel.classList.contains("aberto")) return;
            // Abriu por URL? Ainda assim devolvemos foco a um atalho visível ao fechar.
            if (!ultimoBotaoAbrir) {
                ultimoBotaoAbrir = botoesAbrir.find(btn => btn.getClientRects().length) || null;
            }
            fundo.hidden = false;
            painel.classList.add("aberto");
            painel.setAttribute("aria-hidden", "false");
            document.body.classList.add("assistente-modal-aberto");
            botoesAbrir.forEach(btn => btn.setAttribute("aria-expanded", "true"));
            carregarHistoricoFlutuante();
            setTimeout(() => {
                if (painel.classList.contains("aberto")) {
                    input.focus();
                    rolarFimAssistente();
                }
            }, 80);
        }

        function fecharAssistente() {
            if (!painel.classList.contains("aberto")) return;
            fundo.hidden = true;
            painel.classList.remove("aberto");
            painel.setAttribute("aria-hidden", "true");
            document.body.classList.remove("assistente-modal-aberto");
            botoesAbrir.forEach(btn => btn.setAttribute("aria-expanded", "false"));
            const destino = ultimoBotaoAbrir?.getClientRects().length
                ? ultimoBotaoAbrir
                : botoesAbrir.find(btn => btn.getClientRects().length);
            destino?.focus();
        }

        botoesAbrir.forEach(btn => btn.addEventListener("click", (e) => {
            ultimoBotaoAbrir = btn;
            e.stopPropagation();
            painel.classList.contains("aberto") ? fecharAssistente() : abrirAssistente();
        }));
        btnFechar.addEventListener("click", fecharAssistente);
        fundo.addEventListener("click", fecharAssistente);

        btnNova.addEventListener("click", async () => {
            if (enviando || carregandoHistorico) return;
            if (!confirm(tAssistente("Começar uma nova conversa? O histórico do chat será limpo, mas seus relatórios e dados do Bixuco não serão apagados.", "Start a new conversation? Chat history will be cleared, but your reports and Bixuco data will not be deleted."))) return;
            try {
                const resposta = await fetch("/api/assistente/historico", { method: "DELETE" });
                await lerRespostaAssistente(resposta);
                mensagensEl.innerHTML = "";
                ultimoAvisoLimpeza = null;
                historicoCarregado = true;
                mostrarBoasVindasAssistente();
            } catch (erro) {
                console.warn("Falha ao iniciar nova conversa:", erro);
                // Evita empilhar a mesma falha se a pessoa clicar várias vezes.
                ultimoAvisoLimpeza?.remove();
                ultimoAvisoLimpeza = adicionarBolhaAssistente("assistant", mensagemFalhaConexaoAssistente(erro), "erro");
            }
        });

        async function enviarMensagemAssistente() {
            const mensagem = input.value.trim();
            if (!mensagem || enviando) return;

            if (carregandoHistorico) await carregandoHistorico;
            if (enviando) return;
            enviando = true;
            sugestoesEl.hidden = true;
            botoesSugestao.forEach(btn => btn.disabled = true);
            btnNova.disabled = true;
            input.value = "";
            input.style.height = "auto";
            btnEnviar.disabled = true;
            adicionarBolhaAssistente("user", mensagem);

            const pensando = document.createElement("div");
            pensando.className = "assistente-painel__linha bixuco pensando";
            pensando.innerHTML = `<div class="assistente-painel__bolha"><span></span><span></span><span></span></div>`;
            mensagensEl.appendChild(pensando);
            rolarFimAssistente();

            try {
                const resposta = await fetch("/api/assistente", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mensagem, idioma: idiomaAssistente() })
                });
                const dados = await lerRespostaAssistente(resposta);
                pensando.remove();
                adicionarBolhaAssistente("assistant", dados.mensagem || tAssistente("O servidor não enviou uma resposta.", "The server didn't send an answer."));
                // O servidor sempre é a fonte de verdade do histórico.
                historicoCarregado = true;
            } catch (erro) {
                pensando.remove();
                console.warn("Falha ao enviar mensagem do assistente:", erro);
                adicionarBolhaAssistente("assistant", mensagemFalhaConexaoAssistente(erro), "erro");
                // Em caso de falha, reconsultar o histórico ao reabrir.
                // A pergunta pode ter sido salva mesmo quando a rede falhou.
                historicoCarregado = false;
            } finally {
                enviando = false;
                btnEnviar.disabled = false;
                btnNova.disabled = false;
                botoesSugestao.forEach(btn => btn.disabled = false);
                if (painel.classList.contains("aberto")) input.focus();
            }
        }

        botoesSugestao.forEach(btn => btn.addEventListener("click", () => {
            if (enviando || carregandoHistorico) return;
            input.value = idiomaAssistente() === "en" ? btn.dataset.perguntaEn : btn.dataset.perguntaPt;
            enviarMensagemAssistente();
        }));

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            enviarMensagemAssistente();
        });
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviarMensagemAssistente();
            }
        });
        input.addEventListener("input", () => {
            input.style.height = "auto";
            input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
        });
        document.addEventListener("keydown", (e) => {
            if (!painel.classList.contains("aberto")) return;
            if (e.key === "Escape") {
                e.preventDefault();
                fecharAssistente();
                return;
            }
            // O foco permanece dentro do modal enquanto ele estiver aberto.
            if (e.key !== "Tab") return;
            const focaveis = [...painel.querySelectorAll("button:not(:disabled), textarea:not(:disabled)")]
                .filter(el => el.getClientRects().length > 0);
            if (!focaveis.length) {
                e.preventDefault();
                painel.focus();
                return;
            }
            const primeiro = focaveis[0];
            const ultimo = focaveis[focaveis.length - 1];
            if (!painel.contains(document.activeElement)) {
                e.preventDefault();
                primeiro.focus();
            } else if (e.shiftKey && document.activeElement === primeiro) {
                e.preventDefault();
                ultimo.focus();
            } else if (!e.shiftKey && document.activeElement === ultimo) {
                e.preventDefault();
                primeiro.focus();
            }
        });

        if (new URLSearchParams(window.location.search).get("abrirAssistente") === "1") {
            abrirAssistente();
            const url = new URL(window.location.href);
            url.searchParams.delete("abrirAssistente");
            window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        }
    }

    // ==========================
    // ABRIR / FECHAR O MENU
    // ==========================

    const btnMenu = document.getElementById("btnMenuPerfil");
    const menu    = document.getElementById("menuPerfil");

    function abrirMenu() {
        // não deixa o painel de notificações aberto ao mesmo tempo
        const painel = document.getElementById("painelNotificacoes");
        if (painel) painel.classList.remove("aberto");

        menu.classList.add("aberto");
        btnMenu.setAttribute("aria-expanded", "true");
    }

    function fecharMenu() {
        menu.classList.remove("aberto");
        btnMenu.setAttribute("aria-expanded", "false");
    }

    btnMenu.addEventListener("click", () => {
        menu.classList.contains("aberto") ? fecharMenu() : abrirMenu();
    });

    // Escolheu um item → fecha o menu (o clique do item continua
    // funcionando normalmente, porque este listener está no pai)
    menu.addEventListener("click", (e) => {
        if (e.target.closest(".menu-perfil__item")) fecharMenu();
    });

    // Clique fora fecha. Fase de captura, porque o sininho usa
    // stopPropagation() e o clique nele nunca chegaria no document.
    document.addEventListener("click", (e) => {
        if (!menu.classList.contains("aberto")) return;
        if (menu.contains(e.target) || btnMenu.contains(e.target)) return;
        fecharMenu();
    }, true);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menu.classList.contains("aberto")) {
            fecharMenu();
            btnMenu.focus();
        }
    });

})();
