import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

let uri: string

if (process.env.MONGO_URI) {
    uri = process.env.MONGO_URI
} else {
    throw new Error('MONGO_URI not found in .env file')
}

const client = new MongoClient(uri)

export async function connect() {
    await client.connect()
}

let db = client.db('mongo-chat-test')

export function getMessages(asker: string, receiver: string, askerTag: string, receiverTag: string) {

    console.log(`asker: ${asker}, receiver: ${receiver}`)

    let messages = db.collection('chats').find({
        $or: [
            { "toUserName": asker, "fromUser": receiver, "toUserTag": askerTag, "fromUserTag": receiverTag },
            { "toUserName": receiver, "fromUser": asker, "toUserTag": receiverTag, "fromUserTag": askerTag }
        ]
    }).limit(20).sort('timestamp', -1).toArray()

    return messages
}

export async function checkIfUserExists(email: string): Promise<boolean> {
    let user = await db.collection('users').findOne({ email: email })

    if (user) {
        return true
    } else {
        return false
    }
}

export async function getUsernameAndTag(email: string, password: string) {
    let user = await db.collection('users').findOne({ email: email, password: password })
    if (!user) {
        throw new Error('User does not exist')
    }


    return {username: user.username, tag: user.tag}
}


export function generateUserTag(username: string) {}