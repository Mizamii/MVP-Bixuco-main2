const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { cpf } = require('cpf-cnpj-validator');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET || 'bixuco2024',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// arquivos estáticos
app.use(express.static(path.join(__dirname, 'static')));

// pegar dados do formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.get('/logar', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'logar.html'));
});

app.get('/ContaExistente', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'ContaExistente.html'));
});

app.get('/CriarContaS', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'CriarContaS.html'));
});

app.get('/CriarContaP', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'CriarContaP.html'));
});

app.get('/CriarContaG', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'CriarContaG.html'));
});

app.get('/QuestionarioP', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'QuestionarioP.html'));
});

app.get('/EsqueceuSenha', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'EsqueceuSenha.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'home.html'));
});

app.get('/AdicionarC', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'AdicionarC.html'));
});


const db = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_7dAgQi9wVomv@ep-tiny-truth-apsty8fo.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${process.env.BASE_URL || 'http://localhost:3000'}/auth/google/callback`
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const nome  = profile.displayName;

        const resultado = await db.query(
            'SELECT * FROM usuarios WHERE email = $1', [email]
        );

        if (resultado.rows.length > 0) {
            return done(null, resultado.rows[0]);
        }

        const insert = await db.query(
            `INSERT INTO usuarios (nome, email, tipo, senha)
             VALUES ($1, $2, 'pai', '') RETURNING *`,
            [nome, email]
        );

        return done(null, insert.rows[0]);

    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((usuario, done) => {
    done(null, usuario.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const resultado = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        done(null, resultado.rows[0]);
    } catch (err) {
        done(err, null);
    }
});


app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/logar' }),
    (req, res) => {
        res.redirect('/home');
    }
);
 

app.post('/cadastro-pai', async (req, res) => {

  const { nome, email, cpfUser, senha, dataNascimento, cep, cidade, estado, bairro } = req.body;

  // validar CPF
  if (!cpf.isValid(cpfUser)) {
    return res.send("CPF inválido");
  }

  // validar email
  if (!email || !email.includes('@')) {
    return res.send("Email inválido");
  }

  // validar senha
  if (!senha || senha.length < 6) {
    return res.send("Senha deve ter pelo menos 6 caracteres");
  }

  try {

    // criptografar senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // verificar se já existe
    const checkSql = `
      SELECT * FROM usuarios 
      WHERE email = $1 OR cpf = $2
    `;

    const resultado = await db.query(checkSql, [email, cpfUser]);

    if (resultado.rows.length > 0) {
      return res.send("Email ou CPF já cadastrado");
    }

    // inserir usuário
    const insertSql = `
      INSERT INTO usuarios
      (nome, email, cpf, senha, data_nascimento, tipo, cep, cidade, estado, bairro)
      VALUES ($1, $2, $3, $4, $5, 'pai', $6, $7, $8, $9)
    `;

    await db.query(insertSql, [
      nome,
      email,
      cpfUser,
      senhaHash,
      dataNascimento,
      cep,
      cidade,
      estado,
      bairro
    ]);

    res.redirect('/QuestionarioP');

  } catch (error) {

    console.log(error);
    res.send("Erro interno");

  }

});



function validarCRP(crp) {
  return /^CRP-\d{2}\/\d{4,6}$/.test(crp);
}


app.post('/cadastro-psicologo', async (req, res) => {

  const { nome, email, crp, senha, dataNascimento, cep, cidade, estado, bairro } = req.body;

  // validar CRP
  if (!validarCRP(crp)) {
    return res.send("CRP inválido");
  }

  // validar email
  if (!email || !email.includes('@')) {
    return res.send("Email inválido");
  }

  // validar senha
  if (!senha || senha.length < 6) {
    return res.send("Senha deve ter pelo menos 6 caracteres");
  }

  try {

    // criptografar senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // verificar se já existe
    const checkSql = `
      SELECT * FROM usuarios 
      WHERE email = $1 OR crp = $2
    `;

    const resultado = await db.query(checkSql, [email, crp]);

    if (resultado.rows.length > 0) {
      return res.send("Email ou CRP já cadastrado");
    }

    // inserir usuário
    const insertSql = `
      INSERT INTO usuarios
      (nome, email, crp, senha, data_nascimento, tipo, cep, cidade, estado, bairro)
      VALUES ($1, $2, $3, $4, $5, 'psicologo', $6, $7, $8, $9)
    `;

    await db.query(insertSql, [
      nome,
      email,
      crp,
      senhaHash,
      dataNascimento,
      cep,
      cidade,
      estado,
      bairro
    ]);

    res.redirect('/home');

  } catch (error) {

    console.log(error);
    res.send("Erro interno");

  }

});


app.post('/login', async (req, res) => {

  const { email, senha } = req.body;

  try {

    const sql = `
      SELECT * FROM usuarios
      WHERE email = $1
    `;

    const resultado = await db.query(sql, [email]);

    if (resultado.rows.length === 0) {
      return res.send("Usuário não encontrado");
    }

    const usuario = resultado.rows[0];

    // comparar senha
    const senhaValida = await bcrypt.compare(
      senha,
      usuario.senha
    );

    if (!senhaValida) {
      return res.send("Senha incorreta");
    }

    // identificar tipo
    if (usuario.tipo === 'pai') {
      return res.redirect('/home');
    }

    if (usuario.tipo === 'psicologo') {
      return res.redirect('/home');
    }

    res.send("Login realizado com sucesso");

  } catch (error) {

    console.log(error);
    res.send("Erro no servidor");

  }

});


app.get('/usuarios', async (req, res) => {

  try {

    const resultado = await db.query(`
      SELECT *
      FROM usuarios
      ORDER BY id ASC
    `);

    res.json(resultado.rows);

  } catch (error) {

    console.log(error);
    res.send("Erro ao buscar usuários");

  }

});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});