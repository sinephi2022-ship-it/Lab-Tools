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
  emits: ['element-update', 'connection-create'],
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

    onMounted(() => {
      initCanvas()
      startRenderLoop()
      setupInertialPanning()
    })

    onUnmounted(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    })

    const initCanvas = () => {
      canvas.value.width = container.value.clientWidth
      canvas.value.height = container.value.clientHeight
      ctx.value = canvas.value.getContext('2d')
      
      window.addEventListener('resize', handleResize)
    }

    const handleResize = () => {
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
      if (!ctx.value) return
      
      ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
      
      ctx.value.save()
      
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
      props.elements.forEach(element => {
        drawElement(element)
      })
    }

    const drawElement = (element) => {
      const isSelected = selectedElements.value.includes(element.id)
      
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
    }

    const drawNoteElement = (element, isSelected) => {
      ctx.value.fillStyle = element.color || '#FFF59D'
      ctx.value.fillRect(element.x, element.y, element.width, element.height)
      
      if (isSelected) {
        ctx.value.strokeStyle = '#2196F3'
        ctx.value.lineWidth = 3
        ctx.value.strokeRect(element.x, element.y, element.width, element.height)
      }
      
      ctx.save()
      ctx.value.translate(element.x + element.width / 2, element.y + element.height / 2)
      ctx.value.rotate(1 * Math.PI / 180)
      ctx.value.translate(-(element.x + element.width / 2), -(element.y + element.height / 2))
      
      ctx.value.fillStyle = '#333'
      ctx.value.font = '16px Kalam, cursive'
      ctx.value.textAlign = 'center'
      ctx.value.textBaseline = 'middle'
      
      const lines = wrapText(element.content || '便签', element.width - 20)
      lines.forEach((line, index) => {
        ctx.value.fillText(line, element.x + element.width / 2, element.y + 30 + index * 20)
      })
      
      ctx.value.restore()
    }

    const drawTimerElement = (element, isSelected) => {
      ctx.value.fillStyle = element.color || '#E1F5FE'
      ctx.value.fillRect(element.x, element.y, element.width, element.height)
      
      if (isSelected) {
        ctx.value.strokeStyle = '#2196F3'
        ctx.value.lineWidth = 3
        ctx.value.strokeRect(element.x, element.y, element.width, element.height)
      }
      
      ctx.value.fillStyle = '#333'
      ctx.value.font = 'bold 24px Arial'
      ctx.value.textAlign = 'center'
      ctx.value.textBaseline = 'middle'
      
      const timeLeft = calculateTimeLeft(element)
      ctx.value.fillText(timeLeft, element.x + element.width / 2, element.y + element.height / 2)
    }

    const drawProtocolElement = (element, isSelected) => {
      ctx.value.fillStyle = element.color || '#E8F5E9'
      ctx.value.fillRect(element.x, element.y, element.width, element.height)
      
      ctx.value.fillStyle = '#4CAF50'
      ctx.value.fillRect(element.x, element.y, element.width, 10)
      
      if (isSelected) {
        ctx.value.strokeStyle = '#2196F3'
        ctx.value.lineWidth = 3
        ctx.value.strokeRect(element.x, element.y, element.width, element.height)
      }
      
      ctx.value.fillStyle = '#333'
      ctx.value.font = '14px Arial'
      ctx.value.textAlign = 'left'
      ctx.value.textBaseline = 'top'
      
      const steps = parseProtocolSteps(element.content || '步骤 1')
      steps.forEach((step, index) => {
        const y = element.y + 20 + index * 25
        
        ctx.value.strokeStyle = step.done ? '#4CAF50' : '#ccc'
        ctx.value.lineWidth = 2
        ctx.value.strokeRect(element.x + 10, y, 15, 15)
        
        if (step.done) {
          ctx.value.beginPath()
          ctx.value.moveTo(element.x + 13, y + 7)
          ctx.value.lineTo(element.x + 17, y + 11)
          ctx.value.lineTo(element.x + 22, y + 3)
          ctx.value.stroke()
        }
        
        ctx.value.fillStyle = '#333'
        ctx.value.fillText(step.text, element.x + 35, y)
      })
    }

    const drawTextElement = (element, isSelected) => {
      if (isSelected) {
        ctx.value.strokeStyle = '#2196F3'
        ctx.value.lineWidth = 2
        ctx.value.setLineDash([5, 5])
        ctx.value.strokeRect(element.x, element.y, element.width, element.height)
        ctx.value.setLineDash([])
      }
      
      ctx.value.fillStyle = '#333'
      ctx.value.font = '16px Arial'
      ctx.value.textAlign = element.align || 'left'
      ctx.value.textBaseline = 'top'
      
      const lines = wrapText(element.content || '文本', element.width)
      lines.forEach((line, index) => {
        let x = element.x
        if (element.align === 'center') x = element.x + element.width / 2
        if (element.align === 'right') x = element.x + element.width
        
        ctx.value.fillText(line, x, element.y + index * 20)
      })
    }

    const drawFileElement = (element, isSelected) => {
      if (isSelected) {
        ctx.value.strokeStyle = '#2196F3'
        ctx.value.lineWidth = 3
        ctx.value.strokeRect(element.x, element.y, element.width, element.height)
      }
      
      ctx.value.fillStyle = element.color || '#F3E5F5'
      ctx.value.fillRect(element.x, element.y, element.width, element.height)
      
      ctx.value.fillStyle = '#9C27B0'
      ctx.value.fillRect(element.x + 10, element.y + 10, 30, 40)
      
      ctx.value.fillStyle = 'white'
      ctx.value.font = 'bold 12px Arial'
      ctx.value.textAlign = 'center'
      ctx.value.fillText('FILE', element.x + 25, element.y + 30)
      
      ctx.value.fillStyle = '#333'
      ctx.value.font = '12px Arial'
      ctx.value.textAlign = 'left'
      ctx.value.fillText(element.content || '文件.txt', element.x + 50, element.y + 30)
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
    }

    const calculateTimeLeft = (element) => {
      if (!element.startTime || !element.duration) return '00:00'
      
      const elapsed = Date.now() - element.startTime
      const remaining = Math.max(0, element.duration - elapsed)
      
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    const parseProtocolSteps = (content) => {
      const lines = content.split('\n').filter(line => line.trim())
      return lines.map((line, index) => ({
        text: line,
        done: false
      }))
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

    const handleMouseDown = (e) => {
      const worldPos = screenToWorld(e.clientX, e.clientY)
      
      if (e.button === 0) {
        const clickedElement = getElementAt(worldPos.x, worldPos.y)
        
        if (clickedElement) {
          selectedElements.value = [clickedElement.id]
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
      if (isDragging.value) {
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

    const selectionBoxStyle = computed(() => {
      if (!isBoxSelecting.value) return {}
      
      const minX = Math.min(boxSelection.value.startX, boxSelection.value.endX)
      const maxX = Math.max(boxSelection.value.startX, boxSelection.value.endX)
      const minY = Math.min(boxSelection.value.startY, boxSelection.value.endY)
      const maxY = Math.max(boxSelection.value.startY, boxSelection.value.endY)
      
      const screenMin = screenToWorld(minX, minY)
      const screenMax = screenToWorld(maxX, maxY)
      
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