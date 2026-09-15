// ==========================================================
// deeplink.js
// Trata o retorno do login com Google feito no navegador do
// sistema. O app recebe bixuco://auth?token=XXX e troca esse
// token por uma sessão própria na WebView.
// ==========================================================

(function () {

    // Só roda dentro do app
    const dentroDoApp = navigator.userAgent.includes("BixucoApp");
    if (!dentroDoApp) return;

    // O Capacitor injeta window.Capacitor; se não existir, não há o que fazer
    if (!window.Capacitor || !window.Capacitor.Plugins) return;

    const { App, Browser } = window.Capacitor.Plugins;

    // 1) Quando o deep link chega, extrai o token e navega pra rota de troca
    if (App) {
        App.addListener("appUrlOpen", (evento) => {

            const url = evento && evento.url ? evento.url : "";
            if (!url.startsWith("bixuco://")) return;

            // Fecha o navegador que ficou aberto por cima do app
            if (Browser) Browser.close().catch(() => {});

            const token = new URL(url.replace("bixuco://", "https://x/")).searchParams.get("token");
            if (!token) return;

            window.location.href = "/auth/app-token?token=" + encodeURIComponent(token);
        });
    }

    // 2) Intercepta o clique em "Continuar com Google" e abre no navegador
    //    do sistema (o Google recusa OAuth dentro de WebView embutida)
    document.addEventListener("click", (e) => {

        const link = e.target.closest('a[href*="/auth/google"]');
        if (!link) return;

        e.preventDefault();

        const destino = "https://mvp-bixuco.onrender.com/auth/google?origem=app";

        if (Browser) {
            Browser.open({ url: destino });
        } else {
            window.open(destino, "_system");
        }

    });

})();