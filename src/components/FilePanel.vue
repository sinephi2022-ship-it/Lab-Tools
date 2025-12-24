<template>
  <div class="file-panel">
    <div class="panel-header">
      <h3>文件管理</h3>
    </div>
    
    <div class="upload-section">
      <input 
        type="file" 
        ref="fileInput"
        @change="handleFileSelect"
        multiple
        style="display: none"
      >
      <button @click="$refs.fileInput.click()" class="upload-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
        </svg>
        上传文件
      </button>
    </div>
    
    <div class="files-section">
      <h4>项目文件</h4>
      <div class="file-list">
        <div v-for="file in projectFiles" :key="file.id" class="file-item">
          <div class="file-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
          </div>
          <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-size">{{ formatFileSize(file.size) }}</div>
          </div>
          <button @click="addFileToCanvas(file)" class="add-btn">
            添加到画布
          </button>
        </div>
      </div>
    </div>
    
    <div class="collection-section">
      <h4>个人收藏</h4>
      <div class="file-list">
        <div v-for="item in collections" :key="item.id" class="file-item">
          <div class="file-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          </div>
          <div class="file-info">
            <div class="file-name">{{ item.name }}</div>
            <div class="file-type">{{ item.type }}</div>
          </div>
          <button @click="addCollectionToCanvas(item)" class="add-btn">
            添加到画布
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilePanel',
  data() {
    return {
      projectFiles: [],
      collections: [
        { id: 1, name: '常用协议模板', type: 'protocol' },
        { id: 2, name: '实验数据表格', type: 'file' },
        { id: 3, name: '安全注意事项', type: 'note' }
      ]
    }
  },
  methods: {
    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      
      files.forEach(file => {
        const fileData = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          file: file
        }
        
        this.projectFiles.push(fileData)
        this.$emit('file-upload', file)
      })
      
      event.target.value = ''
    },
    addFileToCanvas(file) {
      this.$emit('file-upload', file.file)
    },
    addCollectionToCanvas(item) {
      console.log('添加收藏到画布:', item)
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  }
}
</script>

<style scoped>
.file-panel {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow);
  z-index: 100;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.upload-section {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.upload-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
}

.files-section,
.collection-section {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.files-section h4,
.collection-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: var(--background-color);
  border-radius: 6px;
}

.file-icon {
  color: var(--secondary-color);
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size,
.file-type {
  font-size: 12px;
  color: var(--text-secondary);
}

.add-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  white-space: nowrap;
}

.add-btn:hover {
  background: #1976D2;
}
</style>