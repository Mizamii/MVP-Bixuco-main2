const express = require('express');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { cpf } = require('cpf-cnpj-validator');

const app = express();

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


const db = new Client({
  connectionString: 'postgresql://mvp_r7wd_user:bJ9M5LHkUhjvNNymFJG9FHAADs9ofeCN@dpg-d7ts34dckfvc73ebqv80-a.oregon-postgres.render.com/mvp_r7wd',

  ssl: {
    rejectUnauthorized: false
  }
});

db.connect()
  .then(() => {
    console.log('Conectado ao PostgreSQL! ');
  })
  .catch(err => {
    console.error('Erro ao conectar:', err);
  });



app.post('/cadastro-pai', async (req, res) => {

  const { nome, email, cpfUser, senha, dataNascimento } = req.body;

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
      (nome, email, cpf, senha, data_nascimento, tipo)
      VALUES ($1, $2, $3, $4, $5, 'pai')
    `;

    await db.query(insertSql, [
      nome,
      email,
      cpfUser,
      senhaHash,
      dataNascimento
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

  const { nome, email, crp, senha, dataNascimento } = req.body;

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
      (nome, email, crp, senha, data_nascimento, tipo)
      VALUES ($1, $2, $3, $4, $5, 'psicologo')
    `;

    await db.query(insertSql, [
      nome,
      email,
      crp,
      senhaHash,
      dataNascimento
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
      return res.send('/home');
    }

    if (usuario.tipo === 'psicologo') {
      return res.send('/home');
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