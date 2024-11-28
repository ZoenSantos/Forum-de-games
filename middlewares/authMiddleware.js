const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next(); // Usuário está logado, prossiga
    } else {
        res.redirect('/login'); // Redirecione para a página de login se não estiver logado
    }
};

module.exports = isAuthenticated;
