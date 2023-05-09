import dotenv from 'dotenv'
import { Router } from 'express'
import jwt from 'jsonwebtoken'

dotenv.config({
    path: '../.env'
})

export let router = Router()

let SECRET_TOKEN: string;

if (process.env.TOKEN_SECRET) {
    SECRET_TOKEN = process.env.TOKEN_SECRET;
} else {
    throw new Error('TOKEN_SECRET not found in .env file');
}

router.get('/token/new', (req, res) => {
    let token = generateAccessToken('test')
    res.json({ token: token })
})

function generateAccessToken(username: string) {
    return jwt.sign(username, SECRET_TOKEN, { expiresIn: '1800s' });
}