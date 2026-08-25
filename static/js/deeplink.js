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
        window.Capacitor.Plugins.App.addListener("appUrlOpen", function (data) {
            handleUrl(data.url);
        });
    }
})();
