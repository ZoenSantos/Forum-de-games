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

app.get('/dashbordAdmin', (req, res) => {
    res.render('dashbordAdmin', { title: 'Página após o login para os escritores' });
});

app.get('/dashbord', (req, res) => {
    res.render('dashbord', { title: 'Página após o login para os clientes'})
});

app.get('/post', (req, res) => {
    res.render('post', { title: 'Tela para escrever as reviews'})
});

app.get('/reviewEscritor', (req, res) => {
    res.render('reviewEscritor', {title: 'Tela para redirecionar para a tela de post'})
});

app.get('/lerReview', (req, res) => {
    res.render('lerReview', { title: 'Aqui o cliente e escritor poderam ler a review que foi escrita' });
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
            res.redirect('/dashboard');
        } else {
            // Credenciais inválidas
            res.send('Email ou senha incorretos!');
        }
    });
});

app.post('/post', (req, res) => {
    const { titulo, conteudo } = req.body;

    // Inserindo o post no banco de dados
    const query = 'INSERT INTO posts (titulo, conteudo) VALUES (?, ?)';
    db.query(query, [titulo, conteudo], (err, result) => {
        if (err) {
            console.error('Erro ao inserir no MySQL:', err);
            res.status(500).send('Erro ao salvar o post!');
            return;
        }
        res.redirect('/'); // Redireciona para a página inicial ou de posts
    });
});

// Rota para exibir um post individual
app.get('/lerReview/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM posts WHERE id = ?'; // Seleciona o post específico pelo ID
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Erro ao consultar o MySQL:', err);
            res.status(500).send('Erro ao carregar o post!');
            return;
        }

        if (result.length > 0) {
            res.render('lerReview', { post: result[0], title: result[0].titulo }); // Passa o post para o template
        } else {
            res.status(404).send('Post não encontrado');
        }
    });
});

// Rota para retornar todas as postagens em formato JSON
app.get('/api/postagens', (req, res) => {
    const query = 'SELECT * FROM posts';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao consultar o MySQL:', err);
            res.status(500).json({ error: 'Erro ao carregar as postagens!' });
            return;
        }

        // Retorna as postagens como JSON
        res.json(results);
    });
});



// Iniciando o servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
