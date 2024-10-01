const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');
const mysql = require('mysql2');

const app = express();

// Configurando o motor de visualização EJS
app.set('views', path.join(__dirname, 'view'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Middleware para analisar o corpo das requisições
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração da conexão com o MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'phpmyadmin', // substitua pelo seu usuário do MySQL
    password: '1421', // substitua pela sua senha do MySQL
    database: 'usuarios' // substitua pelo seu banco de dados
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('Conectado ao MySQL!');
});

// Rota para a página inicial
app.get('/', (req, res) => {
    res.render('index', { title: 'Página Inicial' });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Página Login' });
});

// Rota para a página de cadastro
app.get('/cadastro', (req, res) => {
    res.render('cadastro', { title: 'Cadastro' });
});

app.get('/dicas', (req, res) => {
    res.render('dicas', {title: 'Dicas' })
});

app.get('/easter-eggs', (req, res) => {
    res.render('easter-eggs', { title: 'Segredinhos nos games' });
});

app.get('/forgot', (req, res) => {
    res.render('forgot', { title: 'Esqueci a senha' });
});

app.get('/reviews', (req, res) => {
    res.render('reviews', { title: 'Reviews' });
});

// Rota para processar o cadastro
app.post('/cadastro', (req, res) => {
    const { nome, email, senha, telefone } = req.body;

    // Inserindo os dados no banco de dados
    const query = 'INSERT INTO users (nome, email, senha, telefone) VALUES (?, ?, ?, ?)';
    db.query(query, [nome, email, senha, telefone], (err, results) => {
        if (err) {
            console.error('Erro ao inserir no MySQL:', err);
            res.status(500).send('Erro ao cadastrar!');
            return;
        }
        res.send('Cadastro realizado com sucesso!');
    });
});

// Rota para a página de login
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

// Rota para processar o login
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    // Verifica se o usuário existe no banco de dados
    const query = 'SELECT * FROM users WHERE email = ? AND senha = ?';
    db.query(query, [email, senha], (err, results) => {
        if (err) {
            console.error('Erro ao consultar o MySQL:', err);
            res.status(500).send('Erro no servidor!');
            return;
        }

        if (results.length > 0) {
            // Login bem-sucedido
            res.send('Login realizado com sucesso!');
        } else {
            // Credenciais inválidas
            res.send('Email ou senha incorretos!');
        }
    });
});

// Iniciando o servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
