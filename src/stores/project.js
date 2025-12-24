import { defineStore } from 'pinia'

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
    isDirty: false
  }),
  actions: {
    addElement(element) {
      this.elements.push(element)
      this.isDirty = true
    },
    updateElement(id, updates) {
      const index = this.elements.findIndex(el => el.id === id)
      if (index !== -1) {
        this.elements[index] = { ...this.elements[index], ...updates }
        this.isDirty = true
      }
    },
    removeElement(id) {
      this.elements = this.elements.filter(el => el.id !== id)
      this.connections = this.connections.filter(conn => conn.from !== id && conn.to !== id)
      this.isDirty = true
    },
    addConnection(connection) {
      this.connections.push(connection)
      this.isDirty = true
    },
    removeConnection(id) {
      this.connections = this.connections.filter(conn => conn.id !== id)
      this.isDirty = true
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
    },
    resetProject() {
      this.elements = []
      this.connections = []
      this.selectedElements = []
      this.camera = { x: 0, y: 0, zoom: 1 }
      this.isDirty = false
    }
  }
})