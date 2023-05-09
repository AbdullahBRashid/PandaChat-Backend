import dotenv from 'dotenv'
import { Router } from 'express'
import jwt from 'jsonwebtoken'

dotenv.config()

export let router = Router()

let SECRET_TOKEN: string;

if (process.env.TOKEN_SECRET) {
    SECRET_TOKEN = process.env.TOKEN_SECRET;
} else {
    throw new Error('TOKEN_SECRET not found in .env file');
}

router.get('/token/new', (req, res) => {
    let json = req.body

    console.log(json)

    if (typeof(json) !== 'object') {
        res.status(400).send('invalid json')
        return
    }

    if (!json.username) {
        res.status(400).send('username is required')
        return
    }

    if (!json.password) {
        res.status(400).send('password is required')
        return
    }

    let token = generateAccessToken({ username: json.username })
    res.json({ token: token })
})

function generateAccessToken({username}: {username: string}) {
    let usernameObj = { username: username }
    return jwt.sign(usernameObj, SECRET_TOKEN, { expiresIn: '1800s' })
}