import Phaser from 'phaser'
import { drawGold, drawRock, drawDiamond, drawBag } from '../draw.js'

// Anchor positions per player count (for W=1000)
const ANCHOR_SETS = {
  1: [{ x: 500, y: 108 }],
  2: [{ x: 250, y: 108 }, { x: 750, y: 108 }],
  3: [{ x: 167, y: 108 }, { x: 500, y: 108 }, { x: 833, y: 108 }],
}

const ROPE_COLORS  = [0xD47000, 0x0055CC, 0x007700]
const NAME_COLORS  = ['#FF9900', '#44AAFF', '#55DD55']

const SWING_SPEED  = 1.4
const EXTEND_SPEED = 320
const RETRACT_SPEED = 220
const MAX_ANGLE    = 1.22
const MIN_LENGTH   = 55
const MAX_LENGTH   = 480

export default class MultiScene extends Phaser.Scene {
  constructor() { super('MultiScene') }

  init(data) {
    this.socket     = data.socket
    this.myPlayerId = data.myPlayerId
    this.players    = data.players   // [{id, name, score}]
    this.itemDefs   = data.items     // from server, x/y resolved
    this.timeLeft   = data.timeLeft
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    this.W = W; this.H = H
    this.GROUND_Y = 145

    // Anchor positions depend on actual player count
    const n = Math.min(this.players.length, 3)
    this.ANCHORS = ANCHOR_SETS[n] || ANCHOR_SETS[3]

    // ── My hook local state ──
    this.myHook = {
      angle: 0, dir: 1, length: MIN_LENGTH,
      state: 'SWINGING',   // SWINGING | EXTENDING | RETRACTING
      hookedItemId: null,
      pendingScore: undefined,  // deferred score shown on delivery
    }

    // Remote hook states: { [playerId]: { angle, length, state } }
    this.remoteHooks = {}

    // Scores
    this.scores = {}
    for (const p of this.players) this.scores[p.id] = p.score

    // Build scene
    this.scoreTexts = {}     // must exist before drawMiners()
    this.drawBackground()
    this.itemGfxMap  = this.createItems(this.itemDefs)
    this.bagLabelMap = this.createBagLabels(this.itemDefs)
    this.drawMiners()        // creates scoreTexts entries

    this.hookGfx = this.add.graphics().setDepth(5)

    this.createUI()          // timer only — no dark bar

    this._setupSocketEvents()

    // Send hook state to server every 50ms
    this.time.addEvent({
      delay: 50, loop: true,
      callback: this._sendHookUpdate, callbackScope: this,
    })

    // Input
    this.input.on('pointerdown', this._onShoot, this)
    this.input.keyboard?.on('keydown-SPACE', this._onShoot, this)
  }

  // ── Background ───────────────────────────────────────────────────
  drawBackground() {
    const { W, H, GROUND_Y } = this
    const g = this.add.graphics()

    g.fillStyle(0x44AADD, 1); g.fillRect(0, 0, W, GROUND_Y)
    g.fillStyle(0xFFEE33, 1); g.fillCircle(W - 55, 42, 26)
    g.fillStyle(0xFFFF88, 0.5); g.fillCircle(W - 55, 42, 36)

    // Clouds spread across the wider (1000px) sky
    for (const [cx, cy, cr] of [[90,38,28],[280,22,22],[490,42,30],[680,26,20],[850,36,24]]) {
      g.fillStyle(0xFFFFFF, 1)
      g.fillCircle(cx, cy, cr); g.fillCircle(cx+cr*0.55, cy+4, cr*0.72)
      g.fillCircle(cx-cr*0.50, cy+5, cr*0.65); g.fillCircle(cx+cr*0.10, cy-cr*0.30, cr*0.62)
    }

    g.fillStyle(0x3DAD1A, 1); g.fillRect(0, GROUND_Y - 10, W, 18)
    g.fillStyle(0x55D428, 1); g.fillRect(0, GROUND_Y - 10, W, 9)
    g.fillStyle(0xC87830, 1); g.fillRect(0, GROUND_Y + 8, W, (H - GROUND_Y) * 0.55)
    g.fillStyle(0x8A4E18, 1); g.fillRect(0, GROUND_Y + 8 + (H - GROUND_Y)*0.55, W, (H - GROUND_Y)*0.45)

    g.lineStyle(2, 0x000000, 0.07)
    for (let y = GROUND_Y + 40; y < H; y += 52) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + 10); g.strokePath()
    }

    // Decorative pebbles spread across wider canvas
    for (const [px, py, pr] of [
      [65,210,5],[185,268,4],[315,190,6],[455,315,5],[585,235,4],
      [705,285,5],[135,368,4],[395,415,6],[655,395,5],[755,185,4],
      [820,250,5],[900,310,4],[940,190,6],[870,400,5],[980,360,4],
    ]) {
      g.fillStyle(0x6A6A6A, 0.5); g.lineStyle(2, 0x5A3208, 0.5)
      g.fillEllipse(px, py, pr*2.2, pr*1.6); g.strokeEllipse(px, py, pr*2.2, pr*1.6)
    }
  }

  // ── Items ────────────────────────────────────────────────────────
  createItems(items) {
    const map = {}
    for (const item of items) {
      const gfx = this.add.graphics().setPosition(item.x, item.y).setDepth(2)
      switch (item.type) {
        case 'gold_large': case 'gold_medium': case 'gold_small': drawGold(gfx, item.radius); break
        case 'rock_large': case 'rock_small': drawRock(gfx, item.radius); break
        case 'diamond':    drawDiamond(gfx, item.radius); break
        case 'bag':        drawBag(gfx, item.radius); break
      }
      map[item.id] = { ...item, gfx, active: item.active !== false, draggedByPlayerId: null }
    }
    return map
  }

  createBagLabels(items) {
    const map = {}
    for (const item of items) {
      if (item.type !== 'bag') continue
      const text = this.add.text(item.x, item.y, '?', {
        fontSize: '18px', color: '#FFD700', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(3)
      map[item.id] = { itemId: item.id, text }
    }
    return map
  }

  // ── Miners ───────────────────────────────────────────────────────
  drawMiners() {
    const { GROUND_Y } = this
    for (const player of this.players) {
      const anchor = this.ANCHORS[player.id]
      if (!anchor) continue
      this._drawMiner(anchor.x, GROUND_Y, player.id)

      const isMe   = player.id === this.myPlayerId
      const nameColor  = NAME_COLORS[player.id]
      const scoreColor = isMe ? '#FFE000' : '#DDDDDD'

      // Player name — top of canvas, above the miner's hat (hat top ≈ y=23)
      this.add.text(anchor.x, 3, `${isMe ? '▶ ' : ''}${player.name}`, {
        fontSize: '11px', color: nameColor, fontStyle: 'bold',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5, 0).setDepth(7)

      // Score text — dynamic, shown on delivery
      this.scoreTexts[player.id] = this.add.text(anchor.x, 16, `$${this.scores[player.id] || 0}`, {
        fontSize: '14px', color: scoreColor, fontStyle: 'bold',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5, 0).setDepth(7)
    }
  }

  _drawMiner(cx, gy, pid) {
    const g = this.add.graphics().setDepth(4)
    const bodyColor = [0x2255CC, 0x1144AA, 0x226622][pid] ?? 0x2255CC
    const hatColor  = [0x8B3A00, 0x444444, 0x2244AA][pid] ?? 0x8B3A00

    g.lineStyle(3, 0x5C2E00, 1); g.fillStyle(0x8B5C28, 1)
    g.fillRect(cx-40, gy-22, 80, 14); g.strokeRect(cx-40, gy-22, 80, 14)
    g.fillStyle(0xAA7840, 0.6); g.fillRect(cx-38, gy-22, 76, 6)

    g.fillStyle(0x1A3A80, 1); g.lineStyle(2, 0x0A1A40, 1)
    g.fillRect(cx-13, gy-28, 9, 16); g.strokeRect(cx-13, gy-28, 9, 16)
    g.fillRect(cx+4,  gy-28, 9, 16); g.strokeRect(cx+4,  gy-28, 9, 16)
    g.fillStyle(0x3A2200, 1)
    g.fillEllipse(cx-9, gy-10, 16, 9); g.fillEllipse(cx+9, gy-10, 16, 9)

    g.lineStyle(3, 0x0A1A40, 1); g.fillStyle(bodyColor, 1)
    g.fillRect(cx-17, gy-68, 34, 44); g.strokeRect(cx-17, gy-68, 34, 44)
    g.lineStyle(3, 0xEE2222, 1)
    g.beginPath(); g.moveTo(cx-10, gy-68); g.lineTo(cx-5, gy-46); g.strokePath()
    g.beginPath(); g.moveTo(cx+10, gy-68); g.lineTo(cx+5, gy-46); g.strokePath()

    g.lineStyle(2, 0x0A1A40, 1); g.fillStyle(bodyColor, 1)
    g.fillRect(cx-27, gy-66, 12, 26); g.strokeRect(cx-27, gy-66, 12, 26)
    g.fillRect(cx+15, gy-66, 12, 26); g.strokeRect(cx+15, gy-66, 12, 26)
    g.fillStyle(0xFFCC99, 1); g.lineStyle(2, 0xCC7733, 1)
    g.fillCircle(cx-21, gy-38, 7); g.strokeCircle(cx-21, gy-38, 7)
    g.fillCircle(cx+21, gy-38, 7); g.strokeCircle(cx+21, gy-38, 7)

    g.fillStyle(0xFFCC99, 1); g.lineStyle(3, 0xCC7733, 1)
    g.fillCircle(cx, gy-80, 19); g.strokeCircle(cx, gy-80, 19)
    g.fillStyle(0x222222, 1)
    g.fillCircle(cx-7, gy-82, 3.5); g.fillCircle(cx+7, gy-82, 3.5)
    g.fillStyle(0xFFFFFF, 1)
    g.fillCircle(cx-6, gy-83, 1.5); g.fillCircle(cx+8, gy-83, 1.5)
    g.lineStyle(2.5, 0x884422, 1)
    g.beginPath(); g.moveTo(cx-6, gy-73); g.lineTo(cx, gy-71); g.lineTo(cx+6, gy-73); g.strokePath()

    g.lineStyle(3, 0x5C2200, 1); g.fillStyle(hatColor, 1)
    g.fillRect(cx-25, gy-101, 50, 10); g.strokeRect(cx-25, gy-101, 50, 10)
    g.fillRect(cx-16, gy-122, 32, 23); g.strokeRect(cx-16, gy-122, 32, 23)
    g.fillStyle(0xFFDD00, 1); g.fillRect(cx-16, gy-103, 32, 5)
  }

  // ── UI (timer only — scores are above each miner) ────────────────
  createUI() {
    const { W } = this
    this.timerText = this.add.text(W - 8, 5, `${this.timeLeft}s`, {
      fontSize: '20px', color: '#FF4444', fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(8)
  }

  // ── Hook physics helpers ─────────────────────────────────────────
  _hookTip(hook, anchor) {
    return {
      tx: anchor.x + Math.sin(hook.angle) * hook.length,
      ty: anchor.y + Math.cos(hook.angle) * hook.length,
    }
  }

  _updateMyHook(dt) {
    const hook   = this.myHook
    const anchor = this.ANCHORS[this.myPlayerId]

    if (hook.state === 'SWINGING') {
      hook.angle += SWING_SPEED * hook.dir * dt
      if (hook.angle >=  MAX_ANGLE) { hook.angle =  MAX_ANGLE; hook.dir = -1 }
      if (hook.angle <= -MAX_ANGLE) { hook.angle = -MAX_ANGLE; hook.dir =  1 }
      hook.length = MIN_LENGTH

    } else if (hook.state === 'EXTENDING') {
      hook.length += EXTEND_SPEED * dt
      const { tx, ty } = this._hookTip(hook, anchor)

      for (const item of Object.values(this.itemGfxMap)) {
        if (!item.active) continue
        if (Math.hypot(tx - item.x, ty - item.y) < item.radius + 10) {
          // Immediately retract — no GRAB_PENDING pause (client-side prediction)
          hook.state = 'RETRACTING'
          hook.hookedItemId = item.id
          item.draggedByPlayerId = this.myPlayerId
          this.socket.emit('grab_item', { itemId: item.id })
          return
        }
      }

      if (hook.length > MAX_LENGTH || tx < 0 || tx > this.W || ty > this.H) {
        hook.state = 'RETRACTING'
      }

    } else if (hook.state === 'RETRACTING') {
      const hookedItem = hook.hookedItemId !== null ? this.itemGfxMap[hook.hookedItemId] : null
      const w = hookedItem ? hookedItem.weight : 1
      hook.length -= (RETRACT_SPEED / w) * dt

      if (hook.length <= MIN_LENGTH) {
        hook.length = MIN_LENGTH
        // Item reaches the miner — hide it
        if (hook.hookedItemId !== null) {
          const item = this.itemGfxMap[hook.hookedItemId]
          if (item) { item.gfx.setVisible(false); item.draggedByPlayerId = null }
          hook.hookedItemId = null

          // Apply deferred score now that item is delivered
          if (hook.pendingScore !== undefined) {
            const myId = this.myPlayerId
            this.scores[myId] = hook.pendingScore
            if (this.scoreTexts[myId]) {
              this.scoreTexts[myId].setText(`$${hook.pendingScore}`)
            }
            hook.pendingScore = undefined
          }
        }
        hook.state = 'SWINGING'
      }
    }
  }

  // ── Draw a single hook (rope + claw) ────────────────────────────
  _drawHook(g, pid, hook) {
    const anchor = this.ANCHORS[pid]
    if (!anchor) return
    const { tx, ty } = this._hookTip(hook, anchor)
    const ang   = hook.angle
    const color = ROPE_COLORS[pid] ?? 0x888888

    g.lineStyle(5, 0x000000, 0.12)
    g.beginPath(); g.moveTo(anchor.x+2, anchor.y+2); g.lineTo(tx+2, ty+2); g.strokePath()

    g.lineStyle(3.5, color, 1)
    g.beginPath(); g.moveTo(anchor.x, anchor.y); g.lineTo(tx, ty); g.strokePath()

    const px =  Math.cos(ang), py = -Math.sin(ang)
    const fx =  Math.sin(ang), fy =  Math.cos(ang)
    const S = 11

    g.lineStyle(4, 0x666666, 1)
    g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx-px*S-fx*4, ty-py*S-fy*4); g.strokePath()
    g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx+px*S-fx*4, ty+py*S-fy*4); g.strokePath()

    g.fillStyle(0xAAAAAA, 1); g.lineStyle(2, 0x555555, 1)
    g.fillCircle(tx, ty, 6); g.strokeCircle(tx, ty, 6)
  }

  // ── Follow hooked item with my hook tip ──────────────────────────
  _syncMyItemPosition() {
    const hook = this.myHook
    if (hook.hookedItemId === null) return
    const item = this.itemGfxMap[hook.hookedItemId]
    if (!item) return
    const anchor = this.ANCHORS[this.myPlayerId]
    const { tx, ty } = this._hookTip(hook, anchor)
    item.gfx.setPosition(tx, ty)
    item.x = tx; item.y = ty
  }

  // ── Follow items dragged by remote players ───────────────────────
  _syncRemoteItemPositions() {
    for (const [pidStr, rHook] of Object.entries(this.remoteHooks)) {
      const pid = parseInt(pidStr)
      const anchor = this.ANCHORS[pid]
      if (!anchor) continue

      for (const item of Object.values(this.itemGfxMap)) {
        if (item.draggedByPlayerId !== pid) continue

        // Hide when hook returns to anchor
        if (rHook.state === 'SWINGING' || rHook.length <= MIN_LENGTH + 5) {
          item.gfx.setVisible(false)
          item.draggedByPlayerId = null
        } else {
          const tx = anchor.x + Math.sin(rHook.angle) * rHook.length
          const ty = anchor.y + Math.cos(rHook.angle) * rHook.length
          item.gfx.setPosition(tx, ty)
          item.x = tx; item.y = ty
        }
        break // one item per player
      }
    }
  }

  // ── Sync bag "?" labels to item position ─────────────────────────
  _syncBagLabels() {
    for (const { itemId, text } of Object.values(this.bagLabelMap)) {
      const item = this.itemGfxMap[itemId]
      if (!item) continue
      if (!item.active) { text.setVisible(false); continue }
      text.setPosition(item.x, item.y)
    }
  }

  // ── Send hook position to server ─────────────────────────────────
  _sendHookUpdate() {
    if (!this.socket) return
    this.socket.emit('hook_update', {
      angle: this.myHook.angle,
      length: this.myHook.length,
      hookState: this.myHook.state,
    })
  }

  // ── Socket events ─────────────────────────────────────────────────
  _setupSocketEvents() {
    const s = this.socket

    s.on('hooks_sync', ({ players }) => {
      for (const p of players) {
        if (p.id === this.myPlayerId) continue
        this.remoteHooks[p.id] = { angle: p.angle, length: p.length, state: p.hookState }
      }
    })

    s.on('item_grabbed', ({ itemId, playerId, value, score }) => {
      const item = this.itemGfxMap[itemId]
      if (item) {
        item.active = false
        item.draggedByPlayerId = playerId
      }

      if (playerId === this.myPlayerId) {
        // Server confirmed we got it — defer score display until item is delivered
        this.myHook.pendingScore = score
      } else {
        // Someone else got it
        if (this.myHook.hookedItemId === itemId) {
          // We optimistically grabbed it — un-hook, keep retracting empty
          this.myHook.hookedItemId = null
        }
        // Update remote player's score immediately
        this.scores[playerId] = score
        if (this.scoreTexts[playerId]) {
          this.scoreTexts[playerId].setText(`$${score}`)
        }
      }

      // Floating score popup above that player's anchor
      const anchor = this.ANCHORS[playerId]
      if (anchor) {
        const sign = value >= 0 ? '+' : ''
        const ft = this.add.text(anchor.x, anchor.y - 50, `${sign}$${value}`, {
          fontSize: '22px', color: value >= 0 ? '#FFE000' : '#FF4444',
          fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(10)
        this.tweens.add({
          targets: ft, y: anchor.y - 100, alpha: 0, duration: 900,
          onComplete: () => ft.destroy(),
        })
      }
    })

    s.on('timer_tick', ({ timeLeft }) => {
      this.timeLeft = timeLeft
      if (this.timerText) {
        this.timerText.setText(`${timeLeft}s`)
        if (timeLeft <= 10) {
          this.timerText.setStyle({ color: '#FF2222', fontStyle: 'bold', fontSize: '22px' })
        }
      }
    })

    s.on('game_end', ({ scores }) => {
      this.scene.start('MultiResultScene', { scores, myPlayerId: this.myPlayerId })
    })

    s.on('player_left', ({ playerId, name }) => {
      const notice = this.add.text(this.W / 2, this.H / 2 - 40, `${name} 离开了游戏`, {
        fontSize: '22px', color: '#FF9999',
        stroke: '#000', strokeThickness: 4,
        backgroundColor: '#00000088',
        padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setDepth(20)
      this.time.delayedCall(2500, () => notice.destroy())
    })
  }

  // ── Input ────────────────────────────────────────────────────────
  _onShoot() {
    if (this.myHook.state === 'SWINGING') this.myHook.state = 'EXTENDING'
  }

  // ── Main loop ────────────────────────────────────────────────────
  update(_time, delta) {
    const dt = delta / 1000
    this._updateMyHook(dt)

    this.hookGfx.clear()

    // Draw remote hooks first (behind my hook)
    for (const [pid, hook] of Object.entries(this.remoteHooks)) {
      if (parseInt(pid) === this.myPlayerId) continue
      this._drawHook(this.hookGfx, parseInt(pid), hook)
    }

    // Draw my hook on top
    this._drawHook(this.hookGfx, this.myPlayerId, this.myHook)

    this._syncMyItemPosition()
    this._syncRemoteItemPositions()
    this._syncBagLabels()
  }

  shutdown() {
    const s = this.socket
    if (s) {
      s.off('hooks_sync'); s.off('item_grabbed'); s.off('timer_tick')
      s.off('game_end');   s.off('player_left')
    }
  }
}
