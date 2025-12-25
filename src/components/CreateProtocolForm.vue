<template>
  <el-form :model="form" :rules="rules" ref="formRef">
    <el-form-item label="协议名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入协议名称" />
    </el-form-item>
    
    <el-form-item label="协议内容">
      <el-input
        v-model="protocolText"
        type="textarea"
        :rows="6"
        placeholder="粘贴协议内容，系统会自动生成可勾选的步骤列表"
        @paste="handlePaste"
      />
      <div class="paste-hint">
        💡 提示：粘贴文本后，系统会自动将每行转换为可勾选的步骤
      </div>
    </el-form-item>
    
    <el-form-item label="预览步骤">
      <div class="steps-preview">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step-item"
        >
          <el-checkbox v-model="step.checked" disabled>
            {{ step.text }}
          </el-checkbox>
        </div>
        <div v-if="steps.length === 0" class="empty-steps">
          暂无步骤，请粘贴协议内容
        </div>
      </div>
    </el-form-item>
    
    <el-form-item>
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :disabled="steps.length === 0">
        创建
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

const emit = defineEmits(['create', 'cancel'])

const formRef = ref<FormInstance>()
const protocolText = ref('')
const steps = ref<Array<{ id: string; text: string; checked: boolean }>>([])

const form = reactive({
  name: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入协议名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

// 解析粘贴的文本，生成步骤列表
const parseSteps = (text: string) => {
  if (!text.trim()) {
    steps.value = []
    return
  }
  
  const lines = text.split('\n').filter(line => line.trim())
  const parsedSteps = lines.map((line, index) => ({
    id: `step-${index}`,
    text: line.trim(),
    checked: false
  }))
  
  steps.value = parsedSteps
}

const handlePaste = (event: ClipboardEvent) => {
  setTimeout(() => {
    parseSteps(protocolText.value)
  }, 100)
}

// 监听文本变化
watch(protocolText, (newText) => {
  parseSteps(newText)
})

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (steps.value.length === 0) {
      return
    }
    
    emit('create', {
      name: form.name,
      content: {
        steps: steps.value
      }
    })
  } catch (error) {
    // 表单验证失败
  }
}
</script>

<style scoped>
.paste-hint {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.steps-preview {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
}

.step-item {
  margin-bottom: 8px;
}

.empty-steps {
  text-align: center;
  color: #999;
  padding: 20px;
}
</style>