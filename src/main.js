import Phaser from 'phaser'
import MenuScene from './scenes/MenuScene.js'
import GameScene from './scenes/GameScene.js'
import GameOverScene from './scenes/GameOverScene.js'
import LobbyScene from './scenes/LobbyScene.js'
import MultiScene from './scenes/MultiScene.js'
import MultiResultScene from './scenes/MultiResultScene.js'

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1000,
  height: 500,
  backgroundColor: '#d4a055',
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: { createContainer: true },
  scene: [MenuScene, GameScene, GameOverScene, LobbyScene, MultiScene, MultiResultScene],
})
