import Phaser from 'phaser'

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene') }

  create(data) {
    const { win, score, timeBonus = 0, level = 1 } = data
    const W = this.scale.width
    const H = this.scale.height
    const total = score + timeBonus

    // Dim overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72)

    if (win) {
      this.add.text(W / 2, 95, '过关！🎉', {
        fontSize: '54px', color: '#FFD700', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 6,
      }).setOrigin(0.5)

      this.add.text(W / 2, 178, `本关金钱：$${score}`, {
        fontSize: '26px', color: '#ffffff', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5)

      if (timeBonus > 0) {
        this.add.text(W / 2, 218, `时间奖励：+$${timeBonus}`, {
          fontSize: '22px', color: '#FFD700', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5)

        this.add.text(W / 2, 258, `总计：$${total}`, {
          fontSize: '24px', color: '#FF9900', fontStyle: 'bold', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5)
      }

      this.makeButton(W / 2, 330, '下一关', 0xFFD700, '#8B4513', () => {
        this.scene.start('GameScene', { level: level + 1, prevScore: total })
      })

    } else {
      this.add.text(W / 2, 95, '时间到！', {
        fontSize: '54px', color: '#FF4444', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 6,
      }).setOrigin(0.5)

      this.add.text(W / 2, 178, `金钱：$${score}`, {
        fontSize: '26px', color: '#ffffff', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5)

      this.add.text(W / 2, 220, '没有达到目标，再试一次！', {
        fontSize: '20px', color: '#FF9999', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5)

      this.makeButton(W / 2, 320, '再试一次', 0xFF6655, '#ffffff', () => {
        this.scene.start('GameScene', { level, prevScore: 0 })
      })
    }

    this.makeButton(W / 2, 400, '主菜单', 0x555555, '#ffffff', () => {
      this.scene.start('MenuScene')
    })
  }

  makeButton(x, y, label, bg, textColor, cb) {
    const btn = this.add.rectangle(x, y, 210, 56, bg)
      .setInteractive({ useHandCursor: true })
    this.add.text(x, y, label, {
      fontSize: '26px', color: textColor, fontStyle: 'bold',
    }).setOrigin(0.5)
    btn.on('pointerover', () => btn.setAlpha(0.8))
    btn.on('pointerout', () => btn.setAlpha(1))
    btn.on('pointerdown', cb)
  }
}
