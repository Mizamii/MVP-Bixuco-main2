(function () {
    function handleUrl(url) {
        try {
            var alvo = new URL(url);
            window.location.href = alvo.pathname + alvo.search;
        } catch (e) {
            console.log("Erro ao processar link recebido:", e);
        }
    }

    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {

        // Cobre o caso do app já estar aberto e receber o link
        window.Capacitor.Plugins.App.addListener("appUrlOpen", function (data) {
            handleUrl(data.url);
        });

        // Cobre o caso do app estar fechado e ser aberto PELO link
        // (cold start) — sem isso, o app sempre carrega a index
        // mesmo quando aberto por um link de recuperação de senha
        window.Capacitor.Plugins.App.getLaunchUrl().then(function (resultado) {
            if (resultado && resultado.url) {
                handleUrl(resultado.url);
            }
        });

    }
})();