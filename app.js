const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const multer = require('multer');
const checkSession = require('./middlewares/sessionCheck'); // Importando o middleware

const app = express();

// Configurando o motor de visualização EJS
app.set('views', path.join(__dirname, 'view'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Configurar armazenamento do multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/uploads', express.static('uploads'));

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

// Configuração da sessão
app.use(session({
    secret: 'minha-chave-super-secreta-para-sessoes-123!@#', //Basicamente isso é cookies
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Defina como true se estiver usando HTTPS
}));

// Rota para processar o cadastro
app.post('/cadastro', (req, res) => {
    const { nome, email, telefone, senha } = req.body;
    // Query para inserir os dados do usuário no banco de dados
    const query = 'INSERT INTO users (nome, email, telefone, senha) VALUES (?, ?, ?, ?)';

    // Inserindo os dados no banco de dados, incluindo o campo 'role'
    db.query(query, [nome, email, telefone, senha], (err, result) => {
        if (err) {
            console.error('Erro ao inserir no MySQL:', err);
            return res.status(500).send('Erro ao cadastrar usuário');
        }

        // Redireciona o usuário ou envia uma resposta de sucesso
        res.redirect('/cadastrosucesso');
    });
});

// Rota para processar o login
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    // Verifica se o email e senha foram fornecidos
    if (!email || !senha) {
        return res.status(400).send('Email e senha são obrigatórios');
    }

    // Query para verificar o login do usuário
    const query = 'SELECT * FROM users WHERE email = ? AND senha = ?';

    db.query(query, [email, senha], (err, results) => {
        if (err) {
            console.error('Erro ao consultar o MySQL:', err);
            return res.status(500).send('Erro no servidor!');
        }

        // Se nenhum usuário for encontrado, retorna erro
        if (results.length === 0) {
            return res.status(401).send('Email ou senha inválidos');
        }

        if (results.length > 0) {
            const user = results[0];

            // Criando a sessão com os dados do usuário
            req.session.user = {
                id: user.id,
                nome: user.nome,
                role: user.role
            };
        }
        // Usuário encontrado
        const user = results[0]; // Obtém o primeiro (e único) resultado

        // Redireciona de acordo com o papel (role) do usuário
        if (user.role === 'usuario') {
            return res.redirect('/dashbord'); // Escritores vão para o dashboard de escritores
        } else if (user.role === 'admin') {
            return res.redirect('/dashbordAdmin'); // Admins vão para o dashboard admin
        } else {
            return res.status(403).send('Acesso negado! Role inválido.');
        }
    });
});

app.post('/profile', upload.single('profileImage'), (req, res) => {
    const { username } = req.body;
    const profileImage = req.file ? req.file.filename : req.session.user.profile_image;

    const query = 'UPDATE users SET nome = ?, profile_image = ? WHERE id = ?';
    db.query(query, [username, profileImage, req.session.user.id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar dados do usuário no MySQL:', err);
            return res.status(500).send('Erro ao atualizar perfil do usuário');
        }

        // Atualiza a sessão com os novos dados
        req.session.user.nome = username;
        req.session.user.profile_image = profileImage;

        res.redirect('/profile');
    });
});

// Rota para exibir um post individual no lerReview.ejs
app.get('/lerReview/:id', (req, res) => {
    const { id } = req.params; // Pegando o ID do post na URL

    const query = 'SELECT * FROM posts WHERE id = ?'; // Buscando o post pelo ID no banco de dados
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Erro ao consultar o MySQL:', err);
            res.status(500).send('Erro ao carregar o post!');
            return;
        }

        if (result.length > 0) {
            // Se o post for encontrado, renderizamos o template e passamos os dados do post
            res.render('lerReview', { post: result[0] }); // Passa o post encontrado para o EJS
        } else {
            // Se o post não for encontrado, renderizamos o template com post = null
            res.render('lerReview', { post: null });
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

// Rota para atualização de perfil
app.post('/profile', upload.single('profileImage'), (req, res) => {
    const { username } = req.body;
    const profileImage = req.file ? req.file.filename : req.session.user.profile_image;

    const query = 'UPDATE users SET nome = ?, profile_image = ? WHERE id = ?';
    db.query(query, [username, profileImage, req.session.user.id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar dados do usuário no MySQL:', err);
            return res.status(500).send('Erro ao atualizar perfil do usuário');
        }

        // Atualiza a sessão com os novos dados após o update no banco
        req.session.user.nome = username;
        req.session.user.profile_image = profileImage;

        res.redirect('/profile'); // Redireciona para a rota GET de /profile
    });
});

// Iniciando o servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
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
    res.render('dicas', { user: req.session.user });
});

app.get('/easter-eggs', (req, res) => {
    res.render('easter-eggs', { user: req.session.user });
});

app.get('/forgot', (req, res) => {
    res.render('forgot', { title: 'Esqueci a senha' });
});

app.get('/reviews', (req, res) => {
    res.render('reviews', { user: req.session.user });
});

app.get('/dashbordAdmin', (req, res) => {
    //if (!req.session.user || req.session.user.role !== 'admin') {
       //return res.status(403).send('Acesso negado!');
    //}
    if (!req.session.user) {
        return res.redirect('/login'); // Redireciona para o login se não estiver logado
    }
    const userId = req.session.user.id;
    db.query('SELECT profile_image FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar imagem de perfil:', err);
            return res.status(500).send('Erro ao carregar o dashboard');
        }
        const profileImage = results[0].profile_image || 'default-avatar.png'; // Imagem padrão se não houver
        // Atualiza a sessão com a imagem de perfil
        req.session.user.profile_image = profileImage;
        // Renderiza o dashboard com a imagem de perfil
    });

    // Renderiza o dashboard para administradores
    res.render('dashbordAdmin', { user: req.session.user });
});

app.get('/dashbord', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redireciona para o login se não estiver logado
    }
    
    const userId = req.session.user.id;
    
    // Consulta para obter a imagem de perfil do usuário
    db.query('SELECT profile_image FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar imagem de perfil:', err);
            return res.status(500).send('Erro ao carregar o dashboard');
        }
        const profileImage = results[0].profile_image || 'default-avatar.png'; // Imagem padrão se não houver
        // Atualiza a sessão com a imagem de perfil
        req.session.user.profile_image = profileImage;
        // Renderiza o dashboard com a imagem de perfil
        res.render('dashbord', { user: req.session.user });
    });
});


app.get('/post', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'escritor') {
        return res.status(403).send('Acesso negado! Faça o login primeiro');
    }

    res.render('post', { title: 'Tela para escrever as reviews' })
});

app.get('/reviewEscritor', (req, res) => {
    res.render('reviewEscritor', { user: req.session.user });
});

app.get('/lerReview', (req, res) => {
    res.render('lerReview', { user: req.session.user });
});

app.get('/cadastrosucesso', (req, res) => {
    res.render('cadastrosucesso', { user: req.session.user }); // Renderiza o EJS cadastrosucesso.ejs
});

app.get('/profile', (req, res) => {
    const userId = req.session.user.id;

    db.query('SELECT nome, role, profile_image FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).send('Erro ao buscar dados do usuário');
        }

        const user = results[0];
        res.render('profile', { user });
    });
});



