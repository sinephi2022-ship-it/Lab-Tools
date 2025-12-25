<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left">
        <el-button @click="goBack" type="text">
          <el-icon><ArrowLeft /></el-icon>
          返回大厅
        </el-button>
        <h2>{{ currentLab?.name }}</h2>
        <el-tag :type="currentLab?.type === 'private' ? 'info' : 'success'">
          {{ currentLab?.type === 'private' ? '私人' : '多人' }}
        </el-tag>
      </div>
      
      <div class="header-right">
        <el-button @click="exportReport" type="primary">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <div class="main-content">
      <div class="file-explorer">
        <div class="file-toolbar">
          <el-button-group>
            <el-button @click="showCreateDialog = true; itemType = 'note'" type="primary">
              <el-icon><Document /></el-icon>
              便签
            </el-button>
            <el-button @click="showCreateDialog = true; itemType = 'timer'" type="warning">
              <el-icon><Timer /></el-icon>
              计时器
            </el-button>
            <el-button @click="showCreateDialog = true; itemType = 'protocol'" type="success">
              <el-icon><List /></el-icon>
              协议
            </el-button>
            <el-upload
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
            >
              <el-button type="info">
                <el-icon><Upload /></el-icon>
                上传文件
              </el-button>
            </el-upload>
          </el-button-group>
          
          <div class="view-toggle">
            <el-radio-group v-model="viewMode">
              <el-radio-button label="grid">
                <el-icon><Grid /></el-icon>
              </el-radio-button>
              <el-radio-button label="list">
                <el-icon><List /></el-icon>
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="file-content">
          <!-- 网格视图 -->
          <div v-if="viewMode === 'grid'" class="file-grid">
            <div
              v-for="item in labItems"
              :key="item.id"
              class="file-item"
              @click="openItem(item)"
              @contextmenu.prevent="showContextMenu($event, item)"
            >
              <div class="file-icon">
                <span v-if="item.type === 'note'">📝</span>
                <span v-else-if="item.type === 'timer'">⏰</span>
                <span v-else-if="item.type === 'protocol'">📋</span>
                <span v-else-if="item.type === 'file'">📄</span>
              </div>
              <div class="file-name">{{ item.name }}</div>
              <div class="file-date">{{ formatDate(item.updatedAt) }}</div>
            </div>
          </div>

          <!-- 列表视图 -->
          <el-table v-else :data="labItems" @row-contextmenu="showContextMenu">
            <el-table-column prop="name" label="名称">
              <template #default="{ row }">
                <span class="item-type-icon">
                  <span v-if="row.type === 'note'">📝</span>
                  <span v-else-if="row.type === 'timer'">⏰</span>
                  <span v-else-if="row.type === 'protocol'">📋</span>
                  <span v-else-if="row.type === 'file'">📄</span>
                </span>
                {{ row.name }}
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getItemTypeColor(row.type)">
                  {{ getItemTypeName(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="修改时间" width="150">
              <template #default="{ row }">
                {{ formatDate(row.updatedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" @click="openItem(row)">打开</el-button>
                <el-button size="small" type="danger" @click="deleteItem(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 创建项目对话框 -->
    <el-dialog v-model="showCreateDialog" :title="`创建${getItemTypeName(itemType)}`" width="500px">
      <component
        :is="getCreateComponent(itemType)"
        @create="handleCreate"
        @cancel="showCreateDialog = false"
      />
    </el-dialog>

    <!-- 右键菜单 -->
    <el-dropdown
      ref="contextMenu"
      :virtual-ref="contextMenuTarget"
      virtual-triggering
      trigger="contextmenu"
      @command="handleContextCommand"
    >
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="open">打开</el-dropdown-item>
          <el-dropdown-item command="rename">重命名</el-dropdown-item>
          <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Download,
  Document,
  Timer,
  List,
  Upload,
  Grid
} from '@element-plus/icons-vue'
import { useLabStore } from '@/stores/lab'
import { useAuthStore } from '@/stores/auth'
import { uploadFile } from '@/utils/firebase'
import type { LabItem } from '@/types'

const router = useRouter()
const labStore = useLabStore()
const authStore = useAuthStore()

const viewMode = ref<'grid' | 'list'>('grid')
const showCreateDialog = ref(false)
const itemType = ref<'note' | 'timer' | 'protocol'>('note')
const contextMenuTarget = ref()
const selectedContextItem = ref<LabItem | null>(null)

const currentLab = computed(() => labStore.currentLab)
const labItems = computed(() => labStore.labItems)

let unsubscribeItems: (() => void) | null = null

const getItemTypeName = (type: string) => {
  const names = {
    note: '便签',
    timer: '计时器',
    protocol: '协议',
    file: '文件'
  }
  return names[type] || type
}

const getItemTypeColor = (type: string) => {
  const colors = {
    note: 'primary',
    timer: 'warning',
    protocol: 'success',
    file: 'info'
  }
  return colors[type] || 'info'
}

const getCreateComponent = (type: string) => {
  const components = {
    note: 'CreateNoteForm',
    timer: 'CreateTimerForm',
    protocol: 'CreateProtocolForm'
  }
  return components[type] || 'CreateNoteForm'
}

const formatDate = (date: any) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('zh-CN')
}

const goBack = () => {
  router.push('/lobby')
}

const handleFileChange = async (file: any) => {
  try {
    if (!currentLab.value) return
    
    const url = await uploadFile(file.raw, `labs/${currentLab.value.id}/files/${file.name}`)
    await labStore.createNewItem('file', file.name, {
      url,
      size: file.size,
      mimeType: file.type
    })
    ElMessage.success('文件上传成功')
  } catch (error) {
    ElMessage.error('文件上传失败')
  }
}

const handleCreate = async (data: any) => {
  try {
    await labStore.createNewItem(itemType.value, data.name, data.content)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

const openItem = (item: LabItem) => {
  // 这里将在后续实现具体的项目打开逻辑
  console.log('打开项目:', item)
  ElMessage.info(`打开 ${getItemTypeName(item.type)}: ${item.name}`)
}

const deleteItem = async (item: LabItem) => {
  try {
    await ElMessageBox.confirm(`确定要删除"${item.name}"吗？`, '确认删除', {
      type: 'warning'
    })
    // 这里将实现删除逻辑
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const showContextMenu = (event: MouseEvent, item: LabItem) => {
  contextMenuTarget.value = event.target
  selectedContextItem.value = item
}

const handleContextCommand = (command: string) => {
  if (!selectedContextItem.value) return
  
  switch (command) {
    case 'open':
      openItem(selectedContextItem.value)
      break
    case 'rename':
      // 实现重命名逻辑
      break
    case 'delete':
      deleteItem(selectedContextItem.value)
      break
  }
}

const exportReport = () => {
  // 这里将实现导出报告功能
  ElMessage.info('导出报告功能开发中...')
}

onMounted(() => {
  if (currentLab.value) {
    unsubscribeItems = labStore.subscribeToLabItemsRealtime(currentLab.value.id)
  }
})

onUnmounted(() => {
  if (unsubscribeItems) {
    unsubscribeItems()
  }
})
</script>

<style scoped>
.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left h2 {
  margin: 0;
  color: #333;
}

.file-explorer {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.file-toolbar {
  padding: 15px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-content {
  flex: 1;
  overflow: auto;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  padding: 20px;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.file-item:hover {
  background: #f0f9ff;
  border-color: #409eff;
}

.file-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.file-name {
  font-size: 14px;
  text-align: center;
  word-break: break-all;
  margin-bottom: 4px;
}

.file-date {
  font-size: 12px;
  color: #999;
}

.item-type-icon {
  margin-right: 8px;
}
</style>