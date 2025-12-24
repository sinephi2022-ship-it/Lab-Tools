<template>
  <div class="project-info">
    <div class="project-header">
      <h2>{{ project.name }}</h2>
      <div class="project-badges">
        <span class="badge" :class="{ 'public': project.isPublic, 'private': !project.isPublic }">
          {{ project.isPublic ? '公开' : '私有' }}
        </span>
      </div>
    </div>
    
    <div class="project-details">
      <div class="detail-item">
        <span class="label">房主:</span>
        <span class="value">{{ project.owner }}</span>
      </div>
      
      <div class="members-section">
        <span class="label">成员:</span>
        <div class="members-list">
          <div v-for="member in project.members" :key="member" class="member-item">
            <div class="member-avatar">{{ member.charAt(0) }}</div>
            <span class="member-name">{{ member }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="project-actions">
      <button @click="handleExportReport" class="export-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        导出报告
      </button>
      <button @click="handleShare" class="share-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
        </svg>
        分享
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectInfo',
  props: {
    project: {
      type: Object,
      required: true
    }
  },
  methods: {
    handleExportReport() {
      this.$emit('export-report')
    },
    handleShare() {
      const shareUrl = `${window.location.origin}/project/${this.project.id}`
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('项目链接已复制到剪贴板')
      })
    }
  }
}
</script>

<style scoped>
.project-info {
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 16px;
  z-index: 100;
}

.project-header {
  margin-bottom: 16px;
}

.project-header h2 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.project-badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge.public {
  background: #E8F5E9;
  color: #2E7D32;
}

.badge.private {
  background: #FFF3E0;
  color: #E65100;
}

.project-details {
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 50px;
}

.value {
  font-size: 14px;
  color: var(--text-primary);
}

.members-section {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.members-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--secondary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.member-name {
  font-size: 14px;
  color: var(--text-primary);
}

.project-actions {
  display: flex;
  gap: 8px;
}

.export-btn,
.share-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  font-size: 14px;
  border-radius: 6px;
  border: none;
}

.export-btn {
  background: var(--primary-color);
  color: white;
}

.export-btn:hover {
  background: #45a049;
}

.share-btn {
  background: var(--secondary-color);
  color: white;
}

.share-btn:hover {
  background: #1976D2;
}
</style>