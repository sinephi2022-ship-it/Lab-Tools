<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ projectType === 'private' ? '创建私人实验' : '创建多人实验' }}</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="projectName">项目名称</label>
          <input 
            id="projectName"
            v-model="formData.name" 
            type="text" 
            placeholder="输入实验项目名称"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="projectDesc">项目描述</label>
          <textarea 
            id="projectDesc"
            v-model="formData.description" 
            placeholder="描述这个实验项目的内容和目标"
            rows="3"
          ></textarea>
        </div>
        
        <div v-if="projectType === 'public'" class="form-group">
          <label for="inviteCode">邀请码（可选）</label>
          <input 
            id="inviteCode"
            v-model="formData.inviteCode" 
            type="text" 
            placeholder="留空将自动生成邀请码"
            maxlength="10"
          >
          <small>其他用户可以通过此邀请码加入您的实验项目</small>
        </div>
        
        <div v-if="projectType === 'public'" class="form-group">
          <label for="password">访问密码（可选）</label>
          <input 
            id="password"
            v-model="formData.password" 
            type="password" 
            placeholder="设置访问密码以增强安全性"
          >
          <small>设置密码后，首次加入的用户需要输入密码</small>
        </div>
        
        <div class="form-group">
          <label>项目模板</label>
          <div class="template-options">
            <div 
              v-for="template in templates" 
              :key="template.id"
              :class="['template-card', { selected: formData.template === template.id }]"
              @click="formData.template = template.id"
            >
              <div class="template-icon">{{ template.icon }}</div>
              <div class="template-info">
                <h4>{{ template.name }}</h4>
                <p>{{ template.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
      
      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-secondary">取消</button>
        <button @click="handleSubmit" class="btn-primary" :disabled="!formData.name.trim()">
          {{ isCreating ? '创建中...' : '创建项目' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useProjectManagementStore } from '../stores/projectManagement'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'CreateProjectModal',
  props: {
    projectType: {
      type: String,
      required: true,
      validator: (value) => ['private', 'public'].includes(value)
    }
  },
  emits: ['close', 'created'],
  setup(props, { emit }) {
    const projectManagementStore = useProjectManagementStore()
    const authStore = useAuthStore()
    
    const isCreating = ref(false)
    
    const formData = ref({
      name: '',
      description: '',
      inviteCode: '',
      password: '',
      template: 'blank'
    })
    
    const templates = [
      {
        id: 'blank',
        name: '空白项目',
        description: '从空白画布开始创建',
        icon: '📄'
      },
      {
        id: 'chemistry',
        name: '化学实验',
        description: '包含常用化学实验模板',
        icon: '⚗️'
      },
      {
        id: 'physics',
        name: '物理实验',
        description: '包含常用物理实验模板',
        icon: '⚡'
      },
      {
        id: 'biology',
        name: '生物实验',
        description: '包含常用生物实验模板',
        icon: '🧬'
      }
    ]
    
    const generateInviteCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = ''
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }
    
    const handleSubmit = async () => {
      if (!formData.value.name.trim()) return
      
      isCreating.value = true
      
      try {
        // 生成邀请码（多人项目）
        let inviteCode = formData.value.inviteCode
        if (props.projectType === 'public' && !inviteCode) {
          inviteCode = generateInviteCode()
        }
        
        const newProject = {
          name: formData.value.name.trim(),
          description: formData.value.description.trim(),
          type: props.projectType,
          owner: authStore.user.uid, // 使用用户ID
          members: props.projectType === 'public' ? [authStore.user.uid] : [],
          inviteCode: props.projectType === 'public' ? inviteCode : null,
          password: props.projectType === 'public' ? formData.value.password : null,
          template: formData.value.template
        }
        
// 真正创建实验室到Firebase
        const labId = await projectManagementStore.createLab(newProject, authStore.user.uid)
        
        emit('created', { ...newProject, id: labId })
        
      } catch (error) {
        console.error('创建项目失败:', error)
        alert('创建项目失败，请重试')
      } finally {
        isCreating.value = false
      }
    }
    
    return {
      isCreating,
      formData,
      templates,
      handleSubmit
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
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-group small {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.template-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-card:hover {
  border-color: #4CAF50;
  background: #f8fff8;
}

.template-card.selected {
  border-color: #4CAF50;
  background: #e8f5e9;
}

.template-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.template-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.template-info p {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.3;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
  color: #333;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
  
  .template-options {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn-secondary,
  .btn-primary {
    width: 100%;
  }
}
</style>