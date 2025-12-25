<template>
  <el-form :model="form" :rules="rules" ref="formRef">
    <el-form-item label="计时器名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入计时器名称" />
    </el-form-item>
    
    <el-form-item label="倒计时时间" prop="duration">
      <el-input-number
        v-model="form.duration"
        :min="1"
        :max="3600"
        placeholder="请输入秒数"
      />
      <span style="margin-left: 10px;">秒</span>
    </el-form-item>
    
    <el-form-item label="快速设置">
      <el-button-group>
        <el-button @click="form.duration = 60">1分钟</el-button>
        <el-button @click="form.duration = 300">5分钟</el-button>
        <el-button @click="form.duration = 600">10分钟</el-button>
        <el-button @click="form.duration = 1800">30分钟</el-button>
      </el-button-group>
    </el-form-item>
    
    <el-form-item>
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" @click="handleSubmit">创建</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

const emit = defineEmits(['create', 'cancel'])

const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  duration: 60
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入计时器名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请输入倒计时时间', trigger: 'blur' },
    { type: 'number', min: 1, max: 3600, message: '时间范围在 1 到 3600 秒', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    emit('create', {
      name: form.name,
      content: {
        duration: form.duration,
        isRunning: false,
        isCompleted: false
      }
    })
  } catch (error) {
    // 表单验证失败
  }
}
</script>