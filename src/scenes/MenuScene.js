import Phaser from 'phaser'
import { connectSocket } from '../socket.js'

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    const g = this.add.graphics()

    // Sky
    g.fillStyle(0x44AADD, 1)
    g.fillRect(0, 0, W, 200)

    // Sun
    g.fillStyle(0xFFEE33, 1)
    g.fillCircle(W - 60, 50, 30)
    g.fillStyle(0xFFFF88, 0.4)
    g.fillCircle(W - 60, 50, 44)

    // Clouds
    for (const [cx, cy, cr] of [[100, 50, 30], [300, 35, 24], [530, 55, 28], [730, 38, 22], [880, 52, 26]]) {
      g.fillStyle(0xFFFFFF, 1)
      g.fillCircle(cx, cy, cr)
      g.fillCircle(cx + cr * 0.55, cy + 4, cr * 0.72)
      g.fillCircle(cx - cr * 0.50, cy + 5, cr * 0.65)
      g.fillCircle(cx + cr * 0.10, cy - cr * 0.30, cr * 0.62)
    }

    // Grass
    g.fillStyle(0x3DAD1A, 1)
    g.fillRect(0, 190, W, 18)
    g.fillStyle(0x55D428, 1)
    g.fillRect(0, 190, W, 9)

    // Underground
    g.fillStyle(0xC87830, 1)
    g.fillRect(0, 208, W, H - 208)
    g.fillStyle(0x8A4E18, 1)
    g.fillRect(0, 208 + (H - 208) * 0.5, W, (H - 208) * 0.5)

    // Soil lines
    g.lineStyle(2, 0x000000, 0.07)
    for (let y = 240; y < H; y += 52) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + 10); g.strokePath()
    }

    // ── Title ──
    // Shadow
    this.add.text(W / 2 + 4, 78, '黄金矿工', {
      fontSize: '68px', color: '#7A3A00', fontStyle: 'bold',
    }).setOrigin(0.5)
    // Main title
    this.add.text(W / 2, 74, '黄金矿工', {
      fontSize: '68px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#8B4000', strokeThickness: 8,
    }).setOrigin(0.5)

    this.add.text(W / 2, 152, 'Gold Miner', {
      fontSize: '26px', color: '#FFFFFF',
      stroke: '#336600', strokeThickness: 4,
    }).setOrigin(0.5)

    // ── Play button ──
    const btn = this.add.rectangle(W / 2, 248, 230, 60, 0xFF8800)
      .setInteractive({ useHandCursor: true })

    this.add.text(W / 2, 248, '开始游戏', {
      fontSize: '30px', color: '#FFFFFF', fontStyle: 'bold',
      stroke: '#7A3A00', strokeThickness: 4,
    }).setOrigin(0.5)

    btn.on('pointerover', () => btn.setFillStyle(0xFFAA00))
    btn.on('pointerout',  () => btn.setFillStyle(0xFF8800))
    btn.on('pointerdown', () => {
      this.scene.start('GameScene', { level: 1 })
    })

    // ── Multiplayer button ──
    const multiBtn = this.add.rectangle(W / 2, 322, 230, 60, 0x3388CC)
      .setInteractive({ useHandCursor: true })

    this.add.text(W / 2, 322, '多人游戏', {
      fontSize: '30px', color: '#FFFFFF', fontStyle: 'bold',
      stroke: '#002244', strokeThickness: 4,
    }).setOrigin(0.5)

    multiBtn.on('pointerover', () => multiBtn.setFillStyle(0x55AAEE))
    multiBtn.on('pointerout',  () => multiBtn.setFillStyle(0x3388CC))
    multiBtn.on('pointerdown', () => {
      const socket = connectSocket()
      this.scene.start('LobbyScene', { socket })
    })

    // Instructions
    this.add.text(W / 2, 393, '点击屏幕  或  按空格键  发射钩子', {
      fontSize: '16px', color: '#FFFFFF',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5)
    this.add.text(W / 2, 416, '抢在时间用完前达到目标金额！', {
      fontSize: '14px', color: '#FFE000',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    // ── Item legend ──
    this.drawLegend(W, H)
  }

  drawLegend(W, H) {
    const y = H - 28
    const items = [
      { draw: (g, x) => { g.fillStyle(0xFFAA00,1); g.lineStyle(2,0x7A4400,1); g.fillCircle(x,y,10); g.strokeCircle(x,y,10) }, label: '金块', color: '#FFE000' },
      { draw: (g, x) => { g.fillStyle(0x66BBFF,1); g.lineStyle(2,0x2255BB,1); g.fillCircle(x,y,10); g.strokeCircle(x,y,10) }, label: '钻石', color: '#AADDFF' },
      { draw: (g, x) => { g.fillStyle(0x8A8A8A,1); g.lineStyle(2,0x333333,1); g.fillCircle(x,y,10); g.strokeCircle(x,y,10) }, label: '石头', color: '#CCCCCC' },
      { draw: (g, x) => { g.fillStyle(0xCC5522,1); g.lineStyle(2,0x7A2E00,1); g.fillCircle(x,y,10); g.strokeCircle(x,y,10) }, label: '神秘袋', color: '#FFCC99' },
    ]

    const g = this.add.graphics()
    const startX = W / 2 - items.length * 55 + 27
    items.forEach((item, i) => {
      const x = startX + i * 110
      item.draw(g, x)
      this.add.text(x + 16, y, item.label, {
        fontSize: '14px', color: item.color,
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0, 0.5)
    })
  }
}
