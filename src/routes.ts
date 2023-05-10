import dotenv from 'dotenv'
import { Router } from 'express'
import { getMessages, getUsernameAndTag, checkIfUserExists } from './mongo'
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

    if (!json.password) {
        res.status(400).send('password is required')
        return
    }

    if (!json.email) {
        res.status(400).send('email is required')
        return
    }

    let userExists = checkIfUserExists(json.email)

    // Resolve promise to check if user exists
    userExists
        .then( (userExists) => {
            if (userExists) {
                let token = generateAccessToken({ email: json.email, password: json.password })
                res.json({ token: token })
            } else {
                res.status(400).send('User does not exist')
            }
        })
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

            // Resolve promise to get messages
            messages.then((messages) => {
                res.json(messages)
            })
        }
    })


})


function generateAccessToken({email, password}: {email: string, password: string}) {
    // Resolve promise to get Username and Tag
    getUsernameAndTag(email, password)
        .then( ({username, tag}) => {
            let usernameObj = { username: username, userTag: tag }
            return jwt.sign(usernameObj, SECRET_TOKEN, { expiresIn: '3h' })
        })
}