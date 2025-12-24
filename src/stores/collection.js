import { defineStore } from 'pinia'
import { saveUserCollection, loadUserCollections } from '../utils/firebase'

export const useCollectionStore = defineStore('collection', {
  state: () => ({
    collections: [],
    isLoading: false,
    error: null
  }),
  
  actions: {
    async loadCollections(userId) {
      this.isLoading = true
      this.error = null
      
      try {
        this.collections = await loadUserCollections(userId)
      } catch (error) {
        console.error('加载收藏失败:', error)
        this.error = error.message
      } finally {
        this.isLoading = false
      }
    },
    
    async addToCollection(userId, item) {
      try {
        const collectionItem = {
          id: Date.now().toString(),
          ...item,
          createdAt: Date.now(),
          type: this.getItemType(item)
        }
        
        await saveUserCollection(userId, collectionItem)
        this.collections.push(collectionItem)
        return true
      } catch (error) {
        console.error('添加收藏失败:', error)
        this.error = error.message
        return false
      }
    },
    
    async removeFromCollection(userId, itemId) {
      try {
        this.collections = this.collections.filter(item => item.id !== itemId)
        return true
      } catch (error) {
        console.error('删除收藏失败:', error)
        this.error = error.message
        return false
      }
    },
    
    getItemType(item) {
      if (item.type) return item.type
      if (item.fileName) return 'file'
      if (item.steps) return 'protocol'
      if (item.duration) return 'timer'
      return 'note'
    },
    
    searchCollections(query) {
      if (!query.trim()) return this.collections
      
      const lowerQuery = query.toLowerCase()
      return this.collections.filter(item => 
        item.name?.toLowerCase().includes(lowerQuery) ||
        item.content?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery)
      )
    },
    
    getCollectionsByType(type) {
      return this.collections.filter(item => item.type === type)
    }
  }
})