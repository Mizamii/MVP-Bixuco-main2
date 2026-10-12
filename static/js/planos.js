                            
                  
                            

let idiomaAtual = localStorage.getItem("idioma") || "pt";

const dicionario = {
    "Selecione um plano antes de confirmar.": "Select a plan before confirming.",
    "Processando...":                        "Processing...",
    "Confirmar":                              "Confirm",
    "Erro ao processar.":                     "Error processing.",
    "Erro ao processar. Tente novamente.":    "Error processing. Try again.",
    "Nenhuma promoção por enquanto.":         "No promotions for now.",
    "Não foi possível carregar.":             "Could not load.",
    "Carregando...":                          "Loading...",
    "Responsável":                            "Guardian",
    "Terapeuta":                              "Therapist",
    "Usuário":                                "User",
    "Pagamento ainda não aprovado. Aguarde a confirmação do Mercado Pago antes de acessar a home.": "Payment has not been approved yet. Wait for Mercado Pago confirmation before accessing the home page.",
    "Pagamento não aprovado. Tente novamente ou escolha outra forma de pagamento.": "Payment was not approved. Try again or choose another payment method.",
    "Não foi possível validar esse pagamento. Tente novamente.": "We could not validate this payment. Please try again.",
    "Grátis": "Free",
    "Plano Grátis": "Free plan",
    "Plano Intermediário": "Intermediate plan",
    "Plano Completo": "Complete plan"
};

function traduzir(texto) {
    if (idiomaAtual === "pt" || texto == null) return texto;
    return dicionario[texto] || texto;
}

function aplicarIdiomaEstatico() {
    document.querySelectorAll("[data-pt]").forEach(el => {
        el.textContent = idiomaAtual === "en"
            ? (el.dataset.en || el.dataset.pt)
            : el.dataset.pt;
    });

    document.getElementById("textoTradutor").textContent =
        idiomaAtual === "en" ? "Traduzir para o português" : "Traduzir para o inglês";

                                                       
    document.getElementById("tipoConta").textContent = traduzir(ultimoTipoConta);

    const nomePlanoAtual = document.getElementById("nomePlanoAtual");
    if (nomePlanoAtual) {
        nomePlanoAtual.textContent = traduzir(ultimoNomePlanoAtual);
    }
}

document.getElementById("btnTraduzir").addEventListener("click", () => {
    idiomaAtual = idiomaAtual === "pt" ? "en" : "pt";
    localStorage.setItem("idioma", idiomaAtual);
    aplicarIdiomaEstatico();

    if (painelNotificacoes.classList.contains("aberto")) {
        carregarNotificacoes();
    }
});

                                                  
let planoSelecionado = null;
let ultimoTipoConta  = "Responsável";

                                                               
                                                                  
                                                                   
let planoCodigoAtual = "gratis";
let ultimoNomePlanoAtual = "Grátis";

                                                                  
                                                                 
                                                                  
                                                                    
                  
function atualizarLinkPerfil() {
    const destino = planoCodigoAtual === "gratis" ? "/perfilSemAssinatura" : "/perfil";

    const item = document.getElementById("itemMeuPerfil");
    if (item) item.href = destino;

    const fotoSidebar = document.getElementById("fotoLinkSidebar");
    if (fotoSidebar) fotoSidebar.href = destino;
}

                                                                   
                                                                
                                                              
                                                                             
function atualizarSidebar(planoCodigo) {
    const temPlanoPago = planoCodigo === "medio" || planoCodigo === "completo";

    document.getElementById("navComPlano").style.display  = temPlanoPago ? "flex" : "none";
    document.getElementById("navSemPlano").style.display  = temPlanoPago ? "none"  : "flex";

                                                                             
                                                                        
                                                                    
                                                       
    document.getElementById("bottomNavComPlano").style.display = temPlanoPago ? "" : "none";
    document.getElementById("bottomNavSemPlano").style.display = temPlanoPago ? "none" : "";
}

                            
                   
                            
async function carregarUsuario() {
    try {
                                                                 
                                                                     
                                                                    
                                                               
                             
        const resposta = await fetch("/api/perfil");

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        if (!resposta.ok) return;

        const dados = await resposta.json();

        document.getElementById("nomeUsuario").textContent =
            dados.nome || "Usuário";

        ultimoTipoConta = dados.tipoConta || "Responsável";
        document.getElementById("tipoConta").textContent = traduzir(ultimoTipoConta);

        if (dados.fotoPerfil) {
            document.getElementById("fotoUsuario").src = dados.fotoPerfil;
        }

        planoCodigoAtual = dados.planoCodigo || "gratis";
        atualizarSidebar(planoCodigoAtual);
        atualizarLinkPerfil();

                               
        if (dados.plano) {
            ultimoNomePlanoAtual = dados.plano;
            document.getElementById("nomePlanoAtual").textContent = traduzir(ultimoNomePlanoAtual);
            document.getElementById("planoAtualInfo").style.display = "block";
        }

                                                                 
                                                                    
                                                              
        const idsPorCodigo = {
            gratis:   "cardGratis",
            medio:    "cardMedio",
            completo: "cardCompleto"
        };

        const cardId = idsPorCodigo[planoCodigoAtual];
        if (cardId) {
            const card = document.getElementById(cardId);
            if (card) selecionarPlano(planoCodigoAtual, card);
        }

    } catch (e) {
        console.log("Erro ao carregar usuário:", e);
    }
}

                            
                  
                            
function selecionarPlano(plano, card) {
                              
    document.querySelectorAll(".card-plano").forEach(c => {
        c.classList.remove("card-plano--selecionado");
    });

                           
    card.classList.add("card-plano--selecionado");
    planoSelecionado = plano;

                                     
    document.getElementById("erroPlano").style.display = "none";
}

                            
                  
                            
async function confirmarPlano() {

    if (!planoSelecionado) {
        const erroEl = document.getElementById("erroPlano");
        erroEl.textContent = traduzir("Selecione um plano antes de confirmar.");
        erroEl.style.display = "block";
        return;
    }

    const btn = document.getElementById("btnConfirmar");
    btn.disabled    = true;
    btn.textContent = traduzir("Processando...");

    try {

        const resposta = await fetch("/api/planos/assinar", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ plano: planoSelecionado })
        });

        if (resposta.status === 401) {
            window.location.href = "/logar";
            return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao processar.");
        }

                                          
        if (dados.destino) {
            window.location.href = dados.destino;
            return;
        }

                                                 
        if (dados.linkPagamento) {
            window.location.href = dados.linkPagamento;
            return;
        }

    } catch (erro) {

        console.log("Erro ao confirmar plano:", erro);

        const erroEl = document.getElementById("erroPlano");
        erroEl.textContent = traduzir(erro.message) || traduzir("Erro ao processar. Tente novamente.");
        erroEl.style.display = "block";

    } finally {

        btn.disabled    = false;
        btn.textContent = traduzir("Confirmar");

    }

}

                            
       
                            
function aplicarTema(tema) {
    document.body.classList.remove("tema-claro", "tema-escuro");
    document.body.classList.add(`tema-${tema}`);
    document.getElementById("btnClaro").classList.toggle("ativo", tema === "claro");
    document.getElementById("btnEscuro").classList.toggle("ativo", tema === "escuro");
    localStorage.setItem("tema", tema);

                                                                             
    const iconeMobile = document.querySelector("#btnTemaMobile i");
    if (iconeMobile) {
        iconeMobile.className = tema === "claro" ? "fa-regular fa-sun" : "fa-regular fa-moon";
    }
}

document.getElementById("btnClaro").addEventListener("click",  () => aplicarTema("claro"));
document.getElementById("btnEscuro").addEventListener("click", () => aplicarTema("escuro"));

document.getElementById("btnTemaMobile").addEventListener("click", () => {
    const temaAtual = document.body.classList.contains("tema-escuro") ? "escuro" : "claro";
    aplicarTema(temaAtual === "claro" ? "escuro" : "claro");
});

                            
                              
                            
const painelNotificacoes = document.getElementById("painelNotificacoes");
const listaNotificacoes  = document.getElementById("listaNotificacoes");

function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

function formatarItemNotificacao(item) {
    const classeExtra = item.lida ? "" : "nao-lida";
    return `
        <div class="item-notificacao ${classeExtra}">
            ${escaparHTML(item.mensagem)}
            <span class="tempo-notificacao">${escaparHTML(item.tempo)}</span>
        </div>
    `;
}

async function carregarNotificacoes() {
    try {
        const resposta = await fetch("/api/notificacoes");
        if (!resposta.ok) throw new Error();
        const dados = await resposta.json();

        const itens = (dados.notificacoes || []).filter(n => n.tipo === "novidade");

        listaNotificacoes.innerHTML = itens.length === 0
            ? `<div class="painel-vazio">${traduzir("Nenhuma promoção por enquanto.")}</div>`
            : itens.map(formatarItemNotificacao).join("");

        const naoLidas = itens.filter(item => !item.lida).length;
        document.getElementById("quantidadeNotificacoes").textContent = naoLidas;

    } catch (erro) {
        listaNotificacoes.innerHTML = `<div class="painel-vazio">${traduzir("Não foi possível carregar.")}</div>`;
    }
}

async function marcarNotificacoesComoLidas() {
    try {
        await fetch("/api/notificacoes/marcar-lidas", { method: "POST" });
        document.getElementById("quantidadeNotificacoes").textContent = 0;
    } catch (erro) {
        console.log("Erro ao marcar notificações como lidas:", erro);
    }
}

document.getElementById("btnNotificacoes").addEventListener("click", async (e) => {
    e.stopPropagation();
    const estaAberto = painelNotificacoes.classList.contains("aberto");
    if (estaAberto) {
        painelNotificacoes.classList.remove("aberto");
        return;
    }
    painelNotificacoes.classList.add("aberto");
    await carregarNotificacoes();
    marcarNotificacoesComoLidas();
});

document.addEventListener("click", (e) => {
    if (!painelNotificacoes.contains(e.target)) {
        painelNotificacoes.classList.remove("aberto");
    }
});

                            
                                      
                            
function mostrarFeedbackPagamento() {
    const params = new URLSearchParams(window.location.search);
    const info = params.get("info");
    const erro = params.get("erro");

    let mensagem = null;
    let cor = "#E53E3E";

    if (info === "pagamento_pendente") {
        mensagem = "Pagamento ainda não aprovado. Aguarde a confirmação do Mercado Pago antes de acessar a home.";
        cor = "#2252BD";
    } else if (erro === "pagamento_falhou") {
        mensagem = "Pagamento não aprovado. Tente novamente ou escolha outra forma de pagamento.";
    } else if (erro === "pagamento_invalido") {
        mensagem = "Não foi possível validar esse pagamento. Tente novamente.";
    }

    if (!mensagem) return;

    const feedback = document.getElementById("erroPlano");
    feedback.textContent = traduzir(mensagem);
    feedback.style.color = cor;
    feedback.style.display = "block";

                                                                                      
    window.history.replaceState({}, document.title, window.location.pathname);
}

                            
                
                            
aplicarIdiomaEstatico();
const temaSalvo = localStorage.getItem("tema") || "claro";
aplicarTema(temaSalvo);
carregarUsuario();
mostrarFeedbackPagamento();

                                                                           

document.getElementById("fotoUsuario").addEventListener("error", function () {
    this.src = "/img/perfilPadrao.png";
});

document.getElementById("imgMascotePlanos").addEventListener("error", function () {
    this.style.display = "none";
});

document.getElementById("cardGratis").addEventListener("click", function () {
    selecionarPlano("gratis", this);
});

document.getElementById("cardMedio").addEventListener("click", function () {
    selecionarPlano("medio", this);
});

document.getElementById("cardCompleto").addEventListener("click", function () {
    selecionarPlano("completo", this);
});

document.getElementById("btnConfirmar").addEventListener("click", confirmarPlano);