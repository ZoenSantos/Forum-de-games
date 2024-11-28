const notFoundMiddleware = (req, res, next) => {
    res.status(404).send('Página não encontrada.');
};

module.exports = notFoundMiddleware;

