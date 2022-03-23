const express = require('express')
const path = require('path')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = require('socket.io')(server);
const db = require('./models')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(function (_, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept',
    )
    next()
})

app.use(express.static(path.join(process.cwd(), 'build')))
app.use(express.static(path.join(process.cwd(), 'upload')))

require('./models/connection')
require('./auth/passport')

app.use('/api', require('./routes'))

app.use('*', (_req, res) => {
    const file = path.resolve(process.cwd(), 'build', 'index.html')

    res.sendFile(file)
})

app.use((err, _, res, __) => {
    console.log(err.stack)
    res.status(500).json({
      code: 500,
      message: err.message,
    })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, function () {
  console.log(`Server running on port: ${PORT}`)
})

const users = {}

io.on('connection', socket => {
  socket.on('users:connect', function (userInfo) {
    users[socket.id] = {}
    users[socket.id].username = userInfo.username
    users[socket.id].socketId = socket.id
    users[socket.id].userId = userInfo.userId
    users[socket.id].activeRoom = 'default'
    socket.join('default')
    socket.json.emit('users:list', Object.values(users));
    const room = users[socket.id].activeRoom
    socket.broadcast
      .to(room)
      .emit('users:add', users[socket.id]);
  });

  socket.on('message:add', async function (data) {
    const usersArr = Object.values(users)
    let from, to;
    usersArr.forEach((user) => {
      if (user.userId === data.senderId) from = user.socketId;
      if (user.userId === data.recipientId) to = user.socketId
    })
    try {
      await db.createMessage(data)
    } catch (err) {
      console.log(err);
      return
    }
    
    io.to(from).emit('message:add', data);
    if (to !== from) {
      io.to(to).emit('message:add', data);
    }
  })

  socket.on('message:history', async function (data) {
    let history = []
    try {
      history = await db.getAllMessages(data)
    } catch (err) {
      console.log(err);
      return
    }
    socket.json.emit('message:history', history);
  })

  socket.on('disconnect', function (data) {

    const room = users[socket.id].activeRoom
    socket.leave(room);
    delete users[socket.id];

    socket.broadcast.to(room).emit('users:leave', socket.id);
  });
})

