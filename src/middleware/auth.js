import jwt from 'jsonwebtoken';

// Adicione uma chave secreta para a sua aplicação
const JWT_SECRET = '3DehqxNjNSloPV6R';

function auth(req, res, next) {
    const token = req.header('Authorization');

    // Verifica se não há token
    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token inválido.' });
    }
}

export default auth;