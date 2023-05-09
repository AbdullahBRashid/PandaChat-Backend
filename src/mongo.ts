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