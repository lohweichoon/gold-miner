// ── Cartoon-style item drawing (draw at local 0,0) ──────────────

export function blob(g, r, wobbleAmp = 0.14, pts = 10) {
  g.beginPath()
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2 - Math.PI / 2
    const w = 1 - wobbleAmp + wobbleAmp * 2 * ((i % 3 === 1) ? 0.6 : 1)
    i === 0
      ? g.moveTo(Math.cos(a) * r * w, Math.sin(a) * r * w)
      : g.lineTo(Math.cos(a) * r * w, Math.sin(a) * r * w)
  }
  g.closePath()
}

export function drawGold(g, r) {
  const outline = Math.max(3, r * 0.11)

  // Main nugget body
  g.lineStyle(outline, 0x7A4400, 1)
  g.fillStyle(0xFFAA00, 1)
  blob(g, r, 0.16)
  g.fillPath()
  g.strokePath()

  // Inner bright zone
  g.fillStyle(0xFFCC33, 1)
  blob(g, r * 0.65, 0.12)
  g.fillPath()

  // Highlight oval
  g.fillStyle(0xFFEE88, 0.9)
  g.fillEllipse(-r * 0.22, -r * 0.24, r * 0.55, r * 0.40)

  // Specular dot
  g.fillStyle(0xFFFFCC, 1)
  g.fillCircle(-r * 0.28, -r * 0.32, r * 0.14)
}

export function drawRock(g, r) {
  const outline = Math.max(3, r * 0.10)
  const pts = 7

  // Shadow fill (offset)
  g.fillStyle(0x444444, 1)
  g.beginPath()
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2 - 0.3
    const w = 0.78 + 0.22 * Math.sin(i * 1.8 + 0.8)
    i === 0
      ? g.moveTo(Math.cos(a) * r * w + r * 0.12, Math.sin(a) * r * w * 0.85 + r * 0.12)
      : g.lineTo(Math.cos(a) * r * w + r * 0.12, Math.sin(a) * r * w * 0.85 + r * 0.12)
  }
  g.closePath()
  g.fillPath()

  // Main rock body
  g.lineStyle(outline, 0x333333, 1)
  g.fillStyle(0x8A8A8A, 1)
  g.beginPath()
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2 - 0.3
    const w = 0.78 + 0.22 * Math.sin(i * 1.8 + 0.8)
    i === 0
      ? g.moveTo(Math.cos(a) * r * w, Math.sin(a) * r * w * 0.85)
      : g.lineTo(Math.cos(a) * r * w, Math.sin(a) * r * w * 0.85)
  }
  g.closePath()
  g.fillPath()
  g.strokePath()

  // Highlight
  g.fillStyle(0xCCCCCC, 0.7)
  g.fillEllipse(-r * 0.2, -r * 0.22, r * 0.70, r * 0.48)

  // Crack lines
  g.lineStyle(2, 0x444444, 0.8)
  g.beginPath(); g.moveTo(-r*0.08, -r*0.18); g.lineTo(r*0.14, r*0.24); g.strokePath()
  g.beginPath(); g.moveTo(r*0.06, -r*0.12); g.lineTo(-r*0.12, r*0.18); g.strokePath()
}

export function drawDiamond(g, r) {
  // Shadow
  g.fillStyle(0x000000, 0.18)
  g.fillEllipse(r * 0.14, r * 0.95, r * 1.2, r * 0.38)

  // Gem body
  const top  = [0,          -r]
  const ml   = [-r * 0.65,  -r * 0.08]
  const mr   = [ r * 0.65,  -r * 0.08]
  const bl   = [-r * 0.45,   r * 0.96]
  const br   = [ r * 0.45,   r * 0.96]
  const mid  = [0,           r * 0.22]

  const facets = [
    { pts: [top, ml,  mid], fill: 0xCCEEFF },
    { pts: [top, mid, mr ], fill: 0x88CCFF },
    { pts: [ml,  mid, bl ], fill: 0x55AAEE },
    { pts: [mid, mr,  br ], fill: 0x3388CC },
    { pts: [mid, bl,  br ], fill: 0x1166AA },
  ]

  for (const f of facets) {
    g.fillStyle(f.fill, 1)
    g.beginPath()
    g.moveTo(f.pts[0][0], f.pts[0][1])
    for (let i = 1; i < f.pts.length; i++) g.lineTo(f.pts[i][0], f.pts[i][1])
    g.closePath()
    g.fillPath()
  }

  // Outline
  g.lineStyle(3, 0x1155BB, 1)
  g.beginPath()
  g.moveTo(top[0], top[1]); g.lineTo(ml[0], ml[1]); g.lineTo(bl[0], bl[1])
  g.lineTo(br[0], br[1]); g.lineTo(mr[0], mr[1]); g.closePath()
  g.strokePath()
  // Inner lines
  g.lineStyle(1.5, 0x3377CC, 0.6)
  g.beginPath(); g.moveTo(top[0],top[1]); g.lineTo(mid[0],mid[1]); g.strokePath()
  g.beginPath(); g.moveTo(ml[0],ml[1]);   g.lineTo(mid[0],mid[1]); g.strokePath()
  g.beginPath(); g.moveTo(mr[0],mr[1]);   g.lineTo(mid[0],mid[1]); g.strokePath()

  // Sparkle
  g.fillStyle(0xFFFFFF, 0.95)
  g.fillCircle(-r * 0.20, -r * 0.62, r * 0.12)
  g.fillStyle(0xFFFFFF, 0.50)
  g.fillCircle(-r * 0.20, -r * 0.62, r * 0.22)
}

export function drawBag(g, r) {
  // Shadow
  g.fillStyle(0x000000, 0.20)
  g.fillEllipse(r * 0.14, r * 0.58, r * 1.6, r * 0.50)

  // Body
  g.lineStyle(3.5, 0x7A2E00, 1)
  g.fillStyle(0xCC5522, 1)
  g.fillCircle(0, r * 0.06, r)
  g.strokeCircle(0, r * 0.06, r)

  // Highlight on body
  g.fillStyle(0xFF8855, 0.7)
  g.fillEllipse(-r * 0.25, -r * 0.18, r * 0.80, r * 0.60)

  // Neck
  g.fillStyle(0xAA3A10, 1)
  g.fillRect(-r * 0.26, -r * 0.78, r * 0.52, r * 0.52)
  g.lineStyle(3, 0x7A2E00, 1)
  g.strokeRect(-r * 0.26, -r * 0.78, r * 0.52, r * 0.52)

  // Tie band
  g.lineStyle(3.5, 0xFFCC00, 1)
  g.beginPath(); g.moveTo(-r * 0.26, -r * 0.57); g.lineTo(r * 0.26, -r * 0.57); g.strokePath()

  // Crown knot
  g.fillStyle(0xFFCC00, 1)
  g.lineStyle(2, 0xAA8800, 1)
  g.fillCircle(0, -r * 0.88, r * 0.22)
  g.strokeCircle(0, -r * 0.88, r * 0.22)
}
