type Room = {
    password: string,
    [key: string]: string,
}

type Rooms = {
    [key: string]: Room,
}

let rooms:Rooms = {}

export function userJoin (socketId: string, username: string, room: string, password: string) {

    let roomData = {
        password: password,
    }

    if (!rooms[room] || (rooms[room] && !rooms[room].password)) {

        rooms[room] = roomData;
        rooms[room][socketId] = username;
        
        return true;
    } else {

        if (rooms[room].password == password) {
            
            rooms[room][socketId] = username;
            return true;
        } else {
            return false;
        }
    }
}

export function checkIsInRoom(socketId: string, room: string) {
    if (rooms[room] && rooms[room][socketId]) {
        return true;
    } else {
        return false;
    }
}

export function getUsername(socketId: string, room: string) {
    return rooms[room][socketId];
}