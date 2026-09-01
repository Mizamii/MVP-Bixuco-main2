const express = require('express');
const path = require('path');
const fs = require('fs'); 
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { cpf } = require('cpf-cnpj-validator');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const crypto = require('crypto');
const multer = require('multer');
const cron = require('node-cron');
const { MercadoPagoConfig, PreApprovalPlan, PreApproval } = require("mercadopago");


const { Brevo, BrevoClient, BrevoEnvironment } = require('@getbrevo/brevo');

const brevoClient = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
    environment: BrevoEnvironment.Production
});


const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

const app = express();

const db = new Pool({

    // 🔒 FIX 3: A connection string NUNCA deve ficar hardcoded no código
    // Crie um arquivo .env na raiz do projeto com a linha:
    // DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
    // E adicione .env no seu .gitignore para não subir para o GitHub
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    },

    options: '-c timezone=America/Sao_Paulo'


});

const pgSession = require('connect-pg-simple')(session);

app.use(session({
    store: new pgSession({
        pool: db,              // usa o mesmo Pool do Postgres que você já tem
        tableName: 'session',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || "bixuco2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
    }
}));



app.use(passport.initialize());
app.use(passport.session());

const upload = multer({

    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB por arquivo
    },

    fileFilter: (req, file, cb) => {

        // Aceita apenas imagens
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas imagens são permitidas."), false);
        }

    }

});

/* ==========================
   LEMBRETE DIÁRIO DE RELATÓRIO
========================== */

// Roda todo dia às 19h (horário de Brasília)
// Verifica quem ainda não fez o relatório hoje E tem o lembrete ativado,
// e cria uma notificação pra essas pessoas — igual o Duolingo faz
cron.schedule('0 19 * * *', async () => {

    try {

        const usuariosParaLembrar = await db.query(`
            SELECT u.id
            FROM usuarios u
            LEFT JOIN preferencias_usuario p ON p.usuario_id = u.id
            WHERE u.tipo = 'pai'
            AND COALESCE(p.notif_lembrete, TRUE) = TRUE
            AND NOT EXISTS (
                SELECT 1 FROM relatorios r
                WHERE r.usuario_id = u.id
                AND DATE(r.data) = CURRENT_DATE
            )
            AND NOT EXISTS (
                SELECT 1 FROM notificacoes n
                WHERE n.usuario_id = u.id
                AND n.tipo = 'lembrete_relatorio'
                AND DATE(n.criado_em) = CURRENT_DATE
            )
        `);

        for (const usuario of usuariosParaLembrar.rows) {

            await db.query(
                `INSERT INTO notificacoes (usuario_id, tipo, mensagem, lida)
                 VALUES ($1, 'lembrete_relatorio', $2, FALSE)`,
                [usuario.id, "Não esqueça de preencher o relatório de hoje! 📋"]
            );

        }

        console.log(`Lembretes de relatório enviados para ${usuariosParaLembrar.rows.length} usuário(s).`);

    } catch (erro) {

        console.log("Erro ao enviar lembretes de relatório:", erro);

    }

}, {
    timezone: "America/Sao_Paulo"
});

// GET — busca preferências
app.get("/api/preferencias", estaLogado, async (req, res) => {
    try {
        const usuarioId = req.session.usuarioId || (req.user && req.user.id);
        const resultado = await db.query(
            `SELECT notif_lembrete, notif_novidades
             FROM preferencias_usuario
             WHERE usuario_id = $1`,
            [usuarioId]
        );

        const prefs = resultado.rows[0] || {};
        res.json({
            lembreteRelatorio: prefs.notif_lembrete  ?? true,
            novaSolicitacao:   prefs.notif_novidades ?? true
        });
    } catch (_) {
        res.json({ lembreteRelatorio: true, novaSolicitacao: true });
    }
});

const PLANOS_MP = {
    medio: {
        nome:       "Plano Básico Bixuco",
        preco:      100.00,
        planId:     process.env.MP_PLAN_ID_MEDIO    || null,
        nomeBanco:  "medio"
    },
    completo: {
        nome:       "Plano Premium Bixuco",
        preco:      120.00,
        planId:     process.env.MP_PLAN_ID_COMPLETO || null,
        nomeBanco:  "completo"
    }
};

app.use(express.json());

// POST — salva preferências (terapeuta e pai compartilham a mesma tabela)
app.post("/api/preferencias", estaLogado, async (req, res) => {
    try {
        const usuarioId = req.session.usuarioId || (req.user && req.user.id);
        const { lembreteRelatorio, novaSolicitacao } = req.body;

        if(!req.body){
            return res.status(400).json({ erro: "corpo da requisição inválido ou ausente" });
        }

        if (lembreteRelatorio !== undefined) {
            await db.query(
                `INSERT INTO preferencias_usuario (usuario_id, notif_lembrete)
                 VALUES ($1, $2)
                 ON CONFLICT (usuario_id) DO UPDATE SET notif_lembrete = $2`,
                [usuarioId, lembreteRelatorio]
            );
        }

        if (novaSolicitacao !== undefined) {
            await db.query(
                `INSERT INTO preferencias_usuario (usuario_id, notif_novidades)
                 VALUES ($1, $2)
                 ON CONFLICT (usuario_id) DO UPDATE SET notif_novidades = $2`,
                [usuarioId, novaSolicitacao]
            );
        }

        res.json({ mensagem: "Preferências salvas." });
    } catch (erro) {
        console.log("Erro ao salvar preferências:", erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});


/* ==========================
   MIDDLEWARES
========================== */

app.use(express.static(path.join(__dirname, "static")));

app.use(express.urlencoded({
    extended: true
}));





/* ==========================
   MIDDLEWARE DE AUTENTICAÇÃO
========================== */

// 🔒 FIX 2: Middleware que protege rotas que exigem login
// Use estaLogado nas rotas que o usuário precisa estar autenticado para acessar
function estaLogado(req, res, next) {
    if (req.isAuthenticated() || req.session.usuarioId) {
        return next();
    }
    return res.redirect("/logar");
}

// ─────────────────────────────────────────
// MIDDLEWARE — verifica plano do usuário
// ─────────────────────────────────────────

// busca o plano ativo do usuário e anexa em req.plano
async function verificarPlano(req, res, next) {
    const usuarioId = req.session.usuarioId || (req.user && req.user.id);
    if (!usuarioId) return res.status(401).json({ erro: "Não autenticado." });

    try {
        // terapeutas não precisam de assinatura
        if (req.session.tipo === 'psicologo' || (req.user && req.user.tipo === 'psicologo')) {
            req.plano = 'terapeuta';
            return next();
        }

        const resultado = await db.query(
            `SELECT nome_plano FROM assinaturas 
             WHERE usuario_id = $1 AND ativo = true 
             ORDER BY criado_em DESC LIMIT 1`,
            [usuarioId]
        );

        req.plano = resultado.rows.length > 0 
            ? resultado.rows[0].nome_plano.toLowerCase()
            : 'gratuito';

        next();
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro interno." });
    }
}

// exige plano medio ou superior
function exigeEconomico(req, res, next) {
    if (['medio', 'completo', 'terapeuta'].includes(req.plano)) return next();
    return res.status(403).json({ erro: "plano_insuficiente", planoAtual: req.plano });
}

// exige plano completo
function exigePremium(req, res, next) {
    if (['completo', 'terapeuta'].includes(req.plano)) return next();
    return res.status(403).json({ erro: "plano_insuficiente", planoAtual: req.plano });
}



/* ==========================
   ROTAS GET
========================== */

app.get("/.well-known/assetlinks.json", (req, res) => {
    const caminho = path.join(__dirname, ".well-known", "assetlinks.json");
    res.sendFile(caminho, { dotfiles: 'allow' });
});

// ─────────────────────────────────────────
// PLANO DO USUÁRIO LOGADO
// ─────────────────────────────────────────
app.get("/api/meu-plano", estaLogado, verificarPlano, (req, res) => {
    res.json({ plano: req.plano });
});


app.get("/relatorios", estaLogado, precisaPlano("Médio"), (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "relatorios.html"));

});


app.get("/AdicionarC", estaLogado, (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "AdicionarC.html"));

});

app.get("/", (req, res) => {
    const usuarioId = req.session.usuarioId || (req.user && req.user.id);
    const tipo = req.session.tipo || (req.user && req.user.tipo);

    if (usuarioId) {
        return res.redirect(tipo === "psicologo" ? "/hometerapeuta" : "/home");
    }

    return res.sendFile(path.join(__dirname, "templates", "index.html"));
    // ou res.redirect("/logar") se você não quiser mostrar a index pra ninguém deslogado dentro do app
});

app.get("/pacientes", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "Pacientes.html"));
});

app.get("/logar", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "logar.html"));
});

app.get("/ContaExistente", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "ContaExistente.html"));
});

app.get("/CriarContaS", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "CriarContaS.html"));
});

app.get("/CriarContaG", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "CriarContaG.html"));
});

app.get("/CriarContaP", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "CriarContaP.html"));
});

app.get("/CriarContaSenha", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "CriarContaSenha.html"));
});

app.get("/AdicionarC", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "AdicionarC.html"));
});

app.get("/QuestionarioP", estaLogado, (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "QuestionarioP.html"));

});

app.get("/relatoriosTerapeutaS", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "RelatoriosTerapeutaS.html"));
});

app.get("/relatoriosTerapeuta", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "RelatoriosTerapeuta.html"));
});

app.get("/EsqueceuSenha", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "EsqueceuSenha.html"));
});

app.get("/sobreT", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "SobreTerapeuta.html"));
});


app.get("/configuracoesT", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "ConfiguracoesTerapeuta.html"));
});



app.get("/planos", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "planos.html"));
});

app.get("/sobreSemAssinatura", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "SobreSemAssinatura.html"));
});

app.get("/configuracoesSemAssinatura", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "ConfiguracoesSemAssinatura.html"));
});



app.get("/perfilSemAssinatura", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "PerfilSemAssinatura.html"));
});


app.get("/hometerapeuta", estaLogado, (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "HomeTerapeuta.html"));

});

app.get("/onboarding-google", estaLogado, (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "onboarding-google.html"));

});

app.get("/FormularioEntrega", estaLogado, precisaPlano("Médio"), (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "FormularioEntrega.html"));
});

app.get("/admin/pedidos", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "AdminPedidos.html"));
});

app.get("/PedidoConfirmado", estaLogado, precisaPlano("Médio"), (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "PedidoConfirmado.html"));
});

app.get("/AcompanharPedido", estaLogado, precisaPlano("Médio"), (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "AcompanharPedido.html"));
});

app.get("/BixucoEntregue", estaLogado, precisaPlano("Médio"), (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "BixucoEntregue.html"));
});

app.get("/VincularIdentidade", estaLogado, precisaPlano("Médio"), (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "VincularIdentidade.html"));
});

app.get("/VincularSucesso", estaLogado, precisaPlano("Médio"), (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "VincularSucesso.html"));
});


app.get("/PerfilTerapeuta", estaLogado, (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "PerfilTerapeuta.html"));

});



// 🔒 FIX 2 (aplicado): /home agora exige login
app.get("/home", estaLogado, precisaPlano("Médio"), (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "home.html"));
});

app.get("/Transicao1", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "Transicao1.html"));
});

app.get("/Transicao2", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "Transicao2.html"));
});

app.get("/Transicao3", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "Transicao3.html"));
});

/* ==========================
   BANCO DE DADOS
========================== */



/* ==========================
   LOGIN COM GOOGLE
========================== */

passport.use(new GoogleStrategy({

    clientID: process.env.GOOGLE_CLIENT_ID,

    clientSecret: process.env.GOOGLE_CLIENT_SECRET,

    callbackURL:
        `${process.env.BASE_URL || "http://localhost:3000"}/auth/google/callback`

},

async (accessToken, refreshToken, profile, done) => {

    try {

        const email = profile.emails[0].value;
        const nome  = profile.displayName;
        const foto  = profile.photos?.[0]?.value || null;

        const resultado = await db.query(

            "SELECT * FROM usuarios WHERE email = $1",

            [email]

        );

        if (resultado.rows.length > 0) {

            // Usuário já existe — retorna direto
            return done(null, resultado.rows[0]);

        }

        // 🔧 FIX: Usuário novo via Google
        // NÃO define o tipo ainda — deixa como null
        // novo_usuario = TRUE → callback vai mandar para o onboarding
        const novoUsuario = await db.query(

            `INSERT INTO usuarios
             (nome, email, tipo, senha, foto_perfil, novo_usuario)
             VALUES ($1, $2, 'pendente', '', $3, TRUE)
             RETURNING *`,

            [nome, email, foto]

        );

        return done(null, novoUsuario.rows[0]);

    } catch (err) {

        return done(err, null);

    }

}));

passport.serializeUser((usuario, done) => {

    done(null, usuario.id);

});

passport.deserializeUser(async (id, done) => {

    try {

        const resultado = await db.query(

            "SELECT * FROM usuarios WHERE id=$1",

            [id]

        );

        done(null, resultado.rows[0]);

    }

    catch (err) {

        done(err, null);

    }

});

app.get(
    "/auth/google",
    (req, res, next) => {
        req.session.origemLogin = req.query.origem === "app" ? "app" : "web";
        next();
    },
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account"
    })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/logar"
    }),
    (req, res) => {

        req.session.usuarioId = req.user.id;
        req.session.tipo      = req.user.tipo;

        let destino;

        if (!req.user.tipo || req.user.tipo === "pendente") {
            destino = "/onboarding-google";
        } else if (req.user.tipo === "pai" && !req.user.cadastro_completo) {
            destino = "/AdicionarC";
        } else if (req.user.tipo === "psicologo") {
            destino = "/homeTerapeuta";
        } else {
            destino = "/home";
        }

        // Veio do app? Tenta o deep link. Veio do navegador (site)? Redireciona normal.
        const veioDoApp = req.session.origemLogin === "app";
        delete req.session.origemLogin; // limpa pra não "vazar" pra próxima sessão

        if (veioDoApp) {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body>
                    <script>
                        window.location.href = "bixuco://${destino}";
                    </script>
                    <p>Redirecionando... se nada acontecer, <a href="https://${req.headers.host}${destino}">clique aqui</a>.</p>
                </body>
                </html>
            `);
        } else {
            res.redirect(destino);
        }

    }
);

app.post("/api/admin/pedido-status", async (req, res) => {

    const { chave, email, novoStatus } = req.body;

    if (!process.env.ADMIN_SECRET || chave !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ erro: "Chave de admin inválida." });
    }

    if (!email) {
        return res.status(400).json({ erro: "Informe o e-mail do usuário." });
    }

    try {
        const usuario = await db.query(
            "SELECT id, nome FROM usuarios WHERE email = $1",
            [email]
        );

        if (usuario.rows.length === 0) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        const usuarioId = usuario.rows[0].id;

        // Sem novoStatus → só consulta o status atual (usado pelo "Buscar pedido")
        if (!novoStatus) {
            const pedido = await db.query(
                "SELECT status FROM pedidos WHERE usuario_id = $1 ORDER BY id DESC LIMIT 1",
                [usuarioId]
            );

            if (pedido.rows.length === 0) {
                return res.status(404).json({ erro: "Esse usuário ainda não tem pedido." });
            }

            return res.json({ nome: usuario.rows[0].nome, status: pedido.rows[0].status });
        }

        const statusesValidos = ["em_producao", "enviado", "em_transito", "entregue"];
        if (!statusesValidos.includes(novoStatus)) {
            return res.status(400).json({ erro: "Status inválido." });
        }

        const atualizado = await db.query(
            `UPDATE pedidos SET status = $1
             WHERE id = (SELECT id FROM pedidos WHERE usuario_id = $2 ORDER BY id DESC LIMIT 1)
             RETURNING id`,
            [novoStatus, usuarioId]
        );

        if (atualizado.rows.length === 0) {
            return res.status(404).json({ erro: "Esse usuário ainda não tem pedido." });
        }

        res.json({ mensagem: `Status atualizado para "${novoStatus}".` });

    } catch (erro) {
        console.log("Erro ao atualizar status do pedido:", erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});


app.post("/api/planos/criar-planos", async (req, res) => {

    try {

        const planoMP = new PreApprovalPlan(mpClient);

        // Cria o plano médio
        const planMedio = await planoMP.create({
            body: {
                reason:            "Plano Médio Bixuco",
                auto_recurring: {
                    frequency:          1,
                    frequency_type:     "months",
                    transaction_amount: 29.00,
                    currency_id:        "BRL"
                },
                back_url: `${process.env.BASE_URL}/pagamento/sucesso`,
                status:   "active"
            }
        });

        // Cria o plano completo
        const planCompleto = await planoMP.create({
            body: {
                reason:            "Plano Completo Bixuco",
                auto_recurring: {
                    frequency:          1,
                    frequency_type:     "months",
                    transaction_amount: 55.00,
                    currency_id:        "BRL"
                },
                back_url: `${process.env.BASE_URL}/pagamento/sucesso`,
                status:   "active"
            }
        });

        // Retorna os IDs para você copiar no .env
        res.json({
            mensagem:           "Planos criados! Adicione esses IDs no .env do Render:",
            MP_PLAN_ID_MEDIO:    planMedio.id,
            MP_PLAN_ID_COMPLETO: planCompleto.id
        });

    } catch (erro) {

        console.log("Erro ao criar planos no MP:", erro);
        res.status(500).json({ erro: erro.message });

    }

});


app.post("/api/planos/assinar", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const { plano } = req.body;

        // MODO TESTE — remove isso em produção
        if (process.env.NODE_ENV === "test" || process.env.MP_BYPASS === "true") {

            const nomesPorPlano = {

                gratis:   "gratis",
                medio:    "medio",
                completo: "completo"

            };

            const nomePlano = nomesPorPlano[plano];

            if (!nomePlano) {
                return res.status(400).json({ erro: "Plano inválido." });
            }

            await db.query(
                `UPDATE assinaturas SET ativo = FALSE WHERE usuario_id = $1 AND ativo = TRUE`,
                [usuarioId]
            );

            await db.query(
                `INSERT INTO assinaturas (usuario_id, nome_plano, ativo)
                 VALUES ($1, $2, TRUE)`,
                [usuarioId, nomePlano]
            );

            await db.query(
                `UPDATE usuarios SET novo_usuario = FALSE WHERE id = $1`,
                [usuarioId]
            );

            const destino = plano === "gratis" ? "/sobreSemAssinatura" : "/home";
            return res.json({ destino });
        }



        // ===========================
        // PLANO GRÁTIS
        // ===========================
        if (plano === "gratis") {

            await db.query(
                `UPDATE assinaturas SET ativo = FALSE WHERE usuario_id = $1 AND ativo = TRUE`,
                [usuarioId]
            );

            await db.query(
                `INSERT INTO assinaturas (usuario_id, nome_plano, ativo)
                 VALUES ($1, 'gratis', TRUE)`,
                [usuarioId]
            );

            await db.query(
                `UPDATE usuarios SET novo_usuario = FALSE WHERE id = $1`,
                [usuarioId]
            );

            return res.json({ destino: "/sobreSemAssinatura" });

        }

        // ===========================
        // PLANOS PAGOS
        // ===========================
        if (!PLANOS_MP[plano]) {
            return res.status(400).json({ erro: "Plano inválido." });
        }

        const dadosPlano = PLANOS_MP[plano];

        if (!dadosPlano.planId) {
            return res.status(500).json({
                erro: "Plano ainda não configurado. Execute POST /api/planos/criar-planos primeiro."
            });
        }

        // Busca email do usuário para o MP
        const resultadoUsuario = await db.query(
            `SELECT nome, email FROM usuarios WHERE id = $1`,
            [usuarioId]
        );

        const usuario = resultadoUsuario.rows[0];

        // Cria a assinatura no Mercado Pago
        const { MercadoPagoConfig, Preference } = require("mercadopago");

        // Troque PreApproval por Preference
        const preference = new Preference(mpClient);

        const pagamento = await preference.create({
            body: {
                items: [{
                    id:          `bixuco-${plano}`,
                    title:       `Bixuco — Plano ${dadosPlano.nome}`,
                    quantity:    1,
                    unit_price:  dadosPlano.preco,
                    currency_id: "BRL"
                }],
                payer: { email: usuario.email },
                back_urls: {
                    success: `${process.env.BASE_URL}/pagamento/sucesso?plano=${plano}&usuario=${usuarioId}`,
                    failure: `${process.env.BASE_URL}/pagamento/falha`,
                    pending: `${process.env.BASE_URL}/pagamento/pendente`
                },
                auto_return:        "approved",
                external_reference: `${usuarioId}|${plano}`,
                notification_url:   `${process.env.BASE_URL}/api/planos/webhook`
            }
        });

        return res.json({ linkPagamento: pagamento.init_point });

    } catch (erro) {

        console.log("Erro ao assinar plano:", JSON.stringify(erro, Object.getOwnPropertyNames(erro)));
        res.status(500).json({ erro: "Erro ao processar assinatura. Tente novamente." });

    }

});


app.post('/api/pedidos/endereco', estaLogado, precisaPlano("Médio"), async (req, res) => {
    const usuarioId = req.session.usuarioId || (req.user && req.user.id);
    const { cep, rua, numero, complemento, bairro, cidade, estado } = req.body;

    try {
        await db.query(
            `INSERT INTO pedidos (usuario_id, cep, rua, numero, complemento, bairro, cidade, estado, codigo_rastreio, previsao_entrega)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [usuarioId, cep, rua, numero, complemento, bairro, cidade, estado,
             'BR' + Math.floor(1000000000 + Math.random() * 9000000000),
             new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)]
        );

        res.sendStatus(200);
    } catch (erro) {
        console.error("Erro ao salvar endereço:", erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});

app.get('/api/pedidos/status', estaLogado, precisaPlano("Médio"), async (req, res) => {
    const usuarioId = req.session.usuarioId || (req.user && req.user.id);

    try {
        const resultado = await db.query(
            'SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY id DESC LIMIT 1',
            [usuarioId]
        );

        if (resultado.rows.length === 0) return res.status(404).json({});
        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error("Erro ao buscar status do pedido:", erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});

app.get('/api/bixuco/status', estaLogado, precisaPlano("Médio"), async (req, res) => {
    const usuarioId = req.session.usuarioId || (req.user && req.user.id);

    try {
        const dispositivo = await db.query(
            'SELECT * FROM dispositivos WHERE usuario_id = $1',
            [usuarioId]
        );

        if (dispositivo.rows.length > 0) {
            return res.json({ estado: 'vinculado' });
        }

        const pedido = await db.query(
            'SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY id DESC LIMIT 1',
            [usuarioId]
        );

        if (pedido.rows.length === 0) {
            return res.json({ estado: 'sem_pedido' });
        }

        if (pedido.rows[0].status !== 'entregue') {
            return res.json({ estado: 'em_andamento', ...pedido.rows[0] });
        }

        return res.json({ estado: 'entregue_nao_vinculado' });
    } catch (erro) {
        console.error("Erro ao buscar status do Bixuco:", erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});

app.post('/api/dispositivos/vincular', estaLogado, precisaPlano("Médio"), async (req, res) => {
    const usuarioId = req.session.usuarioId || (req.user && req.user.id);
    const { device_id } = req.body;

    if (!device_id || device_id.trim().length === 0) {
        return res.status(400).json({ mensagem: 'Código do dispositivo é obrigatório.' });
    }

    try {
        const dispositivo = await db.query(
            'SELECT * FROM dispositivos WHERE dispositivo_id = $1',
            [device_id.trim()]
        );

        if (dispositivo.rows.length === 0) {
            return res.status(404).json({ mensagem: 'Código não encontrado.' });
        }

        if (dispositivo.rows[0].usuario_id && dispositivo.rows[0].usuario_id !== usuarioId) {
            return res.status(409).json({ mensagem: 'Este Bixuco já está vinculado a outra conta.' });
        }

        const crianca = await db.query(
            'SELECT id FROM criancas WHERE usuario_id = $1 LIMIT 1',
            [usuarioId]
        );

        if (crianca.rows.length === 0) {
            return res.status(400).json({ mensagem: 'Cadastre uma criança antes de vincular o Bixuco.' });
        }

        await db.query(
            'UPDATE dispositivos SET usuario_id = $1, crianca_id = $2, vinculado_em = NOW() WHERE dispositivo_id = $3',
            [usuarioId, crianca.rows[0].id, device_id.trim()]
        );

        res.sendStatus(200);
    } catch (erro) {
        console.error('Erro ao vincular dispositivo:', erro);
        res.status(500).json({ mensagem: 'Erro no servidor. Tente novamente.' });
    }
});



app.get("/pagamento/sucesso", estaLogado, async (req, res) => {

    try {

        const { plano, usuario: usuarioIdParam, status } = req.query;
        const usuarioId = req.session.usuarioId || parseInt(usuarioIdParam);

        // O MP pode demorar alguns segundos para confirmar
        // então não dependemos só do status da URL — o webhook cuida da ativação
        // Aqui só mostramos uma tela de aguardo/confirmação

        if (status === "approved") {
            return res.redirect("/home");
        }

        // Pendente — webhook vai ativar quando confirmar
        return res.redirect("/planos?info=pagamento_pendente");

    } catch (erro) {

        console.log("Erro no retorno do pagamento:", erro);
        res.redirect("/planos");

    }

});

app.get("/pagamento/falha", estaLogado, (req, res) => {
    res.redirect("/planos?erro=pagamento_falhou");
});

app.get("/pagamento/pendente", estaLogado, (req, res) => {
    res.redirect("/planos?info=pagamento_pendente");
});


app.post("/api/planos/webhook", async (req, res) => {

    try {

        const { type, data, action } = req.body;

        console.log("Webhook MP recebido:", type, action, data?.id);

        // Processa notificações de assinatura e pagamento
        if (type !== "subscription_preapproval" && type !== "payment") {
            return res.sendStatus(200);
        }

        const itemId = data?.id;
        if (!itemId) return res.sendStatus(200);

        // Busca os detalhes no MP
        const endpoint = type === "payment"
            ? `https://api.mercadopago.com/v1/payments/${itemId}`
            : `https://api.mercadopago.com/preapproval/${itemId}`;

        const response = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
        });

        const dados = await response.json();

        // Extrai usuarioId e plano da referência externa
        // Formato: "42|medio" ou "42|completo"
        const referencia = dados.external_reference || dados.metadata?.external_reference;

        if (!referencia) return res.sendStatus(200);

        const [usuarioId, plano] = referencia.split("|");

        if (!usuarioId || !PLANOS_MP[plano]) return res.sendStatus(200);

        const statusAtual = dados.status;

        // Assinatura ativa ou pagamento aprovado → ativa o plano
        if (statusAtual === "authorized" || statusAtual === "approved") {

            await db.query(
                `UPDATE assinaturas SET ativo = FALSE WHERE usuario_id = $1 AND ativo = TRUE`,
                [parseInt(usuarioId)]
            );

            await db.query(
                `INSERT INTO assinaturas (usuario_id, nome_plano, ativo)
                 VALUES ($1, $2, TRUE)`,
                [parseInt(usuarioId), PLANOS_MP[plano].nomeBanco]
            );

            await db.query(
                `UPDATE usuarios SET novo_usuario = FALSE WHERE id = $1`,
                [parseInt(usuarioId)]
            );

            console.log(`Plano ${PLANOS_MP[plano].nomeBanco} ativado para usuário ${usuarioId}.`);

        }

        // Assinatura cancelada ou pausada → volta para grátis
        if (statusAtual === "cancelled" || statusAtual === "paused") {

            await db.query(
                `UPDATE assinaturas SET ativo = FALSE WHERE usuario_id = $1 AND ativo = TRUE`,
                [parseInt(usuarioId)]
            );

            await db.query(
                `INSERT INTO assinaturas (usuario_id, nome_plano, ativo)
                 VALUES ($1, 'Grátis', TRUE)`,
                [parseInt(usuarioId)]
            );

            console.log(`Plano cancelado para usuário ${usuarioId}. Voltando para Grátis.`);

        }

        return res.sendStatus(200);

    } catch (erro) {

        console.log("Erro no webhook:", erro);
        return res.sendStatus(500);

    }

});

/* ==========================
   MIDDLEWARE DE PLANO
   Verifica se o usuário tem o plano necessário
========================== */

async function verificarPlano(req, res, next) {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) return res.redirect("/logar");

        // Terapeuta tem acesso total sem plano
        if (req.session.tipo === "psicologo") {
            req.plano = "terapeuta";
            return next();
        }

        const resultado = await db.query(
            `SELECT nome_plano FROM assinaturas
             WHERE usuario_id = $1 AND ativo = TRUE
             ORDER BY criado_em DESC LIMIT 1`,
            [usuarioId]
        );

        req.plano = resultado.rows[0]?.nome_plano || "Grátis";
        return next();

    } catch (erro) {
        console.log("Erro ao verificar plano:", erro);
        req.plano = "Grátis";
        return next();
    }

}

// Bloqueia rotas para usuários sem o plano mínimo necessário
function precisaPlano(planoMinimo) {

    const hierarquia = { "gratis": 0, "medio": 1, "completo": 2, "terapeuta": 99 };

    return async (req, res, next) => {
        await verificarPlano(req, res, async () => {

            const nivelUsuario = hierarquia[req.plano] ?? 0;
            const nivelMinimo  = hierarquia[planoMinimo] ?? 1;

            if (nivelUsuario >= nivelMinimo) return next();

            return res.redirect("/planos");
        });
    };

}


app.post("/api/onboarding-google", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const { tipo } = req.body;

        if (!["pai", "psicologo"].includes(tipo)) {
            return res.status(400).json({ erro: "Tipo inválido." });
        }

        // Salva o tipo e marca que o onboarding foi concluído
        // marca cadastro_completo; pai ainda precisa passar pelo AdicionarC.
        await db.query(
            `UPDATE usuarios
            SET tipo = $1, novo_usuario = FALSE, cadastro_completo = $3
            WHERE id = $2`,
            [tipo, usuarioId, tipo === "psicologo"]
        );

        // Atualiza a sessão com o tipo correto
        req.session.tipo = tipo;

        // Define o destino conforme o tipo
        // Pai → adicionar criança | Terapeuta → home do terapeuta
        const destino = tipo === "pai" ? "/AdicionarC" : "/homeTerapeuta";

        return res.json({ sucesso: true, destino });

    } catch (erro) {

        console.log("Erro no onboarding Google:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });

    }

});

/* ==========================
   ADMIN — PUBLICAR NOVIDADE
========================== */

// Página simples para publicar novidades (protegida pela senha admin)
app.get("/admin/novidades", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "Adminnovidades.html"));
});

/* ==========================
   ROTA — ATUALIZAR CRIANÇA (nome / foto)
========================== */

app.post("/api/crianca/atualizar", estaLogado, upload.single("fotoCrianca"), async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const criancaResult = await db.query(
            "SELECT id FROM criancas WHERE usuario_id = $1 LIMIT 1",
            [usuarioId]
        );

        if (criancaResult.rows.length === 0) {
            return res.status(404).json({ erro: "Nenhuma criança cadastrada." });
        }

        const criancaId = criancaResult.rows[0].id;

        const { nome } = req.body;

        const campos  = [];
        const valores = [];
        let indice = 1;

        if (nome !== undefined) {

            const nomeLimpo = nome.trim();

            if (nomeLimpo.length < 2) {
                return res.status(400).json({ erro: "Nome inválido." });
            }

            campos.push(`nome = $${indice++}`);
            valores.push(nomeLimpo);

        }

        // Mesmo padrão de storage usado em /api/perfil/atualizar
        if (req.file) {
            const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
            campos.push(`foto_url = $${indice++}`);
            valores.push(base64);
        }

        if (campos.length === 0) {
            return res.status(400).json({ erro: "Nada para atualizar." });
        }

        valores.push(criancaId);

        const atualizado = await db.query(
            `UPDATE criancas SET ${campos.join(", ")} WHERE id = $${indice}
             RETURNING nome, foto_url`,
            valores
        );

        return res.status(200).json({
            sucesso: true,
            nome: atualizado.rows[0].nome,
            fotoUrl: atualizado.rows[0].foto_url
        });

    } catch (erro) {

        console.log("Erro ao atualizar criança:", erro);
        res.status(500).json({ erro: "Erro interno ao atualizar criança." });

    }

});

// Envia a notificação de novidade para todos os usuários
// que têm "Novidades e dicas" ativado nas configurações
app.post("/api/admin/novidade", async (req, res) => {

    const { chave, mensagem } = req.body;

    // Só continua se a chave enviada bater com a do .env
    if (!process.env.ADMIN_SECRET || chave !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ erro: "Chave de admin inválida." });
    }

    if (!mensagem || mensagem.trim().length < 3) {
        return res.status(400).json({ erro: "Escreva uma mensagem válida." });
    }

    try {

        // Busca todos os usuários que têm o toggle "Novidades e dicas" ativado
        // Quem nunca mexeu no toggle não recebe, já que o padrão do checkbox é desmarcado
        const usuarios = await db.query(`
            SELECT u.id
            FROM usuarios u
            JOIN preferencias_usuario p ON p.usuario_id = u.id
            WHERE p.notif_novidades = TRUE
        `);

        for (const usuario of usuarios.rows) {

            await db.query(
                `INSERT INTO notificacoes (usuario_id, tipo, mensagem, lida)
                 VALUES ($1, 'novidade', $2, FALSE)`,
                [usuario.id, mensagem.trim()]
            );

        }

        return res.status(201).json({
            mensagem: `Novidade enviada para ${usuarios.rows.length} usuário(s).`
        });

    } catch (erro) {

        console.log("Erro ao publicar novidade:", erro);
        res.status(500).json({ erro: "Erro interno ao publicar novidade." });

    }

});

/* ==========================
   FUNÇÃO AUXILIAR
========================== */

function validarCRP(crp) {

    return /^CRP-\d{2}\/\d{4,6}$/.test(crp);

}

async function gerarCodigoVinculo() {

    // Sem caracteres ambíguos (0/O, 1/I) para facilitar digitar o código
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let codigo;
    let existe = true;

    while (existe) {

        codigo = "";
        for (let i = 0; i < 6; i++) {
            codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }

        const resultado = await db.query(
            "SELECT id FROM usuarios WHERE codigo_vinculo = $1",
            [codigo]
        );

        existe = resultado.rows.length > 0;

    }

    return codigo;

}


app.post("/api/perfil-sensorial", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const { respostas } = req.body;

        // Valida se as respostas chegaram corretamente
        if (!respostas || !Array.isArray(respostas) || respostas.length === 0) {
            return res.status(400).json({ erro: "Respostas inválidas." });
        }

        // Busca a criança cadastrada por esse usuário
        // para associar o perfil sensorial a ela
        const criancaResult = await db.query(
            "SELECT id FROM criancas WHERE usuario_id = $1 LIMIT 1",
            [usuarioId]
        );

        const criancaId = criancaResult.rows.length > 0
            ? criancaResult.rows[0].id
            : null;

        // Verifica se já existe um perfil sensorial para essa criança
        // Se existir, atualiza em vez de criar um novo
        if (criancaId) {

            const existente = await db.query(
                "SELECT id FROM perfil_sensorial WHERE crianca_id = $1",
                [criancaId]
            );

            if (existente.rows.length > 0) {

                // Atualiza o perfil existente
                await db.query(
                    `UPDATE perfil_sensorial
                     SET respostas = $1, criado_em = NOW()
                     WHERE crianca_id = $2`,
                    [JSON.stringify(respostas), criancaId]
                );

                return res.status(200).json({ mensagem: "Perfil sensorial atualizado." });

            }

        }

        // Salva o perfil sensorial no banco
        await db.query(
            `INSERT INTO perfil_sensorial
             (usuario_id, crianca_id, respostas)
             VALUES ($1, $2, $3)`,
            [
                usuarioId,
                criancaId,
                JSON.stringify(respostas)
            ]
        );

        return res.status(201).json({ mensagem: "Perfil sensorial salvo com sucesso." });

    } catch (erro) {

        console.log("Erro ao salvar perfil sensorial:", erro);
        res.status(500).json({ erro: "Erro interno ao salvar perfil sensorial." });

    }

});

// Retorna as preferências de notificação salvas do usuário
// Usado para marcar os checkboxes com o estado real ao carregar a página
app.get("/api/configuracoes/notificacoes", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const resultado = await db.query(
            `SELECT notif_lembrete, notif_novidades
             FROM preferencias_usuario
             WHERE usuario_id = $1`,
            [usuarioId]
        );

        // Se o usuário nunca mexeu nos toggles, não existe linha ainda —
        // usa os mesmos padrões do HTML original (lembrete ligado, novidades desligado)
        if (resultado.rows.length === 0) {
            return res.json({ lembrete: true, novidades: false });
        }

        const prefs = resultado.rows[0];

        res.set("Cache-Control", "no-store");
        return res.json({
            lembrete:  prefs.notif_lembrete  !== null ? prefs.notif_lembrete  : true,
            novidades: prefs.notif_novidades !== null ? prefs.notif_novidades : false
        });

    } catch (erro) {

        console.log("Erro ao buscar preferências de notificação:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });

    }

});

app.post("/api/adicionar-crianca", estaLogado, upload.single("fotoCrianca"), async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const { nomeCrianca, dataNascimento, sexo, nomePelucia } = req.body;

        // Validações básicas no backend (o frontend já valida, mas nunca confie só no frontend)
        if (!nomeCrianca || nomeCrianca.trim().length < 2) {
            return res.status(400).json({
                campo: "nomeCrianca",
                erro: "Nome da criança inválido."
            });
        }

        if (!dataNascimento) {
            return res.status(400).json({
                campo: "dataNascimento",
                erro: "Data de nascimento inválida."
            });
        }

        if (!sexo) {
            return res.status(400).json({
                campo: "sexo",
                erro: "Selecione o sexo."
            });
        }

        // Verifica se já existe uma criança cadastrada para esse usuário
        // Ajuste se quiser permitir múltiplas crianças
        const existente = await db.query(
            "SELECT id FROM criancas WHERE usuario_id = $1",
            [usuarioId]
        );

        if (existente.rows.length > 0) {
            return res.status(409).json({
                campo: "nomeCrianca",
                erro: "Você já possui uma criança cadastrada."
            });
        }

        // Processa a foto se foi enviada
        // Por ora salva null — integre com Cloudinary ou S3 quando quiser
        // Exemplo de integração com Cloudinary está comentado abaixo
        // Mesmo padrão de storage usado em /api/perfil/atualizar e /api/crianca/atualizar
        let fotoUrl = null;

        if (req.file) {
            fotoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        }

        // Salva a criança no banco
        await db.query(
            `INSERT INTO criancas
             (usuario_id, nome, data_nascimento, sexo, nome_pelucia, foto_url)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                usuarioId,
                nomeCrianca.trim(),
                dataNascimento,
                sexo,
                nomePelucia ? nomePelucia.trim() : null,
                fotoUrl
            ]
        );

        await db.query(
            "UPDATE usuarios SET cadastro_completo = TRUE WHERE id = $1",
            [usuarioId]
        );

        // Redireciona para o questionário de perfil sensorial
        return res.redirect("/QuestionarioP");

    } catch (erro) {

        console.log("Erro ao adicionar criança:", erro);
        res.status(500).json({ erro: "Erro interno ao salvar criança." });

    }

});


// Checa em tempo real (enquanto o usuário digita) se email/cpf/crp já
// estão em uso — usada pelas telas de cadastro para não deixar o erro
// só aparecer na etapa seguinte.
app.post("/api/verificar-disponibilidade", async (req, res) => {

    const { campo, valor } = req.body || {};

    const colunaPorCampo = {
        email: "email",
        cpf:   "cpf",
        crp:   "crp"
    };

    const coluna = colunaPorCampo[campo];

    if (!coluna || !valor) {
        return res.json({ disponivel: true });
    }

    try {

        const resultado = await db.query(
            `SELECT tipo FROM usuarios WHERE ${coluna} = $1`,
            [valor]
        );

        // Contas "pendente" vieram do login com Google e nunca terminaram
        // o cadastro — elas são assumidas depois, então não bloqueiam aqui.
        const bloqueado = resultado.rows.some(linha => linha.tipo !== "pendente");

        res.json({ disponivel: !bloqueado });

    } catch (erro) {

        console.log("Erro ao verificar disponibilidade:", erro);
        // Em caso de erro interno não travamos o usuário — a checagem
        // definitiva continua acontecendo no envio do formulário.
        res.json({ disponivel: true });

    }

});

app.post("/continuar-cadastro-psicologo", async (req, res) => {

    const {
        nome,
        email,
        telefone,
        crp,
        dataNascimento
    } = req.body;

    const existe = await db.query(
        `SELECT email, crp
        FROM usuarios
        WHERE email = $1 OR crp = $2`,
        [email, crp]
    );

    if (existe.rows.length > 0) {

        if (existe.rows[0].email === email) {
            console.log("Email já cadastrado");
            return res.status(409).json({
                campo: "email",
                erro: "Este e-mail já está cadastrado."
            });
        }

        if (existe.rows[0].crp === crp) {
            console.log("CRP já cadastrado");
            return res.status(409).json({
                campo: "crp",
                erro: "Este CRP já está cadastrado."
            });
        }

    }

    // Salva os dados na sessão para usar na etapa final do cadastro
    req.session.cadastro = {

        tipo: "psicologo",

        nome,
        email,
        telefone,
        crp,
        dataNascimento

    };

    // Como o frontend usa fetch e trata resposta.redirected,
    // o redirect funciona normalmente aqui
    return res.json({
        sucesso: true,
        destino: "/CriarContaSenha"
    });

});


/* ==========================
   PRIMEIRA ETAPA DO CADASTRO
========================== */

app.post("/continuar-cadastro-pai", (req, res) => {

    const {
        nome,
        email,
        telefone,
        cpfUser,
        dataNascimento
    } = req.body;


    req.session.cadastro = {
        tipo: "pai",
        nome,
        email,
        telefone,
        cpfUser,
        dataNascimento
    };

    res.redirect("/CriarContaSenha");

});




// Serve a página de redefinição de senha
// O usuário chega aqui clicando no link do e-mail
app.get("/redefinir-senha", async (req, res) => {

    const { token } = req.query;

    if (!token) {
        return res.redirect("/logar");
    }

    try {

        // Verifica se o token existe, não foi usado e ainda não expirou
        const resultado = await db.query(
            `SELECT * FROM tokens_recuperacao
             WHERE token = $1
             AND usado = FALSE
             AND expira_em > NOW()`,
            [token]
        );

        if (resultado.rows.length === 0) {
            // Token inválido ou expirado — redireciona para o login
            return res.redirect("/logar?erro=token-invalido");
        }

        // Token válido — serve a página de redefinição de senha
        // Crie o arquivo templates/redefinirsenha.html com um form de nova senha
        res.sendFile(path.join(__dirname, "templates", "redefinirsenha.html"));

    } catch (erro) {

        console.log("Erro ao validar token:", erro);
        res.redirect("/logar");

    }

});

/* ==========================
   ROTA — ALTERAR SENHA
========================== */

app.post("/api/alterar-senha", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body;

        if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
            return res.status(400).json({ erro: "Preencha todos os campos." });
        }

        if (novaSenha !== confirmarNovaSenha) {
            return res.status(400).json({ erro: "As senhas novas não coincidem." });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({ erro: "A nova senha deve ter pelo menos 6 caracteres." });
        }

        const resultado = await db.query(
            "SELECT senha FROM usuarios WHERE id = $1",
            [usuarioId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        const usuario = resultado.rows[0];

        // Contas criadas via Google não têm senha (campo fica vazio)
        if (!usuario.senha) {
            return res.status(400).json({
                erro: "Sua conta usa login do Google e não possui senha cadastrada."
            });
        }

        const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ erro: "Senha atual incorreta." });
        }

        const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

        await db.query(
            "UPDATE usuarios SET senha = $1 WHERE id = $2",
            [novaSenhaHash, usuarioId]
        );

        return res.status(200).json({ mensagem: "Senha alterada com sucesso!" });

    } catch (erro) {

        console.log("Erro ao alterar senha:", erro);
        res.status(500).json({ erro: "Erro interno ao alterar senha." });

    }

});

/* ==========================
   ROTA — REDEFINIR SENHA (POST)
========================== */

// Processa a nova senha enviada pelo usuário
app.post("/redefinir-senha", async (req, res) => {

    const { token, senha, confirmarSenha } = req.body;

    if (!token) {
        return res.status(400).json({ erro: "Token inválido." });
    }

    if (!senha || senha.length < 6) {
        return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres." });
    }

    if (senha !== confirmarSenha) {
        return res.status(400).json({ erro: "As senhas não coincidem." });
    }

    try {

        // Verifica novamente se o token ainda é válido
        const resultado = await db.query(
            `SELECT * FROM tokens_recuperacao
             WHERE token = $1
             AND usado = FALSE
             AND expira_em > NOW()`,
            [token]
        );

        if (resultado.rows.length === 0) {
            return res.status(400).json({ erro: "Link expirado ou já utilizado. Solicite um novo." });
        }

        const tokenDados = resultado.rows[0];

        // Gera o hash da nova senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Atualiza a senha do usuário no banco
        await db.query(
            "UPDATE usuarios SET senha = $1 WHERE id = $2",
            [senhaHash, tokenDados.usuario_id]
        );

        // Marca o token como usado para que não possa ser reutilizado
        await db.query(
            "UPDATE tokens_recuperacao SET usado = TRUE WHERE token = $1",
            [token]
        );

        return res.status(200).json({ mensagem: "Senha redefinida com sucesso! Faça login com a nova senha." });

    } catch (erro) {

        console.log("Erro ao redefinir senha:", erro);
        res.status(500).json({ erro: "Erro interno. Tente novamente." });

    }

});


app.get("/RelatorioDiario", estaLogado,precisaPlano("Médio"), (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "relatoriodiario.html"));

});

// 🔧 Rota POST — salva o relatório preenchido pelo usuário
// O frontend chamava /salvar-relatorio que nunca existiu
// Agora a rota correta é /api/relatorio
app.get("/api/relatorios", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        // 🔧 Condição reutilizada: só considera "alerta" o dia em que a
        // pergunta "alerta_estresse" foi respondida com "Sim". Enquanto
        // não existe conexão real com o Bixuco, é essa resposta que
        // controla os alertas — ver nota na Parte 1.
        const filtroAlerta = `
            AND EXISTS (
                SELECT 1 FROM jsonb_array_elements(respostas) AS r
                WHERE r->>'id' = 'alerta_estresse'
                AND r->>'resposta' = 'Sim'
            )
        `;

        // =====================
        // ALERTAS DO MÊS
        // =====================

        const alertasMes = await db.query(
            `WITH eventos_ordenados AS (
                SELECT
                    e.criado_em,
                    LAG(e.criado_em) OVER (ORDER BY e.criado_em) AS evento_anterior
                FROM eventos_bixuco e
                JOIN criancas c ON c.id = e.crianca_id
                WHERE c.usuario_id = $1
                AND EXTRACT(MONTH FROM (e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) = EXTRACT(MONTH FROM NOW() AT TIME ZONE 'America/Sao_Paulo')
                AND EXTRACT(YEAR FROM (e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))  = EXTRACT(YEAR FROM NOW() AT TIME ZONE 'America/Sao_Paulo')
            ),
            grupos AS (
                SELECT
                    criado_em,
                    SUM(
                        CASE WHEN evento_anterior IS NULL
                            OR criado_em - evento_anterior > INTERVAL '5 minutes'
                        THEN 1 ELSE 0 END
                    ) OVER (ORDER BY criado_em) AS episodio_id
                FROM eventos_ordenados
            )
            SELECT COUNT(DISTINCT episodio_id) AS total FROM grupos`,
            [usuarioId]
        );

        const alertasMesAnterior = await db.query(
            `WITH eventos_ordenados AS (
                SELECT
                    e.criado_em,
                    LAG(e.criado_em) OVER (ORDER BY e.criado_em) AS evento_anterior
                FROM eventos_bixuco e
                JOIN criancas c ON c.id = e.crianca_id
                WHERE c.usuario_id = $1
                AND EXTRACT(MONTH FROM (e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month')
                AND EXTRACT(YEAR FROM (e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))  = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')
            ),
            grupos AS (
                SELECT
                    criado_em,
                    SUM(
                        CASE WHEN evento_anterior IS NULL
                            OR criado_em - evento_anterior > INTERVAL '5 minutes'
                        THEN 1 ELSE 0 END
                    ) OVER (ORDER BY criado_em) AS episodio_id
                FROM eventos_ordenados
            )
            SELECT COUNT(DISTINCT episodio_id) AS total FROM grupos`,
            [usuarioId]
        );

        const alertasHoje = await db.query(
            `WITH eventos_ordenados AS (
                SELECT
                    e.criado_em,
                    LAG(e.criado_em) OVER (ORDER BY e.criado_em) AS evento_anterior
                FROM eventos_bixuco e
                JOIN criancas c ON c.id = e.crianca_id
                WHERE c.usuario_id = $1
                AND DATE((e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
            ),
            grupos AS (
                SELECT
                    criado_em,
                    SUM(
                        CASE WHEN evento_anterior IS NULL
                            OR criado_em - evento_anterior > INTERVAL '5 minutes'
                        THEN 1 ELSE 0 END
                    ) OVER (ORDER BY criado_em) AS episodio_id
                FROM eventos_ordenados
            )
            SELECT COUNT(DISTINCT episodio_id) AS total FROM grupos`,
            [usuarioId]
        );

        const alertasOntem = await db.query(
            `WITH eventos_ordenados AS (
                SELECT
                    e.criado_em,
                    LAG(e.criado_em) OVER (ORDER BY e.criado_em) AS evento_anterior
                FROM eventos_bixuco e
                JOIN criancas c ON c.id = e.crianca_id
                WHERE c.usuario_id = $1
                AND DATE((e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date - INTERVAL '1 day'
            ),
            grupos AS (
                SELECT
                    criado_em,
                    SUM(
                        CASE WHEN evento_anterior IS NULL
                            OR criado_em - evento_anterior > INTERVAL '5 minutes'
                        THEN 1 ELSE 0 END
                    ) OVER (ORDER BY criado_em) AS episodio_id
                FROM eventos_ordenados
            )
            SELECT COUNT(DISTINCT episodio_id) AS total FROM grupos`,
            [usuarioId]
        );

        const totalHoje  = parseInt(alertasHoje.rows[0].total) || 0;
        const totalOntem = parseInt(alertasOntem.rows[0].total) || 0;
        const diffDiario  = totalHoje - totalOntem;

        const tempoHojeResultado = await db.query(
            `SELECT AVG(e.duracao_ms) AS media_ms
            FROM eventos_bixuco e
            JOIN criancas c ON c.id = e.crianca_id
            WHERE c.usuario_id = $1
            AND e.duracao_ms IS NOT NULL
            AND DATE((e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date`,
            [usuarioId]
        );

        const mediaHojeMs = parseFloat(tempoHojeResultado.rows[0].media_ms) || 0;

        const totalMes         = parseInt(alertasMes.rows[0].total) || 0;
        const totalMesAnterior = parseInt(alertasMesAnterior.rows[0].total) || 0;
        const diffAlertas      = totalMes - totalMesAnterior;

        const comparativoAlertasDiario = diffDiario === 0 ? "igual a ontem" : diffDiario > 0 ? `↑ ${diffDiario} comparado a ontem` : `↓ ${Math.abs(diffDiario)} comparado a ontem`;

        const comparativoAlertas = totalMesAnterior === 0
            ? "registrados este mês"
            : diffAlertas === 0
                ? "igual ao mês passado"
                : diffAlertas > 0
                    ? `↑ ${diffAlertas} comparado ao mês passado`
                    : `↓ ${Math.abs(diffAlertas)} comparado ao mês passado`;

        // =====================
        // GRÁFICO DE BARRAS — ESTRESSE POR DIA (últimos 7 dias)
        // =====================

        const estresseDias = await db.query(
            `SELECT
                dia,
                COALESCE(cnt.total, 0) AS total
            FROM generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            ) AS dia
            LEFT JOIN (
                SELECT DATE(e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') AS dia, COUNT(*) AS total
                FROM eventos_bixuco e
                JOIN criancas c ON c.id = e.crianca_id
                WHERE c.usuario_id = $1
                GROUP BY DATE(e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
            ) cnt USING (dia)
            ORDER BY dia`,
            [usuarioId]
        );

        const diasSemanaPt = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

        const labelsEstresse = estresseDias.rows.map(r => diasSemanaPt[new Date(r.dia).getUTCDay()]);
        const dadosEstresse  = estresseDias.rows.map(r => parseInt(r.total));



        // =====================
        // GRÁFICO — GATILHOS (resposta real do relatório diário, últimos 30 dias)
        // =====================

        const gatilhosRaw = await db.query(
            `SELECT
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements(respostas) AS x
                        WHERE x->>'id' = 'gatilho_principal'
                        AND x->>'resposta' = 'Ambientes barulhentos'
                    )
                ) AS barulho,
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements(respostas) AS x
                        WHERE x->>'id' = 'gatilho_principal'
                        AND x->>'resposta' = 'Locais lotados'
                    )
                ) AS lotados,
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements(respostas) AS x
                        WHERE x->>'id' = 'gatilho_principal'
                        AND x->>'resposta' = 'Mudança de rotina'
                    )
                ) AS rotina,
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements(respostas) AS x
                        WHERE x->>'id' = 'gatilho_principal'
                        AND x->>'resposta' = 'Não identificado'
                    )
                ) AS nao_identificado
            FROM relatorios
            WHERE usuario_id = $1
            AND data >= NOW() - INTERVAL '30 days'`,
            [usuarioId]
        );

        const g = gatilhosRaw.rows[0];

        const barulho         = parseInt(g.barulho)          || 0;
        const lotados         = parseInt(g.lotados)          || 0;
        const rotina          = parseInt(g.rotina)           || 0;
        const naoIdentificado = parseInt(g.nao_identificado) || 0;

        const totalGatilhos = barulho + lotados + rotina + naoIdentificado;

        let graficoGatilhos;

        if (totalGatilhos === 0) {

            graficoGatilhos = {
                labels: ["Sem dados suficientes ainda"],
                dados: [100],
                cores: ["#C2C2C2"]
            };

        } else {

            graficoGatilhos = {
                labels: [
                    "Ambientes barulhentos",
                    "Locais lotados",
                    "Mudança de rotina",
                    "Não identificado"
                ],
                dados: [
                    Math.round((barulho         / totalGatilhos) * 100),
                    Math.round((lotados         / totalGatilhos) * 100),
                    Math.round((rotina          / totalGatilhos) * 100),
                    Math.round((naoIdentificado / totalGatilhos) * 100)
                ],
                cores: ["#32C26D", "#0AB7FB", "#1D8EC9", "#C2C2C2"]
            };

        }

        // =====================
        // GRÁFICO DE LINHA — EVOLUÇÃO (últimos 7 dias)
        // =====================

        // =====================
        // GRÁFICO DE LINHA — EVOLUÇÃO DE CRISES SENSORIAIS (últimos 7 dias)
        // Índice combinado 0-10: 40% quantidade de eventos, 30% duração média,
        // 20% força média (tudo do Bixuco/IoT) + 10% nível percebido no relatório.
        // Normalização é dinâmica (relativa ao pico da própria janela de 7 dias),
        // então funciona mesmo se a pergunta do relatório mudar/sumir no futuro.
        // =====================

        const eventosPorDia = await db.query(
            `SELECT
                dia,
                COALESCE(cnt.total, 0)          AS eventos,
                COALESCE(cnt.duracao_media, 0)  AS duracao_media,
                COALESCE(cnt.forca_media, 0)    AS forca_media
            FROM generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            ) AS dia
            LEFT JOIN (
                SELECT
                    DATE(e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') AS dia,
                    COUNT(*)             AS total,
                    AVG(e.duracao_ms)    AS duracao_media,
                    AVG(e.forca)         AS forca_media
                FROM eventos_bixuco e
                JOIN criancas c ON c.id = e.crianca_id
                WHERE c.usuario_id = $1
                GROUP BY DATE(e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
            ) cnt USING (dia)
            ORDER BY dia`,
            [usuarioId]
        );

        const percebidoPorDia = await db.query(
            `SELECT
                dia,
                (
                    SELECT CASE elem->>'resposta'
                        WHEN 'Nenhuma'      THEN 0
                        WHEN 'Poucas'       THEN 1
                        WHEN 'Algumas'      THEN 2
                        WHEN 'Sim, várias'  THEN 3
                        ELSE NULL
                    END
                    FROM relatorios r
                    CROSS JOIN LATERAL jsonb_array_elements(r.respostas) AS elem
                    WHERE r.usuario_id = $1
                    AND DATE(r.data AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = dia
                    AND elem->>'id' = 'crises_sensoriais'
                    LIMIT 1
                ) AS nivel
            FROM generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            ) AS dia
            ORDER BY dia`,
            [usuarioId]
        );

        // Junta os dois resultados por dia (índices batem pois os generate_series são iguais)
        const diasCombinados = eventosPorDia.rows.map((linha, i) => ({
            dia:           linha.dia,
            eventos:       parseInt(linha.eventos) || 0,
            duracaoMedia:  parseFloat(linha.duracao_media) || 0,
            forcaMedia:    parseFloat(linha.forca_media) || 0,
            percebido:     percebidoPorDia.rows[i]?.nivel ?? null
        }));

        function normalizar(valor, max) {
            if (!max || max <= 0) return 0;
            return Math.min(valor / max, 1);
        }

        const maxEventos  = Math.max(...diasCombinados.map(d => d.eventos), 1);
        const maxDuracao  = Math.max(...diasCombinados.map(d => d.duracaoMedia), 1);
        const maxForca    = Math.max(...diasCombinados.map(d => d.forcaMedia), 1);

        const dadosEvolucao = diasCombinados.map(d => {

            const eventosNorm   = normalizar(d.eventos, maxEventos);
            const duracaoNorm   = normalizar(d.duracaoMedia, maxDuracao);
            const forcaNorm     = normalizar(d.forcaMedia, maxForca);
            const percebidoNorm = d.percebido !== null ? d.percebido / 3 : 0;

            const indice = (
                eventosNorm   * 0.4 +
                duracaoNorm   * 0.3 +
                forcaNorm     * 0.2 +
                percebidoNorm * 0.1
            ) * 10;

            return Math.round(indice * 10) / 10; // 1 casa decimal

        });

        const labelsEvolucao = diasCombinados.map(d => diasSemanaPt[new Date(d.dia).getUTCDay()]);

        // =====================
        // ÚLTIMO RELATÓRIO DIÁRIO
        // =====================

        const ultimoRelatorio = await db.query(
            `SELECT respostas, data
             FROM relatorios
             WHERE usuario_id = $1
             ORDER BY data DESC
             LIMIT 1`,
            [usuarioId]
        );

        let perguntas    = [];
        let dataRelatorio = "Nenhum relatório encontrado.";

        if (ultimoRelatorio.rows.length > 0) {

            const row = ultimoRelatorio.rows[0];

            perguntas = typeof row.respostas === "string"
                ? JSON.parse(row.respostas)
                : row.respostas;

            const data = new Date(row.data);
            dataRelatorio = data.toLocaleDateString("pt-BR", {
                weekday: "long",
                day:     "numeric",
                month:   "long",
                year:    "numeric",
                timeZone: "America/Sao_Paulo"
            });

        }

        // =====================
        // TEMPO DE ESTRESSE (a partir dos eventos reais do Bixuco)
        // =====================

        const tempoMesResultado = await db.query(
            `SELECT AVG(e.duracao_ms) AS media_ms
            FROM eventos_bixuco e
            JOIN criancas c ON c.id = e.crianca_id
            WHERE c.usuario_id = $1
            AND e.duracao_ms IS NOT NULL
            AND EXTRACT(MONTH FROM e.criado_em) = EXTRACT(MONTH FROM NOW())
            AND EXTRACT(YEAR FROM e.criado_em)  = EXTRACT(YEAR FROM NOW())`,
            [usuarioId]
        );

        const tempoMesAnteriorResultado = await db.query(
            `SELECT AVG(e.duracao_ms) AS media_ms
            FROM eventos_bixuco e
            JOIN criancas c ON c.id = e.crianca_id
            WHERE c.usuario_id = $1
            AND e.duracao_ms IS NOT NULL
            AND EXTRACT(MONTH FROM e.criado_em) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month')
            AND EXTRACT(YEAR FROM e.criado_em)  = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')`,
            [usuarioId]
        );

        const mediaMesMs         = parseFloat(tempoMesResultado.rows[0].media_ms) || 0;
        const mediaMesAnteriorMs = parseFloat(tempoMesAnteriorResultado.rows[0].media_ms) || 0;

        function formatarTempo(ms) {
            if (ms < 60000) {
                const segundos = Math.round(ms / 1000);
                return `${segundos} s`;
            }
            const minutos = Math.round(ms / 60000);
            return `${minutos} min`;
        }

        const tempoFormatado    = formatarTempo(mediaMesMs);
        const tempoHojeFormatado = formatarTempo(mediaHojeMs);
        const diffMinutos       = Math.round((mediaMesMs - mediaMesAnteriorMs) / 60000);

        const comparativoTempo = mediaMesAnteriorMs === 0
            ? "por episódio"
            : diffMinutos === 0
                ? "igual ao mês passado"
                : diffMinutos > 0
                    ? `↑ ${diffMinutos} min comparado ao mês passado`
                    : `↓ ${Math.abs(diffMinutos)} min comparado ao mês passado`;

        // =====================
        // RETORNA TUDO
        // =====================

        res.json({

            alertas:             totalMes,
            comparativoAlertas,
            alertasHoje:       totalHoje,
            comparativoAlertasDiario,
            tempo:               tempoFormatado,
            comparativoTempo,
            tempoDiario:         tempoHojeFormatado,

            graficoEstresse: {
                labels: labelsEstresse,
                dados:  dadosEstresse
            },

            graficoGatilhos,

            graficoEvolucao: {
                labels: labelsEvolucao,
                dados:  dadosEvolucao
            },

            dataRelatorio,
            perguntas

        });

    } catch (erro) {

        console.log("Erro na rota /api/relatorios:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });

    }

});



/* ==========================
   CADASTRO FINAL
========================== */

app.post("/cadastro-finalizar", async (req, res) => {

    console.log(req.session.cadastro);

    const dados = req.session.cadastro;


    if (!dados) {
        return res.status(400).json({
            erro: "Sessão expirada. Reinicie o cadastro."
        });
    }

    const { senha, confirmarSenha } = req.body;

    if (senha !== confirmarSenha) {
        return res.status(400).json({
            campo: "confirmarSenha",
            erro: "As senhas não coincidem."
        });
    }

    if (!senha || senha.length < 6) {
        return res.status(400).json({
            campo: "senha",
            erro: "Senha deve possuir pelo menos 6 caracteres."
        });
    }

    try {

        const senhaHash = await bcrypt.hash(senha, 10);

        /* ==========================
           RESPONSÁVEL
        ========================== */

        if (dados.tipo === "pai") {

            if (!cpf.isValid(dados.cpfUser)) {
                return res.status(400).json({
                    campo: "cpf",
                    erro: "CPF inválido."
                });
            }

            console.log("Cadastro-finalizar - email:", dados.email, "| cpf:", dados.cpfUser);

            const existe = await db.query(
                `SELECT id, email, cpf, tipo FROM usuarios
                WHERE email = $1 OR cpf = $2`,
                [dados.email, dados.cpfUser]
            );

            const contaPendente = existe.rows.find(r => r.tipo === 'pendente');
            const contaCompleta = existe.rows.find(r => r.tipo !== 'pendente');

            if (contaCompleta) {
                if (contaCompleta.email === dados.email) {
                    return res.status(409).json({ campo: "email", erro: "Este e-mail já está cadastrado." });
                }
                return res.status(409).json({ campo: "cpf", erro: "Este CPF já está cadastrado." });
            }

            if (contaPendente) {
                // Conta veio do Google e nunca foi completada — assume ela em vez de bloquear
                const atualizado = await db.query(
                    `UPDATE usuarios
                    SET nome=$1, cpf=$2, senha=$3, data_nascimento=$4, tipo='pai', novo_usuario=FALSE
                    WHERE id=$5
                    RETURNING id, tipo`,
                    [dados.nome, dados.cpfUser, senhaHash, dados.dataNascimento, contaPendente.id]
                );

                delete req.session.cadastro;
                req.session.usuarioId = atualizado.rows[0].id;
                req.session.tipo = atualizado.rows[0].tipo;

                // cria assinatura gratuita para conta Google finalizada
                await db.query(
                    `INSERT INTO assinaturas (usuario_id, nome_plano, ativo)
                    VALUES ($1, 'gratuito', true)
                    ON CONFLICT DO NOTHING`,
                    [atualizado.rows[0].id]
                );


                return res.json({ sucesso: true, destino: "/planos" });
            }

            // nenhuma linha encontrada — segue o INSERT normal que já existe

            const novoUsuario = await db.query(
                `INSERT INTO usuarios
                (nome, email, cpf, senha, data_nascimento, tipo)
                VALUES ($1,$2,$3,$4,$5,'pai')
                RETURNING id, tipo`,
                [
                    dados.nome,
                    dados.email,
                    dados.cpfUser,
                    senhaHash,
                    dados.dataNascimento
                ]
            );

            delete req.session.cadastro;

            req.session.usuarioId = novoUsuario.rows[0].id;
            req.session.tipo = novoUsuario.rows[0].tipo;
            
            return res.json({
                sucesso: true,
                destino: "/AdicionarC"
            });

            // cria assinatura gratuita para novo responsável
            await db.query(
                `INSERT INTO assinaturas (usuario_id, nome_plano, ativo)
                VALUES ($1, 'gratuito', true)`,
                [novoUsuario.rows[0].id]
            );


        }

        /* ==========================
           PSICÓLOGO
        ========================== */

        else if (dados.tipo === "psicologo") {

            if (!validarCRP(dados.crp)) {
                return res.status(400).json({
                    campo: "crp",
                    erro: "CRP inválido."
                });
            }

            const existe = await db.query(
                `SELECT id, email, crp, tipo FROM usuarios
                WHERE email = $1 OR crp = $2`,
                [dados.email, dados.crp]
            );

            const contaPendente = existe.rows.find(r => r.tipo === 'pendente');
            const contaCompleta = existe.rows.find(r => r.tipo !== 'pendente');

            if (contaCompleta) {
                if (contaCompleta.email === dados.email) {
                    return res.status(409).json({ campo: "email", erro: "Este e-mail já está cadastrado." });
                }
                return res.status(409).json({ campo: "crp", erro: "Este CRP já está cadastrado." });
            }

                        if (contaPendente) {
                // Conta veio do Google e nunca foi completada — assume ela em vez de bloquear
                const atualizado = await db.query(
                    `UPDATE usuarios
                    SET nome=$1, crp=$2, senha=$3, data_nascimento=$4, tipo='psicologo', novo_usuario=FALSE
                    WHERE id=$5
                    RETURNING id, tipo`,
                    [dados.nome, dados.crp, senhaHash, dados.dataNascimento, contaPendente.id]
                );

                delete req.session.cadastro;
                req.session.usuarioId = atualizado.rows[0].id;
                req.session.tipo = atualizado.rows[0].tipo;

                return res.json({ sucesso: true, destino: "/hometerapeuta" });
            }

            // nenhuma linha encontrada — segue o INSERT normal que já existe

            
            const codigoVinculo = await gerarCodigoVinculo();

            const novoUsuario = await db.query(
                `INSERT INTO usuarios
                (nome, email, crp, senha, data_nascimento, tipo, codigo_vinculo)
                VALUES ($1,$2,$3,$4,$5,'psicologo',$6)
                RETURNING id, tipo`,
                [
                    dados.nome,
                    dados.email,
                    dados.crp,
                    senhaHash,
                    dados.dataNascimento,
                    codigoVinculo
                ]
            );

            delete req.session.cadastro;

            req.session.usuarioId = novoUsuario.rows[0].id;
            req.session.tipo = novoUsuario.rows[0].tipo;

            return res.json({
                sucesso: true,
                destino: "/hometerapeuta"
            });

        }

        else {

            return res.status(400).json({
                erro: "Tipo de usuário inválido."
            });

        }

       

    } catch (erro) {

        console.log("Erro no cadastro-finalizar:", erro);

        return res.status(500).json({
            erro: "Erro interno do servidor. Tente novamente."
        });

    }

});


/* ==========================
   ROTA GET — DADOS DO HOME TERAPEUTA (API)
========================== */

// 🔧 FIX 1: Rota /api/home-terapeuta que o frontend chama
// Retorna nome, foto, contadores, solicitações pendentes e atividade recente
app.get("/api/home-terapeuta", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        // Dados do terapeuta
        const resultadoUsuario = await db.query(
            `SELECT nome, foto_perfil, codigo_vinculo FROM usuarios WHERE id = $1`,
            [usuarioId]
        );

        if (resultadoUsuario.rows.length === 0) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        const terapeuta = resultadoUsuario.rows[0];

        // Total de pacientes vinculados (vínculos ativos)
        const totalPacientes = await db.query(
            `SELECT COUNT(*) AS total
             FROM vinculos
             WHERE terapeuta_id = $1 AND ativo = TRUE`,
            [usuarioId]
        );

        // Total de solicitações pendentes (vínculos aguardando aprovação)
        const totalPendentes = await db.query(
            `SELECT COUNT(*) AS total
             FROM vinculos
             WHERE terapeuta_id = $1 AND ativo = FALSE AND recusado = FALSE`,
            [usuarioId]
        );

        // Relatórios compartilhados hoje
        const relatoriosHoje = await db.query(
            `SELECT COUNT(*) AS total
             FROM relatorios r
             JOIN vinculos v ON v.responsavel_id = r.usuario_id
             WHERE v.terapeuta_id = $1
             AND v.ativo = TRUE
             AND DATE(r.data) = CURRENT_DATE`,
            [usuarioId]
        );

        // Notificações não lidas
        const notificacoesNaoLidas = await db.query(
            `SELECT COUNT(*) AS total
            FROM notificacoes
            WHERE usuario_id = $1 AND lida = FALSE`,
            [usuarioId]
        );

        // Relatórios não vistos (pendentes de visualização)
        const relatoriosPendentes = await db.query(
            `SELECT COUNT(*) AS total
            FROM relatorios r
            JOIN vinculos v ON v.responsavel_id = r.usuario_id
            WHERE v.terapeuta_id = $1
            AND v.ativo = TRUE
            AND r.visto_terapeuta = FALSE`,
            [usuarioId]
        );

        // Solicitações pendentes com dados do responsável e criança
        // Ajuste os nomes das tabelas conforme seu banco
        const solicitacoes = await db.query(
            `SELECT
                v.id,
                u.nome AS nome_responsavel,
                u.foto_perfil,
                c.nome AS nome_crianca,
                EXTRACT(YEAR FROM AGE(c.data_nascimento))::INT AS idade_crianca,
                TO_CHAR(v.criado_em, 'DD/MM/YYYY') AS tempo
             FROM vinculos v
             JOIN usuarios u ON u.id = v.responsavel_id
             LEFT JOIN criancas c ON c.usuario_id = v.responsavel_id
             WHERE v.terapeuta_id = $1
             AND v.ativo = FALSE
             AND v.recusado = FALSE
             ORDER BY v.criado_em DESC
             LIMIT 10`,
            [usuarioId]
        );

        // Atividade recente — últimos relatórios dos pacientes vinculados
        const atividadeRecente = await db.query(
            `SELECT
                r.id,
                c.nome AS nome_crianca,
                u.nome AS nome_responsavel,
                TO_CHAR(r.data, 'DD/MM/YYYY HH24:MI') AS tempo
             FROM relatorios r
             JOIN usuarios u ON u.id = r.usuario_id
             JOIN vinculos v ON v.responsavel_id = r.usuario_id
             LEFT JOIN criancas c ON c.usuario_id = r.usuario_id
             WHERE v.terapeuta_id = $1
             AND v.ativo = TRUE
             ORDER BY r.data DESC
             LIMIT 8`,
            [usuarioId]
        );

        // Alterna entre verde e azul nos ícones da atividade
        const atividades = atividadeRecente.rows.map((item, i) => ({
            id:             item.id,
            nomeCrianca:    item.nome_crianca   || "Criança",
            nomeResponsavel: item.nome_responsavel || "Responsável",
            tempo:          item.tempo,
            cor:            i % 2 === 0 ? "verde" : "azul"
        }));

        res.json({
            nome:             terapeuta.nome,
            fotoPerfil:       terapeuta.foto_perfil || null,
            notificacoes:   parseInt(notificacoesNaoLidas.rows[0].total) || 0,
            totalPacientes: parseInt(totalPacientes.rows[0].total) || 0,
            totalPendentes: parseInt(relatoriosPendentes.rows[0].total) || 0,
            relatoriosHoje: parseInt(relatoriosHoje.rows[0].total) || 0,
            codigoTerapeuta:     terapeuta.codigo_vinculo || null,

            solicitacoes: solicitacoes.rows.map(s => ({
                id:              s.id,
                nomeResponsavel: s.nome_responsavel,
                fotoPerfil:      s.foto_perfil || null,
                nomeCrianca:     s.nome_crianca   || "Criança",
                idadeCrianca:    s.idade_crianca  || 0,
                tempo:           s.tempo
            })),

            atividadeRecente: atividades
        });

    } catch (erro) {

        console.log("Erro na rota /api/homeTerapeuta:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });

    }

});

/* ==========================
   ROTA POST — RESPONDER SOLICITAÇÃO DE VÍNCULO
========================== */

// 🔧 FIX 2: Rota /api/vinculos/responder que o frontend chama
// ao clicar em Aceitar ou Recusar nas solicitações pendentes
app.post("/api/vinculos/responder", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const { vinculoId, acao } = req.body;

        if (!vinculoId || !["aceitar", "recusar"].includes(acao)) {
            return res.status(400).json({ erro: "Dados inválidos." });
        }

        // Verifica se o vínculo pertence a esse terapeuta
        const vinculo = await db.query(
            `SELECT id FROM vinculos
             WHERE id = $1 AND terapeuta_id = $2 AND ativo = FALSE`,
            [vinculoId, usuarioId]
        );

        if (vinculo.rows.length === 0) {
            return res.status(404).json({ erro: "Solicitação não encontrada." });
        }

        if (acao === "aceitar") {

            // Ativa o vínculo
            await db.query(
                `UPDATE vinculos SET ativo = TRUE WHERE id = $1`,
                [vinculoId]
            );

        } else {

            // Marca como recusado — não deleta para manter histórico
            await db.query(
                `UPDATE vinculos SET recusado = TRUE WHERE id = $1`,
                [vinculoId]
            );

        }

        return res.status(200).json({
            mensagem: acao === "aceitar"
                ? "Vínculo aceito com sucesso."
                : "Solicitação recusada."
        });

    } catch (erro) {

        console.log("Erro ao responder vínculo:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });

    }

});

// ─────────────────────────────────────────
// VINCULAR TERAPEUTA — enviar pedido
// ─────────────────────────────────────────
app.post("/api/vinculos/solicitar", estaLogado, verificarPlano, exigePremium, async (req, res) => {
    const { codigoTerapeuta } = req.body;
    const responsavelId = req.session.usuarioId || req.session.userId || req.session.usuario?.id || (req.user && req.user.id);
    

    if (!responsavelId) {
        return res.status(401).json({ erro: "Não autenticado." });
    }

    try {
        const terapeuta = await db.query(
            "SELECT id, nome FROM usuarios WHERE codigo_vinculo = $1 AND tipo = 'psicologo'",
            [codigoTerapeuta]
        );

        if (terapeuta.rows.length === 0)
            return res.status(404).json({ erro: "Terapeuta não encontrado. Verifique o código." });

        const terapeutaId = terapeuta.rows[0].id;

        const existente = await db.query(
            "SELECT id, ativo, recusado FROM vinculos WHERE responsavel_id = $1 AND terapeuta_id = $2",
            [responsavelId, terapeutaId]
        );

        if (existente.rows.length > 0) {
            const v = existente.rows[0];
            if (v.ativo)   return res.status(400).json({ erro: "Você já está vinculado a este terapeuta." });
            if (!v.ativo && !v.recusado) return res.status(400).json({ erro: "Já existe um pedido pendente." });

            // se foi recusado ou cancelado, reabre o pedido
            await db.query(
                "UPDATE vinculos SET ativo = false, recusado = false WHERE id = $1",
                [v.id]
            );
        } else {
            // insere o vínculo
            await db.query(
                "INSERT INTO vinculos (responsavel_id, terapeuta_id, ativo, recusado) VALUES ($1, $2, false, false)",
                [responsavelId, terapeutaId]
            );

            // notifica o terapeuta — comando separado
            await db.query(
                `INSERT INTO notificacoes (usuario_id, tipo, mensagem, lida)
                VALUES ($1, 'pedido_vinculo', $2, FALSE)`,
                [terapeutaId, `Você recebeu um pedido de vínculo de um novo responsável.`]
            );
        }


        res.json({ sucesso: true, nomeTerapeuta: terapeuta.rows[0].nome });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro interno ao enviar pedido." });
    }
});


// ─────────────────────────────────────────
// CANCELAR PEDIDO PENDENTE
// ─────────────────────────────────────────
app.post("/api/vinculos/cancelar", estaLogado, verificarPlano, exigePremium, async (req, res) => {
    const responsavelId = req.session.usuarioId || req.session.userId || req.session.usuario?.id || (req.user && req.user.id);

    if (!responsavelId) {
        return res.status(401).json({ erro: "Não autenticado." });
    }

    try {
        await db.query(
            "DELETE FROM vinculos WHERE responsavel_id = $1 AND ativo = false AND recusado = false",
            [responsavelId]
        );
        res.json({ sucesso: true });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro interno ao cancelar pedido." });
    }
});


// ─────────────────────────────────────────
// REMOVER TERAPEUTA VINCULADO
// ─────────────────────────────────────────
app.post("/api/vinculos/remover", estaLogado, estaLogado, verificarPlano, exigePremium, async (req, res) => {
    const responsavelId = req.session.usuarioId || req.session.userId || req.session.usuario?.id || (req.user && req.user.id);

    if (!responsavelId) {
        return res.status(401).json({ erro: "Não autenticado." });
    }

    try {
        // Usa ativo = FALSE em vez de DELETE para manter histórico do vínculo
        const resultado = await db.query(
            `UPDATE vinculos SET ativo = FALSE WHERE responsavel_id = $1 AND ativo = TRUE`,
            [responsavelId]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ erro: "Nenhum terapeuta vinculado encontrado." });
        }

        res.json({ sucesso: true });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro interno ao remover terapeuta." });
    }
});


// ─────────────────────────────────────────
// BUSCAR STATUS DO VÍNCULO ATUAL
// ─────────────────────────────────────────
app.get("/api/vinculos/status", estaLogado, async (req, res) => {
    const responsavelId = req.session.usuarioId || req.session.userId || req.session.usuario?.id || (req.user && req.user.id);

    if (!responsavelId) {
        return res.status(401).json({ erro: "Não autenticado." });
    }

    try {
        const resultado = await db.query(
            `SELECT v.id, v.ativo, v.recusado,
                    u.nome        AS nome_terapeuta,
                    u.crp         AS crp_terapeuta,
                    u.foto_perfil AS foto_terapeuta
             FROM vinculos v
             JOIN usuarios u ON u.id = v.terapeuta_id
             WHERE v.responsavel_id = $1
             ORDER BY v.criado_em DESC
             LIMIT 1`,
            [responsavelId]
        );

        if (resultado.rows.length === 0)
            return res.json({ status: "sem_vinculo" });

        const v = resultado.rows[0];

        let status;
        if (v.ativo)        status = "aceito";
        else if (v.recusado) status = "recusado";
        else                 status = "pendente";

        res.json({
            status,
            nomeTerapeuta: v.nome_terapeuta,
            crpTerapeuta:  v.crp_terapeuta,
            fotoTerapeuta: v.foto_terapeuta
        });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});

/* ==========================
   LOGIN
========================== */

// 🔧 FIX: Rota de login atualizada para aceitar tanto JSON (fetch) quanto form (fallback)
// O frontend agora envia via fetch com Content-Type: application/json
// então req.body.email e req.body.senha chegam pelo express.json() middleware

app.post('/login', async (req, res) => {

    const { email, senha } = req.body;

    try {

        const sql = `
            SELECT *
            FROM usuarios
            WHERE email = $1
        `;

        const resultado = await db.query(sql, [email]);

        if (resultado.rows.length === 0) {
            // 🔧 Retorna JSON com status 401 — o frontend exibe na tela
            return res.status(401).json({ erro: "Usuário não encontrado." });
        }

        const usuario = resultado.rows[0];

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaValida) {
            return res.status(401).json({ erro: "Senha incorreta." });
        }

        // Salva o id E o tipo do usuário na sessão
        req.session.usuarioId = usuario.id;
        req.session.tipo = usuario.tipo;

        // Redireciona conforme o tipo da conta
        if (usuario.tipo === "psicologo") {
            return res.redirect("/homeTerapeuta");
        }
        return res.redirect("/home");

    } catch (erro) {

        console.log(erro);
        res.status(500).json({ erro: "Erro no servidor. Tente novamente." });

    }

});

/* ==================================================
   ROTAS DO PERFIL — adicione no seu server.js
   ================================================== */

/* ==========================
   ROTA GET — PÁGINA DO PERFIL
========================== */

// 🔧 FIX 7: Rota GET /perfil que não existia no server.js
app.get("/perfil", estaLogado, precisaPlano("Médio"), (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "perfil.html"));

});

/* ==================================================
   ROTAS DE CONFIGURAÇÕES — adicione no seu server.js
   ================================================== */

/* ==========================
   ROTA GET — PÁGINA DE CONFIGURAÇÕES
========================== */

// 🔧 Rota GET /configuracoes que não existia no server.js
app.get("/configuracoes", estaLogado, precisaPlano("Médio"), (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "configuracoes.html"));

});

/* ==========================
   ROTA POST — SALVAR NOTIFICAÇÕES
========================== */

// 🔧 FIX 2: Rota /api/configuracoes/notificacoes que o frontend chamava
// mas nunca existiu no server.js
app.post("/api/configuracoes/notificacoes", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const { lembrete, novidades } = req.body;

        // Atualiza as preferências de notificação do usuário
        // Ajuste o nome da tabela/colunas conforme o seu banco
        // Se não tiver tabela de preferências ainda, crie:
        // CREATE TABLE preferencias_usuario (
        //     usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id),
        //     notif_lembrete BOOLEAN DEFAULT TRUE,
        //     notif_novidades BOOLEAN DEFAULT FALSE
        // );

        if (lembrete !== undefined) {

            await db.query(
                `INSERT INTO preferencias_usuario (usuario_id, notif_lembrete)
                 VALUES ($1, $2)
                 ON CONFLICT (usuario_id)
                 DO UPDATE SET notif_lembrete = $2`,
                [usuarioId, lembrete]
            );

        }

        if (novidades !== undefined) {

            await db.query(
                `INSERT INTO preferencias_usuario (usuario_id, notif_novidades)
                 VALUES ($1, $2)
                 ON CONFLICT (usuario_id)
                 DO UPDATE SET notif_novidades = $2`,
                [usuarioId, novidades]
            );

        }

        return res.status(200).json({ mensagem: "Preferências salvas." });

    } catch (erro) {

        console.log("Erro ao salvar notificações:", erro);
        res.status(500).json({ erro: "Erro interno ao salvar preferências." });

    }

});




/* ==========================
   ROTA POST — SALVAR RELATÓRIO DIÁRIO
========================== */

app.post("/api/relatorio", estaLogado,precisaPlano("Médio"), async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const { respostas, data } = req.body;

        if (!respostas || !Array.isArray(respostas) || respostas.length === 0) {
            return res.status(400).json({ erro: "Respostas inválidas." });
        }

        // Impede mais de um relatório por dia
        const jaTemHoje = await db.query(
            `SELECT id FROM relatorios
             WHERE usuario_id = $1
             AND DATE(data) = CURRENT_DATE`,
            [usuarioId]
        );

        if (jaTemHoje.rows.length > 0) {
            return res.status(409).json({
                erro: "Você já preencheu o relatório de hoje. Volte amanhã!"
            });
        }

        // Salva o relatório
        await db.query(
            `INSERT INTO relatorios
            (usuario_id, respostas, data)
            VALUES ($1, $2, $3)`,
            [
                usuarioId,
                JSON.stringify(respostas),
                data || new Date().toISOString()
            ]
        );

        // Cria a notificação de sucesso
        await db.query(
            `INSERT INTO notificacoes (usuario_id, tipo, mensagem, lida)
             VALUES ($1, 'relatorio_concluido', $2, FALSE)`,
            [usuarioId, "Você acabou de finalizar um relatório. Parabéns! 🎉"]
        );

        // busca o terapeuta vinculado ao responsável
        const terapeutaVinculado = await db.query(
            `SELECT u.id, u.nome
            FROM vinculos v
            JOIN usuarios u ON u.id = v.terapeuta_id
            WHERE v.responsavel_id = $1 AND v.ativo = TRUE
            LIMIT 1`,
            [usuarioId]
        );

        // se tiver terapeuta vinculado, notifica ele também
        if (terapeutaVinculado.rows.length > 0) {
            const terapeuta = terapeutaVinculado.rows[0];

            // busca o nome da criança do responsável
            const crianca = await db.query(
                `SELECT nome FROM criancas WHERE usuario_id = $1 LIMIT 1`,
                [usuarioId]
            );

            const nomeCrianca = crianca.rows[0]?.nome || "A criança";

            await db.query(
                `INSERT INTO notificacoes (usuario_id, tipo, mensagem, lida)
                VALUES ($1, 'relatorio_finalizado', $2, FALSE)`,
                [terapeuta.id, `${nomeCrianca} acabou de finalizar um relatório. Clique para ver.`]
            );

        }

        return res.status(201).json({ mensagem: "Relatório salvo com sucesso." });

    } catch (erro) {

        console.log("Erro ao salvar relatório:", erro);
        res.status(500).json({ erro: "Erro interno ao salvar relatório." });

    }

});


app.post("/api/relatorios/:id/marcar-visto", estaLogado, async (req, res) => {
    const usuarioId   = req.session.usuarioId || (req.user && req.user.id);
    const relatorioId = req.params.id;

    try {
        await db.query(
            `UPDATE relatorios SET visto_terapeuta = TRUE
             WHERE id = $1
             AND usuario_id IN (
                 SELECT responsavel_id FROM vinculos
                 WHERE terapeuta_id = $2 AND ativo = TRUE
             )`,
            [relatorioId, usuarioId]
        );
        res.json({ sucesso: true });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});


/* ==========================
   ROTA DELETE — EXCLUIR CONTA
========================== */

// 🔧 FIX 3: Rota /api/excluir-conta que o frontend chamava
// mas nunca existiu no server.js
app.delete("/api/excluir-conta", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        // A ordem importa por causa das chaves estrangeiras (foreign keys).
        // Sempre apaga primeiro quem "aponta para" o usuário/criança,
        // e só no final apaga o próprio usuário.

        // 🔧 Perfil sensorial referencia tanto usuario_id quanto crianca_id —
        // precisa ser apagado antes da tabela criancas
        await db.query(
            "DELETE FROM perfil_sensorial WHERE usuario_id = $1",
            [usuarioId]
        );

        // Remove relatórios
        await db.query(
            "DELETE FROM relatorios WHERE usuario_id = $1",
            [usuarioId]
        );

        // Remove vínculos com terapeutas
        await db.query(
            "DELETE FROM vinculos WHERE responsavel_id = $1 OR terapeuta_id = $1",
            [usuarioId]
        );

        // Remove tokens de recuperação de senha
        await db.query(
            "DELETE FROM tokens_recuperacao WHERE usuario_id = $1",
            [usuarioId]
        );

        // Remove preferências
        await db.query(
            "DELETE FROM preferencias_usuario WHERE usuario_id = $1",
            [usuarioId]
        );

        // 🔧 Remove notificações
        await db.query(
            "DELETE FROM notificacoes WHERE usuario_id = $1",
            [usuarioId]
        );

        // 🔧 Remove assinaturas
        await db.query(
            "DELETE FROM assinaturas WHERE usuario_id = $1",
            [usuarioId]
        );

        // 🔧 Remove a criança vinculada — precisa vir depois de perfil_sensorial,
        // e antes do usuário
        await db.query(
            "DELETE FROM criancas WHERE usuario_id = $1",
            [usuarioId]
        );

        // Remove o usuário em si — por último, já que ninguém mais aponta pra ele agora
        await db.query(
            "DELETE FROM usuarios WHERE id = $1",
            [usuarioId]
        );

        // Encerra a sessão após excluir a conta
        req.session.destroy((err) => {
            if (err) console.log("Erro ao destruir sessão:", err);
        });

        return res.status(200).json({ mensagem: "Conta excluída com sucesso." });

    } catch (erro) {

        console.log("Erro ao excluir conta:", erro);
        res.status(500).json({ erro: "Erro interno ao excluir conta." });

    }

});


/* ==========================
   ROTA GET — DADOS DO PERFIL (API)
========================== */

// 🔧 FIX 1: Rota /api/perfil que o frontend chamava como /dados-usuario
// Retorna todos os dados necessários para montar a página de perfil
app.get("/api/perfil", estaLogado, async (req, res) => {
    

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        // Busca os dados do usuário
        const resultadoUsuario = await db.query(
            `SELECT id, nome, email, tipo, foto_perfil,
                    EXTRACT(YEAR FROM criado_em) AS ano_cadastro
             FROM usuarios
             WHERE id = $1`,
            [usuarioId]
        );

        if (resultadoUsuario.rows.length === 0) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        const usuario = resultadoUsuario.rows[0];

        // Busca a criança vinculada ao responsável
        // Ajuste o nome da tabela conforme o seu banco
        const resultadoCrianca = await db.query(
            `SELECT nome, data_nascimento, foto_url
             FROM criancas
             WHERE usuario_id = $1
             LIMIT 1`,
            [usuarioId]
        );

        // Calcula a idade da criança a partir da data de nascimento
        let criancaDados = null;

        if (resultadoCrianca.rows.length > 0) {

            const crianca = resultadoCrianca.rows[0];

            const nascimento = new Date(crianca.data_nascimento);
            const hoje = new Date();
            const idade = hoje.getFullYear() - nascimento.getFullYear();

            criancaDados = {
                nome: crianca.nome,
                idade,
                foto: crianca.foto_url || null
            };

        }

        // Busca o terapeuta vinculado ao responsável
        // Ajuste o nome das tabelas conforme o seu banco
        const resultadoTerapeuta = await db.query(
            `SELECT u.nome, u.crp
             FROM vinculos v
             JOIN usuarios u ON u.id = v.terapeuta_id
             WHERE v.responsavel_id = $1
             AND v.ativo = TRUE
             LIMIT 1`,
            [usuarioId]
        );

        let terapeutaDados = null;

        if (resultadoTerapeuta.rows.length > 0) {
            terapeutaDados = resultadoTerapeuta.rows[0];
        }

        // Busca o plano ativo do usuário
        // Ajuste o nome da tabela conforme o seu banco
        const resultadoPlano = await db.query(
            `SELECT nome_plano
             FROM assinaturas
             WHERE usuario_id = $1
             AND ativo = TRUE
             ORDER BY criado_em DESC
             LIMIT 1`,
            [usuarioId]
        );

        const plano = resultadoPlano.rows.length > 0
            ? resultadoPlano.rows[0].nome_plano
            : "Plano gratuito";

        // Busca dias consecutivos de relatório
        const resultadoDias = await db.query(
            `SELECT COUNT(*) AS total
             FROM relatorios
             WHERE usuario_id = $1
             AND data >= CURRENT_DATE - INTERVAL '30 days'`,
            [usuarioId]
        );

        const tipoConta = usuario.tipo === "pai"
            ? "Responsável"
            : "Terapeuta";

        // Monta e retorna o JSON completo para o frontend
        const diasConsecutivos = parseInt(resultadoDias.rows[0].total) || 0;

        res.json({
            nome: usuario.nome,
            email: usuario.email,   // 🔧 ADICIONAR ESTA LINHA
            tipoConta,
            fotoPerfil: usuario.foto_perfil || null,
            anoCadastro: usuario.ano_cadastro || new Date().getFullYear(),
            diasConsecutivos,
            maiorOfensiva: diasConsecutivos,
            plano,
            crianca: criancaDados,
            terapeuta: terapeutaDados
        });

    } catch (erro) {

        console.log("Erro na rota /api/perfil:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });

    }

});

// 🔧 A remoção de terapeuta agora é feita só por /api/vinculos/remover
// (a rota /api/remover-terapeuta foi removida por ser duplicada e
// usar DELETE em vez de manter o histórico do vínculo)

/* ==========================
   ROTA POST — ATUALIZAR PERFIL (nome e/ou foto)
========================== */

app.post("/api/perfil/atualizar", estaLogado, upload.single("fotoPerfil"), async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const { nome } = req.body;

        // Monta a query dinamicamente — só atualiza os campos que vieram
        const campos = [];
        const valores = [];
        let indice = 1;

        if (nome !== undefined) {

            const nomeLimpo = nome.trim();

            if (nomeLimpo.length < 2) {
                return res.status(400).json({ erro: "Nome inválido.", campo: "nome" });
            }

            campos.push(`nome = $${indice++}`);
            valores.push(nomeLimpo);

        }

        // Se veio uma foto nova, salva no disco (reaproveitando o multer
        // "upload" já configurado com memoryStorage, igual ao adicionar-crianca)
        if (req.file) {
            const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
            campos.push(`foto_perfil = $${indice++}`);
            valores.push(base64);
        }

        if (campos.length === 0) {
            return res.status(400).json({ erro: "Nada para atualizar." });
        }

        valores.push(usuarioId);

        const resultado = await db.query(
            `UPDATE usuarios
             SET ${campos.join(", ")}
             WHERE id = $${indice}
             RETURNING nome, foto_perfil`,
            valores
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        return res.json({
            sucesso: true,
            nome: resultado.rows[0].nome,
            fotoPerfil: resultado.rows[0].foto_perfil
        });

    } catch (erro) {

        console.log("Erro ao atualizar perfil:", erro);
        res.status(500).json({ erro: "Erro interno ao salvar perfil." });

    }

});

/* ==================================================
   ROTA DO SOBRE — adicione no seu server.js
   ================================================== */

// 🔧 Rota GET /sobre que não existia no server.js
// Protegida com estaLogado para manter padrão das outras páginas
app.get("/sobre", estaLogado, precisaPlano("Médio"), (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "sobre.html"));

});


/* ==========================
   LOGOUT
========================== */

// 🔧 FIX 6: Rota de logout que antes não existia
// O HTML tinha <a href="/logout"> mas a rota nunca foi criada
app.get('/logout', (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            console.log("Erro ao encerrar sessão:", err);
        }

        res.redirect("/logar");

    });

});

/* ==========================
   API — DADOS DA HOME
========================== */

// 🔧 FIX 7: Rota /api/home que o frontend chamava mas não existia no backend
// Retorna os dados do usuário logado para preencher a página home
app.get('/api/home', estaLogado, async (req, res) => {

    try {

        // Pega o id do usuário logado — pode vir do Passport (Google) ou do login manual
        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const resultado = await db.query(

            `SELECT id, nome, email, tipo, foto_perfil
             FROM usuarios
             WHERE id = $1`,

            [usuarioId]

        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        const usuario = resultado.rows[0];

        // Busca quantos dias consecutivos o usuário preencheu relatório
        // Ajuste a query conforme sua tabela de relatórios
        // Calcula a sequencia REAL de dias consecutivos (nao apenas o total de relatorios)
        // Agrupa dias seguidos em "ilhas" e pega a mais recente, so contando como
        // sequencia ativa se o ultimo dia registrado foi hoje ou ontem
        const sequencia = await db.query(

            `WITH dias AS (
                SELECT DISTINCT DATE(data AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') AS dia
                FROM relatorios
                WHERE usuario_id = $1
            ),
            ilhas AS (
                SELECT dia,
                    dia - (ROW_NUMBER() OVER (ORDER BY dia))::int AS grupo
                FROM dias
            ),
            ultima_ilha AS (
                SELECT MAX(dia) AS fim, COUNT(*) AS tamanho
                FROM ilhas
                GROUP BY grupo
                ORDER BY MAX(dia) DESC
                LIMIT 1
            )
            SELECT
                CASE
                    WHEN fim >= (NOW() AT TIME ZONE 'America/Sao_Paulo')::date - INTERVAL '1 day' THEN tamanho
                    ELSE 0
                END AS total
            FROM ultima_ilha`,

            [usuarioId]

        );

        // Busca quantas notificações não lidas o usuário tem
        // Ajuste conforme sua tabela de notificações
        let totalNotificacoes = 0;
        try {
            const notificacoes = await db.query(
                `SELECT COUNT(*) AS total
                FROM notificacoes
                WHERE usuario_id = $1
                AND lida = false`,
                [usuarioId]
            );
            totalNotificacoes = parseInt(notificacoes.rows[0].total) || 0;
        } catch (_) {
            // Tabela notificacoes ainda não existe — retorna 0 sem quebrar a home
        }

        // Monta o tipo de conta para exibir na tela
        const tipoConta = usuario.tipo === "pai"
            ? "Responsável"
            : "Terapeuta";

        res.json({
            nome: usuario.nome,
            tipoConta,
            fotoPerfil: usuario.foto_perfil || null,
            notificacoes: totalNotificacoes,
            diasConsecutivos: sequencia.rows.length > 0 ? (parseInt(sequencia.rows[0].total) || 0) : 0,
            nomeBixuco: "Bixuco" // futuramente buscar da tabela de dispositivos vinculados
        });

    } catch (erro) {

        console.log("Erro na rota /api/home:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });

    }

});

/* ==========================
   API — NOTIFICAÇÕES
========================== */

// Lista as notificações do usuário logado, mais recentes primeiro
app.get("/api/notificacoes", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const resultado = await db.query(
            `SELECT id, tipo, mensagem, lida,
                    TO_CHAR(criado_em, 'DD/MM/YYYY HH24:MI') AS tempo
             FROM notificacoes
             WHERE usuario_id = $1
             ORDER BY criado_em DESC
             LIMIT 20`,
            [usuarioId]
        );

        res.json({ notificacoes: resultado.rows });

    } catch (erro) {

        console.log("Erro ao buscar notificações:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });

    }

});

// Marca todas as notificações do usuário como lidas
// Chamada quando o usuário abre o painel de notificações
app.post("/api/notificacoes/marcar-lidas", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        await db.query(
            `UPDATE notificacoes SET lida = TRUE WHERE usuario_id = $1 AND lida = FALSE`,
            [usuarioId]
        );

        res.status(200).json({ mensagem: "Notificações marcadas como lidas." });

    } catch (erro) {

        console.log("Erro ao marcar notificações como lidas:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });

    }

});

/* ==========================
   API — DIAS COM RELATÓRIO (CALENDÁRIO)
========================== */

// 🔧 FIX 8: Rota para o calendário saber quais dias tiveram relatório
// O frontend pode chamar /api/relatorios/dias?mes=6&ano=2026
// e marcar os círculos verdes nos dias corretos
app.get('/api/relatorios/dias', estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        const mes = parseInt(req.query.mes) || new Date().getMonth() + 1;
        const ano = parseInt(req.query.ano) || new Date().getFullYear();

        const resultado = await db.query(

            `SELECT EXTRACT(DAY FROM (data AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) AS dia
            FROM relatorios
            WHERE usuario_id = $1
            AND EXTRACT(MONTH FROM (data AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) = $2
            AND EXTRACT(YEAR FROM (data AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) = $3`,

            [usuarioId, mes, ano]

        );

        // Retorna um array com os números dos dias que têm relatório
        // Ex: [1, 4, 7, 8, 11] → frontend pinta esses dias de verde
        const diasComRelatorio = resultado.rows.map(r => parseInt(r.dia));

        res.json({ dias: diasComRelatorio });

    } catch (erro) {

        console.log("Erro na rota /api/relatorios/dias:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });

    }

});

/* ==========================
   LISTAR USUÁRIOS
========================== */

// 🔒 FIX 9: Rota protegida — antes qualquer pessoa podia acessar /usuarios
// e ver todos os cadastros sem estar logada
app.get('/usuarios', estaLogado, async (req, res) => {

    try {

        const resultado = await db.query(`
            SELECT id, nome, email, tipo, data_nascimento, cidade, estado
            FROM usuarios
            ORDER BY id ASC
        `);

        // Retornando só os campos necessários, sem senha nem dados sensíveis
        res.json(resultado.rows);

    } catch (erro) {

        console.log(erro);
        res.status(500).json({ erro: "Erro ao buscar usuários." });

    }

});



// ─────────────────────────────────────────
// LISTA DE PACIENTES COM ÚLTIMO RELATÓRIO
// usada pela tela de seleção de relatórios do terapeuta
// ─────────────────────────────────────────
app.get("/api/pacientes-relatorios", estaLogado, async (req, res) => {
    const usuarioId = req.session.usuarioId || (req.user && req.user.id);

    try {
        const resultado = await db.query(
            `SELECT
                u.id              AS responsavel_id,
                u.nome            AS nome_responsavel,
                c.nome            AS nome_crianca,
                c.foto_url        AS foto_crianca,
                MAX(r.data)       AS ultimo_relatorio
             FROM vinculos v
             JOIN usuarios u ON u.id = v.responsavel_id
             LEFT JOIN criancas c ON c.usuario_id = v.responsavel_id
             LEFT JOIN relatorios r ON r.usuario_id = v.responsavel_id
             WHERE v.terapeuta_id = $1
               AND v.ativo = TRUE
             GROUP BY u.id, u.nome, c.nome, c.foto_url
             ORDER BY MAX(r.data) DESC NULLS LAST`,
            [usuarioId]
        );

        const pacientes = resultado.rows.map(p => ({
            responsavelId:   p.responsavel_id,
            nomeResponsavel: p.nome_responsavel,
            nomeCrianca:     p.nome_crianca     || "Criança",
            fotoCrianca:     p.foto_crianca     || null,
            ultimoRelatorio: p.ultimo_relatorio || null
        }));

        res.json({ pacientes });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});


app.get("/api/relatorio-paciente", estaLogado, async (req, res) => {

    try {

        const terapeutaId = req.session.usuarioId || (req.user && req.user.id);
        const pacienteId  = parseInt(req.query.paciente);

        if (!terapeutaId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        if (!pacienteId) {
            return res.status(400).json({ erro: "ID do paciente inválido." });
        }

        const vinculo = await db.query(
            `SELECT id FROM vinculos
             WHERE terapeuta_id = $1 AND responsavel_id = $2 AND ativo = TRUE`,
            [terapeutaId, pacienteId]
        );

        if (vinculo.rows.length === 0) {
            return res.status(403).json({ erro: "Você não tem vínculo com esse paciente." });
        }

        const crianca = await db.query(
            `SELECT c.nome FROM criancas c WHERE c.usuario_id = $1 LIMIT 1`,
            [pacienteId]
        );

        const nomePaciente = crianca.rows[0]?.nome || "Paciente";

        function formatarTempo(ms) {
            if (ms < 60000) return `${Math.round(ms / 1000)} s`;
            return `${Math.round(ms / 60000)} min`;
        }

        // =====================
        // ALERTAS DO MÊS (eventos reais do Bixuco)
        // =====================

        const alertasMes = await db.query(
            `WITH eventos_ordenados AS (
                SELECT
                    e.criado_em,
                    LAG(e.criado_em) OVER (ORDER BY e.criado_em) AS evento_anterior
                FROM eventos_bixuco e
                JOIN criancas c ON c.id = e.crianca_id
                WHERE c.usuario_id = $1
                AND EXTRACT(MONTH FROM e.criado_em) = EXTRACT(MONTH FROM NOW())
                AND EXTRACT(YEAR FROM e.criado_em)  = EXTRACT(YEAR FROM NOW())
            ),
            grupos AS (
                SELECT
                    criado_em,
                    SUM(
                        CASE WHEN evento_anterior IS NULL
                            OR criado_em - evento_anterior > INTERVAL '5 minutes'
                        THEN 1 ELSE 0 END
                    ) OVER (ORDER BY criado_em) AS episodio_id
                FROM eventos_ordenados
            )
            SELECT COUNT(DISTINCT episodio_id) AS total FROM grupos`,
            [pacienteId]
        );

        const alertasMesAnterior = await db.query(
            `WITH eventos_ordenados AS (
                SELECT
                    e.criado_em,
                    LAG(e.criado_em) OVER (ORDER BY e.criado_em) AS evento_anterior
                FROM eventos_bixuco e
                JOIN criancas c ON c.id = e.crianca_id
                WHERE c.usuario_id = $1
                AND EXTRACT(MONTH FROM e.criado_em) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month')
                AND EXTRACT(YEAR FROM e.criado_em)  = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')
            ),
            grupos AS (
                SELECT
                    criado_em,
                    SUM(
                        CASE WHEN evento_anterior IS NULL
                            OR criado_em - evento_anterior > INTERVAL '5 minutes'
                        THEN 1 ELSE 0 END
                    ) OVER (ORDER BY criado_em) AS episodio_id
                FROM eventos_ordenados
            )
            SELECT COUNT(DISTINCT episodio_id) AS total FROM grupos`,
            [pacienteId]
        );

        const totalMes         = parseInt(alertasMes.rows[0].total) || 0;
        const totalMesAnterior = parseInt(alertasMesAnterior.rows[0].total) || 0;
        const diffAlertas      = totalMes - totalMesAnterior;

        const comparativoAlertas = totalMesAnterior === 0
            ? "registrados este mês"
            : diffAlertas === 0
                ? "igual ao mês passado"
                : diffAlertas > 0
                    ? `↑ ${diffAlertas} comparado ao mês passado`
                    : `↓ ${Math.abs(diffAlertas)} comparado ao mês passado`;

        // =====================
        // TEMPO DE ESTRESSE DO MÊS
        // =====================

        const tempoMes = await db.query(
            `SELECT AVG(e.duracao_ms) AS media_ms
             FROM eventos_bixuco e
             JOIN criancas c ON c.id = e.crianca_id
             WHERE c.usuario_id = $1
             AND e.duracao_ms IS NOT NULL
             AND EXTRACT(MONTH FROM e.criado_em) = EXTRACT(MONTH FROM NOW())
             AND EXTRACT(YEAR FROM e.criado_em)  = EXTRACT(YEAR FROM NOW())`,
            [pacienteId]
        );

        const tempoMesAnterior = await db.query(
            `SELECT AVG(e.duracao_ms) AS media_ms
             FROM eventos_bixuco e
             JOIN criancas c ON c.id = e.crianca_id
             WHERE c.usuario_id = $1
             AND e.duracao_ms IS NOT NULL
             AND EXTRACT(MONTH FROM e.criado_em) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month')
             AND EXTRACT(YEAR FROM e.criado_em)  = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')`,
            [pacienteId]
        );

        const mediaMesMs         = parseFloat(tempoMes.rows[0].media_ms) || 0;
        const mediaMesAnteriorMs = parseFloat(tempoMesAnterior.rows[0].media_ms) || 0;
        const diffMinutos        = Math.round((mediaMesMs - mediaMesAnteriorMs) / 60000);

        const comparativoTempo = mediaMesAnteriorMs === 0
            ? "por episódio"
            : diffMinutos === 0
                ? "igual ao mês passado"
                : diffMinutos > 0
                    ? `↑ ${diffMinutos} min comparado ao mês passado`
                    : `↓ ${Math.abs(diffMinutos)} min comparado ao mês passado`;



        const estresseDias = await db.query(
            `SELECT
                dia,
                COALESCE(cnt.total, 0) AS total
            FROM generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            ) AS dia
            LEFT JOIN (
                SELECT DATE(e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') AS dia, COUNT(*) AS total
                FROM eventos_bixuco e
                JOIN criancas c ON c.id = e.crianca_id
                WHERE c.usuario_id = $1
                GROUP BY DATE(e.criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
            ) cnt USING (dia)
            ORDER BY dia`,
            [pacienteId]
        );

        const diasSemanaPt = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

        const labelsEstresse = estresseDias.rows.map(r => diasSemanaPt[new Date(r.dia).getUTCDay()]);
        const dadosEstresse  = estresseDias.rows.map(r => parseInt(r.total));

        // =====================
        // GRÁFICO — GATILHOS (resposta real do relatório diário, últimos 30 dias)
        // =====================

        const gatilhosRaw = await db.query(
            `SELECT
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements(respostas) AS x
                        WHERE x->>'id' = 'gatilho_principal'
                        AND x->>'resposta' = 'Ambientes barulhentos'
                    )
                ) AS barulho,
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements(respostas) AS x
                        WHERE x->>'id' = 'gatilho_principal'
                        AND x->>'resposta' = 'Locais lotados'
                    )
                ) AS lotados,
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements(respostas) AS x
                        WHERE x->>'id' = 'gatilho_principal'
                        AND x->>'resposta' = 'Mudança de rotina'
                    )
                ) AS rotina,
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements(respostas) AS x
                        WHERE x->>'id' = 'gatilho_principal'
                        AND x->>'resposta' = 'Não identificado'
                    )
                ) AS nao_identificado
             FROM relatorios
             WHERE usuario_id = $1
             AND data >= NOW() - INTERVAL '30 days'`,
            [pacienteId]
        );

        const g = gatilhosRaw.rows[0];

        const barulho         = parseInt(g.barulho)          || 0;
        const lotados         = parseInt(g.lotados)          || 0;
        const rotina          = parseInt(g.rotina)           || 0;
        const naoIdentificado = parseInt(g.nao_identificado) || 0;

        const totalGatilhos = barulho + lotados + rotina + naoIdentificado;

        let graficoGatilhos;

        if (totalGatilhos === 0) {

            graficoGatilhos = { labels: ["Sem dados suficientes ainda"], dados: [100], cores: ["#C2C2C2"] };

        } else {

            graficoGatilhos = {
                labels: [
                    "Ambientes barulhentos",
                    "Locais lotados",
                    "Mudança de rotina",
                    "Não identificado"
                ],
                dados: [
                    Math.round((barulho         / totalGatilhos) * 100),
                    Math.round((lotados         / totalGatilhos) * 100),
                    Math.round((rotina          / totalGatilhos) * 100),
                    Math.round((naoIdentificado / totalGatilhos) * 100)
                ],
                cores: ["#32C26D", "#0AB7FB", "#1D8EC9", "#C2C2C2"]
            };

        }

        res.json({
            nomePaciente,
            alertas: totalMes,
            comparativoAlertas,
            tempo: formatarTempo(mediaMesMs),
            comparativoTempo,
            graficoEstresse: { labels: labelsEstresse, dados: dadosEstresse },
            graficoGatilhos
        });

    } catch (erro) {
        console.log("Erro na rota /api/relatorio-paciente:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }

});

app.get("/api/relatorio-paciente/dias", estaLogado, async (req, res) => {

    try {

        const terapeutaId = req.session.usuarioId || (req.user && req.user.id);
        const pacienteId  = parseInt(req.query.paciente);
        const mes         = req.query.mes; // "YYYY-MM"

        if (!terapeutaId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        if (!pacienteId || !mes) {
            return res.status(400).json({ erro: "Parâmetros inválidos." });
        }

        const vinculo = await db.query(
            `SELECT id FROM vinculos
             WHERE terapeuta_id = $1 AND responsavel_id = $2 AND ativo = TRUE`,
            [terapeutaId, pacienteId]
        );

        if (vinculo.rows.length === 0) {
            return res.status(403).json({ erro: "Você não tem vínculo com esse paciente." });
        }

        const resultado = await db.query(
            `SELECT DISTINCT DATE(data AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') AS dia
            FROM relatorios
            WHERE usuario_id = $1
            AND TO_CHAR(data AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') = $2`,
            [pacienteId, mes]
        );

        res.json({
            dias: resultado.rows.map(r => r.dia.toISOString().split("T")[0])
        });

    } catch (erro) {
        console.log("Erro na rota /api/relatorio-paciente/dias:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }

});

app.get("/api/relatorio-paciente/dia", estaLogado, async (req, res) => {

    try {

        const terapeutaId = req.session.usuarioId || (req.user && req.user.id);
        const pacienteId  = parseInt(req.query.paciente);
        const dataISO     = req.query.data;

        if (!terapeutaId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        if (!pacienteId || !dataISO) {
            return res.status(400).json({ erro: "Parâmetros inválidos." });
        }

        const vinculo = await db.query(
            `SELECT id FROM vinculos
             WHERE terapeuta_id = $1 AND responsavel_id = $2 AND ativo = TRUE`,
            [terapeutaId, pacienteId]
        );

        if (vinculo.rows.length === 0) {
            return res.status(403).json({ erro: "Você não tem vínculo com esse paciente." });
        }

        const relatorioDia = await db.query(
            `SELECT respostas, data FROM relatorios
             WHERE usuario_id = $1
             AND DATE(data AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $2
             LIMIT 1`,
            [pacienteId, dataISO]
        );

        const temRelatorio = relatorioDia.rows.length > 0;
        let perguntas = [];

        if (temRelatorio) {
            const row = relatorioDia.rows[0];
            perguntas = typeof row.respostas === "string" ? JSON.parse(row.respostas) : row.respostas;
        }

        const dataFormatada = new Date(dataISO + "T12:00:00").toLocaleDateString("pt-BR", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });

        const notaDia = await db.query(
            `SELECT texto FROM notas_clinicas
             WHERE terapeuta_id = $1 AND paciente_id = $2 AND data_referencia = $3`,
            [terapeutaId, pacienteId, dataISO]
        );

        res.json({
            temRelatorio,
            dataFormatada,
            perguntas,
            nota: notaDia.rows[0]?.texto || ""
        });

    } catch (erro) {
        console.log("Erro na rota /api/relatorio-paciente/dia:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }

});

app.get("/api/pacientes", estaLogado, async (req, res) => {
    const usuarioId = req.session.usuarioId || (req.user && req.user.id);

    try {
        const resultado = await db.query(
            `SELECT
                u.id                  AS responsavel_id,
                u.nome                AS nome_responsavel,
                u.foto_perfil         AS foto_perfil,
                c.nome                AS nome_crianca,
                c.data_nascimento     AS data_nascimento,
                c.foto_url            AS foto_crianca,
                v.ativo               AS ativo,
                COUNT(r.id)           AS total_relatorios_semana,
                MAX(r.data)           AS ultimo_relatorio
             FROM vinculos v
             JOIN usuarios u ON u.id = v.responsavel_id
             LEFT JOIN criancas c ON c.usuario_id = v.responsavel_id
             LEFT JOIN relatorios r
                ON r.usuario_id = v.responsavel_id
                AND r.data >= NOW() - INTERVAL '7 days'
             WHERE v.terapeuta_id = $1
             GROUP BY u.id, u.nome, u.foto_perfil, c.nome,
                      c.data_nascimento, c.foto_url, v.ativo
             ORDER BY total_relatorios_semana DESC`,
            [usuarioId]
        );

        const pacientes = resultado.rows.map(p => {
            let idade = 0;
            if (p.data_nascimento) {
                const hoje = new Date();
                const nasc = new Date(p.data_nascimento);
                idade = hoje.getFullYear() - nasc.getFullYear();
                const mes = hoje.getMonth() - nasc.getMonth();
                if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
            }

            const alertas = parseInt(p.total_relatorios_semana) || 0;

            let nivelEstresse = "Baixo";
            if (alertas >= 5)      nivelEstresse = "Alto";
            else if (alertas >= 2) nivelEstresse = "Médio";

            let ultimoRelatorio = "Sem relatórios";
            if (p.ultimo_relatorio) {
                const diff = Math.floor(
                    (new Date() - new Date(p.ultimo_relatorio)) / (1000 * 60 * 60 * 24)
                );
                if (diff === 0)      ultimoRelatorio = "Hoje";
                else if (diff === 1) ultimoRelatorio = "Ontem";
                else                 ultimoRelatorio = `${diff} dias`;
            }

            return {
                id:              p.responsavel_id,
                nomeResponsavel: p.nome_responsavel,
                fotoPerfil:      p.foto_perfil   || null,
                nomeCrianca:     p.nome_crianca  || "Criança",
                idadeCrianca:    idade,
                status:          p.ativo ? "ativo" : "inativo",
                alertas,
                nivelEstresse,
                ultimoRelatorio
            };
        });

        res.json({ pacientes });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});

/* ==========================
   ROTA POST — SALVAR NOTA CLÍNICA
========================== */

app.post("/api/nota-clinica", estaLogado, async (req, res) => {

    try {

        const terapeutaId = req.session.usuarioId || (req.user && req.user.id);

        if (!terapeutaId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const { pacienteId, texto, data } = req.body;

        if (!pacienteId || !texto?.trim() || !data) {
            return res.status(400).json({ erro: "Dados inválidos." });
        }

        // Verifica vínculo antes de salvar
        const vinculo = await db.query(
            `SELECT id FROM vinculos
             WHERE terapeuta_id = $1 AND responsavel_id = $2 AND ativo = TRUE`,
            [terapeutaId, parseInt(pacienteId)]
        );

        if (vinculo.rows.length === 0) {
            return res.status(403).json({ erro: "Você não tem vínculo com esse paciente." });
        }

        await db.query(
            `INSERT INTO notas_clinicas (terapeuta_id, paciente_id, data_referencia, texto)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (terapeuta_id, paciente_id, data_referencia)
             DO UPDATE SET texto = EXCLUDED.texto, criado_em = NOW()`,
            [terapeutaId, parseInt(pacienteId), data, texto.trim()]
        );

        return res.status(201).json({ mensagem: "Nota salva com sucesso." });

    } catch (erro) {
        console.log("Erro ao salvar nota clínica:", erro);
        res.status(500).json({ erro: "Erro interno ao salvar nota." });
    }

});

app.post("/esqueceu-senha", async (req, res) => {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ erro: "E-mail inválido." });
    }

    try {
        const resultado = await db.query(
            "SELECT * FROM usuarios WHERE email = $1",
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(200).json({
                mensagem: "Se esse e-mail estiver cadastrado, você receberá o link em breve."
            });
        }

        const usuario = resultado.rows[0];
        const token   = crypto.randomBytes(32).toString("hex");
        const expiraEm = new Date(Date.now() + 60 * 60 * 1000);

        await db.query(
            `UPDATE tokens_recuperacao SET usado = TRUE
             WHERE usuario_id = $1 AND usado = FALSE`,
            [usuario.id]
        );

        await db.query(
            `INSERT INTO tokens_recuperacao (usuario_id, token, expira_em)
             VALUES ($1, $2, $3)`,
            [usuario.id, token, expiraEm]
        );

        const link = `${process.env.BASE_URL || "http://localhost:3000"}/redefinir-senha?token=${token}`;

        
        await brevoClient.transactionalEmails.sendTransacEmail({
            sender: { name: "Bixuco", email: process.env.BREVO_FROM_EMAIL || "yasminbertoni7@gmail.com" },
            to: [{ email }],
            subject: "Recuperação de senha — Bixuco",
            htmlContent: `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
                    <h2 style="color:#32C26D;">Recuperação de senha</h2>
                    <p>Olá, <strong>${usuario.nome}</strong>!</p>
                    <p>Clique no botão abaixo para criar uma nova senha. O link expira em 1 hora.</p>
                    <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#79D836,#32C26D);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
                        Redefinir senha
                    </a>
                    <p style="color:#5A5A5A;font-size:14px;">Se você não solicitou isso, ignore este email.</p>
                </div>
            `
        });

        

        return res.status(200).json({
            mensagem: "Se esse e-mail estiver cadastrado, você receberá o link em breve."
        });

    } catch (erro) {
        console.error("ERRO esqueceu-senha:", erro.message || erro);
        res.status(500).json({ erro: "Erro interno ao enviar o e-mail." });
    }
});

app.post("/api/bixuco/localizacao", async (req, res) => {
    const { dispositivo_id, latitude, longitude, bateria } = req.body;

    try {
        const vinculo = await db.query(
            'SELECT crianca_id FROM dispositivos WHERE dispositivo_id = $1',
            [dispositivo_id]
        );

        if (vinculo.rows.length === 0 || !vinculo.rows[0].crianca_id) {
            return res.sendStatus(202); // dispositivo ainda não vinculado
        }

        const criancaId = vinculo.rows[0].crianca_id;

        await db.query(
            `INSERT INTO localizacoes_bixuco (crianca_id, latitude, longitude, bateria, criado_em)
             VALUES ($1, $2, $3, $4, NOW())`,
            [criancaId, latitude, longitude, bateria || null]
        );

        res.json({ sucesso: true });

    } catch (erro) {
        console.error("Erro em POST /api/bixuco/localizacao:", erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});


app.get("/api/bixuco/eventos-hoje", estaLogado, async (req, res) => {
    const usuarioId = req.session.usuarioId || (req.user && req.user.id);

    try {
        const resultado = await db.query(
            `SELECT TO_CHAR(e.criado_em, 'HH24:MI') AS horario, e.forca, e.duracao_ms, e.tipo_evento
             FROM eventos_bixuco e
             JOIN criancas c ON c.id = e.crianca_id
             WHERE c.usuario_id = $1
               AND DATE(e.criado_em) = CURRENT_DATE
             ORDER BY e.criado_em ASC
             LIMIT 1`,
            [usuarioId]
        );

        if (resultado.rows.length === 0) {
            return res.json({ houveAlerta: false });
        }

        const evento = resultado.rows[0];

        res.json({
            houveAlerta: true,
            horario: evento.horario,
            tipoEvento: evento.tipo_evento
        });

    } catch (erro) {
        console.error("Erro em /api/bixuco/eventos-hoje:", erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});

app.get("/api/bixuco/localizacao", estaLogado, async (req, res) => {
    const usuarioId = req.session.usuarioId || (req.user && req.user.id);

    try {
        const resultado = await db.query(
            `SELECT l.latitude, l.longitude, l.bateria,
                    TO_CHAR(l.criado_em, 'HH24:MI') AS horario,
                    TO_CHAR(l.criado_em, 'DD/MM') AS data_formatada,
                    c.nome_pelucia,
                    c.foto_url
            FROM localizacoes_bixuco l
            JOIN criancas c ON c.id = l.crianca_id
            WHERE c.usuario_id = $1
            ORDER BY l.criado_em DESC
            LIMIT 1`,
            [usuarioId]
        );

        if (resultado.rows.length === 0) {
            return res.json({ disponivel: false });
        }

        const local = resultado.rows[0];
        res.json({
            disponivel: true,
            latitude: parseFloat(local.latitude),
            longitude: parseFloat(local.longitude),
            bateria: local.bateria,
            horario: local.horario,
            dataFormatada: local.data_formatada,
            nomePelucia: local.nome_pelucia,
            fotoUrl: local.foto_url
        });

    } catch (erro) {
        console.error("Erro em /api/bixuco/localizacao:", erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});


app.post("/api/bixuco/evento", async (req, res) => {

    const { dispositivo_id, evento, forca, duracao_ms, latitude, longitude } = req.body;

    try {
        const vinculo = await db.query(
            'SELECT crianca_id FROM dispositivos WHERE dispositivo_id = $1',
            [dispositivo_id]
        );

        if (vinculo.rows.length === 0 || !vinculo.rows[0].crianca_id) {
            return res.sendStatus(202); // dispositivo existe mas ainda não tem dono
        }

        const criancaId = vinculo.rows[0].crianca_id;

        await db.query(
            `INSERT INTO eventos_bixuco (crianca_id, forca, latitude, longitude, duracao_ms, tipo_evento, criado_em)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [criancaId, forca, latitude, longitude, duracao_ms || null, evento || 'aperto_forte']
        );

        res.json({ sucesso: true });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro interno." });
    }
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;



app.post("/api/dicas/gerar", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        // Verifica se ja gerou essa semana (limite de 1x/semana)
        const geracoesRecentes = await db.query(
            `SELECT dicas FROM dicas_personalizadas
             WHERE usuario_id = $1
             AND gerado_em >= NOW() - INTERVAL '7 days'
             ORDER BY gerado_em DESC`,
            [usuarioId]
        );

        if (geracoesRecentes.rows.length >= 1) {
            return res.status(429).json({
                erro: "Já gerou as dicas dessa semana. Espere até a próxima semana.",
                dicas: geracoesRecentes.rows[0].dicas
            });
        }

        // Busca dicas anteriores (ultimas 4 geracoes, sem limite de data)
        // para instruir a IA a nao repetir as mesmas dicas de novo
        const dicasAnteriores = await db.query(
            `SELECT dicas FROM dicas_personalizadas
             WHERE usuario_id = $1
             ORDER BY gerado_em DESC
             LIMIT 4`,
            [usuarioId]
        );

        let dicasJaUsadas = "";
        if (dicasAnteriores.rows.length > 0) {
            const todasAnteriores = dicasAnteriores.rows.flatMap(r => r.dicas);
            dicasJaUsadas = todasAnteriores
                .map(d => `- ${d.titulo}: ${d.texto}`)
                .join("\n");
        }

        // Busca as respostas dos ultimos 7 dias
        const relatoriosRecentes = await db.query(
            `SELECT respostas FROM relatorios
             WHERE usuario_id = $1
             AND data >= NOW() - INTERVAL '7 days'
             ORDER BY data DESC`,
            [usuarioId]
        );

        if (relatoriosRecentes.rows.length === 0) {
            return res.status(404).json({
                erro: "Ainda não há relatórios suficientes para gerar dicas personalizadas."
            });
        }

        // Monta o resumo em texto para a IA
        let resumo = "";
        relatoriosRecentes.rows.forEach((linha, i) => {
            const respostas = typeof linha.respostas === "string"
                ? JSON.parse(linha.respostas)
                : linha.respostas;

            resumo += `\nRelatório ${i + 1}:\n`;
            respostas.forEach(r => {
                resumo += `- ${r.pergunta}: ${r.resposta}\n`;
            });
        });

        const instrucaoVariedade = dicasJaUsadas
            ? `\n\nIMPORTANTE: estas dicas já foram dadas antes. Você pode falar sobre o mesmo tema/dificuldade, mas a dica em si (o conselho prático específico) precisa ser DIFERENTE das anteriores, não repita a mesma sugestão:\n${dicasJaUsadas}`
            : "";

        const promptCompleto = `Você é um assistente que ajuda pais de crianças com Transtorno de Processamento Sensorial (TPS). Com base nas respostas do relatório diário, gere de 2 a 3 dicas práticas e específicas.

Responda APENAS com um JSON válido, sem nenhum texto antes ou depois, exatamente neste formato:
[
  { "titulo": "Título curto (3-5 palavras)", "texto": "Explicação prática em 1-2 frases." }
]

Não dê conselhos médicos - foque em estratégias comportamentais e de rotina. Escreva em português do Brasil, tom acolhedor.${instrucaoVariedade}

Respostas dos relatórios diários dos últimos 7 dias:
${resumo}

Gere as dicas personalizadas.`;

        const respostaIA = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/interactions?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "models/gemini-3-flash-preview",
                    input: promptCompleto,
                    generation_config: {
                        max_output_tokens: 2000,
                        thinking_level: "low"
                    }
                })
            }
        );

        const dadosIA = await respostaIA.json();

        if (!respostaIA.ok) {
            console.log("Erro na API do Gemini:", dadosIA);
            return res.status(500).json({ erro: "Erro ao gerar dica. Tente novamente." });
        }

        const stepResposta = dadosIA.steps.find(s => s.type === "model_output");

        if (!stepResposta) {
            console.log("Resposta do Gemini sem model_output:", dadosIA);
            return res.status(500).json({ erro: "Erro ao processar a resposta da IA." });
        }

        let textoResposta = stepResposta.content.map(c => c.text).join("").trim();
        textoResposta = textoResposta.replace(/```json|```/g, "").trim();

        let dicasGeradas;
        try {
            dicasGeradas = JSON.parse(textoResposta);
        } catch (erroParse) {
            console.log("Erro ao interpretar resposta da IA:", textoResposta);
            return res.status(500).json({ erro: "Erro ao processar a resposta da IA." });
        }

        await db.query(
            `INSERT INTO dicas_personalizadas (usuario_id, dicas)
             VALUES ($1, $2)`,
            [usuarioId, JSON.stringify(dicasGeradas)]
        );

        res.json({ dicas: dicasGeradas, novo: true });

    } catch (erro) {
        console.log("Erro ao gerar dica personalizada:", erro);
        res.status(500).json({ erro: "Erro interno ao gerar dica." });
    }

});

app.get("/api/dicas", estaLogado, async (req, res) => {

    try {
        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        const resultado = await db.query(
            `SELECT dicas, gerado_em FROM dicas_personalizadas
             WHERE usuario_id = $1
             AND gerado_em >= NOW() - INTERVAL '7 days'
             ORDER BY gerado_em DESC
             LIMIT 1`,
            [usuarioId]
        );

        if (resultado.rows.length === 0) {
            return res.json({ disponivel: false });
        }

        res.json({
            disponivel: true,
            dicas: resultado.rows[0].dicas,
            geradoEm: resultado.rows[0].gerado_em
        });

    } catch (erro) {
        console.log("Erro ao buscar dicas:", erro);
        res.status(500).json({ erro: "Erro interno." });
    }

});

/* ==========================
   INICIAR SERVIDOR
========================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Servidor rodando na porta ${PORT}`);

});