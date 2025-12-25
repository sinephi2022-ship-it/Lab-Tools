<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>个人收藏</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <!-- 添加收藏 -->
        <div class="add-collection">
          <h3>添加到收藏</h3>
          <div class="upload-area" @dragover.prevent @drop.prevent="handleFileDrop">
            <input 
              ref="fileInput"
              type="file" 
              multiple
              @change="handleFileSelect"
              style="display: none"
            >
            <div class="upload-content">
              <div class="upload-icon">📁</div>
              <p>拖拽文件到此处或点击上传</p>
              <button @click="$refs.fileInput.click()" class="upload-btn">选择文件</button>
            </div>
          </div>
        </div>
        
        <!-- 收藏列表 -->
        <div class="collection-list">
          <h3>我的收藏</h3>
          <div class="filter-tabs">
            <button 
              v-for="tab in filterTabs" 
              :key="tab.key"
              :class="['tab-btn', { active: activeFilter === tab.key }]"
              @click="activeFilter = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
          
          <div class="items-grid">
            <div 
              v-for="item in filteredCollections" 
              :key="item.id"
              class="collection-item"
            >
              <div class="item-icon">{{ getItemIcon(item) }}</div>
              <div class="item-info">
                <h4>{{ item.name }}</h4>
                <p>{{ item.description }}</p>
                <div class="item-meta">
                  <span class="item-type">{{ item.type }}</span>
                  <span class="item-date">{{ formatDate(item.createdAt) }}</span>
                </div>
              </div>
              <div class="item-actions">
                <button @click="addToCanvas(item)" class="action-btn add">
                  添加到画布
                </button>
                <button @click="shareItem(item)" class="action-btn share">
                  分享
                </button>
                <button @click="deleteItem(item)" class="action-btn delete">
                  删除
                </button>
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="filteredCollections.length === 0" class="empty-state">
            <div class="empty-icon">📂</div>
            <h3>暂无收藏</h3>
            <p>上传一些文件到收藏夹吧！</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'CollectionModal',
  emits: ['close'],
  setup() {
    const fileInput = ref(null)
    const activeFilter = ref('all')
    
    const collections = ref([
      {
        id: 1,
        name: '常用协议模板',
        type: 'protocol',
        description: '包含常用实验步骤模板',
        content: '○ 准备实验器材\n○ 配制溶液\n○ 进行测量\n○ 记录数据\n○ 清理实验台',
        createdAt: Date.now() - 86400000
      },
      {
        id: 2,
        name: '实验数据表格',
        type: 'file',
        description: 'Excel数据表格模板',
        fileName: 'experiment-template.xlsx',
        fileSize: 25600,
        createdAt: Date.now() - 172800000
      },
      {
        id: 3,
        name: '安全注意事项',
        type: 'note',
        description: '实验室安全规范',
        content: '🥼 穿戴实验服\n🥽 佩戴护目镜\n🧤 佩戴防护手套\n🧪 使用通风橱\n🧴 正确处理废液',
        createdAt: Date.now() - 259200000
      },
      {
        id: 4,
        name: '反应时间记录',
        type: 'timer',
        description: '化学反应计时模板',
        duration: 300000,
        createdAt: Date.now() - 345600000
      }
    ])
    
    const filterTabs = [
      { key: 'all', label: '全部' },
      { key: 'note', label: '便签' },
      { key: 'timer', label: '计时器' },
      { key: 'protocol', label: '协议' },
      { key: 'file', label: '文件' },
      { key: 'text', label: '文本' }
    ]
    
    const filteredCollections = computed(() => {
      if (activeFilter.value === 'all') {
        return collections.value
      }
      return collections.value.filter(item => item.type === activeFilter.value)
    })
    
    const handleFileSelect = (event) => {
      const files = Array.from(event.target.files)
      processFiles(files)
      event.target.value = ''
    }
    
    const handleFileDrop = (event) => {
      const files = Array.from(event.dataTransfer.files)
      processFiles(files)
    }
    
    const processFiles = (files) => {
      files.forEach(file => {
        const reader = new FileReader()
        
        reader.onload = (e) => {
          const newItem = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: 'file',
            description: `上传的${file.type || '文件'}`,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileData: e.target.result,
            createdAt: Date.now()
          }
          
          collections.value.unshift(newItem)
        }
        
        reader.readAsDataURL(file)
      })
    }
    
    const getItemIcon = (item) => {
      const icons = {
        note: '📝',
        timer: '⏱️',
        protocol: '✓',
        text: '📄',
        file: '📎'
      }
      return icons[item.type] || '📄'
    }
    
    const formatDate = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleDateString('zh-CN')
    }
    
    const addToCanvas = (item) => {
      // 发送事件到父组件，添加到画布
      console.log('添加到画布:', item)
      // 这里应该通过事件总线或状态管理来处理
      alert(`已将"${item.name}"添加到画布`)
    }
    
    const shareItem = (item) => {
      if (navigator.share) {
        navigator.share({
          title: item.name,
          text: item.description,
          url: window.location.href
        })
      } else {
        navigator.clipboard.writeText(`${item.name}: ${item.description}`)
        alert('链接已复制到剪贴板')
      }
    }
    
    const deleteItem = (item) => {
      if (confirm(`确定要删除"${item.name}"吗？`)) {
        const index = collections.value.findIndex(c => c.id === item.id)
        if (index > -1) {
          collections.value.splice(index, 1)
        }
      }
    }
    
    return {
      fileInput,
      activeFilter,
      collections,
      filterTabs,
      filteredCollections,
      handleFileSelect,
      handleFileDrop,
      getItemIcon,
      formatDate,
      addToCanvas,
      shareItem,
      deleteItem
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.modal-body {
  padding: 24px;
}

.add-collection {
  margin-bottom: 32px;
}

.add-collection h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.upload-area {
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #4CAF50;
  background: #f8fff8;
}

.upload-content {
  pointer-events: none;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-content p {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
}

.upload-btn {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  pointer-events: all;
}

.upload-btn:hover {
  background: #45a049;
}

.collection-list h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 6px 12px;
  background: #f5f5f5;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #4CAF50;
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #e0e0e0;
  color: #333;
}

.items-grid {
  display: grid;
  gap: 16px;
}

.collection-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.collection-item:hover {
  background: #f0f1f3;
  transform: translateY(-1px);
}

.item-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-info p {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  gap: 12px;
}

.item-type {
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.item-date {
  font-size: 12px;
  color: #999;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.action-btn.add {
  background: #4CAF50;
  color: white;
}

.action-btn.add:hover {
  background: #45a049;
}

.action-btn.share {
  background: #2196F3;
  color: white;
}

.action-btn.share:hover {
  background: #1976D2;
}

.action-btn.delete {
  background: #f44336;
  color: white;
}

.action-btn.delete:hover {
  background: #d32f2f;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

@media (max-width: 480px) {
  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
  
  .collection-item {
    flex-direction: column;
    text-align: center;
  }
  
  .item-actions {
    justify-content: center;
    width: 100%;
  }
  
  .action-btn {
    flex: 1;
  }
}
</style>