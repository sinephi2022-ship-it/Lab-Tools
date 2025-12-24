<template>
  <div class="toolbar">
    <div class="tool-group">
      <button @click="$emit('add-element', 'note')" title="添加便签">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
        便签
      </button>
      <button @click="$emit('add-element', 'timer')" title="添加计时器">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
        计时器
      </button>
      <button @click="$emit('add-element', 'protocol')" title="添加实验协议">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
        协议
      </button>
      <button @click="$emit('add-element', 'text')" title="添加文本">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z"/>
        </svg>
        文本
      </button>
      <button @click="$emit('add-element', 'file')" title="添加文件">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
        </svg>
        文件
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Toolbar',
  emits: ['add-element']
}
</script>

<style scoped>
.toolbar {
  position: absolute;
  left: 20px;
  top: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 10px;
  z-index: 100;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toolbar button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  min-width: 120px;
  justify-content: flex-start;
}

.toolbar button:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.toolbar svg {
  flex-shrink: 0;
}
</style>