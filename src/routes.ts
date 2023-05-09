import dotenv from 'dotenv'
import { Router } from 'express'
import { getMessages } from './mongo'
import jwt from 'jsonwebtoken'

dotenv.config()

export let router = Router()

let SECRET_TOKEN: string;

if (process.env.TOKEN_SECRET) {
    SECRET_TOKEN = process.env.TOKEN_SECRET;
} else {
    throw new Error('TOKEN_SECRET not found in .env file');
}

router.post('/token/new', (req, res) => {
    let json = req.body

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


router.post('/token/verify', (req, res) => {
    let json = req.body

    if (typeof(json) !== 'object') {
        res.status(400).send('invalid json')
        return
    }

    if (!json.token) {
        res.status(400).send('token is required')
        return
    }

    jwt.verify(json.token, SECRET_TOKEN, (err: any, user: any) => {
        if (err) {
            res.status(403).send('invalid token')
            return
        }

        res.json({ username: user.username, userTag: user.userTag })
    })
})


router.get('/messages', (req, res) => {
    let json = req.body

    if (typeof(json) != 'object') {
        res.status(400).send('invalid json')
        return
    }

    if (!json.token) {
        res.status(400).send('token is required')
        return
    }

    if (!json['to-user-name']) {
        res.status(400).send('to-user is required')
        return
    }

    if (!json['to-user-tag']) {
        res.status(400).send('to-user-tag is required')
        return
    }

    jwt.verify(json.token, SECRET_TOKEN, (err: any, user: any) => {
        if (err) {
            res.status(403).send('invalid token')
            return
        } else {
            let messages = getMessages(user.username, json['to-user-name'], user.userTag, json['to-user-tag'])

            messages.then((messages) => {
                res.json(messages)
            })
        }
    })


})

function generateAccessToken({username}: {username: string}) {
    // let userTag = generateUserTag(username)
    let usernameObj = { username: username }
    return jwt.sign(usernameObj, SECRET_TOKEN, { expiresIn: '1800s' })
}