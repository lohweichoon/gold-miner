const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*' },
})

const PORT = process.env.PORT || 3001

// ── Item layout ───────────────────────────────────────────────────
const ITEM_TEMPLATES = [
  { id: 0,  type: 'gold_large',  rx: 0.12, ry: 0.28, value: 400, weight: 6,  radius: 34 },
  { id: 1,  type: 'gold_large',  rx: 0.45, ry: 0.50, value: 400, weight: 6,  radius: 34 },
  { id: 2,  type: 'gold_large',  rx: 0.80, ry: 0.32, value: 400, weight: 6,  radius: 34 },
  { id: 3,  type: 'gold_medium', rx: 0.26, ry: 0.18, value: 150, weight: 3,  radius: 22 },
  { id: 4,  type: 'gold_medium', rx: 0.62, ry: 0.22, value: 150, weight: 3,  radius: 22 },
  { id: 5,  type: 'gold_medium', rx: 0.08, ry: 0.62, value: 150, weight: 3,  radius: 22 },
  { id: 6,  type: 'gold_medium', rx: 0.90, ry: 0.55, value: 150, weight: 3,  radius: 22 },
  { id: 7,  type: 'gold_small',  rx: 0.36, ry: 0.42, value:  50, weight: 1,  radius: 13 },
  { id: 8,  type: 'gold_small',  rx: 0.54, ry: 0.68, value:  50, weight: 1,  radius: 13 },
  { id: 9,  type: 'gold_small',  rx: 0.70, ry: 0.80, value:  50, weight: 1,  radius: 13 },
  { id: 10, type: 'diamond',     rx: 0.44, ry: 0.84, value: 500, weight: 1,  radius: 16 },
  { id: 11, type: 'rock_large',  rx: 0.22, ry: 0.44, value:  25, weight: 10, radius: 28 },
  { id: 12, type: 'rock_large',  rx: 0.58, ry: 0.62, value:  25, weight: 10, radius: 28 },
  { id: 13, type: 'rock_small',  rx: 0.34, ry: 0.74, value:  10, weight: 5,  radius: 17 },
  { id: 14, type: 'bag',         rx: 0.16, ry: 0.78, value:   0, weight: 2,  radius: 21 },
  { id: 15, type: 'bag',         rx: 0.74, ry: 0.72, value:   0, weight: 2,  radius: 21 },
]

const BAG_POOL = [100, 150, 200, 250, 300, 100, 150, 200, -50, -80]

function buildItems() {
  return ITEM_TEMPLATES.map(t => ({
    ...t,
    x: t.rx * 800,
    y: 145 + 20 + t.ry * 340,
    active: true,
  }))
}

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ── Room state ────────────────────────────────────────────────────
// room: { code, players:[{id,socketId,name,score,hook:{angle,length,state}}], items, state:'WAITING'|'PLAYING', timeLeft, timerId, syncId }
const rooms = new Map()

function getPlayerRoom(socketId) {
  for (const [code, room] of rooms) {
    if (room.players.find(p => p.socketId === socketId)) return room
  }
  return null
}

function startGame(room) {
  room.state = 'PLAYING'
  room.timeLeft = 60
  room.items = buildItems()

  const payload = {
    players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    items: room.items,
    timeLeft: room.timeLeft,
  }
  room.players.forEach(p => {
    io.to(p.socketId).emit('game_start', { ...payload, myPlayerId: p.id })
  })

  // Hook sync every 50ms
  room.syncId = setInterval(() => {
    if (room.state !== 'PLAYING') return
    const hooks = room.players.map(p => ({
      id: p.id,
      angle: p.hook.angle,
      length: p.hook.length,
      hookState: p.hook.state,
    }))
    io.to(room.code).emit('hooks_sync', { players: hooks })
  }, 50)

  // Timer tick every 1s
  room.timerId = setInterval(() => {
    if (room.state !== 'PLAYING') return
    room.timeLeft--
    io.to(room.code).emit('timer_tick', { timeLeft: room.timeLeft })
    if (room.timeLeft <= 0) {
      clearInterval(room.timerId)
      clearInterval(room.syncId)
      room.state = 'ENDED'
      const scores = room.players
        .map(p => ({ id: p.id, name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score)
      io.to(room.code).emit('game_end', { scores })
    }
  }, 1000)
}

// ── Socket handlers ───────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('[server] connect', socket.id)

  socket.on('create_room', ({ name }) => {
    let code
    do { code = randomCode() } while (rooms.has(code))

    const player = { id: 0, socketId: socket.id, name: name || 'Player 1', score: 0, hook: { angle: 0, length: 55, state: 'SWINGING' } }
    const room = { code, players: [player], items: [], state: 'WAITING', timeLeft: 60, timerId: null, syncId: null }
    rooms.set(code, room)
    socket.join(code)

    socket.emit('room_created', { code, playerId: 0, players: [{ id: 0, name: player.name }] })
    console.log('[server] room created', code, 'by', name)
  })

  socket.on('join_room', ({ code, name }) => {
    const room = rooms.get(code)
    if (!room) {
      socket.emit('join_error', { message: '房间不存在' })
      return
    }
    if (room.state !== 'WAITING') {
      socket.emit('join_error', { message: '游戏已开始' })
      return
    }
    if (room.players.length >= 3) {
      socket.emit('join_error', { message: '房间已满' })
      return
    }

    const playerId = room.players.length
    const player = { id: playerId, socketId: socket.id, name: name || `Player ${playerId + 1}`, score: 0, hook: { angle: 0, length: 55, state: 'SWINGING' } }
    room.players.push(player)
    socket.join(code)

    const playerList = room.players.map(p => ({ id: p.id, name: p.name }))
    socket.emit('room_joined', { code, playerId, players: playerList })
    socket.to(code).emit('player_joined', { playerId, name: player.name, players: playerList })

    console.log('[server]', name, 'joined room', code, '(', room.players.length, '/3 )')

    if (room.players.length === 3) {
      startGame(room)
    }
  })

  socket.on('start_game', () => {
    const room = getPlayerRoom(socket.id)
    if (!room) return
    const player = room.players.find(p => p.socketId === socket.id)
    if (!player || player.id !== 0) return // host only
    if (room.players.length < 2) {
      socket.emit('join_error', { message: '至少需要2名玩家' })
      return
    }
    if (room.state !== 'WAITING') return
    startGame(room)
  })

  socket.on('hook_update', ({ angle, length, hookState }) => {
    const room = getPlayerRoom(socket.id)
    if (!room || room.state !== 'PLAYING') return
    const player = room.players.find(p => p.socketId === socket.id)
    if (!player) return
    player.hook.angle = angle
    player.hook.length = length
    player.hook.state = hookState
  })

  socket.on('grab_item', ({ itemId }) => {
    const room = getPlayerRoom(socket.id)
    if (!room || room.state !== 'PLAYING') return
    const player = room.players.find(p => p.socketId === socket.id)
    if (!player) return

    const item = room.items.find(it => it.id === itemId)
    if (!item || !item.active) return // race condition guard

    item.active = false

    let value = item.value
    if (item.type === 'bag') {
      value = BAG_POOL[Math.floor(Math.random() * BAG_POOL.length)]
    }

    player.score = Math.max(0, player.score + value)

    io.to(room.code).emit('item_grabbed', {
      itemId,
      playerId: player.id,
      value,
      score: player.score,
    })
  })

  socket.on('disconnect', () => {
    console.log('[server] disconnect', socket.id)
    const room = getPlayerRoom(socket.id)
    if (!room) return

    const player = room.players.find(p => p.socketId === socket.id)
    if (player) {
      io.to(room.code).emit('player_left', { playerId: player.id, name: player.name })
    }

    // If room is now empty, clean up
    room.players = room.players.filter(p => p.socketId !== socket.id)
    if (room.players.length === 0) {
      clearInterval(room.timerId)
      clearInterval(room.syncId)
      rooms.delete(room.code)
      console.log('[server] room', room.code, 'deleted (empty)')
    }
  })
})

// ── Health check ──────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', rooms: rooms.size })
})

server.listen(PORT, () => {
  console.log(`[gold-miner-server] listening on port ${PORT}`)
})
