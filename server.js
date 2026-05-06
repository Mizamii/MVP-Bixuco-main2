const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const { cpf } = require('cpf-cnpj-validator');

const app = express();

// arquivos do HTML, CSS e JS
app.use(express.static('public'));

// necessário pra pegar dados do form
app.use(express.urlencoded({ extended: true }));

// conectar com o banco
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Yasmin@07', // depois muda isso por segurançaa
  database: 'mvp_bixuco'
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar:', err);
  } else {
    console.log('Conectado ao MySQL! ');
  }
});

app.post('/cadastro-pai', async (req, res) => {
  console.log(req.body);
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
    const checkSql = "SELECT * FROM usuarios WHERE email = ? OR cpf = ?";

    db.query(checkSql, [email, cpfUser], (err, results) => {
      if (err) {
        console.log(err);
        return res.send("Erro no servidor");
      }

      if (results.length > 0) {
        return res.send("Email ou CPF já cadastrado");
      }

      //inserir usuário
      const insertSql = `
        INSERT INTO usuarios (nome, email, cpf, senha, data_nascimento, tipo)
        VALUES (?, ?, ?, ?, ?, 'pai')
      `;

      db.query(insertSql, [nome, email, cpfUser, senhaHash, dataNascimento], (err) => {
        if (err) {
          console.log(err);
          return res.send("Erro ao cadastrar");
        }

        res.send("Usuário (responsável) cadastrado com sucesso");
      });
    });

  } catch (error) {
    console.log(error);
    res.send("Erro interno");
  }
});

// validação simples de CRP, tipo nao existe nenhuma biblioteca publica para validar o CRP entao para o mvp usei uma validação mais sobre o formato doq sobre se existe ou nao
function validarCRP(crp) {
  return /^CRP-\d{2}\/\d{4,6}$/.test(crp);
}

app.post('/cadastro-psicologo', async (req, res) => {
  console.log(req.body);
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
    const checkSql = "SELECT * FROM usuarios WHERE email = ? OR crp = ?";

    db.query(checkSql, [email, crp], (err, results) => {
      if (err) {
        console.log(err);
        return res.send("Erro no servidor");
      }

      if (results.length > 0) {
        return res.send("Email ou CRP já cadastrado");
      }

      //inserir usuário
      const insertSql = `
        INSERT INTO usuarios (nome, email, crp, senha, data_nascimento, tipo)
        VALUES (?, ?, ?, ?, ?, 'psicologo')
      `;

      db.query(insertSql, [nome, email, crp, senhaHash, dataNascimento], (err) => {
        if (err) {
          console.log(err);
          return res.send("Erro ao cadastrar");
        }

        res.send("Usuário (psicólogo) cadastrado com sucesso");
      });
    });

  } catch (error) {
    console.log(error);
    res.send("Erro interno");
  }
});


app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const sql = "SELECT * FROM usuarios WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.log(err);
      return res.send("Erro no servidor");
    }

    if (results.length === 0) {
      return res.send("Usuário não encontrado");
    }

    const usuario = results[0];

    // vai comparar as senhas
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.send("Senha incorreta");
    }

    // identifica tipo de usuário
    if (usuario.tipo === 'pai') {
      return res.send("Login realizado como responsável 👨‍👩‍👧");
    } else if (usuario.tipo === 'psicologo') {
      return res.send("Login realizado como psicólogo 🧠");
    }

    res.send("Login realizado com sucesso 🚀");
  });
});


//iniciar servidor
app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});