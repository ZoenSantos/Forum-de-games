// middlewares/sessionCheck.js
function checkSession(req, res, next) {
    if (req.session && req.session.user) {
        // O usuário está logado, então prossiga para a próxima função
        next();
    } else {
        // Se o usuário não estiver logado, redireciona para a página de login
        return res.redirect('/login');
    }
}

module.exports = checkSession;
