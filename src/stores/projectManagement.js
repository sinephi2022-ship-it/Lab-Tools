import { defineStore } from 'pinia'
import { createLab as createLabInFirebase, loadLab, saveLab, saveUserLab, loadUserLabs, deleteLab as deleteLabFromFirebase } from '../utils/firebase'

export const useProjectManagementStore = defineStore('projectManagement', {
  state: () => ({
    labs: [],              // 实验室列表
    privateLabs: [],       // 私人实验室
    publicLabs: [],        // 公开实验室
    recentLabs: [],        // 最近访问的实验室
    isLoading: false
  }),
  actions: {
    async createLab(labInfo, userId) {
      try {
        // 使用firebase.js中的createLab函数
        const labId = await createLabInFirebase(labInfo, userId)
        
        // 重新加载用户实验室列表，确保数据同步
        await this.loadUserLabs(userId)
        
        return labId
      } catch (error) {
        console.error('创建实验室失败:', error)
        throw error
      }
    },
    
    async loadUserLabs(userId) {
      this.isLoading = true
      try {
        const labs = await loadUserLabs(userId)
        this.labs = labs
        this.privateLabs = labs.filter(l => l.type === 'private')
        this.publicLabs = labs.filter(l => l.type === 'public')
        this.recentLabs = labs.slice(0, 5)
      } catch (error) {
        console.error('加载实验室列表失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    async deleteLab(labId, userId) {
      try {
        // 从Firebase删除实验室
        await deleteLabFromFirebase(labId)
        
        // 从本地列表中移除
        this.labs = this.labs.filter(l => l.id !== labId)
        this.privateLabs = this.privateLabs.filter(l => l.id !== labId)
        this.publicLabs = this.publicLabs.filter(l => l.id !== labId)
        this.recentLabs = this.recentLabs.filter(l => l.id !== labId)
      } catch (error) {
        console.error('删除实验室失败:', error)
        throw error
      }
    },
    
    addToRecent(lab) {
      this.recentLabs = this.recentLabs.filter(l => l.id !== lab.id)
      this.recentLabs.unshift(lab)
      this.recentLabs = this.recentLabs.slice(0, 5)
    },
    
    getLabById(labId) {
      return this.labs.find(l => l.id === labId)
    },
    
    async saveLab(labId, labData) {
      try {
        // 保存到 Firebase
        await saveLab(labId, labData)
        
        // 更新本地状态
        const index = this.labs.findIndex(l => l.id === labId)
        if (index !== -1) {
          this.labs[index] = labData
          
          // 更新对应的分类列表
          if (labData.type === 'private') {
            const privateIndex = this.privateLabs.findIndex(l => l.id === labId)
            if (privateIndex !== -1) {
              this.privateLabs[privateIndex] = labData
            }
          } else {
            const publicIndex = this.publicLabs.findIndex(l => l.id === labId)
            if (publicIndex !== -1) {
              this.publicLabs[publicIndex] = labData
            }
          }
        }
        
        return labData
      } catch (error) {
        console.error('保存实验室失败:', error)
        throw error
      }
    },
    
    async loadLab(labId) {
      try {
        const lab = await loadLab(labId)
        if (lab) {
          // 如果实验室不在列表中，添加到列表
          if (!this.labs.find(l => l.id === labId)) {
            this.labs.push(lab)
            if (lab.type === 'private') {
              this.privateLabs.push(lab)
            } else {
              this.publicLabs.push(lab)
            }
            this.addToRecent(lab)
          }
          return lab
        }
        return null
      } catch (error) {
        console.error('加载实验室失败:', error)
        throw error
      }
    },
    
    async joinLab(inviteCode, userId) {
      try {
        if (!inviteCode || !userId) {
          throw new Error('邀请码和用户ID不能为空')
        }
        
        // 从所有公开实验室中查找匹配邀请码的实验室
        const targetLab = this.publicLabs.find(lab => lab.inviteCode === inviteCode)
        
        if (!targetLab) {
          throw new Error('找不到该邀请码对应的实验室')
        }
        
        // 检查是否已经是成员
        if (targetLab.members && targetLab.members.includes(userId)) {
          throw new Error('你已经是这个实验室的成员了')
        }
        
        // 将用户添加到实验室成员列表
        if (!targetLab.members) {
          targetLab.members = []
        }
        targetLab.members.push(userId)
        
        // 保存更新
        await saveLab(targetLab.id, targetLab)
        await saveUserLab(userId, targetLab.id)
        
        // 更新本地状态
        const index = this.publicLabs.findIndex(lab => lab.id === targetLab.id)
        if (index !== -1) {
          this.publicLabs[index] = targetLab
        }
        const allIndex = this.labs.findIndex(lab => lab.id === targetLab.id)
        if (allIndex !== -1) {
          this.labs[allIndex] = targetLab
        }
        
        this.addToRecent(targetLab)
        return targetLab
      } catch (error) {
        console.error('加入实验室失败:', error)
        throw error
      }
    },
    
    // 向后兼容的方法
    async createProject(projectInfo, userId) {
      return await this.createLab(projectInfo, userId)
    },
    
    async loadUserProjects(userId) {
      return await this.loadUserLabs(userId)
    },
    
    async deleteProject(projectId, userId) {
      return await this.deleteLab(projectId, userId)
    },
    
    getProjectById(projectId) {
      return this.getLabById(projectId)
    },
    
    async joinProject(inviteCode, userId) {
      return await this.joinLab(inviteCode, userId)
    }
  }
})