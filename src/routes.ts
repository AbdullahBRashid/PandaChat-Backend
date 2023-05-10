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

    let userExists = checkIfUserExists(json.email, json.password)

    // Resolve promise to check if user exists
    userExists
        .then( (userExists) => {
            if (userExists) {
                generateAccessToken({ email: json.email, password: json.password })
                    .then((token) => {
                        res.json({ token: token })
                    })

            } else {
                res.status(404).send('Wrong credentials')
            }
        })
})


router.post('/token/refresh', (req, res) => {
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
            if (err instanceof jwt.TokenExpiredError) {
                let token = refreshAccessToken({ username: user.username, usertag: user.userTag })
                res.send({ token: token })
                return
            } else {
                res.status(403).send('invalid token')
                return
            }
        }
        
        res.json({ username: user.username, userTag: user.user_tag })
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


async function generateAccessToken({email, password}: {email: string, password: string}) {
    // Resolve promise to get Username and Tag
    let usernameObj = await getUsernameAndTag(email, password)

    let jsonwt = jwt.sign(usernameObj, SECRET_TOKEN, { expiresIn: '3h' })
    return jsonwt
}

function refreshAccessToken({username, usertag}: {username: string, usertag: string}) {
    let usernameObj = { username: username, userTag: usertag }
    return jwt.sign(usernameObj, SECRET_TOKEN, { expiresIn: '3h' })
}