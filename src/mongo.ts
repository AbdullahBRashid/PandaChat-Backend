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
export function getMessages(asker: string, receiver: string, askerTag: string, receiverTag: string) {

    console.log(`asker: ${asker}, receiver: ${receiver}, askerTag: ${askerTag}, receiverTag: ${receiverTag}`)

    let messages = db.collection('chats').find({
        $or: [
            { "to_username": asker, "from_username": receiver, "to_user_tag": askerTag, "from_user_tag": receiverTag },
            { "to_username": receiver, "from_username": asker, "to_user_tag": receiverTag, "from_user_tag": askerTag }
        ]
    }).sort('timestamp', -1).limit(20).toArray()

    return messages
}

// Check if user exists in database
export async function checkIfUserExists(email: string, password: string): Promise<boolean> {
    let user = await db.collection('users').findOne({ email: email, password: password })

    if (user) {
        return true
    } else {
        return false
    }
}

// Get username and tag from database
export async function getUsernameAndTag(email: string, password: string) {
    let user = await db.collection('users').findOne({ email: email, password: password })
    if (!user) {
        throw new Error('User does not exist')
    }

    return {username: user.username, user_tag: user.user_tag}
}

// Generate a new tag for new users
export function generateUserTag(username: string) {}