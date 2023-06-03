// Import modules
import dotenv from 'dotenv'
import { Router } from 'express'
import jwt from 'jsonwebtoken'

// Import functions
import { getMessages, getUser, getChatNames } from './mongo'

// Load .env file
dotenv.config()

// Create and export router
export let router = Router()

// Get secret token from .env file
let SECRET_TOKEN: string;

if (process.env.TOKEN_SECRET) {
    SECRET_TOKEN = process.env.TOKEN_SECRET;
} else {
    throw new Error('TOKEN_SECRET not found in .env file');
}

router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader('Access-Control-Allow-Methods', '*')
    res.setHeader('Access-Control-Expose-Headers', '*')
    next()
})

// Route for new token (Login)
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

    let user = getUser(json.email, json.password)
                .then((user) => {
                    if (user['exists']) {
                        let token = jwt.sign({ username: user.username }, SECRET_TOKEN, { expiresIn: '1h' })
                        res.json({ token: token, username: user.username })
                    } else {
                        res.status(403).send('invalid credentials')
                    }
                })
})


// Route for refresh token
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

                let decodedToken: jwt.JwtPayload;
                decodedToken = jwt.decode(json.token) as jwt.JwtPayload
                let username = decodedToken.username
            

                let token = refreshAccessToken({ username: username })
                res.send({ token: token })
                return
            } else {
                res.status(403).send('invalid token')
                return
            }
        }

        res.json({ username: user.username })
    })
})

// Route for verifying token
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

        res.json({ username: user.username })
    })
})

// Route for getting messages
router.post('/messages/name', (req, res) => {
    let json = req.body

    if (typeof(json) != 'object') {
        res.status(400).send('invalid json')
        return
    }

    if (!json.token) {
        res.status(400).send('token is required')
        return
    }

    if (!json['toUser']) {
        res.status(400).send('toUser is required')
        return
    }

    jwt.verify(json.token, SECRET_TOKEN, (err: any, user: any) => {
        if (err) {
            res.status(403).send('invalid token')
            return
        } else {
            let messages = getMessages(user.username, json['toUser'])

            // Resolve promise to get messages
            messages.then((messages) => {
                res.json(messages)
            })
        }
    })
})

// To get messages
router.post('/messages/names', (req, res) => {
    let json = req.body

    if (typeof(json) != 'object') {
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
        } else {
            let messages = getChatNames(user.username)

            // Resolve promise to get messages
            messages.then((messages) => {
                console.log(messages)
                res.json(messages)
            })
        }
    })
})


// Function to refresh access token
function refreshAccessToken({username}: {username: string}) {
    let usernameObj = { username: username }
    return jwt.sign(usernameObj, SECRET_TOKEN, { expiresIn: '3h' })
}