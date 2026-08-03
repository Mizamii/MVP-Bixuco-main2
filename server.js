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

const { Brevo, BrevoClient, BrevoEnvironment } = require('@getbrevo/brevo');

const brevoClient = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
    environment: BrevoEnvironment.Production
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

/* ==========================
   MIDDLEWARES
========================== */

app.use(express.static(path.join(__dirname, "static")));

app.use(express.urlencoded({
    extended: true
}));

app.use(express.json());

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

/* ==========================
   ROTAS GET
========================== */

app.get("/relatorios", estaLogado, (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "relatorios.html"));

});


app.get("/AdicionarC", estaLogado, (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "AdicionarC.html"));

});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "index.html"));
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



app.get("/hometerapeuta", estaLogado, (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "HomeTerapeuta.html"));

});

app.get("/onboarding-google", estaLogado, (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "onboarding-google.html"));

});

// 🔒 FIX 2 (aplicado): /home agora exige login
app.get("/home", estaLogado, (req, res) => {
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

    passport.authenticate("google", {
        scope: ["profile", "email"]
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

        // 🔧 FIX: Usuário novo → manda para o onboarding de escolha de tipo
        // Usuário existente → manda para a home correta conforme o tipo
        if (req.user.novo_usuario) {
            return res.redirect("/onboarding-google");
        }

        if (req.user.tipo === "psicologo") {
            return res.redirect("/homeTerapeuta");
        }

        return res.redirect("/home");

    }

);

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
        await db.query(
            `UPDATE usuarios
             SET tipo = $1, novo_usuario = FALSE
             WHERE id = $2`,
            [tipo, usuarioId]
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

            const pastaDestino = path.join(__dirname, "static", "uploads", "criancas");
            fs.mkdirSync(pastaDestino, { recursive: true });

            const extensao = path.extname(req.file.originalname) || ".jpg";
            const nomeArquivo = `crianca_${criancaId}_${Date.now()}${extensao}`;
            const caminhoCompleto = path.join(pastaDestino, nomeArquivo);

            fs.writeFileSync(caminhoCompleto, req.file.buffer);

            const novaFotoUrl = `/uploads/criancas/${nomeArquivo}`;

            campos.push(`foto_url = $${indice++}`);
            valores.push(novaFotoUrl);

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

        res.json({
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
        let fotoUrl = null;

        if (req.file) {

            // Para salvar localmente (simples, mas não recomendado para produção):
            // const nomeArquivo = `crianca_${usuarioId}_${Date.now()}.jpg`;
            // const caminho = path.join(__dirname, 'static', 'uploads', nomeArquivo);
            // require('fs').writeFileSync(caminho, req.file.buffer);
            // fotoUrl = `/uploads/${nomeArquivo}`;

            // Para Cloudinary (recomendado):
            // const cloudinary = require('cloudinary').v2;
            // const resultado = await cloudinary.uploader.upload_stream(...);
            // fotoUrl = resultado.secure_url;

            // Por ora apenas registra que a foto foi recebida
            console.log(`Foto recebida: ${req.file.originalname} (${req.file.size} bytes)`);

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

        // Redireciona para o questionário de perfil sensorial
        return res.redirect("/QuestionarioP");

    } catch (erro) {

        console.log("Erro ao adicionar criança:", erro);
        res.status(500).json({ erro: "Erro interno ao salvar criança." });

    }

});


app.post("/continuar-cadastro-psicologo", async (req, res) => {

    const {
        nome,
        email,
        telefone,
        crp,
        dataNascimento,
        cep,
        cidade,
        estado,
        bairro
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
        dataNascimento,
        cep,
        cidade,
        estado,
        bairro

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
        dataNascimento,
        cep,
        cidade,
        estado,
        bairro
    } = req.body;

    // Salva os dados na sessão para usar na etapa final do cadastro
    req.session.cadastro = {

        tipo: "pai",

        nome,
        email,
        telefone,
        cpfUser,
        dataNascimento,
        cep,
        cidade,
        estado,
        bairro

    };

    // Como o frontend usa fetch e trata resposta.redirected,
    // o redirect funciona normalmente aqui
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


app.get("/RelatorioDiario", estaLogado, (req, res) => {

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
            `SELECT COUNT(*) AS total
             FROM relatorios
             WHERE usuario_id = $1
             AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM NOW())
             AND EXTRACT(YEAR FROM data)  = EXTRACT(YEAR FROM NOW())
             ${filtroAlerta}`,
            [usuarioId]
        );

        const alertasSemanaPassada = await db.query(
            `SELECT COUNT(*) AS total
             FROM relatorios
             WHERE usuario_id = $1
             AND data >= NOW() - INTERVAL '14 days'
             AND data <  NOW() - INTERVAL '7 days'
             ${filtroAlerta}`,
            [usuarioId]
        );

        const alertasSemanaAtual = await db.query(
            `SELECT COUNT(*) AS total
             FROM relatorios
             WHERE usuario_id = $1
             AND data >= NOW() - INTERVAL '7 days'
             ${filtroAlerta}`,
            [usuarioId]
        );

        const totalMes      = parseInt(alertasMes.rows[0].total) || 0;
        const totalAtual    = parseInt(alertasSemanaAtual.rows[0].total) || 0;
        const totalAnterior = parseInt(alertasSemanaPassada.rows[0].total) || 0;
        const diffAlertas   = totalAtual - totalAnterior;

        const comparativoAlertas = diffAlertas === 0
            ? "igual à semana passada"
            : diffAlertas > 0
                ? `↑ ${diffAlertas} comparado à semana passada`
                : `↓ ${Math.abs(diffAlertas)} comparado à semana passada`;

        // =====================
        // GRÁFICO DE BARRAS — ESTRESSE POR DIA (últimos 7 dias)
        // 🔧 Agora só entra no gráfico o dia em que houve alerta (Sim)
        // =====================

        const estresseDias = await db.query(
            `SELECT
                TO_CHAR(data, 'Dy') AS dia,
                COUNT(*) AS total
             FROM relatorios
             WHERE usuario_id = $1
             AND data >= NOW() - INTERVAL '7 days'
             ${filtroAlerta}
             GROUP BY data
             ORDER BY data ASC`,
            [usuarioId]
        );

        const labelsEstresse = estresseDias.rows.map(r => r.dia);
        const dadosEstresse  = estresseDias.rows.map(r => parseInt(r.total));

        // =====================
        // GRÁFICO DE ROSCA — GATILHOS (aproximação)
        // 🔧 Mapeamento aproximado usando 4 perguntas existentes, já que ainda
        // não existe uma pergunta dedicada "qual foi o gatilho". Cada categoria
        // vem de uma pergunta diferente — ver tabela de mapeamento na conversa.
        // =====================

        const gatilhosRaw = await db.query(
            `SELECT
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements(respostas) AS x
                        WHERE x->>'id' = 'desconforto_texturas'
                        AND x->>'resposta' IN ('Sempre', 'Quase sempre')
                    )
                ) AS texturas,
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements(respostas) AS x
                        WHERE x->>'id' = 'evitou_contato_visual'
                        AND x->>'resposta' IN ('Sempre', 'Quase sempre')
                    )
                ) AS barulho,
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements(respostas) AS x
                        WHERE x->>'id' = 'atividades_propostas'
                        AND x->>'resposta' IN ('Poucas', 'Nenhuma')
                    )
                ) AS rotina,
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM jsonb_array_elements(respostas) AS x
                        WHERE x->>'id' = 'interacao_social'
                        AND x->>'resposta' IN ('Pouca', 'Nenhuma')
                    )
                ) AS lotados
            FROM relatorios
            WHERE usuario_id = $1
            AND data >= NOW() - INTERVAL '7 days'`,
            [usuarioId]
        );

        const g = gatilhosRaw.rows[0];

        const texturas = parseInt(g.texturas) || 0;
        const barulho   = parseInt(g.barulho)  || 0;
        const rotina    = parseInt(g.rotina)   || 0;
        const lotados   = parseInt(g.lotados)  || 0;

        const totalGatilhos = texturas + barulho + rotina + lotados;

        let graficoGatilhos;

        if (totalGatilhos === 0) {

            // Sem nenhum indício nos últimos 7 dias — evita dividir por zero
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
                    "Mudanças de rotina",
                    "Texturas de alimentos"
                ],
                dados: [
                    Math.round((barulho  / totalGatilhos) * 100),
                    Math.round((lotados  / totalGatilhos) * 100),
                    Math.round((rotina   / totalGatilhos) * 100),
                    Math.round((texturas / totalGatilhos) * 100)
                ],
                cores: ["#32C26D", "#0AB7FB", "#1D8EC9", "#C2C2C2"]
            };

        }


        // =====================
        // GRÁFICO DE LINHA — EVOLUÇÃO (últimos 7 dias)
        // 🔧 Agora usa a pergunta "Apresentou crises sensoriais?" como termômetro
        // de estresse (0 = Nenhuma, 3 = Sim, várias), em vez de repetir o
        // Sim/Não do gráfico de barras
        // =====================

        const evolucaoDias = await db.query(
            `SELECT
                TO_CHAR(dia, 'Dy') AS dia_label,
                COALESCE((
                    SELECT CASE x->>'resposta'
                        WHEN 'Nenhuma'      THEN 0
                        WHEN 'Poucas'       THEN 1
                        WHEN 'Algumas'      THEN 2
                        WHEN 'Sim, várias'  THEN 3
                        ELSE NULL
                    END
                    FROM relatorios r,
                        jsonb_array_elements(r.respostas) AS x
                    WHERE r.usuario_id = $1
                    AND DATE(r.data) = dia
                    AND x->>'id' = 'crises_sensoriais'
                    LIMIT 1
                ), 0) AS nivel_estresse
            FROM generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            ) AS dia
            ORDER BY dia`,
            [usuarioId]
        );

        const labelsEvolucao = evolucaoDias.rows.map(r => r.dia_label);
        const dadosEvolucao  = evolucaoDias.rows.map(r => r.nivel_estresse);


        // =====================
        // ÚLTIMO RELATÓRIO DIÁRIO
        // (sem alteração — continua mostrando todas as perguntas/respostas)
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
                year:    "numeric"
            });

        }

        // =====================
        // RETORNA TUDO
        // =====================

        res.json({

            alertas:             totalMes,
            comparativoAlertas,
            tempo:               "0 min",
            comparativoTempo:    "por episódio",

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

            const existe = await db.query(
                `SELECT * FROM usuarios
                 WHERE email = $1 OR cpf = $2`,
                [dados.email, dados.cpfUser]
            );

            if (existe.rows.length > 0) {
                return res.status(409).json({
                    campo: "email",
                    erro: "Email ou CPF já cadastrado."
                });
            }

        const novoUsuario = await db.query(
            `INSERT INTO usuarios
            (nome, email, cpf, senha, data_nascimento, tipo, cep, cidade, estado, bairro)
            VALUES ($1,$2,$3,$4,$5,'pai',$6,$7,$8,$9)
            RETURNING id, tipo`,
            [
                dados.nome,
                dados.email,
                dados.cpfUser,
                senhaHash,
                dados.dataNascimento,
                dados.cep,
                dados.cidade,
                dados.estado,
                dados.bairro
            ]
        );

        delete req.session.cadastro;

        req.session.usuarioId = novoUsuario.rows[0].id;
        req.session.tipo = novoUsuario.rows[0].tipo;
        
        return res.json({
            sucesso: true,
            destino: "/AdicionarC"
        });

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
                `SELECT * FROM usuarios
                 WHERE email = $1 OR crp = $2`,
                [dados.email, dados.crp]
            );

            if (existe.rows.length > 0) {
                return res.status(409).json({
                    campo: "email",
                    erro: "Email ou CRP já cadastrado."
                });
            }

            const codigoVinculo = await gerarCodigoVinculo();

            const novoUsuario = await db.query(
                `INSERT INTO usuarios
                (nome, email, crp, senha, data_nascimento, tipo, cep, cidade, estado, bairro, codigo_vinculo)
                VALUES ($1,$2,$3,$4,$5,'psicologo',$6,$7,$8,$9,$10)
                RETURNING id, tipo`,
                [
                    dados.nome,
                    dados.email,
                    dados.crp,
                    senhaHash,
                    dados.dataNascimento,
                    dados.cep,
                    dados.cidade,
                    dados.estado,
                    dados.bairro,
                    codigoVinculo
                ]
            );

            delete req.session.cadastro;

            req.session.usuarioId = novoUsuario.rows[0].id;
            req.session.tipo = novoUsuario.rows[0].tipo;

            return res.json({
                sucesso: true,
                destino: "/logar"
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
            notificacoes:     parseInt(totalPendentes.rows[0].total) || 0,
            totalPacientes:   parseInt(totalPacientes.rows[0].total) || 0,
            totalPendentes:   parseInt(totalPendentes.rows[0].total) || 0,
            relatoriosHoje:   parseInt(relatoriosHoje.rows[0].total) || 0,
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
app.post("/api/vinculos/solicitar", estaLogado, async (req, res) => {
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
            await db.query(
                "INSERT INTO vinculos (responsavel_id, terapeuta_id, ativo, recusado) VALUES ($1, $2, false, false)",
                [responsavelId, terapeutaId]
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
app.post("/api/vinculos/cancelar", estaLogado, async (req, res) => {
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
app.post("/api/vinculos/remover", estaLogado, async (req, res) => {
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
app.get("/perfil", estaLogado, (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "perfil.html"));

});

/* ==================================================
   ROTAS DE CONFIGURAÇÕES — adicione no seu server.js
   ================================================== */

/* ==========================
   ROTA GET — PÁGINA DE CONFIGURAÇÕES
========================== */

// 🔧 Rota GET /configuracoes que não existia no server.js
app.get("/configuracoes", estaLogado, (req, res) => {

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

app.get("/api/relatorios", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        // =====================
        // ALERTAS DO MÊS
        // =====================

        const alertasMes = await db.query(
            `SELECT COUNT(*) AS total
             FROM relatorios
             WHERE usuario_id = $1
             AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM NOW())
             AND EXTRACT(YEAR FROM data)  = EXTRACT(YEAR FROM NOW())`,
            [usuarioId]
        );

        const alertasSemanaPasada = await db.query(
            `SELECT COUNT(*) AS total
             FROM relatorios
             WHERE usuario_id = $1
             AND data >= NOW() - INTERVAL '14 days'
             AND data <  NOW() - INTERVAL '7 days'`,
            [usuarioId]
        );

        const alertasSemanaAtual = await db.query(
            `SELECT COUNT(*) AS total
             FROM relatorios
             WHERE usuario_id = $1
             AND data >= NOW() - INTERVAL '7 days'`,
            [usuarioId]
        );

        const totalMes      = parseInt(alertasMes.rows[0].total) || 0;
        const totalAtual    = parseInt(alertasSemanaAtual.rows[0].total) || 0;
        const totalAnterior = parseInt(alertasSemanaPasada.rows[0].total) || 0;
        const diffAlertas   = totalAtual - totalAnterior;

        const comparativoAlertas = diffAlertas === 0
            ? "igual à semana passada"
            : diffAlertas > 0
                ? `↑ ${diffAlertas} comparado à semana passada`
                : `↓ ${Math.abs(diffAlertas)} comparado à semana passada`;

        // =====================
        // GRÁFICO DE BARRAS — ESTRESSE POR DIA (últimos 7 dias)
        // =====================

        // =====================
        // GRÁFICO DE BARRAS — ESTRESSE POR DIA (últimos 7 dias)
        // 🔧 Corrigido: agora sempre mostra os 7 dias, mesmo os que não
        // tiveram alerta (antes esses dias simplesmente sumiam do gráfico)
        // =====================

        const estresseDias = await db.query(
            `SELECT
                TO_CHAR(dia, 'Dy') AS dia_label,
                CASE WHEN EXISTS (
                    SELECT 1 FROM relatorios r
                    WHERE r.usuario_id = $1
                    AND DATE(r.data) = dia
                    AND EXISTS (
                        SELECT 1 FROM jsonb_array_elements(r.respostas) AS x
                        WHERE x->>'id' = 'alerta_estresse'
                        AND x->>'resposta' = 'Sim'
                    )
                ) THEN 1 ELSE 0 END AS teve_alerta
            FROM generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            ) AS dia
            ORDER BY dia`,
            [usuarioId]
        );

        const labelsEstresse = estresseDias.rows.map(r => r.dia_label);
        const dadosEstresse  = estresseDias.rows.map(r => r.teve_alerta);


        // =====================
        // GRÁFICO DE ROSCA — GATILHOS
        // Ajuste conforme sua tabela de respostas
        // =====================

        // Por ora retorna dados fixos representativos
        // Integre com sua tabela de respostas do relatório diário quando quiser
        const graficoGatilhos = {
            labels: [
                "Ambientes barulhentos",
                "Locais lotados",
                "Mudanças de rotina",
                "Texturas de alimentos"
            ],
            dados: [42, 28, 18, 12],
            cores: ["#32C26D", "#0AB7FB", "#1D8EC9", "#C2C2C2"]
        };

        // =====================
        // GRÁFICO DE LINHA — EVOLUÇÃO (últimos 7 dias)
        // 🔧 Mesma correção do gráfico de barras
        // =====================

        const evolucaoDias = await db.query(
            `SELECT
                TO_CHAR(dia, 'Dy') AS dia_label,
                CASE WHEN EXISTS (
                    SELECT 1 FROM relatorios r
                    WHERE r.usuario_id = $1
                    AND DATE(r.data) = dia
                    AND EXISTS (
                        SELECT 1 FROM jsonb_array_elements(r.respostas) AS x
                        WHERE x->>'id' = 'alerta_estresse'
                        AND x->>'resposta' = 'Sim'
                    )
                ) THEN 1 ELSE 0 END AS teve_alerta
            FROM generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            ) AS dia
            ORDER BY dia`,
            [usuarioId]
        );

        const labelsEvolucao = evolucaoDias.rows.map(r => r.dia_label);
        const dadosEvolucao  = evolucaoDias.rows.map(r => r.teve_alerta);


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

            // respostas é um JSONB com array [{pergunta, resposta}]
            perguntas = typeof row.respostas === "string"
                ? JSON.parse(row.respostas)
                : row.respostas;

            // Formata a data em português
            const data = new Date(row.data);
            dataRelatorio = data.toLocaleDateString("pt-BR", {
                weekday: "long",
                day:     "numeric",
                month:   "long",
                year:    "numeric"
            });

        }

        // =====================
        // RETORNA TUDO
        // =====================

        res.json({

            // Cards
            alertas:             totalMes,
            comparativoAlertas,
            tempo:               "0 min",    // integre com sua tabela de alertas IoT
            comparativoTempo:    "por episódio",

            // Gráficos
            graficoEstresse: {
                labels: labelsEstresse,
                dados:  dadosEstresse
            },

            graficoGatilhos,

            graficoEvolucao: {
                labels: labelsEvolucao,
                dados:  dadosEvolucao
            },

            // Diário
            dataRelatorio,
            perguntas

        });

    } catch (erro) {

        console.log("Erro na rota /api/relatorios:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });

    }

});


/* ==========================
   ROTA POST — SALVAR RELATÓRIO DIÁRIO
========================== */

app.post("/api/relatorio", estaLogado, async (req, res) => {

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

        return res.status(201).json({ mensagem: "Relatório salvo com sucesso." });

    } catch (erro) {

        console.log("Erro ao salvar relatório:", erro);
        res.status(500).json({ erro: "Erro interno ao salvar relatório." });

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
            tipoConta,
            fotoPerfil: usuario.foto_perfil || null,
            anoCadastro: usuario.ano_cadastro || new Date().getFullYear(),
            diasConsecutivos,
            maiorOfensiva: diasConsecutivos, // 🔧 placeholder — ver nota sobre streak real acima
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

            const pastaDestino = path.join(__dirname, "static", "uploads", "perfil");
            fs.mkdirSync(pastaDestino, { recursive: true });

            const extensao = path.extname(req.file.originalname) || ".jpg";
            const nomeArquivo = `perfil_${usuarioId}_${Date.now()}${extensao}`;
            const caminhoCompleto = path.join(pastaDestino, nomeArquivo);

            fs.writeFileSync(caminhoCompleto, req.file.buffer);

            // "static" já é servido publicamente em app.use(express.static(...)),
            // então o arquivo fica acessível em /uploads/perfil/<nome>
            const novaFotoUrl = `/uploads/perfil/${nomeArquivo}`;

            campos.push(`foto_perfil = $${indice++}`);
            valores.push(novaFotoUrl);

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
app.get("/sobre", estaLogado, (req, res) => {

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
        const sequencia = await db.query(

            `SELECT COUNT(*) AS total
             FROM relatorios
             WHERE usuario_id = $1
             AND data >= CURRENT_DATE - INTERVAL '30 days'`,

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
            diasConsecutivos: parseInt(sequencia.rows[0].total) || 0,
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

            `SELECT EXTRACT(DAY FROM data) AS dia
             FROM relatorios
             WHERE usuario_id = $1
             AND EXTRACT(MONTH FROM data) = $2
             AND EXTRACT(YEAR FROM data) = $3`,

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

/* ==========================
   INICIAR SERVIDOR
========================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Servidor rodando na porta ${PORT}`);

});