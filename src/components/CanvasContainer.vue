<template>
  <div class="canvas-container" ref="container">
    <canvas 
      ref="canvas"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
      @contextmenu.prevent
    ></canvas>
    <div class="selection-box" v-if="isBoxSelecting" :style="selectionBoxStyle"></div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'

export default {
  name: 'CanvasContainer',
  props: {
    elements: Array,
    connections: Array
  },
  emits: ['element-update', 'connection-create', 'element-create'],
  setup(props, { emit }) {
    const canvas = ref(null)
    const container = ref(null)
    const ctx = ref(null)
    const camera = ref({ x: 0, y: 0, zoom: 1 })
    const isDragging = ref(false)
    const dragStart = ref({ x: 0, y: 0 })
    const panVelocity = ref({ x: 0, y: 0 })
    const isBoxSelecting = ref(false)
    const boxSelection = ref({ startX: 0, startY: 0, endX: 0, endY: 0 })
    const selectedElements = ref([])
    const isDirty = ref(true)
    let animationFrameId = null
    let lastPanTime = 0
    let lastClickTime = null
    let lastClickedElement = null
    const editingElement = ref(null)
    const editInput = ref(null)
    
    // 元素拖拽相关
    const isElementDragging = ref(false)
    const draggedElement = ref(null)
    const dragOffset = ref({ x: 0, y: 0 })

    onMounted(() => {
      initCanvas()
      startRenderLoop()
      setupInertialPanning()
    })

    onUnmounted(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      
      window.removeEventListener('resize', handleResize)
    })

    const initCanvas = () => {
      if (!canvas.value || !container.value) return
      
      canvas.value.width = container.value.clientWidth
      canvas.value.height = container.value.clientHeight
      ctx.value = canvas.value.getContext('2d')
      
      if (!ctx.value) {
        console.error('Failed to get canvas context')
        return
      }
      
      window.addEventListener('resize', handleResize)
    }

    const handleResize = () => {
      if (!canvas.value || !container.value) return
      
      canvas.value.width = container.value.clientWidth
      canvas.value.height = container.value.clientHeight
      isDirty.value = true
    }

    const startRenderLoop = () => {
      const render = () => {
        if (isDirty.value) {
          draw()
          isDirty.value = false
        }
        
        updateInertialPanning()
        animationFrameId = requestAnimationFrame(render)
      }
      render()
    }

    const draw = () => {
      if (!ctx.value || !canvas.value) return
      
      try {
        ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
        ctx.value.save()
      } catch (error) {
        console.error('Canvas drawing error:', error)
        return
      }
      
      ctx.value.translate(canvas.value.width / 2, canvas.value.height / 2)
      ctx.value.scale(camera.value.zoom, camera.value.zoom)
      ctx.value.translate(-camera.value.x, -camera.value.y)
      
      drawGrid()
      drawConnections()
      drawElements()
      
      ctx.value.restore()
    }

    const drawGrid = () => {
      const gridSize = 50
      const startX = Math.floor((camera.value.x - canvas.value.width / camera.value.zoom / 2) / gridSize) * gridSize
      const endX = Math.ceil((camera.value.x + canvas.value.width / camera.value.zoom / 2) / gridSize) * gridSize
      const startY = Math.floor((camera.value.y - canvas.value.height / camera.value.zoom / 2) / gridSize) * gridSize
      const endY = Math.ceil((camera.value.y + canvas.value.height / camera.value.zoom / 2) / gridSize) * gridSize

      ctx.value.strokeStyle = '#e0e0e0'
      ctx.value.lineWidth = 1 / camera.value.zoom

      for (let x = startX; x <= endX; x += gridSize) {
        ctx.value.beginPath()
        ctx.value.moveTo(x, startY)
        ctx.value.lineTo(x, endY)
        ctx.value.stroke()
      }

      for (let y = startY; y <= endY; y += gridSize) {
        ctx.value.beginPath()
        ctx.value.moveTo(startX, y)
        ctx.value.lineTo(endX, y)
        ctx.value.stroke()
      }
    }

    const drawElements = () => {
      if (!ctx.value) return
      
      props.elements.forEach(element => {
        if (ctx.value) {
          drawElement(element)
        }
      })
    }

    const drawElement = (element) => {
      if (!ctx.value) return
      
      const isSelected = selectedElements.value.includes(element.id)
      
      try {
        ctx.value.save()
        
        if (element.type === 'note') {
          drawNoteElement(element, isSelected)
        } else if (element.type === 'timer') {
          drawTimerElement(element, isSelected)
        } else if (element.type === 'protocol') {
          drawProtocolElement(element, isSelected)
        } else if (element.type === 'text') {
          drawTextElement(element, isSelected)
        } else if (element.type === 'file') {
          drawFileElement(element, isSelected)
        }
        
        ctx.value.restore()
      } catch (error) {
        console.error('Error drawing element:', element, error)
        if (ctx.value) {
          try {
            ctx.value.restore()
          } catch (e) {
            console.error('Error restoring context:', e)
          }
        }
      }
    }

    const drawNoteElement = (element, isSelected) => {
      if (!ctx.value) return
      
      try {
        // 绘制阴影
        ctx.value.shadowColor = 'rgba(0, 0, 0, 0.2)'
        ctx.value.shadowBlur = 10
        ctx.value.shadowOffsetX = 3
        ctx.value.shadowOffsetY = 3
        
        // 绘制便签背景
        const gradient = ctx.value.createLinearGradient(element.x, element.y, element.x + element.width, element.y + element.height)
        const baseColor = element.color || '#FFF59D'
        gradient.addColorStop(0, baseColor)
        gradient.addColorStop(1, adjustColor(baseColor, -20))
        ctx.value.fillStyle = gradient
        ctx.value.fillRect(element.x, element.y, element.width, element.height)
        
        // 重置阴影
        ctx.value.shadowColor = 'transparent'
        ctx.value.shadowBlur = 0
        ctx.value.shadowOffsetX = 0
        ctx.value.shadowOffsetY = 0
        
        // 绘制边框
        ctx.value.strokeStyle = adjustColor(baseColor, -40)
        ctx.value.lineWidth = 1
        ctx.value.strokeRect(element.x, element.y, element.width, element.height)
        
        // 绘制选中状态
        if (isSelected) {
          ctx.value.strokeStyle = '#2196F3'
          ctx.value.lineWidth = 3
          ctx.value.setLineDash([5, 3])
          ctx.value.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4)
          ctx.value.setLineDash([])
        }
        
        // 添加轻微旋转效果
        ctx.value.save()
        ctx.value.translate(element.x + element.width / 2, element.y + element.height / 2)
        ctx.value.rotate((element.rotation || 1) * Math.PI / 180)
        ctx.value.translate(-(element.x + element.width / 2), -(element.y + element.height / 2))
        
        // 绘制文本
        ctx.value.fillStyle = '#333'
        ctx.value.font = '16px "Kalam", "Comic Sans MS", cursive'
        ctx.value.textAlign = 'left'
        ctx.value.textBaseline = 'top'
        
        const lines = wrapText(element.content || '便签内容', element.width - 30)
        lines.forEach((line, index) => {
          ctx.value.fillText(line, element.x + 15, element.y + 20 + index * 22)
        })
        
        // 绘制折叠角效果
        ctx.value.fillStyle = adjustColor(baseColor, -30)
        ctx.value.beginPath()
        ctx.value.moveTo(element.x + element.width - 20, element.y)
        ctx.value.lineTo(element.x + element.width, element.y)
        ctx.value.lineTo(element.x + element.width, element.y + 20)
        ctx.value.closePath()
        ctx.value.fill()
        
        ctx.value.restore()
      } catch (error) {
        console.error('Error drawing note element:', error)
      }
    }

    const drawTimerElement = (element, isSelected) => {
      if (!ctx.value) return
      
      try {
        // 绘制阴影
        ctx.value.shadowColor = 'rgba(0, 0, 0, 0.15)'
        ctx.value.shadowBlur = 8
        ctx.value.shadowOffsetX = 2
        ctx.value.shadowOffsetY = 2
        
        // 绘制背景
        const baseColor = element.color || '#E1F5FE'
        const gradient = ctx.value.createRadialGradient(
          element.x + element.width / 2, element.y + element.height / 2, 0,
          element.x + element.width / 2, element.y + element.height / 2, Math.max(element.width, element.height) / 2
        )
        gradient.addColorStop(0, baseColor)
        gradient.addColorStop(1, adjustColor(baseColor, -30))
        
        ctx.value.fillStyle = gradient
        ctx.value.beginPath()
        ctx.value.roundRect(element.x, element.y, element.width, element.height, 15)
        ctx.value.fill()
        
        // 重置阴影
        ctx.value.shadowColor = 'transparent'
        ctx.value.shadowBlur = 0
        ctx.value.shadowOffsetX = 0
        ctx.value.shadowOffsetY = 0
        
        // 绘制选中状态
        if (isSelected) {
          ctx.value.strokeStyle = '#2196F3'
          ctx.value.lineWidth = 3
          ctx.value.setLineDash([5, 3])
          ctx.value.beginPath()
          ctx.value.roundRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4, 17)
          ctx.value.stroke()
          ctx.value.setLineDash([])
        }
        
        const centerX = element.x + element.width / 2
        const centerY = element.y + element.height / 2
        const radius = Math.min(element.width, element.height) / 3
        
        // 绘制进度环背景
        ctx.value.strokeStyle = '#e0e0e0'
        ctx.value.lineWidth = 8
        ctx.value.beginPath()
        ctx.value.arc(centerX, centerY - 10, radius, 0, 2 * Math.PI)
        ctx.value.stroke()
        
        // 计算并绘制进度
        const timeLeft = calculateTimeLeft(element)
        const totalSeconds = element.duration ? element.duration / 1000 : 300 // 默认5分钟
        const [minutes, seconds] = timeLeft.split(':').map(Number)
        const currentSeconds = minutes * 60 + seconds
        const progress = Math.max(0, Math.min(1, currentSeconds / totalSeconds))
        
        // 绘制进度环
        const startAngle = -Math.PI / 2
        const endAngle = startAngle + (2 * Math.PI * progress)
        
        ctx.value.strokeStyle = progress > 0.25 ? '#4CAF50' : progress > 0.1 ? '#FF9800' : '#F44336'
        ctx.value.lineWidth = 8
        ctx.value.lineCap = 'round'
        ctx.value.beginPath()
        ctx.value.arc(centerX, centerY - 10, radius, startAngle, endAngle)
        ctx.value.stroke()
        
        // 绘制时间文本
        ctx.value.fillStyle = '#333'
        ctx.value.font = 'bold 28px "SF Mono", "Monaco", "Inconsolata", monospace'
        ctx.value.textAlign = 'center'
        ctx.value.textBaseline = 'middle'
        ctx.value.fillText(timeLeft, centerX, centerY - 10)
        
        // 绘制控制按钮
        const buttonY = centerY + 25
        const buttonSize = 20
        const buttonSpacing = 25
        
        // 开始/暂停按钮
        ctx.value.fillStyle = element.isRunning ? '#FF5722' : '#4CAF50'
        ctx.value.beginPath()
        if (element.isRunning) {
          // 暂停图标
          ctx.value.rect(centerX - buttonSpacing - buttonSize/2, buttonY - buttonSize/2, buttonSize, buttonSize)
        } else {
          // 播放图标
          ctx.value.moveTo(centerX - buttonSpacing - buttonSize/2, buttonY - buttonSize/2)
          ctx.value.lineTo(centerX - buttonSpacing + buttonSize/2, buttonY)
          ctx.value.lineTo(centerX - buttonSpacing - buttonSize/2, buttonY + buttonSize/2)
        }
        ctx.value.fill()
        
        // 重置按钮
        ctx.value.fillStyle = '#9E9E9E'
        ctx.value.beginPath()
        ctx.value.arc(centerX + buttonSpacing, buttonY, buttonSize/2, 0, 2 * Math.PI)
        ctx.value.fill()
        ctx.value.fillStyle = 'white'
        ctx.value.font = '12px Arial'
        ctx.value.fillText('⟲', centerX + buttonSpacing, buttonY)
        
      } catch (error) {
        console.error('Error drawing timer element:', error)
      }
    }

    const drawProtocolElement = (element, isSelected) => {
      if (!ctx.value) return
      
      try {
        // 绘制阴影
        ctx.value.shadowColor = 'rgba(0, 0, 0, 0.1)'
        ctx.value.shadowBlur = 6
        ctx.value.shadowOffsetX = 2
        ctx.value.shadowOffsetY = 2
        
        // 绘制背景
        const baseColor = element.color || '#E8F5E9'
        ctx.value.fillStyle = baseColor
        ctx.value.beginPath()
        ctx.value.roundRect(element.x, element.y, element.width, element.height, 8)
        ctx.value.fill()
        
        // 重置阴影
        ctx.value.shadowColor = 'transparent'
        ctx.value.shadowBlur = 0
        ctx.value.shadowOffsetX = 0
        ctx.value.shadowOffsetY = 0
        
        // 绘制顶部标题栏
        const headerGradient = ctx.value.createLinearGradient(element.x, element.y, element.x, element.y + 35)
        headerGradient.addColorStop(0, '#4CAF50')
        headerGradient.addColorStop(1, '#388E3C')
        ctx.value.fillStyle = headerGradient
        ctx.value.beginPath()
        ctx.value.roundRect(element.x, element.y, element.width, 35, 8)
        ctx.value.fill()
        
        // 绘制选中状态
        if (isSelected) {
          ctx.value.strokeStyle = '#2196F3'
          ctx.value.lineWidth = 3
          ctx.value.setLineDash([5, 3])
          ctx.value.beginPath()
          ctx.value.roundRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4, 10)
          ctx.value.stroke()
          ctx.value.setLineDash([])
        }
        
        // 绘制标题
        ctx.value.fillStyle = 'white'
        ctx.value.font = 'bold 14px Arial'
        ctx.value.textAlign = 'center'
        ctx.value.textBaseline = 'middle'
        ctx.value.fillText('实验协议', element.x + element.width / 2, element.y + 17)
        
        const steps = parseProtocolSteps(element.content || '步骤 1\n步骤 2\n步骤 3')
        const completedSteps = steps.filter(step => step.done).length
        const totalSteps = steps.length
        const progress = totalSteps > 0 ? completedSteps / totalSteps : 0
        
        // 绘制进度条
        const progressY = element.y + 45
        const progressHeight = 6
        const progressWidth = element.width - 30
        
        ctx.value.fillStyle = '#e0e0e0'
        ctx.value.beginPath()
        ctx.value.roundRect(element.x + 15, progressY, progressWidth, progressHeight, 3)
        ctx.value.fill()
        
        ctx.value.fillStyle = '#4CAF50'
        ctx.value.beginPath()
        ctx.value.roundRect(element.x + 15, progressY, progressWidth * progress, progressHeight, 3)
        ctx.value.fill()
        
        // 绘制进度文本
        ctx.value.fillStyle = '#666'
        ctx.value.font = '11px Arial'
        ctx.value.textAlign = 'right'
        ctx.value.fillText(`${completedSteps}/${totalSteps}`, element.x + element.width - 15, progressY - 5)
        
        // 绘制步骤列表
        ctx.value.textAlign = 'left'
        ctx.value.textBaseline = 'top'
        
        steps.forEach((step, index) => {
          const y = element.y + 65 + index * 28
          const checkboxSize = 16
          
          // 绘制复选框
          ctx.value.strokeStyle = step.done ? '#4CAF50' : '#bdbdbd'
          ctx.value.lineWidth = 2
          ctx.value.beginPath()
          ctx.value.roundRect(element.x + 15, y, checkboxSize, checkboxSize, 3)
          ctx.value.stroke()
          
          // 绘制选中状态
          if (step.done) {
            ctx.value.fillStyle = '#4CAF50'
            ctx.value.beginPath()
            ctx.value.moveTo(element.x + 18, y + 8)
            ctx.value.lineTo(element.x + 21, y + 11)
            ctx.value.lineTo(element.x + 25, y + 5)
            ctx.value.lineWidth = 2
            ctx.value.stroke()
          }
          
          // 绘制步骤文本
          ctx.value.fillStyle = step.done ? '#666' : '#333'
          ctx.value.font = step.done ? '13px Arial' : '14px Arial'
          const textWidth = element.width - 50
          const wrappedText = wrapText(step.text, textWidth)
          wrappedText.forEach((line, lineIndex) => {
            ctx.value.fillText(line, element.x + 40, y + lineIndex * 16)
          })
        })
        
      } catch (error) {
        console.error('Error drawing protocol element:', error)
      }
    }

    const drawTextElement = (element, isSelected) => {
      if (!ctx.value) return
      
      try {
        // 绘制半透明背景（仅当有内容时）
        if (element.content && element.content.trim()) {
          ctx.value.fillStyle = 'rgba(255, 255, 255, 0.05)'
          ctx.value.fillRect(element.x, element.y, element.width, element.height)
        }
        
        // 绘制选中状态
        if (isSelected) {
          ctx.value.strokeStyle = '#2196F3'
          ctx.value.lineWidth = 2
          ctx.value.setLineDash([5, 3])
          ctx.value.strokeRect(element.x - 1, element.y - 1, element.width + 2, element.height + 2)
          ctx.value.setLineDash([])
        }
        
        // 设置文本样式
        ctx.value.fillStyle = element.color || '#333'
        const fontSize = element.fontSize || 16
        const fontFamily = element.fontFamily || '"Helvetica Neue", Arial, sans-serif'
        ctx.value.font = `${fontSize}px ${fontFamily}`
        
        // 设置对齐方式
        const align = element.align || 'left'
        ctx.value.textAlign = align
        ctx.value.textBaseline = 'top'
        
        // 处理文本内容
        const content = element.content || '双击编辑文本'
        const lineHeight = fontSize * 1.4
        
        // 如果是占位符文本，使用灰色
        if (!element.content || element.content.trim() === '') {
          ctx.value.fillStyle = '#999'
          ctx.value.font = `italic ${fontSize}px ${fontFamily}`
        }
        
        // 自动换行处理
        const lines = wrapText(content, element.width - 20)
        const maxLines = Math.floor((element.height - 20) / lineHeight)
        const displayLines = lines.slice(0, maxLines)
        
        displayLines.forEach((line, index) => {
          let x = element.x + 10
          
          if (align === 'center') {
            x = element.x + element.width / 2
          } else if (align === 'right') {
            x = element.x + element.width - 10
          }
          
          const y = element.y + 15 + index * lineHeight
          ctx.value.fillText(line, x, y)
        })
        
        // 如果文本被截断，显示省略号
        if (lines.length > maxLines) {
          ctx.value.fillStyle = '#999'
          ctx.value.font = 'italic 12px Arial'
          ctx.value.textAlign = 'center'
          ctx.value.fillText('...', element.x + element.width / 2, element.y + element.height - 10)
        }
        
        // 绘制对齐指示器（仅当选中时）
        if (isSelected) {
          ctx.value.fillStyle = '#2196F3'
          ctx.value.font = '10px Arial'
          ctx.value.textAlign = 'center'
          ctx.value.textBaseline = 'bottom'
          
          let alignIcon = '⬅'
          if (align === 'center') alignIcon = '⬌'
          if (align === 'right') alignIcon = '➡'
          
          ctx.value.fillText(alignIcon, element.x + element.width / 2, element.y - 5)
        }
        
      } catch (error) {
        console.error('Error drawing text element:', error)
      }
    }

    const drawFileElement = (element, isSelected) => {
      if (!ctx.value) return
      
      try {
        // 绘制阴影
        ctx.value.shadowColor = 'rgba(0, 0, 0, 0.1)'
        ctx.value.shadowBlur = 6
        ctx.value.shadowOffsetX = 2
        ctx.value.shadowOffsetY = 2
        
        // 绘制背景
        ctx.value.fillStyle = element.color || '#F3E5F5'
        ctx.value.beginPath()
        ctx.value.roundRect(element.x, element.y, element.width, element.height, 8)
        ctx.value.fill()
        
        // 重置阴影
        ctx.value.shadowColor = 'transparent'
        ctx.value.shadowBlur = 0
        ctx.value.shadowOffsetX = 0
        ctx.value.shadowOffsetY = 0
        
        // 绘制选中状态
        if (isSelected) {
          ctx.value.strokeStyle = '#2196F3'
          ctx.value.lineWidth = 3
          ctx.value.setLineDash([5, 3])
          ctx.value.beginPath()
          ctx.value.roundRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4, 10)
          ctx.value.stroke()
          ctx.value.setLineDash([])
        }
        
        // 绘制文件图标
        const iconX = element.x + 15
        const iconY = element.y + 15
        const iconWidth = 40
        const iconHeight = 50
        
        // 文件图标背景
        ctx.value.fillStyle = '#9C27B0'
        ctx.value.beginPath()
        ctx.value.moveTo(iconX, iconY)
        ctx.value.lineTo(iconX + iconWidth - 10, iconY)
        ctx.value.lineTo(iconX + iconWidth, iconY + 10)
        ctx.value.lineTo(iconX + iconWidth, iconY + iconHeight)
        ctx.value.lineTo(iconX, iconY + iconHeight)
        ctx.value.closePath()
        ctx.value.fill()
        
        // 文件折角
        ctx.value.fillStyle = '#7B1FA2'
        ctx.value.beginPath()
        ctx.value.moveTo(iconX + iconWidth - 10, iconY)
        ctx.value.lineTo(iconX + iconWidth - 10, iconY + 10)
        ctx.value.lineTo(iconX + iconWidth, iconY + 10)
        ctx.value.closePath()
        ctx.value.fill()
        
        // 文件文字
        ctx.value.fillStyle = 'white'
        ctx.value.font = 'bold 10px Arial'
        ctx.value.textAlign = 'center'
        ctx.value.fillText('FILE', iconX + iconWidth/2 - 5, iconY + iconHeight/2)
        
        // 绘制文件信息
        const textX = iconX + iconWidth + 15
        const textY = iconY + 10
        
        ctx.value.fillStyle = '#333'
        ctx.value.font = 'bold 14px Arial'
        ctx.value.textAlign = 'left'
        
        // 文件名（截断显示）
        const fileName = element.content || element.fileName || '未命名文件'
        const maxWidth = element.width - (textX - element.x) - 10
        const displayName = fileName.length > 15 ? fileName.substring(0, 12) + '...' : fileName
        ctx.value.fillText(displayName, textX, textY)
        
        // 文件大小
        if (element.fileSize) {
          ctx.value.fillStyle = '#666'
          ctx.value.font = '12px Arial'
          const fileSize = formatFileSize(element.fileSize)
          ctx.value.fillText(fileSize, textX, textY + 18)
        }
        
        // 文件类型
        if (element.fileType) {
          ctx.value.fillStyle = '#999'
          ctx.value.font = '11px Arial'
          ctx.value.fillText(element.fileType, textX, textY + 34)
        }
        
        // 双击提示
        if (isSelected) {
          ctx.value.fillStyle = '#2196F3'
          ctx.value.font = '10px Arial'
          ctx.value.textAlign = 'center'
          ctx.value.fillText('双击预览', element.x + element.width/2, element.y + element.height - 8)
        }
        
      } catch (error) {
        console.error('Error drawing file element:', error)
      }
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const handleFileUpload = (file) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const fileElement = {
          id: Date.now().toString(),
          type: 'file',
          x: 300,
          y: 300,
          width: 200,
          height: 100,
          content: file.name,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'unknown',
          fileData: e.target.result,
          color: '#F3E5F5'
        }
        
        // 根据文件类型调整大小
        if (file.type.startsWith('image/')) {
          fileElement.width = 250
          fileElement.height = 180
          fileElement.isImage = true
        }
        
        emit('element-create', fileElement)
        isDirty.value = true
      }
      
      reader.readAsDataURL(file)
    }

    const drawConnections = () => {
      props.connections.forEach(connection => {
        drawConnection(connection)
      })
    }

    const drawConnection = (connection) => {
      const fromElement = props.elements.find(el => el.id === connection.from)
      const toElement = props.elements.find(el => el.id === connection.to)
      
      if (!fromElement || !toElement) return
      
      const fromX = fromElement.x + fromElement.width / 2
      const fromY = fromElement.y + fromElement.height / 2
      const toX = toElement.x + toElement.width / 2
      const toY = toElement.y + toElement.height / 2
      
      ctx.value.strokeStyle = '#666'
      ctx.value.lineWidth = 2
      ctx.value.beginPath()
      
      if (connection.curvature) {
        const controlX = (fromX + toX) / 2 + connection.curvature * 100
        const controlY = (fromY + toY) / 2 + connection.curvature * 100
        ctx.value.moveTo(fromX, fromY)
        ctx.value.quadraticCurveTo(controlX, controlY, toX, toY)
      } else {
        ctx.value.moveTo(fromX, fromY)
        ctx.value.lineTo(toX, toY)
      }
      
      ctx.value.stroke()
      
      const angle = Math.atan2(toY - fromY, toX - fromX)
      const arrowLength = 15
      const arrowAngle = Math.PI / 6
      
      ctx.value.beginPath()
      ctx.value.moveTo(toX, toY)
      ctx.value.lineTo(
        toX - arrowLength * Math.cos(angle - arrowAngle),
        toY - arrowLength * Math.sin(angle - arrowAngle)
      )
      ctx.value.lineTo(
        toX - arrowLength * Math.cos(angle + arrowAngle),
        toY - arrowLength * Math.sin(angle + arrowAngle)
      )
      ctx.value.closePath()
      ctx.value.fillStyle = '#666'
      ctx.value.fill()
    }

    const wrapText = (text, maxWidth) => {
      if (!ctx.value) return [text]
      
      try {
        // 确保最小宽度
        maxWidth = Math.max(maxWidth, 50)
        
        const words = text.split('')
        const lines = []
        let currentLine = ''
        
        words.forEach(word => {
          const testLine = currentLine + word
          const metrics = ctx.value.measureText(testLine)
          
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
      } catch (error) {
        console.error('Error wrapping text:', error)
        return [text]
      }
    }

    const calculateTimeLeft = (element) => {
      // 确保基本属性存在
      if (!element.duration) {
        element.duration = 300000 // 默认5分钟
      }
      
      if (!element.startTime) {
        element.startTime = Date.now()
      }
      
      let elapsed
      if (element.isRunning) {
        elapsed = Date.now() - element.startTime
      } else if (element.pausedAt) {
        elapsed = element.pausedAt - element.startTime
      } else {
        elapsed = 0
      }
      
      const remaining = Math.max(0, element.duration - elapsed)
      
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    const parseProtocolSteps = (content) => {
      const lines = content.split('\n').filter(line => line.trim())
      return lines.map((line, index) => {
        let text = line.trim()
        let done = false
        
        // 检查是否有勾选标记
        if (text.startsWith('✓ ') || text.startsWith('✓')) {
          done = true
          text = text.replace(/^✓\s*/, '')
        } else if (text.startsWith('○ ') || text.startsWith('○')) {
          done = false
          text = text.replace(/^○\s*/, '')
        } else if (text.startsWith('☐ ') || text.startsWith('☐')) {
          done = false
          text = text.replace(/^☐\s*/, '')
        }
        
        return {
          text: text,
          done: done
        }
      })
    }

    const screenToWorld = (screenX, screenY) => {
      const rect = canvas.value.getBoundingClientRect()
      const x = screenX - rect.left
      const y = screenY - rect.top
      
      return {
        x: (x - canvas.value.width / 2) / camera.value.zoom + camera.value.x,
        y: (y - canvas.value.height / 2) / camera.value.zoom + camera.value.y
      }
    }

    const worldToScreen = (worldX, worldY) => {
      const x = (worldX - camera.value.x) * camera.value.zoom + canvas.value.width / 2
      const y = (worldY - camera.value.y) * camera.value.zoom + canvas.value.height / 2
      
      return {
        x: x,
        y: y
      }
    }

    const handleMouseDown = (e) => {
      const worldPos = screenToWorld(e.clientX, e.clientY)
      
      if (e.button === 0) {
        const clickedElement = getElementAt(worldPos.x, worldPos.y)
        
        if (clickedElement) {
          // 检查是否点击了计时器的控制按钮
          if (clickedElement.type === 'timer') {
            const centerX = clickedElement.x + clickedElement.width / 2
            const centerY = clickedElement.y + clickedElement.height / 2
            const buttonY = centerY + 25
            const buttonSize = 20
            const buttonSpacing = 25
            
            // 检查播放/暂停按钮
            if (worldPos.x >= centerX - buttonSpacing - buttonSize/2 && 
                worldPos.x <= centerX - buttonSpacing + buttonSize/2 &&
                worldPos.y >= buttonY - buttonSize/2 && 
                worldPos.y <= buttonY + buttonSize/2) {
              toggleTimer(clickedElement)
              return
            }
            
            // 检查重置按钮
            const distToReset = Math.sqrt(
              Math.pow(worldPos.x - (centerX + buttonSpacing), 2) + 
              Math.pow(worldPos.y - buttonY, 2)
            )
            if (distToReset <= buttonSize/2) {
              resetTimer(clickedElement)
              return
            }
          }
          
          // 检查是否点击了协议的复选框
          if (clickedElement.type === 'protocol') {
            const steps = parseProtocolSteps(clickedElement.content || '步骤 1\n步骤 2\n步骤 3')
            steps.forEach((step, index) => {
              const y = clickedElement.y + 65 + index * 28
              const checkboxSize = 16
              
              if (worldPos.x >= clickedElement.x + 15 && 
                  worldPos.x <= clickedElement.x + 15 + checkboxSize &&
                  worldPos.y >= y && 
                  worldPos.y <= y + checkboxSize) {
                toggleProtocolStep(clickedElement, index)
                return
              }
            })
          }
          
          selectedElements.value = [clickedElement.id]
          
          // 检查是否双击
          const currentTime = Date.now()
          if (lastClickTime && currentTime - lastClickTime < 300 && lastClickedElement === clickedElement.id) {
            editElement(clickedElement)
            lastClickTime = null
            lastClickedElement = null
          } else {
            lastClickTime = currentTime
            lastClickedElement = clickedElement.id
            
            // 开始拖拽元素
            isElementDragging.value = true
            draggedElement.value = clickedElement
            dragOffset.value = {
              x: worldPos.x - clickedElement.x,
              y: worldPos.y - clickedElement.y
            }
          }
        } else {
          isBoxSelecting.value = true
          boxSelection.value = {
            startX: worldPos.x,
            startY: worldPos.y,
            endX: worldPos.x,
            endY: worldPos.y
          }
        }
      } else if (e.button === 2) {
        isDragging.value = true
        dragStart.value = { x: e.clientX, y: e.clientY }
        panVelocity.value = { x: 0, y: 0 }
      }
    }

    const handleMouseMove = (e) => {
      if (isElementDragging.value && draggedElement.value) {
        const worldPos = screenToWorld(e.clientX, e.clientY)
        
        // 更新元素位置
        const newX = worldPos.x - dragOffset.value.x
        const newY = worldPos.y - dragOffset.value.y
        
        draggedElement.value.x = newX
        draggedElement.value.y = newY
        
        isDirty.value = true
        
        // 发送更新事件
        emit('element-update', draggedElement.value.id, { 
          x: newX, 
          y: newY 
        })
      } else if (isDragging.value) {
        const dx = e.clientX - dragStart.value.x
        const dy = e.clientY - dragStart.value.y
        
        camera.value.x -= dx / camera.value.zoom
        camera.value.y -= dy / camera.value.zoom
        
        dragStart.value = { x: e.clientX, y: e.clientY }
        
        panVelocity.value = { x: -dx, y: -dy }
        lastPanTime = Date.now()
        
        isDirty.value = true
      } else if (isBoxSelecting.value) {
        const worldPos = screenToWorld(e.clientX, e.clientY)
        boxSelection.value.endX = worldPos.x
        boxSelection.value.endY = worldPos.y
        isDirty.value = true
      }
    }

    const handleMouseUp = () => {
      if (isBoxSelecting.value) {
        selectElementsInBox()
        isBoxSelecting.value = false
      }
      
      isDragging.value = false
      isElementDragging.value = false
      draggedElement.value = null
    }

    const handleWheel = (e) => {
      e.preventDefault()
      
      const worldPos = screenToWorld(e.clientX, e.clientY)
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(5, camera.value.zoom * zoomFactor))
      
      const zoomChange = newZoom - camera.value.zoom
      camera.value.x -= (worldPos.x - camera.value.x) * (zoomChange / camera.value.zoom)
      camera.value.y -= (worldPos.y - camera.value.y) * (zoomChange / camera.value.zoom)
      camera.value.zoom = newZoom
      
      isDirty.value = true
    }

    const getElementAt = (x, y) => {
      for (let i = props.elements.length - 1; i >= 0; i--) {
        const element = props.elements[i]
        if (x >= element.x && x <= element.x + element.width &&
            y >= element.y && y <= element.y + element.height) {
          return element
        }
      }
      return null
    }

    const selectElementsInBox = () => {
      const minX = Math.min(boxSelection.value.startX, boxSelection.value.endX)
      const maxX = Math.max(boxSelection.value.startX, boxSelection.value.endX)
      const minY = Math.min(boxSelection.value.startY, boxSelection.value.endY)
      const maxY = Math.max(boxSelection.value.startY, boxSelection.value.endY)
      
      selectedElements.value = props.elements
        .filter(element => 
          element.x >= minX && element.x + element.width <= maxX &&
          element.y >= minY && element.y + element.height <= maxY
        )
        .map(element => element.id)
    }

    const setupInertialPanning = () => {
      const updateInertialPanning = () => {
        if (Date.now() - lastPanTime > 50 && !isDragging.value) {
          panVelocity.value.x *= 0.9
          panVelocity.value.y *= 0.9
          
          if (Math.abs(panVelocity.value.x) > 0.1 || Math.abs(panVelocity.value.y) > 0.1) {
            camera.value.x += panVelocity.value.x / camera.value.zoom
            camera.value.y += panVelocity.value.y / camera.value.zoom
            isDirty.value = true
          }
        }
      }
      
      setInterval(updateInertialPanning, 16)
    }

    const updateInertialPanning = () => {
    }

    const adjustColor = (color, amount) => {
      const hex = color.replace('#', '')
      const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount))
      const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount))
      const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount))
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }

    const toggleTimer = (element) => {
      if (!element.isRunning) {
        // 开始计时
        if (!element.startTime) {
          element.startTime = Date.now()
        } else {
          // 暂停后恢复
          const pausedTime = Date.now() - element.pausedAt
          element.startTime += pausedTime
        }
        element.isRunning = true
        element.pausedAt = null
      } else {
        // 暂停计时
        element.pausedAt = Date.now()
        element.isRunning = false
      }
      
      emit('element-update', element.id, { 
        isRunning: element.isRunning,
        startTime: element.startTime,
        pausedAt: element.pausedAt
      })
    }

    const toggleProtocolStep = (element, stepIndex) => {
      const steps = parseProtocolSteps(element.content || '步骤 1\n步骤 2\n步骤 3')
      steps[stepIndex].done = !steps[stepIndex].done
      
      // 更新内容，保存勾选状态
      const updatedContent = steps.map(step => {
        const prefix = step.done ? '✓ ' : '○ '
        return prefix + step.text
      }).join('\n')
      
      element.content = updatedContent
      
      emit('element-update', element.id, { content: updatedContent })
      isDirty.value = true
    }

    const resetTimer = (element) => {
      element.isRunning = false
      element.startTime = Date.now()
      element.pausedAt = null
      element.duration = element.duration || 300000 // 保持原有设置或默认5分钟
      
      emit('element-update', element.id, { 
        isRunning: false,
        startTime: element.startTime,
        pausedAt: null,
        duration: element.duration
      })
    }

    const editElement = (element) => {
      if (!container.value) return
      
      editingElement.value = element
      
      // 获取容器在屏幕上的位置
      const containerRect = container.value.getBoundingClientRect()
      
      // 将世界坐标转换为屏幕坐标
      const screenPos = worldToScreen(element.x, element.y)
      
      // 创建输入框
      const input = document.createElement('textarea')
      input.value = element.content || ''
      input.style.position = 'fixed'
      input.style.left = `${containerRect.left + screenPos.x + 10}px`
      input.style.top = `${containerRect.top + screenPos.y + 10}px`
      input.style.width = `${element.width - 20}px`
      input.style.height = `${element.height - 20}px`
      input.style.fontSize = element.fontSize ? `${element.fontSize}px` : '16px'
      input.style.fontFamily = element.fontFamily || 'Arial'
      input.style.border = '2px solid #2196F3'
      input.style.borderRadius = '4px'
      input.style.padding = '8px'
      input.style.resize = 'none'
      input.style.outline = 'none'
      input.style.zIndex = '1000'
      input.style.backgroundColor = 'white'
      input.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
      
      if (element.type === 'note') {
        input.style.fontFamily = '"Kalam", "Comic Sans MS", cursive'
        input.style.backgroundColor = '#FFF59D'
        input.style.transform = 'rotate(1deg)'
      } else if (element.type === 'timer') {
        input.value = element.duration ? `${Math.floor(element.duration / 60000)}` : '5'
        input.placeholder = '设置分钟数'
        input.style.textAlign = 'center'
        input.style.height = '40px'
      } else if (element.type === 'protocol') {
        input.placeholder = '粘贴实验步骤，每行一个步骤...\n例如：\n1. 准备实验器材\n2. 配制溶液\n3. 进行测量'
      }
      
      document.body.appendChild(input)
      input.focus()
      input.select()
      
      const saveEdit = () => {
        let newContent = input.value
        
        if (element.type === 'timer') {
          const minutes = parseInt(newContent) || 5
          element.duration = minutes * 60000
          element.startTime = Date.now()
          element.isRunning = false
          element.pausedAt = null
          
          emit('element-update', element.id, { 
            duration: element.duration,
            startTime: element.startTime,
            isRunning: false,
            pausedAt: null
          })
        } else if (element.type === 'protocol') {
          // 自动生成协议步骤格式
          const lines = newContent.split('\n').filter(line => line.trim())
          const formattedSteps = lines.map((line, index) => {
            let cleanLine = line.trim()
            
            // 移除现有的标记
            cleanLine = cleanLine.replace(/^[\d\.\-\•\○\✓\☐]+\s*/, '')
            
            // 添加未勾选标记
            return `○ ${cleanLine}`
          }).join('\n')
          
          element.content = formattedSteps
          
          // 根据步骤数量调整大小
          const stepCount = lines.length
          element.width = Math.max(200, Math.min(400, 280))
          element.height = Math.max(150, Math.min(400, 80 + stepCount * 30 + 40))
          
          emit('element-update', element.id, { 
            content: formattedSteps, 
            width: element.width, 
            height: element.height 
          })
        } else {
          element.content = newContent
          
          // 更新元素大小以适应内容
          const lines = newContent.split('\n')
          const maxLineLength = Math.max(...lines.map(line => line.length), 1)
          const charWidth = element.type === 'note' ? 12 : 10
          const lineHeight = element.type === 'note' ? 22 : 20
          
          element.width = Math.max(150, Math.min(400, maxLineLength * charWidth + 40))
          element.height = Math.max(100, Math.min(300, Math.max(lines.length * lineHeight + 40, 80)))
          
          emit('element-update', element.id, { 
            content: newContent, 
            width: element.width, 
            height: element.height 
          })
        }
        
        if (document.body.contains(input)) {
          document.body.removeChild(input)
        }
        editingElement.value = null
        isDirty.value = true
      }
      
      const cancelEdit = () => {
        if (document.body.contains(input)) {
          document.body.removeChild(input)
        }
        editingElement.value = null
      }
      
      input.addEventListener('blur', saveEdit)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          cancelEdit()
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          saveEdit()
        }
      })
    }

    const selectionBoxStyle = computed(() => {
      if (!isBoxSelecting.value) return {}
      
      const minX = Math.min(boxSelection.value.startX, boxSelection.value.endX)
      const maxX = Math.max(boxSelection.value.startX, boxSelection.value.endX)
      const minY = Math.min(boxSelection.value.startY, boxSelection.value.endY)
      const maxY = Math.max(boxSelection.value.startY, boxSelection.value.endY)
      
      const screenMin = worldToScreen(minX, minY)
      const screenMax = worldToScreen(maxX, maxY)
      
      return {
        left: `${screenMin.x}px`,
        top: `${screenMin.y}px`,
        width: `${screenMax.x - screenMin.x}px`,
        height: `${screenMax.y - screenMin.y}px`
      }
    })

    watch(() => props.elements, () => {
      isDirty.value = true
    }, { deep: true })

    watch(() => props.connections, () => {
      isDirty.value = true
    }, { deep: true })

    return {
      canvas,
      container,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleWheel,
      isBoxSelecting,
      selectionBoxStyle
    }
  }
}
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

canvas {
  display: block;
  cursor: grab;
}

canvas:active {
  cursor: grabbing;
}

.selection-box {
  position: absolute;
  border: 2px dashed #2196F3;
  background: rgba(33, 150, 243, 0.1);
  pointer-events: none;
}
</style>