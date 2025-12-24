<template>
  <div class="report-modal" v-if="showModal">
    <div class="modal-overlay" @click="closeModal"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ t('project.exportReport') }}</h2>
        <button @click="closeModal" class="close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="export-options">
          <h3>导出格式</h3>
          <div class="format-options">
            <label class="format-option">
              <input type="radio" v-model="selectedFormat" value="html">
              <div class="format-card">
                <div class="format-icon">📄</div>
                <div class="format-name">HTML 格式</div>
                <div class="format-desc">美观的网页格式，适合打印和分享</div>
              </div>
            </label>
            
            <label class="format-option">
              <input type="radio" v-model="selectedFormat" value="markdown">
              <div class="format-card">
                <div class="format-icon">📝</div>
                <div class="format-name">Markdown 格式</div>
                <div class="format-desc">纯文本格式，便于编辑和版本控制</div>
              </div>
            </label>
          </div>
        </div>
        
        <div class="export-settings">
          <h3>导出设置</h3>
          <div class="setting-item">
            <label>
              <input type="checkbox" v-model="includeImages">
              包含图片
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" v-model="includeConnections">
              包含连接关系图
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" v-model="includeTimestamps">
              包含时间戳
            </label>
          </div>
        </div>
        
        <div class="preview-section" v-if="showPreview">
          <h3>预览</h3>
          <div class="preview-content">
            <div class="preview-item">
              <span class="preview-label">项目名称:</span>
              <span>{{ project.name }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">元素数量:</span>
              <span>{{ elements.length }} 个</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">连接数量:</span>
              <span>{{ connections.length }} 条</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">导出格式:</span>
              <span>{{ selectedFormat.toUpperCase() }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="togglePreview" class="preview-btn">
          {{ showPreview ? '隐藏预览' : '显示预览' }}
        </button>
        <button @click="exportReport" class="export-btn" :disabled="isExporting">
          {{ isExporting ? '导出中...' : '导出报告' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { generateReport } from '../utils/reportGenerator'
import { t } from '../utils/i18n'

export default {
  name: 'ReportExportModal',
  props: {
    showModal: Boolean,
    project: Object,
    elements: Array,
    connections: Array
  },
  emits: ['close'],
  setup(props, { emit }) {
    const selectedFormat = ref('html')
    const includeImages = ref(true)
    const includeConnections = ref(true)
    const includeTimestamps = ref(true)
    const showPreview = ref(false)
    const isExporting = ref(false)
    
    const closeModal = () => {
      emit('close')
    }
    
    const togglePreview = () => {
      showPreview.value = !showPreview.value
    }
    
    const exportReport = async () => {
      isExporting.value = true
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        generateReport(
          props.project,
          props.elements,
          props.connections,
          selectedFormat.value
        )
        
        setTimeout(() => {
          isExporting.value = false
          closeModal()
        }, 500)
      } catch (error) {
        console.error('导出失败:', error)
        isExporting.value = false
      }
    }
    
    return {
      selectedFormat,
      includeImages,
      includeConnections,
      includeTimestamps,
      showPreview,
      isExporting,
      closeModal,
      togglePreview,
      exportReport,
      t
    }
  }
}
</script>

<style scoped>
.report-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--background-color);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.export-options,
.export-settings,
.preview-section {
  margin-bottom: 24px;
}

.export-options h3,
.export-settings h3,
.preview-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.format-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.format-option {
  cursor: pointer;
}

.format-option input[type="radio"] {
  display: none;
}

.format-card {
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s ease;
}

.format-option input[type="radio"]:checked + .format-card {
  border-color: var(--primary-color);
  background: rgba(76, 175, 80, 0.05);
}

.format-card:hover {
  border-color: var(--primary-color);
}

.format-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.format-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.format-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.setting-item {
  margin-bottom: 12px;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.setting-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.preview-content {
  background: var(--background-color);
  border-radius: 8px;
  padding: 16px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.preview-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
}

.preview-btn:hover {
  background: var(--background-color);
}

.export-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
}

.export-btn:hover:not(:disabled) {
  background: #45a049;
}

.export-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>