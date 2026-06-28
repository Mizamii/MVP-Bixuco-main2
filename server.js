const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { cpf } = require('cpf-cnpj-validator');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const app = express();

/* ==========================
   SESSÃO
========================== */

app.use(session({
    secret: process.env.SESSION_SECRET || "bixuco2024",
    resave: false,
    saveUninitialized: false
}));

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

app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname, "templates", "home.html"));
});

/* ==========================
   BANCO DE DADOS
========================== */

const db = new Pool({

    connectionString:
        "postgresql://neondb_owner:npg_7dAgQi9wVomv@ep-tiny-truth-apsty8fo.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require",

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

    try{

        const email = profile.emails[0].value;

        const nome = profile.displayName;

        const resultado = await db.query(

            "SELECT * FROM usuarios WHERE email = $1",

            [email]

        );

        if(resultado.rows.length > 0){

            return done(null, resultado.rows[0]);

        }

        const novoUsuario = await db.query(

            `INSERT INTO usuarios
            (nome,email,tipo,senha)
            VALUES($1,$2,'pai','')
            RETURNING *`,

            [nome,email]

        );

        return done(null, novoUsuario.rows[0]);

    }

    catch(err){

        return done(err,null);

    }

}));

passport.serializeUser((usuario, done)=>{

    done(null, usuario.id);

});

passport.deserializeUser(async(id, done)=>{

    try{

        const resultado = await db.query(

            "SELECT * FROM usuarios WHERE id=$1",

            [id]

        );

        done(null, resultado.rows[0]);

    }

    catch(err){

        done(err,null);

    }

});

app.get(

    "/auth/google",

    passport.authenticate("google",{

        scope:["profile","email"]

    })

);

app.get(

    "/auth/google/callback",

    passport.authenticate(

        "google",

        {

            failureRedirect:"/logar"

        }

    ),

    (req,res)=>{

        res.redirect("/home");

    }

);

/* ==========================
   FUNÇÃO AUXILIAR
========================== */

function validarCRP(crp){

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

        return res.send("As senhas não coincidem.");

    }

    if (!senha || senha.length < 6) {

        return res.send("Senha deve possuir pelo menos 6 caracteres.");

    }

    try {

        const senhaHash = await bcrypt.hash(senha, 10);

        /* =====================
           RESPONSÁVEL
        ===================== */

        if (dados.tipo === "pai") {

            if (!cpf.isValid(dados.cpfUser)) {

                return res.send("CPF inválido");

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

                return res.send("Email ou CPF já cadastrado.");

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

                return res.send("CRP inválido");

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

                return res.send("Email ou CRP já cadastrado.");

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

        res.send("Erro interno.");

    }

});
// =======================
// LOGIN
// =======================

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
            return res.send("Usuário não encontrado");
        }

        const usuario = resultado.rows[0];

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaValida) {
            return res.send("Senha incorreta");
        }

        // salva o tipo do usuário na sessão
        req.session.tipo = usuario.tipo;

        if (usuario.tipo === "pai") {
            return res.redirect("/home");
        }

        if (usuario.tipo === "psicologo") {
            return res.redirect("/home");
        }

        res.redirect("/home");

    } catch (erro) {

        console.log(erro);
        res.send("Erro no servidor");

    }

});


// =======================
// LISTAR USUÁRIOS
// =======================

app.get('/usuarios', async (req, res) => {

    try {

        const resultado = await db.query(`
            SELECT *
            FROM usuarios
            ORDER BY id ASC
        `);

        res.json(resultado.rows);

    } catch (erro) {

        console.log(erro);
        res.send("Erro ao buscar usuários");

    }

});


// =======================
// INICIAR SERVIDOR
// =======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Servidor rodando na porta ${PORT}`);

});