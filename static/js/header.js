// ==========================================================
// header.js
// Monta o cabeçalho ÚNICO do app dentro de <header id="topoApp">
// (usado no mobile). No desktop, nas páginas com
// <body class="layout-sidebar-perfil">, a barra some e o sino de
// notificações vai pro lado do logo da sidebar, com o botão
// "Traduzir" acima do seletor de tema.
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
// Pra levar o sino e o "Traduzir" pra sidebar no desktop, basta
// marcar `<body class="layout-sidebar-perfil">` na página (a sidebar
// precisa ter <div class="logo"> e, opcionalmente, <div class="tema">).
// Essa classe também faz o CSS esconder a barra "topo" a partir de
// 769px (ver layout.css). Sem ela, a página continua exatamente como
// era (só a .topo).
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
    // SINO + TRADUZIR NA SIDEBAR (só desktop)
    //
    // Nas páginas marcadas com <body class="layout-sidebar-perfil">
    // a barra "topo" some no desktop (ver layout.css) e o que ela
    // tinha vai pra sidebar:
    //
    //   Sino     → ao lado do logo do Bixuco. O painel de
    //              notificações abre à direita da sidebar.
    //   Traduzir → botão logo acima do seletor Claro/Escuro.
    //
    // Nenhum dos dois duplica lógica: cada um só repassa o clique
    // (.click()) pro elemento original escondido dentro da .topo, que
    // continua sendo quem de fato busca notificações e traduz — e o
    // contador/texto são só espelhados (MutationObserver).
    // No mobile a barra "topo" de sempre continua igual.
    // ==========================================================
    const logoSidebar = document.body.classList.contains("layout-sidebar-perfil")
        ? document.querySelector(".sidebar .logo")
        : null;

    if (logoSidebar) {
        // ---------- sino ao lado do logo ----------
        logoSidebar.classList.add("logo--com-sino");
        logoSidebar.insertAdjacentHTML("beforeend", `
            <div class="logo-sino" id="sinoSidebar">
                <button type="button" class="notificacoes" id="btnNotificacoesSidebar" aria-label="Notificações">
                    <i class="fa-regular fa-bell"></i>
                    <span id="quantidadeNotificacoesSidebar" class="badge" style="display:none">0</span>
                </button>
            </div>
        `);
        const sinoSidebar = document.getElementById("sinoSidebar");

        // ---------- botão "Traduzir" logo acima do seletor Claro/Escuro ----------
        const temaSidebar = document.querySelector(".sidebar > .tema");
        if (temaSidebar) {
            temaSidebar.insertAdjacentHTML("beforebegin", `
                <button type="button" class="sidebar-traduzir" id="btnTraduzirSidebar">
                    <i class="fa-solid fa-language"></i>
                    <span id="textoTradutorSidebar">Traduzir para o inglês</span>
                </button>
            `);
        }

        // ---------- espelhar texto / contador ----------

        function espelhar(origem, destino) {
            if (!origem || !destino) return;
            const copiar = () => { destino.textContent = origem.textContent; };
            copiar();
            new MutationObserver(copiar).observe(origem, { childList: true, characterData: true, subtree: true });
        }

        espelhar(document.getElementById("textoTradutor"), document.getElementById("textoTradutorSidebar"));

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

        // ---------- posição do painel de notificações ----------
        // A sidebar tem scroll (overflow-y: auto), então um painel
        // "absolute" ficaria cortado por ela. Ele vira "fixed" e é
        // posicionado aqui: logo à direita da sidebar, na altura do sino.
        function posicionarPainelAoLado() {
            const painel = document.getElementById("painelNotificacoes");
            const sidebar = document.querySelector(".sidebar");
            const btn = document.getElementById("btnNotificacoesSidebar");
            if (!painel || !sidebar || !btn) return;
            const rBtn = btn.getBoundingClientRect();
            const rSide = sidebar.getBoundingClientRect();
            painel.style.left = `${rSide.right + 8}px`;
            painel.style.top = `${rBtn.top}px`;
        }

        document.getElementById("btnNotificacoesSidebar").addEventListener("click", posicionarPainelAoLado);

        // O painel de notificações é UM SÓ elemento (#painelNotificacoes),
        // reaproveitado nos dois lugares — mas como ele é filho da .topo
        // (que some no desktop) ou do sino da sidebar (que some no
        // mobile), ele precisa fisicamente "morar" no lugar certo pra
        // não ficar escondido atrás de um pai com display:none.
        const wrapperNotifTopo = document.querySelector(".notificacoes-wrapper");
        const painelNotif = document.getElementById("painelNotificacoes");

        function posicionarPainelNotificacoes() {
            if (!painelNotif) return;
            const alvo = window.matchMedia("(min-width: 769px)").matches ? sinoSidebar : wrapperNotifTopo;
            if (alvo && painelNotif.parentElement !== alvo) alvo.appendChild(painelNotif);
        }

        posicionarPainelNotificacoes();

        let timerResize;
        window.addEventListener("resize", () => {
            clearTimeout(timerResize);
            timerResize = setTimeout(() => {
                posicionarPainelNotificacoes();
                if (painelNotif?.classList.contains("aberto")) posicionarPainelAoLado();
            }, 150);
        });
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
