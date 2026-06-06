import Phaser from 'phaser'

const PLAYER_COLORS   = ['#FF9900', '#44AAFF', '#55DD55']
const PLAYER_DOT_COLORS = [0xFF9900, 0x44AAFF, 0x55DD55]

// editMode: 'none' | 'name' | 'code'

export default class LobbyScene extends Phaser.Scene {
  constructor() { super('LobbyScene') }

  init(data) {
    this.socket      = data.socket
    this.myPlayerId  = null
    this.roomCode    = null
    this.isHost      = false
    this.lobbyPlayers = []
    this._editMode   = 'none'
    this._playerName = '矿工'
    this._codeInput  = ''
    this._showCodeInput = false
    this._keyHandler = null
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    this.W = W; this.H = H

    this._drawBackground(W, H)

    this.add.text(W / 2, 38, '多人游戏', {
      fontSize: '40px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#7A3A00', strokeThickness: 7,
    }).setOrigin(0.5)

    // Container for state-specific UI
    this._uiContainer = this.add.container(0, 0)

    // Global keyboard handler
    this._keyHandler = (e) => this._onKey(e)
    this.input.keyboard?.on('keydown', this._keyHandler)

    this._buildMenuUI(W, H)
    this._setupSocketEvents()
  }

  // ── Background ───────────────────────────────────────────────────
  _drawBackground(W, H) {
    const g = this.add.graphics()
    const GY = 185

    g.fillStyle(0x44AADD, 1)
    g.fillRect(0, 0, W, GY)
    g.fillStyle(0xFFEE33, 1)
    g.fillCircle(W - 55, 42, 26)
    g.fillStyle(0xFFFF88, 0.5)
    g.fillCircle(W - 55, 42, 36)

    for (const [cx, cy, cr] of [[100,38,28],[285,22,22],[510,42,26],[695,28,20]]) {
      g.fillStyle(0xFFFFFF, 1)
      g.fillCircle(cx, cy, cr)
      g.fillCircle(cx + cr*0.55, cy + 4, cr*0.72)
      g.fillCircle(cx - cr*0.50, cy + 5, cr*0.65)
      g.fillCircle(cx + cr*0.10, cy - cr*0.30, cr*0.62)
    }

    g.fillStyle(0x3DAD1A, 1); g.fillRect(0, GY - 8, W, 18)
    g.fillStyle(0x55D428, 1); g.fillRect(0, GY - 8, W, 9)
    g.fillStyle(0xC87830, 1); g.fillRect(0, GY + 10, W, (H - GY) * 0.55)
    g.fillStyle(0x8A4E18, 1); g.fillRect(0, GY + 10 + (H - GY)*0.55, W, (H - GY)*0.45)
    g.lineStyle(2, 0x000000, 0.07)
    for (let y = GY + 40; y < H; y += 52) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + 10); g.strokePath()
    }
  }

  // ── MENU state ───────────────────────────────────────────────────
  _buildMenuUI(W, H) {
    this._clearUI()
    this._editMode   = 'none'
    this._codeInput  = ''
    this._showCodeInput = false

    // ── Name input (Phaser-native, no DOM) ──
    const nameLabel = this.add.text(W/2, 192, '你的名字', {
      fontSize: '17px', color: '#FFEECC', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    const nameBg = this.add.rectangle(W/2, 222, 230, 42, 0x2A1500)
      .setStrokeStyle(2, 0x996633)
      .setInteractive({ useHandCursor: true })

    this._nameDisplay = this.add.text(W/2, 222, this._playerName, {
      fontSize: '20px', color: '#FFD700', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    this._nameCursor = this.add.text(W/2, 222, '', {
      fontSize: '20px', color: '#FFD700',
    }).setOrigin(0, 0.5).setVisible(false)

    this._nameBg = nameBg
    nameBg.on('pointerdown', () => this._activateEdit('name'))

    // ── Create button ──
    const createBtn = this.add.rectangle(W/2, 286, 220, 52, 0xFF8800)
      .setInteractive({ useHandCursor: true })
    const createTxt = this.add.text(W/2, 286, '创建房间', {
      fontSize: '24px', color: '#FFF', fontStyle: 'bold',
      stroke: '#7A3A00', strokeThickness: 3,
    }).setOrigin(0.5)
    createBtn.on('pointerover', () => createBtn.setFillStyle(0xFFAA00))
    createBtn.on('pointerout',  () => createBtn.setFillStyle(0xFF8800))
    createBtn.on('pointerdown', () => this._onCreateRoom())

    // ── Join button ──
    const joinBtn = this.add.rectangle(W/2, 350, 220, 52, 0x3388CC)
      .setInteractive({ useHandCursor: true })
    const joinTxt = this.add.text(W/2, 350, '加入房间', {
      fontSize: '24px', color: '#FFF', fontStyle: 'bold',
      stroke: '#004488', strokeThickness: 3,
    }).setOrigin(0.5)
    joinBtn.on('pointerover', () => joinBtn.setFillStyle(0x55AAEE))
    joinBtn.on('pointerout',  () => joinBtn.setFillStyle(0x3388CC))
    joinBtn.on('pointerdown', () => this._toggleCodeInput())

    // ── Code input row (hidden by default) ──
    this._codeBg = this.add.rectangle(W/2 - 40, 415, 200, 44, 0x001133)
      .setStrokeStyle(2, 0x003388)
      .setInteractive({ useHandCursor: true })
      .setVisible(false)
    this._codeDisplay = this.add.text(W/2 - 40, 415, '', {
      fontSize: '30px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setVisible(false)
    this._codeHint = this.add.text(W/2 - 40, 415, '输入4位房间号', {
      fontSize: '14px', color: '#AAAAAA', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false)

    const confirmBtn = this.add.rectangle(W/2 + 102, 415, 64, 44, 0x22AA44)
      .setInteractive({ useHandCursor: true })
      .setVisible(false)
    const confirmTxt = this.add.text(W/2 + 102, 415, '加入', {
      fontSize: '18px', color: '#FFF', fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false)
    confirmBtn.on('pointerdown', () => this._onJoinRoom())

    this._codeBg.on('pointerdown', () => this._activateEdit('code'))
    this._confirmBtn = confirmBtn
    this._confirmTxt = confirmTxt

    // ── Status text ──
    this._statusText = this.add.text(W/2, 468, '', {
      fontSize: '15px', color: '#FF8888', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    // ── Back button ──
    const backBtn = this.add.text(20, 14, '← 返回', {
      fontSize: '18px', color: '#FFFFFF', stroke: '#000', strokeThickness: 3,
    }).setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => backBtn.setStyle({ color: '#FFD700' }))
    backBtn.on('pointerout',  () => backBtn.setStyle({ color: '#FFFFFF' }))
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'))

    this._uiContainer.add([
      nameLabel, nameBg, this._nameDisplay, this._nameCursor,
      createBtn, createTxt, joinBtn, joinTxt,
      this._codeBg, this._codeDisplay, this._codeHint,
      confirmBtn, confirmTxt, this._statusText, backBtn,
    ])

    // Cursor blink
    this._cursorBlink = this.time.addEvent({
      delay: 500, loop: true,
      callback: () => {
        if (this._editMode !== 'none') {
          this._nameCursor.setVisible(v => !v)
        } else {
          this._nameCursor.setVisible(false)
        }
      },
    })
  }

  _activateEdit(mode) {
    this._editMode = mode
    if (mode === 'name') {
      this._nameBg?.setStrokeStyle(3, 0xFFCC00)
      this._codeBg?.setStrokeStyle(2, 0x003388)
      this._nameCursor.setVisible(true)
      this._syncNameCursor()
    } else if (mode === 'code') {
      this._nameBg?.setStrokeStyle(2, 0x996633)
      this._codeBg?.setStrokeStyle(3, 0xFFCC00)
      this._nameCursor.setVisible(false)
    }
  }

  _syncNameCursor() {
    if (!this._nameDisplay || !this._nameCursor) return
    // Position cursor after the text
    const bounds = this._nameDisplay.getBounds()
    this._nameCursor.setPosition(bounds.right + 1, this._nameDisplay.y)
    this._nameCursor.setText('|')
  }

  _onKey(e) {
    if (this._editMode === 'name') {
      if (e.key === 'Backspace') {
        this._playerName = this._playerName.slice(0, -1)
        if (!this._playerName) this._playerName = ''
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        this._editMode = 'none'
        this._nameBg?.setStrokeStyle(2, 0x996633)
        this._nameCursor.setVisible(false)
        if (!this._playerName.trim()) this._playerName = '矿工'
      } else if (e.key.length === 1 && this._playerName.length < 10) {
        this._playerName += e.key
      }
      this._nameDisplay?.setText(this._playerName || '|')
      this._syncNameCursor()

    } else if (this._editMode === 'code') {
      if (e.key === 'Backspace') {
        this._codeInput = this._codeInput.slice(0, -1)
      } else if (e.key === 'Enter') {
        this._onJoinRoom(); return
      } else if (/^[A-Za-z0-9]$/.test(e.key) && this._codeInput.length < 4) {
        this._codeInput += e.key.toUpperCase()
      }
      this._updateCodeDisplay()
    }
  }

  _toggleCodeInput() {
    this._showCodeInput = !this._showCodeInput
    this._codeInput = ''
    const show = this._showCodeInput
    this._codeBg?.setVisible(show)
    this._codeDisplay?.setVisible(show)
    this._codeHint?.setVisible(show)
    this._confirmBtn?.setVisible(show)
    this._confirmTxt?.setVisible(show)
    if (show) {
      this._updateCodeDisplay()
      this._activateEdit('code')
    } else {
      this._editMode = 'none'
    }
  }

  _updateCodeDisplay() {
    if (!this._codeDisplay) return
    const s = this._codeInput.padEnd(4, '_').split('').join(' ')
    this._codeDisplay.setText(s)
    this._codeHint?.setVisible(this._codeInput.length === 0)
  }

  _getName() {
    return this._playerName.trim() || '矿工'
  }

  _onCreateRoom() {
    if (!this.socket) return
    this._setStatus('正在创建房间...')
    this.socket.emit('create_room', { name: this._getName() })
  }

  _onJoinRoom() {
    if (!this.socket) return
    if (this._codeInput.length < 4) {
      this._setStatus('请输入4位房间号')
      return
    }
    this._setStatus('正在加入...')
    this.socket.emit('join_room', { code: this._codeInput, name: this._getName() })
  }

  _setStatus(msg, color = '#FF9999') {
    this._statusText?.setText(msg).setStyle({ color })
  }

  // ── WAITING state ────────────────────────────────────────────────
  _buildWaitingUI(W, H) {
    this._clearUI()
    this._editMode = 'none'

    const codeLabel = this.add.text(W/2, 195, '房间号', {
      fontSize: '18px', color: '#FFEECC', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    const codeText = this.add.text(W/2, 240, this.roomCode, {
      fontSize: '56px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#7A3A00', strokeThickness: 6,
      letterSpacing: 14,
    }).setOrigin(0.5)

    const shareHint = this.add.text(W/2, 282, '把房间号分享给朋友', {
      fontSize: '15px', color: '#FFFFFF88', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    this._counterText = this.add.text(W/2, 320, '', {
      fontSize: '18px', color: '#FFCC66', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    this._dotGfx = this.add.graphics()
    this._playerListContainer = this.add.container(W/2 - 110, 346)

    this._refreshPlayerList()

    // Host-only start button
    this._startBtn = null
    if (this.isHost) {
      this._startBtn = this.add.rectangle(W/2, 444, 210, 50, 0x228833)
        .setInteractive({ useHandCursor: true }).setAlpha(0.4)
      this._startBtnTxt = this.add.text(W/2, 444, '开始游戏', {
        fontSize: '22px', color: '#FFF', fontStyle: 'bold',
        stroke: '#004400', strokeThickness: 3,
      }).setOrigin(0.5)
      this._startBtn.on('pointerdown', () => {
        if (this.lobbyPlayers.length >= 2) this.socket.emit('start_game')
      })
      this._uiContainer.add([this._startBtn, this._startBtnTxt])
    }

    this._waitStatus = this.add.text(W/2, 478, '等待玩家加入...', {
      fontSize: '14px', color: '#FFFFFF66', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)

    this._uiContainer.add([
      codeLabel, codeText, shareHint,
      this._counterText, this._dotGfx, this._playerListContainer,
      this._waitStatus,
    ])
  }

  _refreshPlayerList() {
    if (!this._counterText) return
    this._counterText.setText(`等待玩家 (${this.lobbyPlayers.length} / 3)`)
    this._playerListContainer?.removeAll(true)
    this._dotGfx?.clear()

    const W = this.W
    this.lobbyPlayers.forEach((p, i) => {
      const y = 350 + i * 30
      const col = PLAYER_DOT_COLORS[p.id] ?? 0xFFFFFF
      this._dotGfx.fillStyle(col, 1).fillCircle(W/2 - 100, y, 8)
      const t = this.add.text(W/2 - 85, y, p.name, {
        fontSize: '18px', color: PLAYER_COLORS[p.id] ?? '#FFFFFF',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0, 0.5)
      this._playerListContainer?.add(t)
    })

    if (this._startBtn) {
      const canStart = this.lobbyPlayers.length >= 2
      this._startBtn.setAlpha(canStart ? 1 : 0.4)
    }
  }

  // ── Socket events ────────────────────────────────────────────────
  _setupSocketEvents() {
    const s = this.socket
    if (!s) return

    s.on('room_created', ({ code, playerId, players }) => {
      this.roomCode = code; this.myPlayerId = playerId
      this.isHost = true; this.lobbyPlayers = players
      this._buildWaitingUI(this.W, this.H)
    })

    s.on('room_joined', ({ code, playerId, players }) => {
      this.roomCode = code; this.myPlayerId = playerId
      this.isHost = false; this.lobbyPlayers = players
      this._buildWaitingUI(this.W, this.H)
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

  // ── Helpers ──────────────────────────────────────────────────────
  _clearUI() {
    if (this._cursorBlink) { this._cursorBlink.remove(); this._cursorBlink = null }
    this._uiContainer?.removeAll(true)
    // Reset refs that may have been destroyed
    this._nameDisplay = null; this._nameBg = null; this._nameCursor = null
    this._codeDisplay = null; this._codeBg = null; this._codeHint = null
    this._confirmBtn = null; this._confirmTxt = null
    this._statusText = null; this._counterText = null
    this._dotGfx = null; this._playerListContainer = null
    this._startBtn = null; this._waitStatus = null
  }

  shutdown() {
    if (this._keyHandler) {
      this.input.keyboard?.off('keydown', this._keyHandler)
      this._keyHandler = null
    }
    const s = this.socket
    if (s) {
      s.off('room_created'); s.off('room_joined'); s.off('player_joined')
      s.off('join_error');   s.off('game_start')
    }
  }
}
