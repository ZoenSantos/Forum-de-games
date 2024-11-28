const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const multer = require('multer');
const checkSession = require('./middlewares/sessionCheck'); // Importando o middleware
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const isAuthenticated = require('./middlewares/authMiddleware'); // Importação correta do middleware
const router = express.Router();
const app = express();

app.use(express.urlencoded({ extended: true })); // Para lidar com dados de formulários

// Configuração da sessão
app.use(session({
    secret: 'minha-chave-super-secreta-para-sessoes-123!@#', //Basicamente isso é cookies
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Defina como true se estiver usando HTTPS
}));

// Iniciando o servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

// Configurando o motor de visualização EJS
app.set('views', path.join(__dirname, 'views'));
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

// Rota para a página inicial
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        // Se o usuário está logado, redireciona para o dashboard
        return res.redirect('/dashbord');
    }

    res.render('index', { title: 'Página Inicial', user: req.session.user });
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

app.get('/dashbordAdmin', isAuthenticated, (req, res) => {
    // Certifique-se de que o usuário está autenticado e é um admin
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Acesso negado!');
    }

    // Consulta para buscar todos os usuários do banco de dados
    db.query('SELECT id, nome, email, role FROM users', (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuários:', err);
            return res.status(500).send('Erro ao carregar o dashboard');
        }

        // Certifique-se de que "results" está definido e contém os dados de usuários
        if (!results || results.length === 0) {
            console.warn('Nenhum usuário encontrado.');
        }

        // Renderiza o dashboard passando a lista de usuários e o usuário atual
        res.render('dashbordAdmin', { user: req.session.user, users: results });
        console.log(results);
    });
});

app.get('/dashbord', checkSession, isAuthenticated, (req, res) => {
    const userId = req.session.user.id;

    // Consulta 1: Obter posts
    db.query('SELECT * FROM posts WHERE id = ?', [userId], (err, postResults) => {
        if (err) {
            console.error('Erro ao buscar os dados dos posts:', err);
            return res.status(500).send('Erro ao buscar os dados!');
        }

        // Consulta 2: Obter imagem de perfil
        db.query('SELECT profile_image FROM users WHERE id = ?', [userId], (err, profileResults) => {
            if (err) {
                console.error('Erro ao buscar imagem de perfil:', err);
                return res.status(500).send('Erro ao carregar o dashboard');
            }

            // Lógica para imagem de perfil
            const profileImage = profileResults[0]?.profile_image || 'default-avatar.png';
            req.session.user.profile_image = profileImage;

            // Lógica de redirecionamento
            if (req.session.user.role === 'admin') {
                return res.redirect('/dashbordAdmin');
            } else if (req.session.user.role === 'usuario') {
                return res.render('dashbord', {
                    user: req.session.user,
                    posts: postResults,
                    title: 'Dashboard do Usuário',
                });
            } else {
                return res.status(403).send('Acesso negado! Role inválido.');
            }
        });
    });
});


app.get('/post', /* checkSession, */(req, res) => {    // Verifica se o usuário está logado e se sua role é 'usuario' ou 'admin'
    if (!req.session.user || (req.session.user.role !== 'usuario' && req.session.user.role !== 'admin')) {
        return res.status(403).send('Acesso negado! Faça o login primeiro');
    }

    // Se a verificação passou, renderiza a página 'post'
    res.render('post', { title: 'Tela para escrever as reviews' });
});

app.get('/postDicas', (req, res) => {
    if (!req.session.user || (req.session.user.role !== 'usuario' && req.session.user.role !== 'admin')) {
        return res.status(403).send('Acesso negado! Faça o login primeiro');
    }

    // Se a verificação passou, renderiza a página 'post'
    res.render('postDicas', { title: 'Tela para escrever as reviews' });
});

app.get('/reviewEscritor', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Acesso negado!');
    }

    // Consulta para buscar os usuários
    db.query('SELECT id, nome, email, role FROM users', (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuários:', err);
            return res.status(500).send('Erro ao carregar o dashboard');
        }

        // Renderiza a página apenas após a consulta ser concluída
        res.render('reviewEscritor', { user: req.session.user, users: results });
    });
});

app.get('/lerReview', (req, res) => {
    res.render('lerReview', { user: req.session.user });
});

app.get('/lerDicas', (req, res) => {
    res.render('lerDicas', { user: req.session.user });
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

// Rota para logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao destruir a sessão:', err);
            return res.status(500).send('Erro ao sair');
        }
        res.redirect('/'); // Redireciona para a página inicial após o logout
    });
});

// Rota para deletar um usuário
app.get('/admin/deletar-usuario/:id', checkSession, (req, res) => {
    const userId = req.params.id;

    // Função para deletar o usuário do banco de dados
    deleteUserById(userId, (err) => {
        if (err) {
            return res.status(500).send('Erro ao deletar o usuário');
        }

        res.redirect('/dashboardAdmin'); // Redireciona de volta para o painel de administração após a exclusão
    });
});

// Rota para renderizar a página de edição de usuário
app.get('/admin/editar-usuario/:id', checkSession, (req, res) => {
    const userId = req.params.id;

    // Aqui você buscaria o usuário no banco de dados pelo ID
    // Vamos assumir que você tem uma função chamada findUserById para isso
    findUserById(userId, (err, user) => {
        if (err || !user) {
            return res.status(404).send('Usuário não encontrado');
        }

        // Renderize uma página de edição, passando os dados do usuário
        res.render('editar-usuario', { user });
    });
});

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

// Rota para processar o cadastro
app.post('/cadastro', (req, res) => {
    const { nome, email, telefone, senha, confirmarSenha } = req.body;
    // Query para inserir os dados do usuário no banco de dados
    const sql = 'INSERT INTO users (nome, email, telefone, senha) VALUES (?, ?, ?, ?)';

    // Validações
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com)$/;
    const isTelefoneValid = /^\d+$/.test(telefone);
    const isEmailValid = emailPattern.test(email);

    if (!isTelefoneValid) {
        return res.render('cadastro', { error: "O telefone deve conter apenas números." });
    }

    if (!isEmailValid) {
        return res.render('cadastro', { error: "O email deve ser um @gmail.com ou @outlook.com." });
    }

    if (senha !== confirmarSenha) {
        return res.render('cadastro', { error: "As senhas não coincidem!" });
    }


    // Inserindo os dados no banco de dados, incluindo o campo 'role'
    db.query(sql, [nome, email, telefone, senha], (err, results) => {
        if (err) {
            // Verifica se o erro é de duplicidade
            if (err.code === 'ER_DUP_ENTRY') {
                // Identifica se foi o email ou telefone duplicado
                let errorMessage;
                if (err.message.includes('email')) {
                    errorMessage = 'Algum dado já foi registrado';
                } else if (err.message.includes('telefone')) {
                    errorMessage = 'Algum dado já foi registrado';
                } else {
                    errorMessage = 'Erro de duplicidade. Verifique seus dados.';
                }

                // Envia a mensagem de erro para a página de cadastro
                return res.render('cadastro', { error: errorMessage });
            } else {
                console.error('Erro ao realizar cadastro:', err);
                return res.status(500).send('Erro no servidor');
            }
        }

        // Redireciona ou exibe uma mensagem de sucesso após o cadastro
        res.redirect('/cadastrosucesso');
    });
});

// Rota para processar o login
app.post('/login', async (req, res) => {
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
            const user = results[0]; // Obtém o primeiro (e único) resultado
        
            // Criação da sessão
            req.session.user = {
                id: user.id,
                nome: user.nome,
                role: user.role,
            };
        
            // Salva o ID do usuário na sessão
            req.session.userId = user.id;
        
            // Redireciona de acordo com o papel (role) do usuário
            if (user.role === 'usuario') {
                return res.redirect('/dashbord'); // Escritores vão para o dashboard de escritores
            } else if (user.role === 'admin') {
                return res.redirect('/dashbordAdmin'); // Admins vão para o dashboard admin
            } else {
                return res.status(403).send('Acesso negado! Role inválido.');
            }
        } else {
            // Caso nenhum usuário seja encontrado
            res.send('Usuário ou senha inválidos');
        }
    });
});

// Rota para deletar um post pelo ID - Apenas para admin
app.post('/deletarPost/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Acesso negado! Apenas administradores podem deletar posts.');
    }

    const postId = req.params.id;
    const query = 'DELETE FROM posts WHERE id = ?';

    db.query(query, [postId], (err, result) => {
        if (err) {
            console.error('Erro ao deletar post no MySQL:', err);
            return res.status(500).send('Erro ao deletar o post!');
        }

        res.status(200).send('Post deletado com sucesso!'); // Responde com status 200 em caso de sucesso
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

app.delete('/admin/deletar-usuario/:id', (req, res) => {
    const userId = req.params.id;

    // Verificar se o usuário tem permissão de admin para deletar usuários
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Acesso negado! Apenas administradores podem deletar usuários.');
    }

    // Query para deletar o usuário do banco de dados
    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Erro ao deletar usuário no MySQL:', err);
            return res.status(500).send('Erro ao deletar o usuário.');
        }

        res.status(200).send('Usuário deletado com sucesso!');
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

app.get('/lerDicas/:idDicas', (req, res) => {
    const { idDicas } = req.params; // Pegando o ID do post na URL

    const query = 'SELECT * FROM postsDicas WHERE idDicas = ?'; // Buscando o post pelo ID no banco de dados
    db.query(query, [idDicas], (err, result) => {
        if (err) {
            console.error('Erro ao consultar o MySQL:', err);
            res.status(500).send('Erro ao carregar o post!');
            return;
        }

        if (result.length > 0) {
            // Se o post for encontrado, renderizamos o template e passamos os dados do post
            res.render('lerDicas', { post: result[0] }); // Passa o post encontrado para o EJS
        } else {
            // Se o post não for encontrado, renderizamos o template com post = null
            res.render('lerDicas', { post: null });
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

// Rota para retornar todas as postagens em formato JSON
app.get('/api/postagensDicas', (req, res) => {
    const query = 'SELECT * FROM postsDicas';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao consultar o MySQL:', err);
            res.status(500).json({ error: 'Erro ao carregar as dicas!' });
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

app.post('/admin/editar-usuario', (req, res) => {
    const { id, nome, email, role } = req.body;

    // Verificar se o usuário tem permissão de admin para realizar a edição
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Acesso negado! Apenas administradores podem editar usuários.');
    }

    // Atualizar as informações do usuário no banco de dados
    const query = 'UPDATE users SET nome = ?, email = ?, role = ? WHERE id = ?';
    db.query(query, [nome, email, role, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar o usuário no MySQL:', err);
            return res.status(500).send('Erro ao atualizar o usuário.');
        }

        res.redirect('/dashbordAdmin'); // Redireciona de volta para o painel admin
    });
});

app.post('/post', (req, res) => {
    const { titulo, conteudo } = req.body;
    const query = 'INSERT INTO posts (titulo, conteudo) VALUES (?, ?)';

    db.query(query, [titulo, conteudo], (err, result) => {
        if (err) {
            console.error('Erro ao criar o post no MySQL:', err);
            return res.status(500).send('Erro ao criar o post.');
        }
        res.redirect('/dashbord'); // Redireciona após a criação do post
    });
});

app.post('/postDicas', (req, res) => {
    const { titulo, conteudo } = req.body;
    const query = 'INSERT INTO postsDicas (titulo, conteudo) VALUES (?, ?)';

    db.query(query, [titulo, conteudo], (err, result) => {
        if (err) {
            console.error('Erro ao criar o post dica no MySQL:', err);
            return res.status(500).send('Erro ao criar o post.');
        }
        res.redirect('/dashbord'); // Redireciona após a criação do post
    });
});


//Usando o middleware
app.use(isAuthenticated);

// Usando o middleware
app.use(notFoundMiddleware);
