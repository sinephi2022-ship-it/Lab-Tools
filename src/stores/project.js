import { defineStore } from 'pinia'
import { saveProject, loadProject, subscribeToProject } from '../utils/firebase'

export const useProjectStore = defineStore('project', {
  state: () => ({
    elements: [],
    connections: [],
    selectedElements: [],
    camera: {
      x: 0,
      y: 0,
      zoom: 1
    },
    isDirty: false,
    currentProjectId: null,
    projectData: null,
    unsubscribe: null
  }),
  actions: {
    async createProject(projectData) {
      try {
        const projectId = 'project_' + Date.now().toString()
        const fullProjectData = {
          id: projectId,
          ...projectData,
          elements: [],
          connections: [],
          camera: { x: 0, y: 0, zoom: 1 },
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        
        await saveProject(projectId, fullProjectData)
        this.currentProjectId = projectId
        this.projectData = fullProjectData
        this.resetProject()
        
        return projectId
      } catch (error) {
        console.error('创建项目失败:', error)
        throw error
      }
    },
    
    async loadProjectData(projectId) {
      try {
        const data = await loadProject(projectId)
        if (data) {
          this.currentProjectId = projectId
          this.projectData = data
          this.elements = data.elements || []
          this.connections = data.connections || []
          this.camera = data.camera || { x: 0, y: 0, zoom: 1 }
          this.isDirty = false
          
          // 订阅实时更新
          if (this.unsubscribe) {
            this.unsubscribe()
          }
          this.unsubscribe = subscribeToProject(projectId, (updatedData) => {
            this.elements = updatedData.elements || []
            this.connections = updatedData.connections || []
            this.camera = updatedData.camera || { x: 0, y: 0, zoom: 1 }
          })
          
          return data
        }
        return null
      } catch (error) {
        console.error('加载项目失败:', error)
        throw error
      }
    },
    
    async saveProjectData() {
      if (!this.currentProjectId || !this.projectData) return
      
      try {
        const updatedData = {
          ...this.projectData,
          elements: this.elements,
          connections: this.connections,
          camera: this.camera,
          updatedAt: Date.now()
        }
        
        await saveProject(this.currentProjectId, updatedData)
        this.projectData = updatedData
        this.isDirty = false
      } catch (error) {
        console.error('保存项目失败:', error)
        throw error
      }
    },
    
    async deleteProject(projectId) {
      try {
        // 注意：Firebase的免费版不支持删除文档，这里只是从本地移除
        // 实际生产环境需要使用Cloud Functions或Firestore规则
        if (this.currentProjectId === projectId) {
          this.currentProjectId = null
          this.projectData = null
          this.resetProject()
        }
      } catch (error) {
        console.error('删除项目失败:', error)
        throw error
      }
    },
    
    addElement(element) {
      this.elements.push(element)
      this.isDirty = true
      this.saveProjectData()
    },
    
    updateElement(id, updates) {
      const index = this.elements.findIndex(el => el.id === id)
      if (index !== -1) {
        this.elements[index] = { ...this.elements[index], ...updates }
        this.isDirty = true
        this.saveProjectData()
      }
    },
    
    removeElement(id) {
      this.elements = this.elements.filter(el => el.id !== id)
      this.connections = this.connections.filter(conn => conn.from !== id && conn.to !== id)
      this.isDirty = true
      this.saveProjectData()
    },
    
    addConnection(connection) {
      this.connections.push(connection)
      this.isDirty = true
      this.saveProjectData()
    },
    
    removeConnection(id) {
      this.connections = this.connections.filter(conn => conn.id !== id)
      this.isDirty = true
      this.saveProjectData()
    },
    
    selectElement(id, multiSelect = false) {
      if (multiSelect) {
        if (this.selectedElements.includes(id)) {
          this.selectedElements = this.selectedElements.filter(el => el !== id)
        } else {
          this.selectedElements.push(id)
        }
      } else {
        this.selectedElements = [id]
      }
    },
    
    clearSelection() {
      this.selectedElements = []
    },
    
    moveCamera(x, y, zoom) {
      this.camera.x = x
      this.camera.y = y
      this.camera.zoom = zoom
      this.isDirty = true
      this.saveProjectData()
    },
    
    resetProject() {
      this.elements = []
      this.connections = []
      this.selectedElements = []
      this.camera = { x: 0, y: 0, zoom: 1 }
      this.isDirty = false
    },
    
    // 添加缺失的方法
    setElements(elements) {
      this.elements = elements || []
      this.isDirty = true
    },
    
    setConnections(connections) {
      this.connections = connections || []
      this.isDirty = true
    },
    
    setCamera(camera) {
      this.camera = camera || { x: 0, y: 0, zoom: 1 }
      this.isDirty = true
    },
    
    clearProject() {
      this.elements = []
      this.connections = []
      this.selectedElements = []
      this.camera = { x: 0, y: 0, zoom: 1 }
      this.currentProjectId = null
      this.projectData = null
      this.isDirty = false
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }
    },
    
    // 新增：批量更新元素
    updateElements(newElements) {
      this.elements = newElements
      this.isDirty = true
    },
    
    // 新增：获取单个元素
    getElement(id) {
      return this.elements.find(el => el.id === id)
    },
    
    // 新增：更新连接
    updateConnections(newConnections) {
      this.connections = newConnections
      this.isDirty = true
    },
    
    // 新增：删除连接
    removeConnectionsByElement(elementId) {
      this.connections = this.connections.filter(
        conn => conn.from !== elementId && conn.to !== elementId
      )
      this.isDirty = true
    },
    
    cleanup() {
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }
    }
  }
})