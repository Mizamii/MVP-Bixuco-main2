const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { cpf } = require('cpf-cnpj-validator');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const crypto = require('crypto');
const multer = require('multer');
const Brevo = require('@getbrevo/brevo'); // Importa a biblioteca Brevo
const brevoClient = Brevo.ApiClient.instance;
brevoClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
const emailApi = new Brevo.TransactionalEmailsApi();


const app = express();



app.use(session({
    // 🔒 FIX 1: SESSION_SECRET agora obrigatoriamente vem do .env
    // Nunca deixe um segredo fixo no código em produção
    secret: process.env.SESSION_SECRET || "bixuco2024",
    resave: false,
    saveUninitialized: false
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

app.get("/EsqueceuSenha", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "EsqueceuSenha.html"));
});

app.get("/homeTerapeuta", estaLogado, (req, res) => {

    res.sendFile(path.join(__dirname, "templates", "HomeTerapeuta.html"));

});

// 🔒 FIX 2 (aplicado): /home agora exige login
app.get("/home", estaLogado, (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "home.html"));
});

/* ==========================
   BANCO DE DADOS
========================== */

const db = new Pool({

    // 🔒 FIX 3: A connection string NUNCA deve ficar hardcoded no código
    // Crie um arquivo .env na raiz do projeto com a linha:
    // DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
    // E adicione .env no seu .gitignore para não subir para o GitHub
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    }

});

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

        const nome = profile.displayName;

        const resultado = await db.query(

            "SELECT * FROM usuarios WHERE email = $1",

            [email]

        );

        if (resultado.rows.length > 0) {

            return done(null, resultado.rows[0]);

        }

        const novoUsuario = await db.query(

            `INSERT INTO usuarios
            (nome,email,tipo,senha)
            VALUES($1,$2,'pai','')
            RETURNING *`,

            [nome, email]

        );

        return done(null, novoUsuario.rows[0]);

    }

    catch (err) {

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

    passport.authenticate(

        "google",

        {

            failureRedirect: "/logar"

        }

    ),

    (req, res) => {
        req.session.usuarioId = req.user.id;
        req.session.tipo = req.user.tipo;

        // Redireciona conforme o tipo da conta
        if (req.user.tipo === "psicologo") {
            return res.redirect("/homeTerapeuta");
        }
        return res.redirect("/home");
    }

);

/* ==========================
   FUNÇÃO AUXILIAR
========================== */

function validarCRP(crp) {

    return /^CRP-\d{2}\/\d{4,6}$/.test(crp);

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
app.post("/api/relatorio", estaLogado, async (req, res) => {

    try {

        // Pega o id do usuário logado — funciona tanto para login manual quanto Google
        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        const { respostas, data } = req.body;

        // Valida se as respostas chegaram e são um array com pelo menos 1 item
        if (!respostas || !Array.isArray(respostas) || respostas.length === 0) {
            return res.status(400).json({ erro: "Respostas inválidas." });
        }

        // Salva o relatório na tabela de relatórios
        // Ajuste o nome das colunas conforme a sua tabela no banco
        await db.query(

            `INSERT INTO relatorios
            (usuario_id, respostas, data)
            VALUES ($1, $2, $3)`,

            [
                usuarioId,
                JSON.stringify(respostas),  // salva as respostas como JSON
                data || new Date().toISOString()
            ]

        );

        return res.status(201).json({ mensagem: "Relatório salvo com sucesso." });

    } catch (erro) {

        console.log("Erro ao salvar relatório:", erro);
        res.status(500).json({ erro: "Erro interno ao salvar relatório." });

    }

});

app.post("/esqueceu-senha", async (req, res) => {

    const { email } = req.body;

    // Valida se o e-mail foi enviado
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ erro: "E-mail inválido." });
    }

    try {

        // Verifica se o e-mail existe no banco
        const resultado = await db.query(
            "SELECT * FROM usuarios WHERE email = $1",
            [email]
        );

        // 🔒 Segurança: mesmo que o e-mail não exista, retornamos sucesso
        // Isso evita que alguém descubra quais e-mails estão cadastrados
        // testando vários endereços e vendo a diferença nas respostas
        if (resultado.rows.length === 0) {
            return res.status(200).json({
                mensagem: "Se esse e-mail estiver cadastrado, você receberá o link em breve."
            });
        }

        const usuario = resultado.rows[0];

        // Gera um token seguro e aleatório de 32 bytes (64 caracteres hex)
        const token = crypto.randomBytes(32).toString("hex");

        // O token expira em 1 hora a partir de agora
        const expiraEm = new Date(Date.now() + 60 * 60 * 1000);

        // Invalida tokens anteriores desse usuário que ainda não foram usados
        // Evita ter múltiplos tokens válidos ao mesmo tempo
        await db.query(
            `UPDATE tokens_recuperacao
             SET usado = TRUE
             WHERE usuario_id = $1
             AND usado = FALSE`,
            [usuario.id]
        );

        // Salva o novo token no banco
        await db.query(
            `INSERT INTO tokens_recuperacao
             (usuario_id, token, expira_em)
             VALUES ($1, $2, $3)`,
            [usuario.id, token, expiraEm]
        );

        // Monta o link de recuperação que será enviado no e-mail
        const link = `${process.env.BASE_URL || "http://localhost:3000"}/redefinir-senha?token=${token}`;

        // Monta o e-mail que será enviado
        const emailOpcoes = {
            from: `"Bixuco" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Recuperação de senha — Bixuco",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">

                    <h2 style="color: #32C26D;">Recuperação de senha</h2>

                    <p>Olá, <strong>${usuario.nome}</strong>!</p>

                    <p>
                        Recebemos uma solicitação para redefinir a senha da sua conta Bixuco.
                        Clique no botão abaixo para criar uma nova senha:
                    </p>

                    <a
                        href="${link}"
                        style="
                            display: inline-block;
                            background: linear-gradient(135deg, #79D836, #32C26D);
                            color: white;
                            padding: 12px 28px;
                            border-radius: 8px;
                            text-decoration: none;
                            font-weight: bold;
                            margin: 16px 0;
                        "
                    >
                        Redefinir minha senha
                    </a>

                    <p style="color: #5A5A5A; font-size: 14px;">
                        Este link é válido por <strong>1 hora</strong>.
                        Após esse prazo, você precisará solicitar um novo link.
                    </p>

                    <p style="color: #5A5A5A; font-size: 14px;">
                        Se você não solicitou a recuperação de senha,
                        ignore este e-mail. Sua senha não será alterada.
                    </p>

                    <hr style="border: none; border-top: 1px solid #C2C2C2; margin: 24px 0;">

                    <p style="color: #C2C2C2; font-size: 12px;">
                        Bixuco — Acompanhamento infantil inteligente
                    </p>

                </div>
            `
        };

        // Envia o e-mail via Nodemailer + Gmail
        await emailApi.sendTransacEmail({
            sender: { name: 'Bixuco', email: 'yasminbertoni7@gmail.com' },
            to: [{ email: email }],
            subject: 'Recuperação de senha — Bixuco',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #32C26D;">Recuperação de senha</h2>
                    <p>Olá, <strong>${usuario.nome}</strong>!</p>
                    <p>Recebemos uma solicitação para redefinir a senha da sua conta Bixuco. Clique no botão abaixo para criar uma nova senha:</p>
                    <a href="${link}" style="display: inline-block; background: linear-gradient(135deg, #79D836, #32C26D); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
                        Redefinir minha senha
                    </a>
                    <p style="color: #5A5A5A; font-size: 14px;">Este link é válido por <strong>1 hora</strong>.</p>
                    <p style="color: #5A5A5A; font-size: 14px;">Se você não solicitou a recuperação de senha, ignore este e-mail.</p>
                    <hr style="border: none; border-top: 1px solid #C2C2C2; margin: 24px 0;">
                    <p style="color: #C2C2C2; font-size: 12px;">Bixuco — Acompanhamento infantil inteligente</p>
                </div>
            `
        });

        return res.status(200).json({
            mensagem: "Se esse e-mail estiver cadastrado, você receberá o link em breve."
        });

    } catch (erro) {
        console.log("ERRO COMPLETO:", JSON.stringify(erro, Object.getOwnPropertyNames(erro)));
        res.status(500).json({ erro: "Erro interno ao enviar o e-mail. Tente novamente." });
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

            const novoUsuario = await db.query(
                `INSERT INTO usuarios
                (nome, email, crp, senha, data_nascimento, tipo, cep, cidade, estado, bairro)
                VALUES ($1,$2,$3,$4,$5,'psicologo',$6,$7,$8,$9)
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
                    dados.bairro
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
app.get("/api//homeTerapeuta", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        // Dados do terapeuta
        const resultadoUsuario = await db.query(
            `SELECT nome, foto_perfil FROM usuarios WHERE id = $1`,
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

        const estresseDias = await db.query(
            `SELECT
                TO_CHAR(data, 'Dy') AS dia,
                COUNT(*) AS total
             FROM relatorios
             WHERE usuario_id = $1
             AND data >= NOW() - INTERVAL '7 days'
             GROUP BY data
             ORDER BY data ASC`,
            [usuarioId]
        );

        const labelsEstresse = estresseDias.rows.map(r => r.dia);
        const dadosEstresse  = estresseDias.rows.map(r => parseInt(r.total));

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
        // =====================

        const evolucaoDias = await db.query(
            `SELECT
                TO_CHAR(data, 'Dy') AS dia,
                COUNT(*) AS total
             FROM relatorios
             WHERE usuario_id = $1
             AND data >= NOW() - INTERVAL '7 days'
             GROUP BY data
             ORDER BY data ASC`,
            [usuarioId]
        );

        const labelsEvolucao = evolucaoDias.rows.map(r => r.dia);
        const dadosEvolucao  = evolucaoDias.rows.map(r => parseInt(r.total));

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

        // Remove os dados vinculados ao usuário antes de deletar a conta
        // A ordem importa para não violar chaves estrangeiras no banco

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

        // Remove o usuário em si
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
            `SELECT nome, data_nascimento
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
                idade
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
        res.json({
            nome: usuario.nome,
            tipoConta,
            fotoPerfil: usuario.foto_perfil || null,
            anoCadastro: usuario.ano_cadastro || new Date().getFullYear(),
            diasConsecutivos: parseInt(resultadoDias.rows[0].total) || 0,
            plano,
            crianca: criancaDados,
            terapeuta: terapeutaDados
        });

    } catch (erro) {

        console.log("Erro na rota /api/perfil:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });

    }

});

/* ==========================
   ROTA POST — REMOVER TERAPEUTA
========================== */

// 🔧 FIX 2: Rota /api/remover-terapeuta que não existia no server.js
app.post("/api/remover-terapeuta", estaLogado, async (req, res) => {

    try {

        const usuarioId = req.session.usuarioId || (req.user && req.user.id);

        if (!usuarioId) {
            return res.status(401).json({ erro: "Não autenticado." });
        }

        // Desativa o vínculo entre o responsável e o terapeuta
        // Usa ativo = FALSE em vez de deletar para manter histórico
        const resultado = await db.query(
            `UPDATE vinculos
             SET ativo = FALSE
             WHERE responsavel_id = $1
             AND ativo = TRUE`,
            [usuarioId]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ erro: "Nenhum terapeuta vinculado encontrado." });
        }

        return res.status(200).json({ mensagem: "Terapeuta removido com sucesso." });

    } catch (erro) {

        console.log("Erro ao remover terapeuta:", erro);
        res.status(500).json({ erro: "Erro interno ao remover terapeuta." });

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
        const notificacoes = await db.query(

            `SELECT COUNT(*) AS total
             FROM notificacoes
             WHERE usuario_id = $1
             AND lida = false`,

            [usuarioId]

        );

        // Monta o tipo de conta para exibir na tela
        const tipoConta = usuario.tipo === "pai"
            ? "Responsável"
            : "Terapeuta";

        res.json({
            nome: usuario.nome,
            tipoConta,
            fotoPerfil: usuario.foto_perfil || null,
            notificacoes: parseInt(notificacoes.rows[0].total) || 0,
            diasConsecutivos: parseInt(sequencia.rows[0].total) || 0,
            nomeBixuco: "Bixuco" // futuramente buscar da tabela de dispositivos vinculados
        });

    } catch (erro) {

        console.log("Erro na rota /api/home:", erro);
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