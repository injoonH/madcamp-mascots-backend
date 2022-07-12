import jwt from 'jsonwebtoken';
import '../env.js';

const authentication = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === undefined)
        res.sendStatus(403);
    else {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.SECRET_KEY);
        next();
    }
};

export default authentication;
