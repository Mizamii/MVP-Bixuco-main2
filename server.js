const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { cpf } = require('cpf-cnpj-validator');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();


app.use(session({
    // 🔒 FIX 1: SESSION_SECRET agora obrigatoriamente vem do .env
    // Nunca deixe um segredo fixo no código em produção
    secret: process.env.SESSION_SECRET || "bixuco2024",
    resave: false,
    saveUninitialized: false
}));

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

app.use(passport.initialize());
app.use(passport.session());

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

app.get("/QuestionarioP", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "QuestionarioP.html"));
});

app.get("/EsqueceuSenha", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "EsqueceuSenha.html"));
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

        // Salva o id na sessão igual ao login manual
        req.session.usuarioId = req.user.id;
        req.session.tipo = req.user.tipo;

        res.redirect("/home");

    }

);

/* ==========================
   FUNÇÃO AUXILIAR
========================== */

function validarCRP(crp) {

    return /^CRP-\d{2}\/\d{4,6}$/.test(crp);

}

/* ==========================
   PRIMEIRA ETAPA DO CADASTRO
========================== */

app.post("/continuar-cadastro-pai", (req, res) => {

    const {
        nome,
        email,
        cpfUser,
        dataNascimento,
        cep,
        cidade,
        estado,
        bairro
    } = req.body;

    req.session.cadastro = {

        tipo: "pai",

        nome,
        email,
        cpfUser,
        dataNascimento,
        cep,
        cidade,
        estado,
        bairro

    };

    res.redirect("/CriarContaSenha");

});

app.post("/continuar-cadastro-psicologo", (req, res) => {

    const {
        nome,
        email,
        crp,
        dataNascimento,
        cep,
        cidade,
        estado,
        bairro
    } = req.body;

    req.session.cadastro = {

        tipo: "psicologo",

        nome,
        email,
        crp,
        dataNascimento,
        cep,
        cidade,
        estado,
        bairro

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
        await transporter.sendMail(emailOpcoes);

        return res.status(200).json({
            mensagem: "Se esse e-mail estiver cadastrado, você receberá o link em breve."
        });

    } catch (erro) {

        console.log("Erro ao enviar e-mail de recuperação:", erro);
        res.status(500).json({ erro: "Erro interno ao enviar o e-mail. Tente novamente." });

    }

});

/* ==========================
   CADASTRO FINAL
========================== */

app.post("/cadastro-finalizar", async (req, res) => {

    const dados = req.session.cadastro;

    if (!dados) {

        return res.redirect("/");

    }

    const senha = req.body.senha;

    const confirmarSenha = req.body.confirmarSenha;

    if (senha !== confirmarSenha) {

        // 🔧 FIX 4: Respondendo com JSON e status HTTP correto em vez de res.send() puro
        // O frontend consegue tratar melhor com JSON
        return res.status(400).json({ erro: "As senhas não coincidem." });

    }

    if (!senha || senha.length < 6) {

        return res.status(400).json({ erro: "Senha deve possuir pelo menos 6 caracteres." });

    }

    try {

        const senhaHash = await bcrypt.hash(senha, 10);

        /* =====================
           RESPONSÁVEL
        ===================== */

        if (dados.tipo === "pai") {

            if (!cpf.isValid(dados.cpfUser)) {

                return res.status(400).json({ erro: "CPF inválido." });

            }

            const existe = await db.query(

                `SELECT *
                 FROM usuarios
                 WHERE email=$1
                 OR cpf=$2`,

                [

                    dados.email,
                    dados.cpfUser

                ]

            );

            if (existe.rows.length > 0) {

                return res.status(409).json({ erro: "Email ou CPF já cadastrado." });

            }

            await db.query(

                `INSERT INTO usuarios
                (nome,email,cpf,senha,data_nascimento,tipo,cep,cidade,estado,bairro)

                VALUES

                ($1,$2,$3,$4,$5,'pai',$6,$7,$8,$9)`,

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

            return res.redirect("/AdicionarC");

        }

        /* =====================
           PSICÓLOGO
        ===================== */

        if (dados.tipo === "psicologo") {

            if (!validarCRP(dados.crp)) {

                return res.status(400).json({ erro: "CRP inválido." });

            }

            const existe = await db.query(

                `SELECT *
                 FROM usuarios
                 WHERE email=$1
                 OR crp=$2`,

                [

                    dados.email,
                    dados.crp

                ]

            );

            if (existe.rows.length > 0) {

                return res.status(409).json({ erro: "Email ou CRP já cadastrado." });

            }

            await db.query(

                `INSERT INTO usuarios
                (nome,email,crp,senha,data_nascimento,tipo,cep,cidade,estado,bairro)

                VALUES

                ($1,$2,$3,$4,$5,'psicologo',$6,$7,$8,$9)`,

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

            return res.redirect("/home");

        }

    }

    catch (erro) {

        console.log(erro);

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

        // 🔧 Redireciona para /home — o fetch detecta o redirect via resposta.redirected
        // e redireciona o browser para a URL correta
        return res.redirect("/home");

    } catch (erro) {

        console.log(erro);
        res.status(500).json({ erro: "Erro no servidor. Tente novamente." });

    }

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