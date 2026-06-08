const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { cpf } = require('cpf-cnpj-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'mizaminina@gmail.com',
        pass: process.env.EMAIL_PASS || 'ypof xvar yqkt csqs'
    },
    connectionTimeout: 5000,  // 5 segundos pra conectar
    greetingTimeout: 5000,    // 5 segundos pra cumprimento
    socketTimeout: 10000      // 10 segundos pra enviar
});

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


const db = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_7dAgQi9wVomv@ep-tiny-truth-apsty8fo.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});



//bagui para o esqueceu a senha
app.post('/esqueceu-senha', async (req, res) => {
    const { email } = req.body;
 
    try {
        const resultado = await db.query(
            'SELECT id, nome FROM usuarios WHERE email = $1',
            [email]
        );
 
        if (resultado.rows.length === 0) {
            return res.redirect('/EsqueceuSenha?status=nao-encontrado');
        }
 
        const usuario = resultado.rows[0];
 
        const token  = crypto.randomBytes(32).toString('hex');
        const expira = new Date(Date.now() + 60 * 60 * 1000);
 
        await db.query(
            'UPDATE usuarios SET reset_token = $1, reset_token_expira = $2 WHERE id = $3',
            [token, expira, usuario.id]
        );
 
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const link    = `${baseUrl}/redefinir-senha?token=${token}`;
 
        
        try {
            await transporter.sendMail({
                from: '"Bixuco" <mizaminina@gmail.com>',
                to: email,
                subject: 'Redefinir sua senha — Bixuco',
                html: `
                    <h2>Olá, ${usuario.nome}!</h2>
                    <p>Recebemos uma solicitação para redefinir sua senha.</p>
                    <p>Clique no botão abaixo para criar uma nova senha. O link expira em 1 hora.</p>
                    <a href="${link}" style="
                        background:#0AB7FB;
                        color:white;
                        padding:12px 24px;
                        border-radius:8px;
                        text-decoration:none;
                        font-weight:bold;
                        display:inline-block;
                        margin:16px 0;
                    ">Redefinir senha</a>
                    <p style="color:#999;font-size:12px;">
                        Se você não solicitou isso, pode ignorar este email.
                    </p>
                `
            });
        } catch (emailError) {
            console.error('Erro ao enviar email:', emailError);
        }

        res.redirect('/EsqueceuSenha?status=enviado');

    } catch (error) {
        console.error('Erro geral:', error);
        res.redirect('/EsqueceuSenha?status=erro');
    }
});
//pagina do redefinir senha
app.get('/redefinir-senha', async (req, res) => {
    const { token } = req.query;
 
    try {
        // verifica se o token existe e não expirou
        const resultado = await db.query(
            'SELECT id FROM usuarios WHERE reset_token = $1 AND reset_token_expira > NOW()',
            [token]
        );
 
        if (resultado.rows.length === 0) {
            // token inválido ou expirado
            return res.send(`
                <p>Este link expirou ou é inválido.</p>
                <a href="/EsqueceuSenha">Solicitar novo link</a>
            `);
        }
 
        // token válido — mostra formulário de nova senha
        // quando tiver a página pronta, substituir o res.send por res.sendFile
        res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Redefinir senha — Bixuco</title>
            </head>
            <body>
                <h2>Criar nova senha</h2>
                <form action="/redefinir-senha" method="POST">
                    <input type="hidden" name="token" value="${token}">
                    <label>Nova senha</label><br>
                    <input type="password" name="novaSenha" minlength="6" required><br><br>
                    <label>Confirmar nova senha</label><br>
                    <input type="password" name="confirmarSenha" minlength="6" required><br><br>
                    <button type="submit">Salvar nova senha</button>
                </form>
            </body>
            </html>
        `);
 
    } catch (error) {
        console.error(error);
        res.redirect('/EsqueceuSenha?status=erro');
    }
});

//salva nova senha

app.post('/redefinir-senha', async (req, res) => {
    const { token, novaSenha, confirmarSenha } = req.body;
 
    if (novaSenha !== confirmarSenha) {
        return res.send('As senhas não coincidem. <a href="javascript:history.back()">Voltar</a>');
    }
 
    if (novaSenha.length < 6) {
        return res.send('A senha deve ter pelo menos 6 caracteres. <a href="javascript:history.back()">Voltar</a>');
    }
 
    try {
        // verifica token novamente
        const resultado = await db.query(
            'SELECT id FROM usuarios WHERE reset_token = $1 AND reset_token_expira > NOW()',
            [token]
        );
 
        if (resultado.rows.length === 0) {
            return res.send('Link expirado. <a href="/EsqueceuSenha">Solicitar novo link</a>');
        }
 
        const usuario    = resultado.rows[0];
        const senhaHash  = await bcrypt.hash(novaSenha, 10);
 
        // atualiza senha e apaga o token para não poder usar de novo
        await db.query(
            'UPDATE usuarios SET senha = $1, reset_token = NULL, reset_token_expira = NULL WHERE id = $2',
            [senhaHash, usuario.id]
        );
 
        res.redirect('/ContaExistente?sucesso=senha-alterada');
 
    } catch (error) {
        console.error(error);
        res.redirect('/EsqueceuSenha?status=erro');
    }
});
 

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