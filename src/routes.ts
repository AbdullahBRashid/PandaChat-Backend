// Import modules
import dotenv from 'dotenv'
import { Router } from 'express'
import jwt from 'jsonwebtoken'

// Import functions
import { getMessages, getUsernameAndTag, checkIfUserExists } from './mongo'

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
                let userTag = decodedToken.user_tag

                let token = refreshAccessToken({ username: username, usertag: userTag })
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

// Route for getting messages
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
        res.status(400).send('to-user-name is required')
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
            let messages = getMessages(user.username, json['to-user-name'], user.user_tag, json['to-user-tag'])

            // Resolve promise to get messages
            messages.then((messages) => {
                res.json(messages)
            })
        }
    })


})


// Function to generate access token
async function generateAccessToken({email, password}: {email: string, password: string}) {
    // Resolve promise to get Username and Tag
    let usernameObj = await getUsernameAndTag(email, password)

    let jsonwt = jwt.sign(usernameObj, SECRET_TOKEN, { expiresIn: '3h' })
    return jsonwt
}


// Function to refresh access token
function refreshAccessToken({username, usertag}: {username: string, usertag: string}) {
    let usernameObj = { username: username, userTag: usertag }
    return jwt.sign(usernameObj, SECRET_TOKEN, { expiresIn: '3h' })
}