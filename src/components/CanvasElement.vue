<template>
  <div
    class="absolute canvas-element shadow-lg transition-all duration-150 group"
    :class="[
      isSelected ? 'ring-2 ring-blue-500 z-30' : 'z-10',
      isDragging ? 'shadow-2xl z-40 opacity-95' : 'hover:shadow-xl',
      `element-type-${element.type}`
    ]"
    :style="{ left: element.x + 'px', top: element.y + 'px', width: element.width + 'px', height: element.height + 'px' }"
    @mousedown.stop="handleMouseDown"
    @click.stop="$emit('select', element.id)"
  >
    <!-- 元素容器 -->
    <div class="w-full h-full relative rounded-lg overflow-hidden flex flex-col bg-white border-2 border-gray-200">
      
      <!-- 删除按钮 -->
      <button
        v-if="isSelected"
        @click.stop="$emit('delete', element.id)"
        class="absolute -top-3 -right-3 z-50 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg transition transform hover:scale-110"
      >
        <i class="fa-solid fa-trash text-xs"></i>
      </button>

      <!-- 连接句柄 -->
      <div
        v-if="isSelected"
        @mousedown.stop="$emit('start-connect', element.id)"
        class="absolute -bottom-3 left-1/2 -translate-x-1/2 z-50 w-5 h-5 bg-blue-500 border-3 border-white rounded-full cursor-crosshair hover:bg-blue-600 shadow-lg transition"
        title="拖拽建立连接"
      ></div>

      <!-- 类型：计时器 -->
      <div v-if="element.type === 'timer'" class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
        <input
          v-model="element.name"
          @change="$emit('update', element)"
          class="text-white text-center text-xs font-bold bg-transparent outline-none mb-3 w-full truncate"
          placeholder="计时器名称"
        />
        <div class="text-5xl font-bold text-red-500 font-mono mb-3 bg-black rounded px-3 py-2 tracking-wider">
          {{ formatTime(timerRemaining) }}
        </div>
        <div class="flex gap-2 w-full">
          <button
            @click.stop="handleToggleTimer"
            class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 rounded transition"
          >
            {{ element.isRunning ? '暂停' : '启动' }}
          </button>
          <button
            @click.stop="handleResetTimer"
            class="bg-gray-600 hover:bg-gray-700 text-white font-bold text-xs px-3 py-2 rounded transition"
          >
            重置
          </button>
          <button
            @click.stop="$emit('edit-timer', element)"
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-3 py-2 rounded transition"
          >
            编辑
          </button>
        </div>
        <div class="text-[10px] text-gray-400 mt-2">创建者: {{ element.author }}</div>
      </div>

      <!-- 类型：便签 -->
      <div v-if="element.type === 'note'" :class="element.color || 'bg-yellow-100'" class="w-full h-full flex flex-col p-4 relative">
        <!-- 便签顶部装饰 -->
        <div class="absolute -top-2 left-1/4 w-16 h-4 bg-white/40 rotate-1 shadow-sm rounded"></div>
        
        <textarea
          v-model="element.content"
          @change="$emit('update', element)"
          class="flex-1 bg-transparent outline-none resize-none font-handwriting text-sm leading-relaxed"
          placeholder="在这里写笔记..."
        ></textarea>

        <!-- 便签操作栏 -->
        <div v-if="isSelected" class="flex justify-between items-end mt-2 pt-2 border-t border-black/10 opacity-100 transition">
          <div class="flex gap-2">
            <!-- 颜色选择 -->
            <div class="flex gap-1">
              <button
                v-for="color in noteColors"
                :key="color"
                @click.stop="element.color = color; $emit('update', element)"
                :class="['w-4', 'h-4', 'rounded-full', 'transition', 'hover:scale-125', 'border-2', color, { 'border-black': element.color === color, 'border-transparent': element.color !== color }]"
              ></button>
            </div>
            <!-- 分享和图片 -->
            <button
              @click.stop="$emit('share', ['note', element])"
              class="text-black/30 hover:text-blue-500 transition"
              title="分享"
            >
              <i class="fa-solid fa-share-nodes text-xs"></i>
            </button>
            <label class="cursor-pointer text-black/30 hover:text-black transition" title="添加图片">
              <i class="fa-solid fa-image text-xs"></i>
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload">
            </label>
          </div>
        </div>

        <!-- 便签中的图片 -->
        <img
          v-if="element.imageUrl"
          :src="element.imageUrl"
          class="mt-2 w-full h-20 object-cover rounded shadow-sm border-2 border-white/50 cursor-pointer hover:shadow-md transition"
          @click.stop="viewImage(element.imageUrl)"
        />
      </div>

      <!-- 类型：协议/清单 -->
      <div v-if="element.type === 'protocol'" class="w-full h-full flex flex-col p-4 bg-gradient-to-br from-green-50 to-blue-50">
        <input
          v-model="element.title"
          @change="$emit('update', element)"
          class="font-bold text-sm text-gray-800 bg-transparent outline-none mb-3 border-b border-gray-300"
          placeholder="协议名称"
        />
        
        <div class="flex-1 overflow-y-auto space-y-1">
          <div
            v-for="(step, idx) in element.steps"
            :key="idx"
            @click.stop="step.done = !step.done; $emit('update', element)"
            class="flex items-center gap-2 cursor-pointer hover:bg-white/50 p-1 rounded transition"
          >
            <i
              :class="step.done ? 'fa-check-circle text-green-500' : 'fa-circle text-gray-300'"
              class="fa-solid text-sm flex-shrink-0"
            ></i>
            <input
              :value="step.text"
              @click.stop
              @change="step.text = $event.target.value; $emit('update', element)"
              class="flex-1 bg-transparent outline-none text-sm"
              :class="step.done ? 'line-through text-gray-400' : 'text-gray-700'"
            />
            <button
              v-if="isSelected"
              @click.stop="element.steps.splice(idx, 1); $emit('update', element)"
              class="text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <!-- 添加新步骤 -->
        <button
          v-if="isSelected"
          @click.stop="element.steps.push({text: '新步骤', done: false}); $emit('update', element)"
          class="mt-2 w-full bg-green-500 hover:bg-green-600 text-white text-xs py-1 rounded transition font-bold"
        >
          + 添加步骤
        </button>

        <div class="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-300 opacity-0 group-hover:opacity-100 transition">
          <button
            @click.stop="$emit('share', ['protocol', element])"
            class="text-gray-500 hover:text-blue-500 text-xs"
          >
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>
      </div>

      <!-- 类型：文件 -->
      <div v-if="element.type === 'file'" class="w-full h-full flex flex-col p-4 bg-gradient-to-br from-blue-50 to-indigo-50 items-center justify-center">
        <i class="fa-solid fa-file text-3xl text-blue-400 mb-2"></i>
        <input
          v-model="element.title"
          @change="$emit('update', element)"
          class="font-bold text-sm text-gray-800 bg-transparent outline-none text-center mb-2 w-full truncate"
          placeholder="文件名"
        />
        <a
          v-if="element.url"
          :href="element.url"
          download
          class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition font-bold"
        >
          下载
        </a>
      </div>

      <!-- 类型：图像 -->
      <div v-if="element.type === 'image'" class="w-full h-full flex items-center justify-center bg-gray-100 overflow-hidden">
        <img
          v-if="element.url"
          :src="element.url"
          class="w-full h-full object-contain cursor-pointer"
          @click.stop="viewImage(element.url)"
        />
        <div v-else class="text-gray-400 text-center">
          <i class="fa-solid fa-image text-3xl mb-2"></i>
          <p class="text-xs">无图像</p>
        </div>
      </div>

      <!-- 类型：文本框 -->
      <div v-if="element.type === 'text'" class="w-full h-full flex items-center justify-center p-4">
        <textarea
          v-model="element.content"
          @change="$emit('update', element)"
          class="w-full h-full bg-transparent outline-none resize-none text-sm"
          placeholder="输入文本..."
        ></textarea>
      </div>

      <!-- 类型：形状 -->
      <div
        v-if="element.type === 'shape'"
        :class="`shape-${element.shapeType}`"
        :style="{ backgroundColor: element.shapeColor }"
        class="w-full h-full cursor-pointer transition hover:opacity-80"
        @click.stop="$emit('select', element.id)"
      ></div>

    </div>

    <!-- 调整大小的手柄（仅在选中时显示） -->
    <div
      v-if="isSelected"
      @mousedown.stop="startResize($event, 'se')"
      class="absolute -bottom-2 -right-2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize z-50 hover:bg-blue-600 transition"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'CanvasElement',
  props: {
    element: {
      type: Object,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select', 'delete', 'update', 'start-connect', 'edit-timer', 'share'],
  data() {
    return {
      isDragging: false,
      noteColors: [
        'bg-yellow-100',
        'bg-pink-100',
        'bg-blue-100',
        'bg-green-100',
        'bg-purple-100',
        'bg-orange-100'
      ]
    }
  },
  computed: {
    timerRemaining() {
      if (!this.element.isRunning) return this.element.duration || 0
      const elapsed = Date.now() - this.element.startTime
      const remaining = Math.max(0, (this.element.duration * 1000 - elapsed) / 1000)
      return Math.ceil(remaining)
    }
  },
  methods: {
    handleMouseDown(e) {
      this.isDragging = true
      this.$emit('select', this.element.id)
    },
    handleToggleTimer() {
      if (this.element.isRunning) {
        this.element.duration = this.timerRemaining
        this.element.isRunning = false
        this.element.startTime = null
      } else {
        if (!this.element.duration || this.element.duration <= 0) {
          this.element.duration = 600 // 默认10分钟
        }
        this.element.startTime = Date.now()
        this.element.isRunning = true
      }
      this.$emit('update', this.element)
    },
    handleResetTimer() {
      this.element.duration = 600
      this.element.isRunning = false
      this.element.startTime = null
      this.$emit('update', this.element)
    },
    handleImageUpload(e) {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (evt) => {
        this.element.imageUrl = evt.target.result
        this.$emit('update', this.element)
      }
      reader.readAsDataURL(file)
    },
    formatTime(seconds) {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = Math.floor(seconds % 60)

      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      return `${m}:${String(s).padStart(2, '0')}`
    },
    viewImage(src) {
      const w = window.open('')
      w.document.write(`<img src="${src}" style="max-width:100%;height:auto;">`)
    },
    startResize(e, direction) {
      e.preventDefault()
      const startX = e.clientX
      const startY = e.clientY
      const startWidth = this.element.width
      const startHeight = this.element.height

      const move = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX
        const deltaY = moveEvent.clientY - startY

        if (direction === 'se') {
          this.element.width = Math.max(150, startWidth + deltaX)
          this.element.height = Math.max(100, startHeight + deltaY)
        }

        this.$emit('update', this.element)
      }

      const up = () => {
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', up)
      }

      window.addEventListener('mousemove', move)
      window.addEventListener('mouseup', up)
    }
  }
}
</script>

<style scoped>
.canvas-element {
  user-select: none;
  -webkit-user-select: none;
}

.shape-rectangle {
  border-radius: 4px;
}

.shape-circle {
  border-radius: 50%;
}

.shape-triangle {
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
}

.element-type-timer {
  min-width: 220px;
  min-height: 150px;
}

.element-type-note {
  min-width: 200px;
  min-height: 160px;
}

.element-type-protocol {
  min-width: 240px;
  min-height: 200px;
}

.element-type-file {
  min-width: 160px;
  min-height: 120px;
}

.element-type-image {
  min-width: 200px;
  min-height: 150px;
}

.element-type-text {
  min-width: 180px;
  min-height: 120px;
}

.element-type-shape {
  min-width: 100px;
  min-height: 100px;
}
</style>
