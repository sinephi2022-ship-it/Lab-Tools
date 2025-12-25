import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Lab, LabItem } from '@/types'
import { createLab, getLabs, subscribeToLabs, createLabItem, subscribeToLabItems, updateLabItem } from '@/utils/firebase'

export const useLabStore = defineStore('lab', () => {
  const labs = ref<Lab[]>([])
  const currentLab = ref<Lab | null>(null)
  const labItems = ref<LabItem[]>([])
  const isLoading = ref(false)

  const loadLabs = async (userId: string) => {
    isLoading.value = true
    try {
      labs.value = await getLabs(userId)
    } catch (error) {
      console.error('加载实验室失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const subscribeToLabsRealtime = (userId: string) => {
    return subscribeToLabs(userId, (updatedLabs) => {
      labs.value = updatedLabs
    })
  }

  const createNewLab = async (name: string, type: 'private' | 'public', userId: string) => {
    try {
      const labId = await createLab({
        name,
        type,
        owner: userId,
        members: [userId]
      })
      await loadLabs(userId)
      return labId
    } catch (error) {
      console.error('创建实验室失败:', error)
      throw error
    }
  }

  const setCurrentLab = (lab: Lab) => {
    currentLab.value = lab
  }

  const subscribeToLabItemsRealtime = (labId: string) => {
    return subscribeToLabItems(labId, (items) => {
      labItems.value = items
    })
  }

  const createNewItem = async (type: 'note' | 'timer' | 'protocol' | 'file', name: string, content: any) => {
    if (!currentLab.value) throw new Error('没有选择实验室')
    
    try {
      const itemId = await createLabItem(currentLab.value.id, {
        type,
        name,
        content,
        createdBy: currentLab.value.owner
      })
      return itemId
    } catch (error) {
      console.error('创建项目失败:', error)
      throw error
    }
  }

  const updateItem = async (itemId: string, data: any) => {
    if (!currentLab.value) throw new Error('没有选择实验室')
    
    try {
      await updateLabItem(currentLab.value.id, itemId, data)
    } catch (error) {
      console.error('更新项目失败:', error)
      throw error
    }
  }

  const getPublicLabs = () => {
    return labs.value.filter(lab => lab.type === 'public')
  }

  return {
    labs,
    currentLab,
    labItems,
    isLoading,
    loadLabs,
    subscribeToLabsRealtime,
    createNewLab,
    setCurrentLab,
    subscribeToLabItemsRealtime,
    createNewItem,
    updateItem,
    getPublicLabs
  }
})