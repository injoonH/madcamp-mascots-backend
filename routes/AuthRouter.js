import { Router } from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import UserModel from '../models/UserModel.js';
import '../env.js';

const router = Router();
const jsonParser = bodyParser.json();

const saltRounds = 10;

router.post('/signup', jsonParser, async (req, res) => {
    const { nickname, password } = req.body;

    /* Check if nickname is in use */
    const isNicknameInUse = await UserModel.isNicknameInUse(nickname);
    if (isNicknameInUse) {
        res.json({
            success: false,
            message: 'Nickname is already in use.'
        });
        return;
    }

    /* Store hashed password in DB */
    const passwdHash = await bcrypt.hash(password, saltRounds);
    const uid = await UserModel.signUpUser(nickname, passwdHash);
    const user = { uid, nickname };
    console.log('Sign up:', user);

    jwt.sign({ user }, process.env.SECRET_KEY, (err, token) => {
        res.status(200).json({
            success: true,
            token
        });
    });
});

router.post('/login', jsonParser, async (req, res) => {
    const { nickname, password } = req.body;

    const user = await UserModel.findByNickname(nickname);
    if (user === null) {
        res.json({
            success: false,
            message: 'No such user.'
        });
        return;
    }

    const isPasswdEqual = await bcrypt.compare(password, user.passwd);
    if (!isPasswdEqual) {
        res.json({
            success: false,
            message: 'Wrong password.'
        });
        return;
    }

    jwt.sign({ user }, process.env.SECRET_KEY, (err, token) => {
        res.status(200).json({
            success: true,
            token
        });
    });
});

export default router;
