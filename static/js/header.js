// ==========================================================
// header.js
// Monta o cabeçalho ÚNICO do app dentro de <header id="topoApp">.
//
//   Esquerda : foto do usuário → abre o menu da conta
//              (nome, meu perfil, traduzir, tema, sair)
//   Direita  : sininho de notificações
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
// Atributos opcionais no <header>:
//   data-perfil       → URL da tela de perfil (item "Meu perfil")
//   data-pagina       → "perfil" marca "Meu perfil" como página atual
//   data-notif-pt/en  → título do painel de notificações
//
// Os IDs abaixo são os MESMOS que os JS das páginas já usam
// (fotoUsuario, nomeUsuario, tipoConta, btnTraduzir, textoTradutor,
//  btnTemaMobile, btnNotificacoes, quantidadeNotificacoes,
//  painelNotificacoes, listaNotificacoes), então a lógica de
// tradução, tema e notificações de cada página continua funcionando.
// ==========================================================
(function () {

    const topo = document.getElementById("topoApp");
    if (!topo) return;

    const urlPerfil   = topo.dataset.perfil || "/perfil";
    const paginaAtual = topo.dataset.pagina || "";
    const notifPt     = topo.dataset.notifPt || "Notificações";
    const notifEn     = topo.dataset.notifEn || "Notifications";

    const ehPerfil = paginaAtual === "perfil";

    topo.innerHTML = `
        <div class="topo-perfil">

            <button type="button" class="topo-avatar" id="btnMenuPerfil"
                    aria-haspopup="true" aria-expanded="false" aria-controls="menuPerfil"
                    aria-label="Menu da conta">
                <img id="fotoUsuario" src="/img/perfilPadrao.png" alt="Foto do usuário">
            </button>

            <div class="menu-perfil" id="menuPerfil" role="menu">

                <div class="menu-perfil__conta">
                    <strong id="nomeUsuario">Carregando...</strong>
                    <span id="tipoConta">...</span>
                </div>

                <a class="menu-perfil__item${ehPerfil ? " ativo" : ""}" role="menuitem"
                   href="${urlPerfil}" id="itemMeuPerfil">
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
                <span id="quantidadeNotificacoes" class="badge">0</span>
            </button>

            <div class="painel-notificacoes" id="painelNotificacoes">
                <div class="painel-header" data-pt="${notifPt}" data-en="${notifEn}">${notifPt}</div>
                <div id="listaNotificacoes">
                    <div class="painel-vazio" data-pt="Carregando..." data-en="Loading...">Carregando...</div>
                </div>
            </div>
        </div>
    `;

    // Já está na tela de perfil: o item só fecha o menu, sem recarregar.
    if (ehPerfil) {
        document.getElementById("itemMeuPerfil").addEventListener("click", (e) => e.preventDefault());
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
