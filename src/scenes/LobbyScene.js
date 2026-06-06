import Phaser from 'phaser'

const PLAYER_COLORS = ['#FF9900', '#44AAFF', '#55DD55']
const PLAYER_DOT_COLORS = [0xFF9900, 0x44AAFF, 0x55DD55]

export default class LobbyScene extends Phaser.Scene {
  constructor() { super('LobbyScene') }

  init(data) {
    this.socket = data.socket
    this.myPlayerId = null
    this.roomCode = null
    this.isHost = false
    this.lobbyPlayers = []
    this._uiState = 'MENU' // 'MENU' | 'WAITING'
    this._codeInput = ''
    this._showCodeInput = false
    this._keyListener = null
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    this._drawBackground(W, H)

    // Title
    this.add.text(W / 2, 40, '多人游戏', {
      fontSize: '44px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#7A3A00', strokeThickness: 7,
    }).setOrigin(0.5)

    // Container for state-specific UI — destroyed on state switch
    this._uiContainer = this.add.container(0, 0)

    this._buildMenuUI(W, H)
    this._setupSocketEvents()
  }

  // ── Background (same style as GameScene) ────────────────────────
  _drawBackground(W, H) {
    const g = this.add.graphics()
    const GROUND_Y = 180

    g.fillStyle(0x44AADD, 1)
    g.fillRect(0, 0, W, GROUND_Y)

    g.fillStyle(0xFFEE33, 1)
    g.fillCircle(W - 55, 42, 26)
    g.fillStyle(0xFFFF88, 0.5)
    g.fillCircle(W - 55, 42, 36)

    for (const [cx, cy, cr] of [[110, 38, 28], [290, 22, 22], [520, 42, 30], [690, 26, 20]]) {
      g.fillStyle(0xFFFFFF, 1)
      g.fillCircle(cx, cy, cr)
      g.fillCircle(cx + cr * 0.55, cy + 4, cr * 0.72)
      g.fillCircle(cx - cr * 0.50, cy + 5, cr * 0.65)
      g.fillCircle(cx + cr * 0.10, cy - cr * 0.30, cr * 0.62)
    }

    g.fillStyle(0x3DAD1A, 1)
    g.fillRect(0, GROUND_Y - 10, W, 18)
    g.fillStyle(0x55D428, 1)
    g.fillRect(0, GROUND_Y - 10, W, 9)

    g.fillStyle(0xC87830, 1)
    g.fillRect(0, GROUND_Y + 8, W, (H - GROUND_Y) * 0.55)
    g.fillStyle(0x8A4E18, 1)
    g.fillRect(0, GROUND_Y + 8 + (H - GROUND_Y) * 0.55, W, (H - GROUND_Y) * 0.45)

    g.lineStyle(2, 0x000000, 0.07)
    for (let y = GROUND_Y + 40; y < H; y += 52) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + 10); g.strokePath()
    }
  }

  // ── MENU state UI ────────────────────────────────────────────────
  _buildMenuUI(W, H) {
    this._clearUI()

    // Name input label
    const nameLabel = this.add.text(W / 2, 200, '你的名字:', {
      fontSize: '20px', color: '#FFFFFF', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5)

    // Name DOM input
    this._nameInput = this.add.dom(W / 2, 235, 'input', [
      'background:#FFFBEE',
      'border:3px solid #8B4000',
      'border-radius:6px',
      'font-size:20px',
      'padding:6px 12px',
      'width:220px',
      'text-align:center',
      'outline:none',
      'color:#333',
    ].join(';'), '')
    this._nameInput.node.placeholder = '输入昵称'
    this._nameInput.node.maxLength = 12

    // "创建房间" button
    const createBtn = this.add.rectangle(W / 2, 298, 220, 52, 0xFF8800)
      .setInteractive({ useHandCursor: true })
    const createText = this.add.text(W / 2, 298, '创建房间', {
      fontSize: '24px', color: '#FFFFFF', fontStyle: 'bold',
      stroke: '#7A3A00', strokeThickness: 3,
    }).setOrigin(0.5)
    createBtn.on('pointerover', () => createBtn.setFillStyle(0xFFAA00))
    createBtn.on('pointerout',  () => createBtn.setFillStyle(0xFF8800))
    createBtn.on('pointerdown', () => this._onCreateRoom())

    // "加入房间" button
    const joinBtn = this.add.rectangle(W / 2, 364, 220, 52, 0x3388CC)
      .setInteractive({ useHandCursor: true })
    const joinText = this.add.text(W / 2, 364, '加入房间', {
      fontSize: '24px', color: '#FFFFFF', fontStyle: 'bold',
      stroke: '#00224466', strokeThickness: 3,
    }).setOrigin(0.5)
    joinBtn.on('pointerover', () => joinBtn.setFillStyle(0x55AAEE))
    joinBtn.on('pointerout',  () => joinBtn.setFillStyle(0x3388CC))
    joinBtn.on('pointerdown', () => this._toggleCodeInput())

    // Code input row (hidden initially)
    this._codeDisplay = this.add.text(W / 2, 428, '', {
      fontSize: '32px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4,
      backgroundColor: '#00000066',
      padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setVisible(false)

    this._codeHint = this.add.text(W / 2, 428, '输入4位房间号 (键盘输入)', {
      fontSize: '16px', color: '#FFEECC', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false)

    this._joinConfirmBtn = this.add.rectangle(W / 2 + 130, 428, 80, 40, 0x22AA44)
      .setInteractive({ useHandCursor: true }).setVisible(false)
    this._joinConfirmText = this.add.text(W / 2 + 130, 428, '加入', {
      fontSize: '18px', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false)
    this._joinConfirmBtn.on('pointerdown', () => this._onJoinRoom())

    // Status / error text
    this._statusText = this.add.text(W / 2, 470, '', {
      fontSize: '16px', color: '#FF6666', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    // Back button
    const backBtn = this.add.text(20, 15, '← 返回', {
      fontSize: '18px', color: '#FFFFFF', stroke: '#000', strokeThickness: 3,
    }).setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => backBtn.setStyle({ color: '#FFD700' }))
    backBtn.on('pointerout',  () => backBtn.setStyle({ color: '#FFFFFF' }))
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'))

    this._uiContainer.add([
      nameLabel, createBtn, createText, joinBtn, joinText,
      this._codeDisplay, this._codeHint, this._joinConfirmBtn, this._joinConfirmText,
      this._statusText, backBtn,
    ])

    // Keyboard listener for code input
    this._keyListener = this.input.keyboard.on('keydown', (e) => {
      if (!this._showCodeInput) return
      if (e.key === 'Backspace') {
        this._codeInput = this._codeInput.slice(0, -1)
      } else if (e.key === 'Enter') {
        this._onJoinRoom()
        return
      } else if (/^[A-Za-z0-9]$/.test(e.key) && this._codeInput.length < 4) {
        this._codeInput += e.key.toUpperCase()
      }
      this._updateCodeDisplay()
    })
  }

  _toggleCodeInput() {
    this._showCodeInput = !this._showCodeInput
    this._codeInput = ''
    const show = this._showCodeInput
    this._codeDisplay.setVisible(show)
    this._codeHint.setVisible(show)
    this._joinConfirmBtn.setVisible(show)
    this._joinConfirmText.setVisible(show)
    if (show) this._updateCodeDisplay()
  }

  _updateCodeDisplay() {
    const display = this._codeInput.padEnd(4, '_').split('').join(' ')
    this._codeDisplay.setText(display)
    this._codeHint.setVisible(this._codeInput.length === 0)
    this._codeDisplay.setVisible(true)
  }

  _getName() {
    const val = this._nameInput?.node?.value?.trim()
    return val || '玩家'
  }

  _onCreateRoom() {
    if (!this.socket) return
    this.socket.emit('create_room', { name: this._getName() })
    this._setStatus('正在创建房间...')
  }

  _onJoinRoom() {
    if (!this.socket || this._codeInput.length < 4) {
      this._setStatus('请输入4位房间号')
      return
    }
    this.socket.emit('join_room', { code: this._codeInput, name: this._getName() })
    this._setStatus('正在加入房间...')
  }

  _setStatus(msg, color = '#FF9999') {
    if (this._statusText) this._statusText.setText(msg).setStyle({ color })
  }

  // ── WAITING state UI ─────────────────────────────────────────────
  _buildWaitingUI(W, H) {
    this._clearUI()

    // Room code display
    this.add.text(W / 2, 200, '房间号', {
      fontSize: '20px', color: '#FFEECC', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1)

    this._roomCodeText = this.add.text(W / 2, 238, this.roomCode, {
      fontSize: '52px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#7A3A00', strokeThickness: 6,
      letterSpacing: 14,
    }).setOrigin(0.5).setDepth(1)

    this.add.text(W / 2, 278, '分享房间号给朋友', {
      fontSize: '16px', color: '#FFFFFF88', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    // Player list
    this._playerListTexts = []
    this._playerDotGfx = this.add.graphics()

    this._counterText = this.add.text(W / 2, 320, '', {
      fontSize: '18px', color: '#FFCC66', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    this._playerListContainer = this.add.container(W / 2 - 120, 348)
    this._refreshPlayerList()

    // Start button (host only)
    if (this.isHost) {
      this._startBtn = this.add.rectangle(W / 2, 440, 200, 50, 0x228833)
        .setInteractive({ useHandCursor: true }).setAlpha(0.5)
      this._startBtnText = this.add.text(W / 2, 440, '开始游戏', {
        fontSize: '22px', color: '#FFFFFF', fontStyle: 'bold',
        stroke: '#004400', strokeThickness: 3,
      }).setOrigin(0.5)
      this._startBtn.on('pointerdown', () => {
        if (this.lobbyPlayers.length >= 2) this.socket.emit('start_game')
      })
    }

    // Status
    this._waitStatus = this.add.text(W / 2, 476, '等待更多玩家加入...', {
      fontSize: '15px', color: '#FFFFFF88', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)
  }

  _refreshPlayerList() {
    if (!this._counterText) return
    this._counterText.setText(`等待玩家 (${this.lobbyPlayers.length}/3)`)

    // Clear old
    if (this._playerListContainer) this._playerListContainer.removeAll(true)
    if (this._playerDotGfx) this._playerDotGfx.clear()

    const W = this.scale.width
    const baseY = 350

    this.lobbyPlayers.forEach((p, i) => {
      const y = baseY + i * 30
      const color = PLAYER_DOT_COLORS[p.id] ?? 0xFFFFFF
      this._playerDotGfx.fillStyle(color, 1)
      this._playerDotGfx.fillCircle(W / 2 - 100, y, 8)

      const t = this.add.text(W / 2 - 85, y, p.name, {
        fontSize: '18px', color: PLAYER_COLORS[p.id] ?? '#FFFFFF',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0, 0.5)
      this._playerListContainer.add(t)
    })

    // Update start button
    if (this._startBtn) {
      const canStart = this.lobbyPlayers.length >= 2
      this._startBtn.setAlpha(canStart ? 1 : 0.5)
    }
  }

  // ── Socket events ─────────────────────────────────────────────────
  _setupSocketEvents() {
    const s = this.socket
    if (!s) return

    s.on('room_created', ({ code, playerId, players }) => {
      this.roomCode = code
      this.myPlayerId = playerId
      this.isHost = true
      this.lobbyPlayers = players
      this._uiState = 'WAITING'
      this._buildWaitingUI(this.scale.width, this.scale.height)
    })

    s.on('room_joined', ({ code, playerId, players }) => {
      this.roomCode = code
      this.myPlayerId = playerId
      this.isHost = false
      this.lobbyPlayers = players
      this._uiState = 'WAITING'
      this._buildWaitingUI(this.scale.width, this.scale.height)
    })

    s.on('player_joined', ({ players }) => {
      this.lobbyPlayers = players
      this._refreshPlayerList()
    })

    s.on('join_error', ({ message }) => {
      this._setStatus(message)
    })

    s.on('game_start', ({ players, items, timeLeft, myPlayerId }) => {
      this.scene.start('MultiScene', {
        socket: this.socket,
        myPlayerId,
        players,
        items,
        timeLeft,
      })
    })
  }

  _clearUI() {
    this._uiContainer.removeAll(true)
    if (this._nameInput) { this._nameInput.destroy(); this._nameInput = null }
  }

  shutdown() {
    if (this._keyListener) {
      this.input.keyboard.off('keydown', this._keyListener)
      this._keyListener = null
    }
    const s = this.socket
    if (s) {
      s.off('room_created')
      s.off('room_joined')
      s.off('player_joined')
      s.off('join_error')
      s.off('game_start')
    }
  }
}
