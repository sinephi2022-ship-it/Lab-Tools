<template>
  <div class="simple-lab h-screen flex flex-col">
    <div class="flex items-center justify-between border-b p-3">
      <div class="flex items-center gap-3">
        <button class="px-2 py-1 border rounded" @click="back">返回大厅</button>
        <h1 class="text-xl font-bold">{{ lab?.name || '实验室' }}</h1>
        <span v-if="lab?.isPublic" class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">公开</span>
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-2 bg-blue-600 text-white rounded" @click="exportReport">导出报告</button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="flex gap-2 p-3 border-b">
      <button class="px-3 py-2 bg-gray-800 text-white rounded" @click="addNote">便签</button>
      <button class="px-3 py-2 bg-red-600 text-white rounded" @click="addTimer">计时器</button>
      <button class="px-3 py-2 bg-indigo-600 text-white rounded" @click="openProtocolPaste">Protocol</button>
      <label class="px-3 py-2 bg-gray-200 rounded cursor-pointer">
        上传文件<input type="file" class="hidden" @change="handleUpload($event, false)" />
      </label>
      <label class="px-3 py-2 bg-gray-200 rounded cursor-pointer">
        上传图片<input type="file" accept="image/*" class="hidden" @change="handleUpload($event, true)" />
      </label>
    </div>

    <!-- Finder 风格布局 -->
    <div class="flex flex-1">
      <aside class="w-52 border-r p-3">
        <ul class="space-y-2 text-sm">
          <li :class="{ 'font-bold': activeTab==='all' }" @click="activeTab='all'" class="cursor-pointer">全部</li>
          <li :class="{ 'font-bold': activeTab==='notes' }" @click="activeTab='notes'" class="cursor-pointer">便签</li>
          <li :class="{ 'font-bold': activeTab==='timers' }" @click="activeTab='timers'" class="cursor-pointer">计时器</li>
          <li :class="{ 'font-bold': activeTab==='protocols' }" @click="activeTab='protocols'" class="cursor-pointer">Protocol</li>
          <li :class="{ 'font-bold': activeTab==='files' }" @click="activeTab='files'" class="cursor-pointer">文件</li>
          <li :class="{ 'font-bold': activeTab==='images' }" @click="activeTab='images'" class="cursor-pointer">图片</li>
        </ul>
      </aside>

      <main class="flex-1 p-4 overflow-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="item in filteredItems" :key="item.id" :ref="el => setItemRef(item.id, el)" class="border rounded p-3">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold">{{ item.title || defaultTitle(item) }}</h3>
              <div class="flex gap-2">
                <button class="text-xs px-2 py-1 border rounded" @click="removeItem(item.id)">删除</button>
              </div>
            </div>

            <!-- 不同类型的渲染 -->
            <template v-if="item.type==='note'">
              <textarea v-model="item.content" class="w-full h-24 border rounded p-2" @change="saveItem(item)"></textarea>
            </template>

            <template v-else-if="item.type==='timer'">
              <div class="flex items-center gap-2">
                <input type="number" min="1" class="w-20 border rounded p-1" v-model.number="item.duration" @change="saveItem(item)" />
                <span class="text-gray-500 text-xs">秒</span>
                <button class="px-2 py-1 bg-red-600 text-white rounded" @click="toggleTimer(item)">{{ item.isRunning ? '暂停' : '开始' }}</button>
                <span class="font-mono text-lg">{{ formatTime(remaining(item)) }}</span>
              </div>
            </template>

            <template v-else-if="item.type==='protocol'">
              <div class="space-y-2">
                <div v-for="(step, idx) in item.steps" :key="idx" class="flex items-start gap-2">
                  <input type="checkbox" v-model="step.done" @change="saveItem(item)" />
                  <div class="flex-1">
                    <input v-model="step.text" class="w-full border rounded p-1 mb-1" @change="saveItem(item)" />
                    <textarea v-model="step.note" class="w-full border rounded p-1 text-xs" placeholder="备注（支持 Markdown / $公式$ / 表格 | 分隔）" @change="saveItem(item)"></textarea>
                    <MarkdownRenderer :text="step.note" />
                  </div>
                </div>
                <button class="px-2 py-1 border rounded" @click="addStep(item)">添加步骤</button>
              </div>
            </template>

            <template v-else-if="item.type==='file'">
              <div>
                <p class="text-xs text-gray-500">{{ item.mimeType }} · {{ Math.round((item.size||0)/1024) }} KB</p>
                <a :href="item.url" target="_blank" class="text-blue-600 underline">下载/预览</a>
              </div>
            </template>

            <template v-else-if="item.type==='image'">
              <img :src="item.url" class="w-full h-48 object-contain" />
            </template>
          </div>
        </div>
      </main>
    </div>

    <ProtocolPasteModal v-if="showProtocolPaste" @close="showProtocolPaste=false" @generate="generateProtocol" />
    <GlobalTimerAlerts :timers="runningTimers" @focus-timer="focusTimer" />
  </div>
</template>

<script>
import { onMounted, ref, computed } from 'vue'
import { useSimpleLabStore } from '../stores/simpleLab'
import GlobalTimerAlerts from './GlobalTimerAlerts.vue'
import ProtocolPasteModal from './ProtocolPasteModal.vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

export default {
  name: 'SimpleLabWorkspace',
  components: { GlobalTimerAlerts, ProtocolPasteModal, MarkdownRenderer },
  setup() {
    const simple = useSimpleLabStore()
    const labId = window.location.hash.split('/')[2]

    const showProtocolPaste = ref(false)
    const activeTab = ref('all')

    const back = () => { window.location.hash = '#/simple' }

    onMounted(async () => {
      await simple.loadLab(labId)
    })

    const lab = computed(() => simple.currentLab)
    const items = computed(() => simple.items)

    const filteredItems = computed(() => {
      switch (activeTab.value) {
        case 'notes': return items.value.filter(i => i.type==='note')
        case 'timers': return items.value.filter(i => i.type==='timer')
        case 'protocols': return items.value.filter(i => i.type==='protocol')
        case 'files': return items.value.filter(i => i.type==='file')
        case 'images': return items.value.filter(i => i.type==='image')
        default: return items.value
      }
    })

    const setItemRef = (id, el) => { simple.setItemRef(id, el) }
    const focusTimer = (id) => { simple.scrollIntoView(id) }

    const addNote = async () => { await simple.addItem({ type:'note', title:'便签', content:'' }) }
    const addTimer = async () => { await simple.addItem({ type:'timer', title:'计时器', duration:600, isRunning:false, startTime:null }) }
    const openProtocolPaste = () => { showProtocolPaste.value = true }

    const generateProtocol = async (text) => {
      const steps = text.split('\n').map(line => ({ text: line.trim(), done: false, note:'' })).filter(s => s.text)
      await simple.addItem({ type:'protocol', title:'Protocol', steps })
      showProtocolPaste.value = false
    }

    const handleUpload = async (e, isImage) => {
      const file = e.target.files[0]
      if (!file) return
      const { url } = await simple.uploadFile(file)
      if (isImage) {
        await simple.addItem({ type:'image', title:file.name, url, mimeType:file.type, size:file.size })
      } else {
        await simple.addItem({ type:'file', title:file.name, url, mimeType:file.type, size:file.size })
      }
      e.target.value = ''
    }

    const removeItem = async (id) => { await simple.removeItem(id) }
    const saveItem = async (item) => { await simple.updateItem(item) }

    const remaining = (item) => {
      if (!item.isRunning) return item.duration || 0
      const elapsed = Date.now() - (item.startTime || Date.now())
      return Math.max(0, Math.ceil((item.duration*1000 - elapsed)/1000))
    }

    const toggleTimer = async (item) => {
      if (item.isRunning) {
        item.duration = remaining(item)
        item.isRunning = false
        item.startTime = null
      } else {
        if (!item.duration || item.duration<=0) item.duration = 60
        item.startTime = Date.now()
        item.isRunning = true
      }
      await simple.updateItem(item)
    }

    const formatTime = (sec) => {
      const m = Math.floor(sec/60)
      const s = sec%60
      return `${m}:${String(s).padStart(2,'0')}`
    }

    const addStep = async (item) => {
      item.steps.push({ text:'', done:false, note:'' })
      await simple.updateItem(item)
    }

    const defaultTitle = (item) => ({ note:'便签', timer:'计时器', protocol:'Protocol', file:'文件', image:'图片' }[item.type])

    const exportReport = async () => { await simple.exportReport() }

    return {
      back,
      lab,
      activeTab,
      filteredItems,
      addNote,
      addTimer,
      openProtocolPaste,
      handleUpload,
      removeItem,
      saveItem,
      remaining,
      toggleTimer,
      formatTime,
      addStep,
      defaultTitle,
      showProtocolPaste,
      runningTimers: computed(() => items.value.filter(i => i.type==='timer' && i.isRunning)),
      setItemRef,
      focusTimer,
      exportReport
    }
  }
}
</script>
