export class Connection {
  constructor(options = {}) {
    this.id = options.id || Date.now().toString()
    this.from = options.from
    this.to = options.to
    this.curvature = options.curvature || 0.3
    this.color = options.color || '#666'
    this.lineWidth = options.lineWidth || 2
    this.dashArray = options.dashArray || null
  }

  render(ctx, elements) {
    const fromElement = elements.find(el => el.id === this.from)
    const toElement = elements.find(el => el.id === this.to)
    
    if (!fromElement || !toElement) return
    
    const fromX = fromElement.x + fromElement.width / 2
    const fromY = fromElement.y + fromElement.height / 2
    const toX = toElement.x + toElement.width / 2
    const toY = toElement.y + toElement.height / 2
    
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.lineWidth
    
    if (this.dashArray) {
      ctx.setLineDash(this.dashArray)
    }
    
    ctx.beginPath()
    
    if (this.curvature) {
      const controlX = (fromX + toX) / 2 + this.curvature * 100
      const controlY = (fromY + toY) / 2 + this.curvature * 100
      ctx.moveTo(fromX, fromY)
      ctx.quadraticCurveTo(controlX, controlY, toX, toY)
    } else {
      ctx.moveTo(fromX, fromY)
      ctx.lineTo(toX, toY)
    }
    
    ctx.stroke()
    
    if (this.dashArray) {
      ctx.setLineDash([])
    }
    
    this.drawArrow(ctx, fromX, fromY, toX, toY)
  }

  drawArrow(ctx, fromX, fromY, toX, toY) {
    const angle = Math.atan2(toY - fromY, toX - fromX)
    const arrowLength = 15
    const arrowAngle = Math.PI / 6
    
    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle - arrowAngle),
      toY - arrowLength * Math.sin(angle - arrowAngle)
    )
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle + arrowAngle),
      toY - arrowLength * Math.sin(angle + arrowAngle)
    )
    ctx.closePath()
    ctx.fillStyle = this.color
    ctx.fill()
  }

  toJSON() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      curvature: this.curvature,
      color: this.color,
      lineWidth: this.lineWidth,
      dashArray: this.dashArray
    }
  }
}

export function createConnection(fromId, toId, options = {}) {
  return new Connection({
    from: fromId,
    to: toId,
    ...options
  })
}

export function findConnectionPath(fromElement, toElement, curvature = 0.3) {
  const fromX = fromElement.x + fromElement.width / 2
  const fromY = fromElement.y + fromElement.height / 2
  const toX = toElement.x + toElement.width / 2
  const toY = toElement.y + toElement.height / 2
  
  const controlX = (fromX + toX) / 2 + curvature * 100
  const controlY = (fromY + toY) / 2 + curvature * 100
  
  return {
    start: { x: fromX, y: fromY },
    control: { x: controlX, y: controlY },
    end: { x: toX, y: toY }
  }
}

export function isPointOnConnection(x, y, connection, elements, threshold = 5) {
  const fromElement = elements.find(el => el.id === connection.from)
  const toElement = elements.find(el => el.id === connection.to)
  
  if (!fromElement || !toElement) return false
  
  const path = findConnectionPath(fromElement, toElement, connection.curvature)
  
  for (let t = 0; t <= 1; t += 0.01) {
    const pointX = (1 - t) * (1 - t) * path.start.x + 
                   2 * (1 - t) * t * path.control.x + 
                   t * t * path.end.x
    const pointY = (1 - t) * (1 - t) * path.start.y + 
                   2 * (1 - t) * t * path.control.y + 
                   t * t * path.end.y
    
    const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2)
    if (distance <= threshold) {
      return true
    }
  }
  
  return false
}