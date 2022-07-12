import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import authRouter from './routes/AuthRouter.js';
import { v4 as uuidv4 } from 'uuid';
import { instrument } from '@socket.io/admin-ui';
import './env.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            'http://172.28.82.242:19006',
            'https://admin.socket.io'
        ],
        credentials: true,
    }
});
const port = process.env.PORT ?? 80;

/* Helmet sets security-related HTTP response headers. */
app.use(helmet());
app.use(cors());

app.use('/auth', authRouter);

app.get('/', (req, res) => {
    res.status(200).json({ title: 'hello world' });
});

app.post('/api/posts', verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err)
            res.sendStatus(403);
        else
            res.json({
                message: 'Post created',
                authData
            });
    });
});

/* Socket */

const playerList = {};
const lobbyList = {};
const gameList = {};

const getLobbyWithNicknames = (lobby) =>
    ({...lobby, players: lobby.players.map(player => playerList[player])});

io.on('connection', (socket) => {
    console.log(`client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log('client disconnected');
    });

    socket.on('login', (nickname) => {
        playerList[socket.id] = nickname;
        console.log('login', playerList);
    });

    socket.on('create-lobby', ({ lobbyName, playerNum }) => {
        console.log(`${playerList[socket.id]}(${socket.id}) created a lobby named ${lobbyName} with ${playerNum} players`);
        const uid = uuidv4();
        lobbyList[uid] = { name: lobbyName, players: [], playerNum };
        socket.emit('create-lobby', uid);
        io.to(process.env.LOBBYLIST_ROOM).emit('new-room-created', lobbyList);
        console.log('lobbyList', lobbyList);
    });

    socket.on('enter-lobbylist', () => {
        console.log(`${socket.id} entered lobbylist`, lobbyList);
        socket.join(process.env.LOBBYLIST_ROOM);
        socket.emit('message', 'you entered lobbylist');
        socket.emit('enter-lobbylist', lobbyList);
    });

    socket.on('leave-lobbylist', () => {
        console.log(`${socket.id} left lobbylist`);
        socket.leave(process.env.LOBBYLIST_ROOM);
        socket.emit('message', 'you left lobbylist');
    });

    socket.on('enter-lobby', (lobbyId) => {
        console.log(`${socket.id} trying to enter a lobby ${lobbyId}`);
        const lobby = lobbyList[lobbyId];

        /* Check if the code is valid */
        if (lobby === undefined) {
            console.log('[ENTER_LOBBY] FAILED :: Invalid lobby code');
            socket.emit('enter-lobby', {
                success: false,
                message: 'Invalid lobby code'
            });
            return;
        }

        /* Check if the lobby is full */
        if (lobby.players.length === lobby.playerNum) {
            console.log('[ENTER_LOBBY] FAILED :: Lobby is full');
            socket.emit('enter-lobby', {
                success: false,
                message: 'Lobby is full'
            });
            return;
        }

        /* Join the lobby */
        socket.join(lobbyId);
        lobbyList[lobbyId].players.push(socket.id);
        socket.emit('enter-lobby', {
            success: true,
            lobbyId: lobbyId
        });

        /* Broadcast to lobby that the player joined */
        // io.to(lobbyId).emit('new-player-enter-room', lobby);
        io.to(lobbyId).emit('new-player-enter-room', getLobbyWithNicknames(lobby));

        // TODO: broadcast to lobbyList that the number of players increased by one
        io.to(process.env.LOBBYLIST_ROOM).emit('lobbylist-updated', lobbyList);

        console.log('[ENTER_LOBBY] SUCCEED')
    });

    socket.on('leave-lobby', (lobbyId) => {
        console.log(`${socket.id} left lobby ${lobbyId}`);
        const lobby = lobbyList[lobbyId];

        /* It never happens */
        if (lobby === undefined)
            return;

        if (lobby.players.length === 1) {
            delete lobbyList[lobbyId];
        } else {
            const index = lobby.players.indexOf(socket.id);
            if (index > -1)
                lobbyList[lobbyId].players.splice(index, 1);
            // TODO: broadcast to lobby that the player left
            socket.to(lobbyId).emit('player-left-room', getLobbyWithNicknames(lobby));

        }
        // TODO: broadcast to lobbyList
        io.to(process.env.LOBBYLIST_ROOM).emit('lobbylist-updated', lobbyList);
        socket.leave(lobbyId);
    });

    socket.on('click-game-start-btn', (lobbyId) => {
        const lobby = lobbyList[lobbyId];

        if (lobby === undefined)
            return;
        
        if (lobby.playerNum !== lobby.players.length) {
            socket.emit('start-game', {
                success: false,
                message: 'Need to wait for some users to join'
            });
            return;
        }

        /* Remove lobby from lobbyList */
        delete lobbyList[lobbyId];
        io.to(process.env.LOBBYLIST_ROOM).emit('lobbylist-updated', lobbyList);

        io.to(lobbyId).emit('start-game', {
            success: true
        });
    });
});

instrument(io, { auth: false });

server.listen(port, () => {
    console.log(`Server is listening @ ${process.env.HOST}:${port}`);
});

function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader === 'undefined')
        res.sendStatus(403);
    else {
        req.token = bearerHeader.split(' ')[1];
        next();
    }
}
