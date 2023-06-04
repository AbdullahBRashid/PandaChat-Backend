// Import modules
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

// Load .env file
dotenv.config()

// Get uri from .env file
let uri: string

if (process.env.MONGO_URI) {
    uri = process.env.MONGO_URI
} else {
    throw new Error('MONGO_URI not found in .env file')
}

// Create client
const client = new MongoClient(uri)

// Connect to client
export async function connect() {
    await client.connect()
}

// Get database
let db = client.db('mongo-chat-test')

// Export functions

// Get latest 20 messages from database
export function getMessages(asker: string, receiver: string) {

    let messages = db.collection('chats').find({
        $or: [
            { "to": asker, "from": receiver },
            { "to": receiver, "from": asker}
        ]
    }).sort('timestamp').limit(20).toArray()

    return messages
}

// Check if user exists in database
export async function getUser(email: string, password: string): Promise<{exists: Boolean, username: string | null}> {
    let user = await db.collection('users').findOne({ email: email, password: password })

    if (user) {
        return { exists: true, username: user.username }
    } else {
        return { exists: false, username: null }
    }
}

export async function getContacts(username: string) {
    let chats = db.collection('chats').find({ $or: [{ to: username }, { from: username }] }).toArray()
    let contacts: any[] = []

    await chats.then((chats) => {
        for (let chat of chats) {
            if (chat.to === username && !contacts.includes(chat.from)) {
                contacts.push(chat.from)
            } else if (chat.from === username && !contacts.includes(chat.to)) {
                contacts.push(chat.to)
            }
        }
        contacts = contacts
    })

    return contacts
}

export function saveMessage(to: string, from: string, message: string) {
    let messageObject = {
        to: to,
        from: from,
        message: message,
        timestamp: Date.now()
    }
    db.collection('chats').insertOne(messageObject)
}