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

    console.log(`asker: ${asker}, receiver: ${receiver}`)

    let messages = db.collection('chats').find({
        $or: [
            { "to_username": asker, "from_username": receiver },
            { "to_username": receiver, "from_username": asker}
        ]
    }).sort('timestamp', -1).limit(20).toArray()

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