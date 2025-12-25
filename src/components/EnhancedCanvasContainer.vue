<template>
  <div
    class="w-full h-full relative bg-white overflow-hidden cursor-grab active:cursor-grabbing"
    @mousedown="handleCanvasMouseDown"
    @mousemove="handleCanvasMouseMove"
    @mouseup="handleCanvasMouseUp"
    @wheel.prevent="handleZoom"
    ref="canvas"
  >
    <!-- 网格背景 -->
    <div
      class="absolute inset-0 pointer-events-none"
      :style="{
        backgroundImage:
          'linear-gradient(0deg, transparent 24%, rgba(200,200,200,.1) 25%, rgba(200,200,200,.1) 26%, transparent 27%, transparent 74%, rgba(200,200,200,.1) 75%, rgba(200,200,200,.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(200,200,200,.1) 25%, rgba(200,200,200,.1) 26%, transparent 27%, transparent 74%, rgba(200,200,200,.1) 75%, rgba(200,200,200,.1) 76%, transparent 77%, transparent)',
        backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`
      }"
    ></div>

    <!-- Canvas 容器 -->
    <div
      class="absolute origin-top-left transition-transform duration-75"
      :style="{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }"
    >
      <!-- 连接线 -->
      <svg class="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible" :style="{ width: '5000px', height: '5000px' }">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>
        <line
          v-for="connection in connections"
          :key="connection.id"
          :x1="getElementCenter(connection.from).x"
          :y1="getElementCenter(connection.from).y"
          :x2="getElementCenter(connection.to).x"
          :y2="getElementCenter(connection.to).y"
          stroke="#cbd5e1"
          stroke-width="2"
          stroke-linecap="round"
          marker-end="url(#arrowhead)"
        />
        <!-- 正在绘制的连接线 -->
        <line
          v-if="connectingFrom"
          :x1="getElementCenter(connectingFrom).x"
          :y1="getElementCenter(connectingFrom).y"
          :x2="currentMousePos.x"
          :y2="currentMousePos.y"
          stroke="#3b82f6"
          stroke-width="2"
          stroke-dasharray="5,5"
          opacity="0.6"
        />
      </svg>

      <!-- Elements -->
      <CanvasElement
        v-for="element in elements"
        :key="element.id"
        :element="element"
        :is-selected="selectedElementId === element.id"
        @select="selectElement"
        @delete="deleteElement"
        @update="updateElement"
        @start-connect="startConnect"
        @edit-timer="editTimer"
        @share="shareElement"
      />
    </div>

    <!-- 底部工具栏 -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-white shadow-2xl rounded-2xl p-3 border border-gray-200 z-40">
      <button
        @click="addElement('timer')"
        class="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-bold"
        title="添加计时器"
      >
        <i class="fa-solid fa-clock text-lg"></i>
        <span class="text-sm">计时器</span>
      </button>

      <button
        @click="addElement('note')"
        class="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-500 transition font-bold"
        title="添加便签"
      >
        <i class="fa-solid fa-note-sticky text-lg"></i>
        <span class="text-sm">便签</span>
      </button>

      <button
        @click="addElement('protocol')"
        class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-bold"
        title="添加协议"
      >
        <i class="fa-solid fa-list-check text-lg"></i>
        <span class="text-sm">协议</span>
      </button>

      <button
        @click="addElement('text')"
        class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-bold"
        title="添加文本框"
      >
        <i class="fa-solid fa-align-left text-lg"></i>
        <span class="text-sm">文本</span>
      </button>

      <div class="w-px bg-gray-300"></div>

      <button
        @click="addElement('image')"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition font-bold"
        title="添加图像"
      >
        <i class="fa-solid fa-image text-lg"></i>
        <span class="text-sm">图像</span>
      </button>

      <button
        @click="showShapeMenu = !showShapeMenu"
        class="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition font-bold relative"
        title="添加形状"
      >
        <i class="fa-solid fa-shapes text-lg"></i>
        <span class="text-sm">形状</span>
        <div v-if="showShapeMenu" class="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2">
          <button
            v-for="shape in ['rectangle', 'circle', 'triangle']"
            :key="shape"
            @click.stop="addShape(shape)"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold capitalize"
          >
            {{ shape }}
          </button>
        </div>
      </button>

      <div class="w-px bg-gray-300"></div>

      <!-- 缩放控制 -->
      <button @click="zoom = Math.max(0.5, zoom - 0.1)" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded font-bold text-sm">
        <i class="fa-solid fa-minus"></i>
      </button>
      <span class="px-3 py-2 bg-gray-100 rounded font-bold text-sm">{{ Math.round(zoom * 100) }}%</span>
      <button @click="zoom = Math.min(3, zoom + 0.1)" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded font-bold text-sm">
        <i class="fa-solid fa-plus"></i>
      </button>

      <button @click="resetView" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded font-bold text-sm" title="重置视图">
        <i class="fa-solid fa-expand"></i>
      </button>
    </div>

    <!-- 快捷键提示 -->
    <div class="absolute top-4 right-4 text-xs text-gray-500 pointer-events-none">
      <p>🔍 滚轮缩放 | 🖱️ 拖动移动 | ➕ 添加元素</p>
    </div>

    <!-- 选中信息面板 -->
    <transition name="slide-up">
      <div v-if="selectedElement" class="absolute bottom-32 right-8 bg-white shadow-lg rounded-lg p-4 border border-gray-200 w-72">
        <div class="flex justify-between items-center mb-2">
          <span class="font-bold text-sm">{{ selectedElement.type }}</span>
          <button @click="selectedElementId = null" class="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div class="space-y-2 text-xs">
          <div>
            <label class="block font-bold text-gray-600 mb-1">位置</label>
            <div class="flex gap-2">
              <input
                v-model.number="selectedElement.x"
                @change="updateElement(selectedElement)"
                class="flex-1 px-2 py-1 border rounded outline-none focus:border-blue-500"
                type="number"
                placeholder="X"
              />
              <input
                v-model.number="selectedElement.y"
                @change="updateElement(selectedElement)"
                class="flex-1 px-2 py-1 border rounded outline-none focus:border-blue-500"
                type="number"
                placeholder="Y"
              />
            </div>
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">尺寸</label>
            <div class="flex gap-2">
              <input
                v-model.number="selectedElement.width"
                @change="updateElement(selectedElement)"
                class="flex-1 px-2 py-1 border rounded outline-none focus:border-blue-500"
                type="number"
                placeholder="宽"
              />
              <input
                v-model.number="selectedElement.height"
                @change="updateElement(selectedElement)"
                class="flex-1 px-2 py-1 border rounded outline-none focus:border-blue-500"
                type="number"
                placeholder="高"
              />
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 计时器编辑模态框 -->
    <div v-if="editingTimer" class="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-80">
        <h3 class="font-bold text-lg mb-4">编辑计时器</h3>
        <div class="bg-gray-100 p-4 rounded-lg text-center mb-4">
          <div class="text-4xl font-bold font-mono">{{ formatTime(timerEditValue) }}</div>
        </div>
        <div class="grid grid-cols-3 gap-2 mb-4">
          <button
            @click="timerEditValue += 60"
            class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-bold"
          >
            +1m
          </button>
          <button
            @click="timerEditValue += 300"
            class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-bold"
          >
            +5m
          </button>
          <button
            @click="timerEditValue += 10"
            class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-bold"
          >
            +10s
          </button>
          <button
            @click="timerEditValue = 0"
            class="col-span-3 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition font-bold"
          >
            清空
          </button>
        </div>
        <div class="flex gap-2">
          <button
            @click="editingTimer = null"
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition font-bold"
          >
            取消
          </button>
          <button
            @click="saveTimer"
            class="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition font-bold"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CanvasElement from './CanvasElement.vue'

export default {
  name: 'EnhancedCanvasContainer',
  components: {
    CanvasElement
  },
  props: {
    elements: {
      type: Array,
      default: () => []
    },
    connections: {
      type: Array,
      default: () => []
    }
  },
  emits: ['element-create', 'element-update', 'element-delete', 'connection-create'],
  data() {
    return {
      pan: { x: 0, y: 0 },
      zoom: 1,
      isPanning: false,
      startPanX: 0,
      startPanY: 0,
      selectedElementId: null,
      currentMousePos: { x: 0, y: 0 },
      connectingFrom: null,
      editingTimer: null,
      timerEditValue: 0,
      showShapeMenu: false
    }
  },
  computed: {
    selectedElement() {
      return this.elements.find((el) => el.id === this.selectedElementId)
    }
  },
  methods: {
    handleCanvasMouseDown(e) {
      if (e.target === this.$refs.canvas) {
        this.isPanning = true
        this.startPanX = e.clientX - this.pan.x
        this.startPanY = e.clientY - this.pan.y
      }
    },
    handleCanvasMouseMove(e) {
      if (this.isPanning) {
        this.pan.x = e.clientX - this.startPanX
        this.pan.y = e.clientY - this.startPanY
      }

      // 更新鼠标位置用于连接线
      const rect = this.$refs.canvas.getBoundingClientRect()
      this.currentMousePos = {
        x: (e.clientX - rect.left - this.pan.x) / this.zoom,
        y: (e.clientY - rect.top - this.pan.y) / this.zoom
      }
    },
    handleCanvasMouseUp() {
      this.isPanning = false
    },
    handleZoom(e) {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.5, Math.min(3, this.zoom * zoomFactor))

      // 计算缩放中心
      const rect = this.$refs.canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // 调整 pan 以保持缩放中心位置不变
      this.pan.x -= (mouseX - this.pan.x) * (zoomFactor - 1)
      this.pan.y -= (mouseY - this.pan.y) * (zoomFactor - 1)

      this.zoom = newZoom
    },
    resetView() {
      this.pan = { x: 0, y: 0 }
      this.zoom = 1
    },
    addElement(type) {
      const element = {
        id: Date.now().toString(),
        type,
        x: (-this.pan.x + window.innerWidth / 2) / this.zoom - 100,
        y: (-this.pan.y + window.innerHeight / 2) / this.zoom - 100,
        width: type === 'timer' ? 240 : type === 'protocol' ? 280 : type === 'note' ? 220 : type === 'text' ? 200 : type === 'image' ? 220 : 180,
        height: type === 'timer' ? 180 : type === 'protocol' ? 250 : type === 'note' ? 200 : type === 'text' ? 150 : type === 'image' ? 180 : 120,
        createdAt: new Date().toISOString()
      }

      // 类型特定的初始化
      if (type === 'timer') {
        Object.assign(element, { name: '计时器', duration: 600, isRunning: false, startTime: null, author: this.$parent?.user?.name || '未知' })
      } else if (type === 'note') {
        Object.assign(element, { content: '', color: 'bg-yellow-100', imageUrl: null })
      } else if (type === 'protocol') {
        Object.assign(element, { title: '新协议', steps: [{ text: '步骤1', done: false }] })
      } else if (type === 'text') {
        Object.assign(element, { content: '' })
      } else if (type === 'image') {
        Object.assign(element, { url: null })
      }

      this.$emit('element-create', element)
    },
    addShape(shapeType) {
      const element = {
        id: Date.now().toString(),
        type: 'shape',
        shapeType,
        shapeColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
        x: (-this.pan.x + window.innerWidth / 2) / this.zoom - 50,
        y: (-this.pan.y + window.innerHeight / 2) / this.zoom - 50,
        width: 120,
        height: 120,
        createdAt: new Date().toISOString()
      }
      this.$emit('element-create', element)
      this.showShapeMenu = false
    },
    selectElement(id) {
      this.selectedElementId = id
    },
    updateElement(element) {
      this.$emit('element-update', element)
    },
    deleteElement(id) {
      if (confirm('确定要删除此元素吗？')) {
        this.$emit('element-delete', id)
        if (this.selectedElementId === id) {
          this.selectedElementId = null
        }
      }
    },
    startConnect(fromId) {
      if (this.connectingFrom === fromId) {
        this.connectingFrom = null
      } else if (this.connectingFrom) {
        // 创建连接
        this.$emit('connection-create', { from: this.connectingFrom, to: fromId })
        this.connectingFrom = null
      } else {
        this.connectingFrom = fromId
      }
    },
    editTimer(element) {
      this.editingTimer = element
      this.timerEditValue = element.duration || 600
    },
    saveTimer() {
      if (this.editingTimer) {
        this.editingTimer.duration = this.timerEditValue
        this.updateElement(this.editingTimer)
        this.editingTimer = null
      }
    },
    getElementCenter(id) {
      const element = this.elements.find((el) => el.id === id)
      if (!element) return { x: 0, y: 0 }
      return {
        x: element.x + element.width / 2,
        y: element.y + element.height / 2
      }
    },
    shareElement(payload) {
      this.$emit('share-element', payload)
    },
    formatTime(seconds) {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = Math.floor(seconds % 60)

      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      return `${m}:${String(s).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
