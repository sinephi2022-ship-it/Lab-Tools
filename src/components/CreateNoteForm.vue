<template>
  <el-form :model="form" :rules="rules" ref="formRef">
    <el-form-item label="便签名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入便签名称" />
    </el-form-item>
    
    <el-form-item label="内容" prop="content">
      <el-input
        v-model="form.content"
        type="textarea"
        :rows="4"
        placeholder="请输入便签内容"
      />
    </el-form-item>
    
    <el-form-item label="颜色">
      <el-color-picker v-model="form.color" />
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
  content: '',
  color: '#fffacd'
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入便签名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入便签内容', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    emit('create', {
      name: form.name,
      content: {
        text: form.content,
        color: form.color
      }
    })
  } catch (error) {
    // 表单验证失败
  }
}
</script>