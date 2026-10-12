                                                             
              
                                                            
                                                             
                                           
                                                             

(function () {

                            
    const dentroDoApp = navigator.userAgent.includes("BixucoApp");
    if (!dentroDoApp) return;

                                                           
                                                     
    document.documentElement.classList.add("app-bixuco");

                                                                              
    if (!window.Capacitor || !window.Capacitor.Plugins) return;

    const { App, Browser } = window.Capacitor.Plugins;

                                                                             
    if (App) {
        App.addListener("appUrlOpen", (evento) => {

            const url = evento && evento.url ? evento.url : "";
            if (!url.startsWith("bixuco://")) return;

                                                                 
            if (Browser) Browser.close().catch(() => {});

            const token = new URL(url.replace("bixuco://", "https://x/")).searchParams.get("token");
            if (!token) return;

            window.location.href = "/auth/app-token?token=" + encodeURIComponent(token);
        });
    }

                                                                           
                                                                       
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