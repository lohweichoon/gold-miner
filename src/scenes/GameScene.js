import Phaser from 'phaser'
import { blob, drawGold, drawRock, drawDiamond, drawBag } from '../draw.js'

const ITEM_DEFS = {
  gold_large:  { value: 400, weight: 6,  radius: 34 },
  gold_medium: { value: 150, weight: 3,  radius: 22 },
  gold_small:  { value: 50,  weight: 1,  radius: 13 },
  diamond:     { value: 500, weight: 1,  radius: 16 },
  rock_large:  { value: 25,  weight: 10, radius: 28 },
  rock_small:  { value: 10,  weight: 5,  radius: 17 },
  bag:         { value: 0,   weight: 2,  radius: 21 },
}

const LEVEL_CONFIGS = [
  {
    target: 650, time: 60,
    items: [
      { type: 'gold_large',  rx: 0.22, ry: 0.30 },
      { type: 'gold_large',  rx: 0.60, ry: 0.52 },
      { type: 'gold_medium', rx: 0.44, ry: 0.20 },
      { type: 'gold_medium', rx: 0.80, ry: 0.36 },
      { type: 'gold_medium', rx: 0.12, ry: 0.63 },
      { type: 'gold_small',  rx: 0.35, ry: 0.46 },
      { type: 'gold_small',  rx: 0.57, ry: 0.76 },
      { type: 'gold_small',  rx: 0.89, ry: 0.58 },
      { type: 'rock_large',  rx: 0.09, ry: 0.42 },
      { type: 'rock_small',  rx: 0.70, ry: 0.20 },
      { type: 'bag',         rx: 0.18, ry: 0.83 },
      { type: 'bag',         rx: 0.84, ry: 0.76 },
    ],
  },
  {
    target: 900, time: 60,
    items: [
      { type: 'gold_large',  rx: 0.15, ry: 0.38 },
      { type: 'gold_large',  rx: 0.72, ry: 0.40 },
      { type: 'gold_large',  rx: 0.44, ry: 0.65 },
      { type: 'gold_medium', rx: 0.30, ry: 0.20 },
      { type: 'gold_medium', rx: 0.60, ry: 0.26 },
      { type: 'gold_medium', rx: 0.88, ry: 0.53 },
      { type: 'gold_small',  rx: 0.50, ry: 0.44 },
      { type: 'gold_small',  rx: 0.08, ry: 0.74 },
      { type: 'rock_large',  rx: 0.38, ry: 0.53 },
      { type: 'rock_large',  rx: 0.78, ry: 0.70 },
      { type: 'rock_small',  rx: 0.22, ry: 0.30 },
      { type: 'bag',         rx: 0.65, ry: 0.80 },
      { type: 'diamond',     rx: 0.50, ry: 0.86 },
    ],
  },
  {
    target: 1200, time: 65,
    items: [
      { type: 'gold_large',  rx: 0.20, ry: 0.26 },
      { type: 'gold_large',  rx: 0.55, ry: 0.46 },
      { type: 'gold_large',  rx: 0.82, ry: 0.33 },
      { type: 'gold_medium', rx: 0.38, ry: 0.36 },
      { type: 'gold_medium', rx: 0.70, ry: 0.60 },
      { type: 'gold_medium', rx: 0.10, ry: 0.56 },
      { type: 'gold_small',  rx: 0.28, ry: 0.66 },
      { type: 'gold_small',  rx: 0.48, ry: 0.76 },
      { type: 'rock_large',  rx: 0.62, ry: 0.23 },
      { type: 'rock_large',  rx: 0.15, ry: 0.76 },
      { type: 'rock_small',  rx: 0.88, ry: 0.70 },
      { type: 'bag',         rx: 0.35, ry: 0.86 },
      { type: 'bag',         rx: 0.78, ry: 0.88 },
      { type: 'diamond',     rx: 0.50, ry: 0.28 },
    ],
  },
  {
    target: 1500, time: 65,
    items: [
      { type: 'gold_large',  rx: 0.12, ry: 0.44 },
      { type: 'gold_large',  rx: 0.50, ry: 0.22 },
      { type: 'gold_large',  rx: 0.86, ry: 0.46 },
      { type: 'gold_medium', rx: 0.28, ry: 0.60 },
      { type: 'gold_medium', rx: 0.66, ry: 0.70 },
      { type: 'gold_small',  rx: 0.42, ry: 0.80 },
      { type: 'gold_small',  rx: 0.74, ry: 0.30 },
      { type: 'rock_large',  rx: 0.36, ry: 0.35 },
      { type: 'rock_large',  rx: 0.20, ry: 0.80 },
      { type: 'rock_small',  rx: 0.58, ry: 0.50 },
      { type: 'rock_small',  rx: 0.92, ry: 0.22 },
      { type: 'bag',         rx: 0.08, ry: 0.65 },
      { type: 'bag',         rx: 0.80, ry: 0.80 },
      { type: 'diamond',     rx: 0.44, ry: 0.55 },
      { type: 'diamond',     rx: 0.62, ry: 0.88 },
    ],
  },
  {
    target: 2000, time: 70,
    items: [
      { type: 'gold_large',  rx: 0.18, ry: 0.28 },
      { type: 'gold_large',  rx: 0.48, ry: 0.60 },
      { type: 'gold_large',  rx: 0.78, ry: 0.40 },
      { type: 'gold_medium', rx: 0.32, ry: 0.44 },
      { type: 'gold_medium', rx: 0.64, ry: 0.24 },
      { type: 'gold_medium', rx: 0.90, ry: 0.64 },
      { type: 'gold_small',  rx: 0.10, ry: 0.78 },
      { type: 'gold_small',  rx: 0.52, ry: 0.82 },
      { type: 'rock_large',  rx: 0.26, ry: 0.22 },
      { type: 'rock_large',  rx: 0.42, ry: 0.76 },
      { type: 'rock_large',  rx: 0.72, ry: 0.80 },
      { type: 'rock_small',  rx: 0.86, ry: 0.22 },
      { type: 'bag',         rx: 0.14, ry: 0.50 },
      { type: 'bag',         rx: 0.60, ry: 0.50 },
      { type: 'diamond',     rx: 0.36, ry: 0.88 },
      { type: 'diamond',     rx: 0.82, ry: 0.88 },
    ],
  },
]

// ──────────────────────────────────────────────────────────────

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene') }

  init(data) {
    this.currentLevel = data.level || 1
  }

  create() {
    this.W = this.scale.width
    this.H = this.scale.height
    this.GROUND_Y = 145
    this.ANCHOR_X = this.W / 2
    this.ANCHOR_Y = 108

    const cfgIdx = Math.min(this.currentLevel - 1, LEVEL_CONFIGS.length - 1)
    const cfg = LEVEL_CONFIGS[cfgIdx]
    const extraTarget = Math.max(0, this.currentLevel - LEVEL_CONFIGS.length) * 600

    this.targetScore = cfg.target + extraTarget
    this.timeLeft = cfg.time
    this.score = 0

    this.hookAngle = 0
    this.hookDir = 1
    this.hookLength = 55
    this.hookState = 'SWINGING'
    this.hookedItem = null

    // Static layers drawn once
    this.drawBackground()
    this.items = this.createItems(cfg.items)
    this.bagLabels = this.createBagLabels()
    this.drawMiner()

    // Only hook rope/claw is redrawn every frame
    this.hookGfx = this.add.graphics().setDepth(4)

    this.createUI()

    this.input.on('pointerdown', this.onShoot, this)
    this.input.keyboard?.on('keydown-SPACE', this.onShoot, this)

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      loop: true,
    })

    const flash = this.add.text(this.W / 2, this.H / 2, `第 ${this.currentLevel} 关`, {
      fontSize: '52px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(10)
    this.tweens.add({
      targets: flash, alpha: 0, delay: 1000, duration: 600,
      onComplete: () => flash.destroy(),
    })
  }

  createItems(layout) {
    const underH = this.H - this.GROUND_Y - 15
    return layout.map(def => {
      const def2 = ITEM_DEFS[def.type]
      const x = def.rx * this.W
      const y = this.GROUND_Y + 20 + def.ry * underH
      const gfx = this.add.graphics().setPosition(x, y).setDepth(2)

      switch (def.type) {
        case 'gold_large': case 'gold_medium': case 'gold_small':
          drawGold(gfx, def2.radius); break
        case 'rock_large': case 'rock_small':
          drawRock(gfx, def2.radius); break
        case 'diamond':
          drawDiamond(gfx, def2.radius); break
        case 'bag':
          drawBag(gfx, def2.radius); break
      }

      return { type: def.type, value: def2.value, weight: def2.weight, radius: def2.radius, x, y, gfx, active: true }
    })
  }

  createBagLabels() {
    return this.items
      .filter(i => i.type === 'bag')
      .map(item => ({
        item,
        text: this.add.text(item.x, item.y, '?', {
          fontSize: '18px', color: '#FFD700', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(3),
      }))
  }

  drawBackground() {
    const { W, H, GROUND_Y } = this
    const g = this.add.graphics()

    // Sky — bright blue
    g.fillStyle(0x44AADD, 1)
    g.fillRect(0, 0, W, GROUND_Y)

    // Sun
    g.fillStyle(0xFFEE33, 1)
    g.fillCircle(W - 55, 42, 26)
    g.fillStyle(0xFFFF88, 0.5)
    g.fillCircle(W - 55, 42, 36)

    // Clouds — cartoon style with outline
    for (const [cx, cy, cr] of [[110, 38, 28], [290, 22, 22], [520, 42, 30], [690, 26, 20]]) {
      g.fillStyle(0xFFFFFF, 1)
      g.fillCircle(cx, cy, cr)
      g.fillCircle(cx + cr * 0.55, cy + 4, cr * 0.72)
      g.fillCircle(cx - cr * 0.50, cy + 5, cr * 0.65)
      g.fillCircle(cx + cr * 0.10, cy - cr * 0.30, cr * 0.62)
      // Outline
      g.lineStyle(2, 0xDDDDDD, 0.6)
      g.strokeCircle(cx, cy, cr)
    }

    // Grass strip — bright green with highlight
    g.fillStyle(0x3DAD1A, 1)
    g.fillRect(0, GROUND_Y - 10, W, 18)
    g.fillStyle(0x55D428, 1)
    g.fillRect(0, GROUND_Y - 10, W, 9)

    // Underground top layer — warm orange-brown
    g.fillStyle(0xC87830, 1)
    g.fillRect(0, GROUND_Y + 8, W, (H - GROUND_Y) * 0.55)

    // Underground deep layer — darker
    g.fillStyle(0x8A4E18, 1)
    g.fillRect(0, GROUND_Y + 8 + (H - GROUND_Y) * 0.55, W, (H - GROUND_Y) * 0.45)

    // Horizontal soil stripe (gives depth)
    g.lineStyle(2, 0x000000, 0.07)
    for (let y = GROUND_Y + 40; y < H; y += 52) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + 10); g.strokePath()
    }

    // Scattered pebbles (cartoon dots)
    g.lineStyle(2, 0x5A3208, 0.5)
    for (const [px, py, pr] of [
      [65,210,5],[185,268,4],[315,190,6],[455,315,5],[585,235,4],
      [705,285,5],[135,368,4],[395,415,6],[655,395,5],[755,185,4],
    ]) {
      g.fillStyle(0x6A6A6A, 0.5)
      g.fillEllipse(px, py, pr * 2.2, pr * 1.6)
      g.strokeEllipse(px, py, pr * 2.2, pr * 1.6)
    }
  }

  drawMiner() {
    const g = this.add.graphics().setDepth(4)
    const cx = this.ANCHOR_X
    const gy = this.GROUND_Y

    // Platform board
    g.lineStyle(3, 0x5C2E00, 1)
    g.fillStyle(0x8B5C28, 1)
    g.fillRect(cx - 40, gy - 22, 80, 14)
    g.strokeRect(cx - 40, gy - 22, 80, 14)
    // Board highlight
    g.fillStyle(0xAA7840, 0.6)
    g.fillRect(cx - 38, gy - 22, 76, 6)

    // Legs (dangling)
    g.fillStyle(0x1A3A80, 1)
    g.lineStyle(2, 0x0A1A40, 1)
    g.fillRect(cx - 13, gy - 28, 9, 16)
    g.strokeRect(cx - 13, gy - 28, 9, 16)
    g.fillRect(cx + 4, gy - 28, 9, 16)
    g.strokeRect(cx + 4, gy - 28, 9, 16)
    // Shoes
    g.fillStyle(0x3A2200, 1)
    g.fillEllipse(cx - 9, gy - 10, 16, 9)
    g.fillEllipse(cx + 9, gy - 10, 16, 9)

    // Body
    g.lineStyle(3, 0x0A1A40, 1)
    g.fillStyle(0x2255CC, 1)
    g.fillRect(cx - 17, gy - 68, 34, 44)
    g.strokeRect(cx - 17, gy - 68, 34, 44)
    // Suspenders
    g.lineStyle(3, 0xEE2222, 1)
    g.beginPath(); g.moveTo(cx - 10, gy - 68); g.lineTo(cx - 5,  gy - 46); g.strokePath()
    g.beginPath(); g.moveTo(cx + 10, gy - 68); g.lineTo(cx + 5,  gy - 46); g.strokePath()

    // Arms
    g.lineStyle(2, 0x0A1A40, 1)
    g.fillStyle(0x2255CC, 1)
    g.fillRect(cx - 27, gy - 66, 12, 26); g.strokeRect(cx - 27, gy - 66, 12, 26)
    g.fillRect(cx + 15, gy - 66, 12, 26); g.strokeRect(cx + 15, gy - 66, 12, 26)
    // Hands
    g.fillStyle(0xFFCC99, 1)
    g.lineStyle(2, 0xCC7733, 1)
    g.fillCircle(cx - 21, gy - 38, 7); g.strokeCircle(cx - 21, gy - 38, 7)
    g.fillCircle(cx + 21, gy - 38, 7); g.strokeCircle(cx + 21, gy - 38, 7)

    // Head
    g.fillStyle(0xFFCC99, 1)
    g.lineStyle(3, 0xCC7733, 1)
    g.fillCircle(cx, gy - 80, 19)
    g.strokeCircle(cx, gy - 80, 19)
    // Eyes
    g.fillStyle(0x222222, 1)
    g.fillCircle(cx - 7, gy - 82, 3.5)
    g.fillCircle(cx + 7, gy - 82, 3.5)
    // Eye shine
    g.fillStyle(0xFFFFFF, 1)
    g.fillCircle(cx - 6, gy - 83, 1.5)
    g.fillCircle(cx + 8, gy - 83, 1.5)
    // Smile
    g.lineStyle(2.5, 0x884422, 1)
    g.beginPath(); g.moveTo(cx - 6, gy - 73); g.lineTo(cx, gy - 71); g.lineTo(cx + 6, gy - 73); g.strokePath()

    // Hat brim
    g.lineStyle(3, 0x5C2200, 1)
    g.fillStyle(0x8B3A00, 1)
    g.fillRect(cx - 25, gy - 101, 50, 10); g.strokeRect(cx - 25, gy - 101, 50, 10)
    // Hat crown
    g.fillRect(cx - 16, gy - 122, 32, 23); g.strokeRect(cx - 16, gy - 122, 32, 23)
    // Hat band
    g.fillStyle(0xFFDD00, 1)
    g.fillRect(cx - 16, gy - 103, 32, 5)
  }

  hookTip() {
    return {
      tx: this.ANCHOR_X + Math.sin(this.hookAngle) * this.hookLength,
      ty: this.ANCHOR_Y + Math.cos(this.hookAngle) * this.hookLength,
    }
  }

  update(_time, delta) {
    const dt = delta / 1000
    this.updateHook(dt)
    this.hookGfx.clear()
    this.drawHook()
    this.syncItems()
    this.syncBagLabels()
  }

  updateHook(dt) {
    const SWING = 1.4, EXTEND = 320, RETRACT = 220
    const MAX_A = 1.22, MIN_L = 55

    if (this.hookState === 'SWINGING') {
      this.hookAngle += SWING * this.hookDir * dt
      if (this.hookAngle >=  MAX_A) { this.hookAngle =  MAX_A; this.hookDir = -1 }
      if (this.hookAngle <= -MAX_A) { this.hookAngle = -MAX_A; this.hookDir =  1 }
      this.hookLength = MIN_L

    } else if (this.hookState === 'EXTENDING') {
      this.hookLength += EXTEND * dt
      const { tx, ty } = this.hookTip()
      for (const item of this.items) {
        if (!item.active) continue
        if (Math.hypot(tx - item.x, ty - item.y) < item.radius + 10) {
          this.hookedItem = item
          this.hookState = 'RETRACTING'
          return
        }
      }
      if (this.hookLength > 480 || tx < 0 || tx > this.W || ty > this.H)
        this.hookState = 'RETRACTING'

    } else if (this.hookState === 'RETRACTING') {
      const w = this.hookedItem ? this.hookedItem.weight : 1
      this.hookLength -= (RETRACT / w) * dt
      if (this.hookLength <= MIN_L) {
        this.hookLength = MIN_L
        if (this.hookedItem) { this.collectItem(this.hookedItem); this.hookedItem = null }
        this.hookState = 'SWINGING'
      }
    }
  }

  syncItems() {
    if (!this.hookedItem) return
    const { tx, ty } = this.hookTip()
    this.hookedItem.gfx.setPosition(tx, ty)
    this.hookedItem.x = tx
    this.hookedItem.y = ty
  }

  collectItem(item) {
    item.active = false
    item.gfx.setVisible(false)

    let value = item.value
    if (item.type === 'bag') {
      const pool = [100, 150, 200, 250, 300, 100, 150, 200, -50, -80]
      value = pool[Math.floor(Math.random() * pool.length)]
    }

    this.score = Math.max(0, this.score + value)
    this.scoreText.setText(`金钱: $${this.score}`)

    const { tx, ty } = this.hookTip()
    const sign = value >= 0 ? '+' : ''
    const ft = this.add.text(tx, ty - 10, `${sign}$${value}`, {
      fontSize: '22px',
      color: value >= 0 ? '#FFE000' : '#FF4444',
      fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(8)
    this.tweens.add({ targets: ft, y: ty - 55, alpha: 0, duration: 900, onComplete: () => ft.destroy() })

    if (this.score >= this.targetScore)
      this.time.delayedCall(400, () => this.winLevel())
  }

  drawHook() {
    const g = this.hookGfx
    const { tx, ty } = this.hookTip()
    const ax = this.ANCHOR_X, ay = this.ANCHOR_Y
    const ang = this.hookAngle

    // Rope shadow
    g.lineStyle(5, 0x000000, 0.15)
    g.beginPath(); g.moveTo(ax + 2, ay + 2); g.lineTo(tx + 2, ty + 2); g.strokePath()

    // Rope
    g.lineStyle(3.5, 0x8B6520, 1)
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(tx, ty); g.strokePath()

    // Claw
    const px =  Math.cos(ang), py = -Math.sin(ang)
    const fx =  Math.sin(ang), fy =  Math.cos(ang)
    const S = 11

    g.lineStyle(4, 0x666666, 1)
    g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx - px*S - fx*4, ty - py*S - fy*4); g.strokePath()
    g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + px*S - fx*4, ty + py*S - fy*4); g.strokePath()

    g.fillStyle(0xAAAAAA, 1)
    g.lineStyle(2, 0x555555, 1)
    g.fillCircle(tx, ty, 6)
    g.strokeCircle(tx, ty, 6)
  }

  syncBagLabels() {
    for (const { item, text } of this.bagLabels) {
      if (!item.active) { text.setVisible(false); continue }
      text.setPosition(item.x, item.y)
    }
  }

  createUI() {
    const { W, H } = this

    // Top bar
    const bar = this.add.graphics().setDepth(5)
    bar.fillStyle(0x000000, 0.60)
    bar.fillRect(0, 0, W, 36)
    bar.lineStyle(2, 0xFFCC00, 0.6)
    bar.strokeRect(0, 0, W, 36)

    this.scoreText = this.add.text(12, 8, `金钱: $${this.score}`, {
      fontSize: '18px', color: '#FFE000', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    }).setDepth(6)

    this.add.text(W / 2, 8, `目标: $${this.targetScore}`, {
      fontSize: '18px', color: '#FFAA00',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(6)

    this.timerText = this.add.text(W - 12, 8, `${this.timeLeft}s`, {
      fontSize: '18px', color: '#FF6666', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(6)

    // Bottom hint
    this.add.text(W / 2, H - 7, '点击 / 空格  发射钩子', {
      fontSize: '13px', color: '#ffffff99',
      stroke: '#00000088', strokeThickness: 1,
    }).setOrigin(0.5, 1).setDepth(6)
  }

  onShoot() {
    if (this.hookState === 'SWINGING') this.hookState = 'EXTENDING'
  }

  tickTimer() {
    this.timeLeft--
    this.timerText.setText(`${this.timeLeft}s`)
    if (this.timeLeft <= 10) this.timerText.setStyle({ color: '#FF2222', fontStyle: 'bold', fontSize: '20px' })
    if (this.timeLeft <= 0) {
      this.timerEvent.remove()
      this.time.delayedCall(600, () => {
        if (this.score >= this.targetScore) this.winLevel()
        else this.scene.start('GameOverScene', { win: false, score: this.score, level: this.currentLevel })
      })
    }
  }

  winLevel() {
    this.timerEvent?.remove()
    const timeBonus = this.timeLeft * 10
    this.scene.start('GameOverScene', { win: true, score: this.score, timeBonus, level: this.currentLevel })
  }
}
