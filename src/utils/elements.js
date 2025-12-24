export class LabElement {
  constructor(options = {}) {
    this.id = options.id || Date.now().toString()
    this.type = options.type || 'note'
    this.x = options.x || 0
    this.y = options.y || 0
    this.width = options.width || 200
    this.height = options.height || 150
    this.content = options.content || ''
    this.color = options.color || '#FFFFFF'
    this.selected = false
  }

  render(ctx, camera) {
    console.warn('render method must be implemented by subclass')
  }

  isPointInside(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height
  }

  move(dx, dy) {
    this.x += dx
    this.y += dy
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      content: this.content,
      color: this.color
    }
  }
}

export class NoteElement extends LabElement {
  constructor(options = {}) {
    super(options)
    this.type = 'note'
    this.color = options.color || '#FFF59D'
    this.rotation = options.rotation || 1
  }

  render(ctx, camera) {
    ctx.save()
    
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2)
    ctx.rotate(this.rotation * Math.PI / 180)
    ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2))
    
    ctx.fillStyle = this.color
    ctx.fillRect(this.x, this.y, this.width, this.height)
    
    if (this.selected) {
      ctx.strokeStyle = '#2196F3'
      ctx.lineWidth = 3
      ctx.strokeRect(this.x, this.y, this.width, this.height)
    }
    
    ctx.fillStyle = '#333'
    ctx.font = '16px Kalam, cursive'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const lines = this.wrapText(ctx, this.content || '便签', this.width - 20)
    lines.forEach((line, index) => {
      ctx.fillText(line, this.x + this.width / 2, this.y + 30 + index * 20)
    })
    
    ctx.restore()
  }

  wrapText(ctx, text, maxWidth) {
    const words = text.split('')
    const lines = []
    let currentLine = ''
    
    words.forEach(word => {
      const testLine = currentLine + word
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    })
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }
}

export class TimerElement extends LabElement {
  constructor(options = {}) {
    super(options)
    this.type = 'timer'
    this.color = options.color || '#E1F5FE'
    this.startTime = options.startTime || null
    this.duration = options.duration || 0
    this.isRunning = false
  }

  render(ctx, camera) {
    ctx.fillStyle = this.color
    ctx.fillRect(this.x, this.y, this.width, this.height)
    
    if (this.selected) {
      ctx.strokeStyle = '#2196F3'
      ctx.lineWidth = 3
      ctx.strokeRect(this.x, this.y, this.width, this.height)
    }
    
    ctx.fillStyle = '#333'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const timeLeft = this.calculateTimeLeft()
    ctx.fillText(timeLeft, this.x + this.width / 2, this.y + this.height / 2)
    
    if (this.isRunning) {
      ctx.fillStyle = '#4CAF50'
      ctx.beginPath()
      ctx.arc(this.x + this.width - 15, this.y + 15, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  start(duration) {
    this.startTime = Date.now()
    this.duration = duration
    this.isRunning = true
  }

  stop() {
    this.isRunning = false
  }

  calculateTimeLeft() {
    if (!this.startTime || !this.duration) return '00:00'
    
    const elapsed = Date.now() - this.startTime
    const remaining = Math.max(0, this.duration - elapsed)
    
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
}

export class ProtocolElement extends LabElement {
  constructor(options = {}) {
    super(options)
    this.type = 'protocol'
    this.color = options.color || '#E8F5E9'
    this.steps = this.parseSteps(options.content || '步骤 1')
  }

  render(ctx, camera) {
    ctx.fillStyle = this.color
    ctx.fillRect(this.x, this.y, this.width, this.height)
    
    ctx.fillStyle = '#4CAF50'
    ctx.fillRect(this.x, this.y, this.width, 10)
    
    if (this.selected) {
      ctx.strokeStyle = '#2196F3'
      ctx.lineWidth = 3
      ctx.strokeRect(this.x, this.y, this.width, this.height)
    }
    
    ctx.fillStyle = '#333'
    ctx.font = '14px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    
    this.steps.forEach((step, index) => {
      const y = this.y + 20 + index * 25
      
      ctx.strokeStyle = step.done ? '#4CAF50' : '#ccc'
      ctx.lineWidth = 2
      ctx.strokeRect(this.x + 10, y, 15, 15)
      
      if (step.done) {
        ctx.beginPath()
        ctx.moveTo(this.x + 13, y + 7)
        ctx.lineTo(this.x + 17, y + 11)
        ctx.lineTo(this.x + 22, y + 3)
        ctx.stroke()
      }
      
      ctx.fillStyle = '#333'
      ctx.fillText(step.text, this.x + 35, y)
    })
  }

  parseSteps(content) {
    const lines = content.split('\n').filter(line => line.trim())
    return lines.map((line, index) => ({
      text: line,
      done: false
    }))
  }

  toggleStep(index) {
    if (this.steps[index]) {
      this.steps[index].done = !this.steps[index].done
    }
  }

  updateContent() {
    this.content = this.steps.map(step => step.text).join('\n')
  }
}

export class TextElement extends LabElement {
  constructor(options = {}) {
    super(options)
    this.type = 'text'
    this.color = 'transparent'
    this.align = options.align || 'left'
    this.fontSize = options.fontSize || 16
    this.fontWeight = options.fontWeight || 'normal'
  }

  render(ctx, camera) {
    if (this.selected) {
      ctx.strokeStyle = '#2196F3'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(this.x, this.y, this.width, this.height)
      ctx.setLineDash([])
    }
    
    ctx.fillStyle = '#333'
    ctx.font = `${this.fontWeight} ${this.fontSize}px Arial`
    ctx.textAlign = this.align
    ctx.textBaseline = 'top'
    
    const lines = this.wrapText(ctx, this.content || '文本', this.width)
    lines.forEach((line, index) => {
      let x = this.x
      if (this.align === 'center') x = this.x + this.width / 2
      if (this.align === 'right') x = this.x + this.width
      
      ctx.fillText(line, x, this.y + index * 20)
    })
  }

  wrapText(ctx, text, maxWidth) {
    const words = text.split('')
    const lines = []
    let currentLine = ''
    
    words.forEach(word => {
      const testLine = currentLine + word
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    })
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }
}

export class FileElement extends LabElement {
  constructor(options = {}) {
    super(options)
    this.type = 'file'
    this.color = options.color || '#F3E5F5'
    this.fileName = options.fileName || options.content || '文件'
    this.fileSize = options.fileSize || '0 KB'
    this.fileData = options.fileData || null
  }

  render(ctx, camera) {
    if (this.selected) {
      ctx.strokeStyle = '#2196F3'
      ctx.lineWidth = 3
      ctx.strokeRect(this.x, this.y, this.width, this.height)
    }
    
    ctx.fillStyle = this.color
    ctx.fillRect(this.x, this.y, this.width, this.height)
    
    ctx.fillStyle = '#9C27B0'
    ctx.fillRect(this.x + 10, this.y + 10, 30, 40)
    
    ctx.fillStyle = 'white'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('FILE', this.x + 25, this.y + 30)
    
    ctx.fillStyle = '#333'
    ctx.font = '12px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(this.fileName, this.x + 50, this.y + 30)
    
    ctx.fillStyle = '#666'
    ctx.font = '10px Arial'
    ctx.fillText(this.fileSize, this.x + 50, this.y + 45)
  }
}

export function createElement(type, options = {}) {
  switch (type) {
    case 'note':
      return new NoteElement(options)
    case 'timer':
      return new TimerElement(options)
    case 'protocol':
      return new ProtocolElement(options)
    case 'text':
      return new TextElement(options)
    case 'file':
      return new FileElement(options)
    default:
      return new LabElement({ ...options, type })
  }
}