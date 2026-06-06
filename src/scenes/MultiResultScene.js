import Phaser from 'phaser'
import { connectSocket } from '../socket.js'

const MEDALS = ['🥇', '🥈', '🥉']
const NAME_COLORS = ['#FF9900', '#44AAFF', '#55DD55']

export default class MultiResultScene extends Phaser.Scene {
  constructor() { super('MultiResultScene') }

  init(data) {
    // scores: [{id, name, score}] already sorted descending by server
    this.scores = data.scores || []
    this.myPlayerId = data.myPlayerId
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // Dark overlay
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.88)
    bg.fillRect(0, 0, W, H)

    // Decorative panel
    bg.lineStyle(3, 0xFFD700, 0.8)
    bg.strokeRoundedRect(W / 2 - 220, 60, 440, H - 120, 16)

    // Title
    this.add.text(W / 2, 100, '游戏结束！', {
      fontSize: '48px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#7A3A00', strokeThickness: 7,
    }).setOrigin(0.5)

    this.add.text(W / 2, 150, '最终排名', {
      fontSize: '22px', color: '#FFFFFF88',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    // Rankings
    const startY = 195
    for (let rank = 0; rank < this.scores.length; rank++) {
      const entry = this.scores[rank]
      const y = startY + rank * 70
      const isMe = entry.id === this.myPlayerId
      const medal = MEDALS[rank] || `${rank + 1}.`
      const nameColor = NAME_COLORS[entry.id] ?? '#FFFFFF'
      const scoreColor = isMe ? '#FFD700' : '#FFFFFF'
      const fontSize = rank === 0 ? '28px' : '22px'

      // Highlight row for current player
      if (isMe) {
        const hl = this.add.graphics()
        hl.fillStyle(0xFFD700, 0.12)
        hl.fillRoundedRect(W / 2 - 190, y - 10, 380, 56, 8)
      }

      // Medal
      this.add.text(W / 2 - 160, y + 14, medal, {
        fontSize: '28px',
      }).setOrigin(0, 0.5)

      // Player name
      const nameStr = isMe ? `${entry.name} (你)` : entry.name
      this.add.text(W / 2 - 110, y + 14, nameStr, {
        fontSize,
        color: nameColor,
        fontStyle: isMe ? 'bold' : 'normal',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0, 0.5)

      // Score
      this.add.text(W / 2 + 160, y + 14, `$${entry.score}`, {
        fontSize,
        color: scoreColor,
        fontStyle: 'bold',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(1, 0.5)
    }

    const btnY = H - 90

    // "再来一局" button
    const playAgainBtn = this.add.rectangle(W / 2 - 100, btnY, 170, 52, 0xFF8800)
      .setInteractive({ useHandCursor: true })
    this.add.text(W / 2 - 100, btnY, '再来一局', {
      fontSize: '22px', color: '#FFFFFF', fontStyle: 'bold',
      stroke: '#7A3A00', strokeThickness: 3,
    }).setOrigin(0.5)
    playAgainBtn.on('pointerover', () => playAgainBtn.setFillStyle(0xFFAA00))
    playAgainBtn.on('pointerout',  () => playAgainBtn.setFillStyle(0xFF8800))
    playAgainBtn.on('pointerdown', () => {
      const socket = connectSocket()
      this.scene.start('LobbyScene', { socket })
    })

    // "主菜单" button
    const menuBtn = this.add.rectangle(W / 2 + 100, btnY, 170, 52, 0x446688)
      .setInteractive({ useHandCursor: true })
    this.add.text(W / 2 + 100, btnY, '主菜单', {
      fontSize: '22px', color: '#FFFFFF', fontStyle: 'bold',
      stroke: '#001133', strokeThickness: 3,
    }).setOrigin(0.5)
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x6688AA))
    menuBtn.on('pointerout',  () => menuBtn.setFillStyle(0x446688))
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'))
  }
}
