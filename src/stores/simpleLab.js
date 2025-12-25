import { defineStore } from 'pinia'
import { db, storage } from '../utils/firebase'
import { doc, setDoc, getDoc, collection, addDoc, updateDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

export const useSimpleLabStore = defineStore('simpleLab', {
  state: () => ({
    publicLabs: [],
    myLabs: [],
    currentLab: null,
    items: [],
    _itemRefs: {}
  }),
  actions: {
    async createLab({ name, isPublic, owner }) {
      const labId = Math.random().toString(36).slice(2)
      const labDoc = { id: labId, name, isPublic: !!isPublic, owner, createdAt: new Date().toISOString() }
      await setDoc(doc(db, 'labs_simple', labId), { ...labDoc, items: [] })
      return labId
    },
    async fetchPublicLabs() {
      const q = query(collection(db, 'labs_simple'), where('isPublic', '==', true))
      const snap = await getDocs(q)
      this.publicLabs = snap.docs.map(d => d.data())
    },
    async fetchMyLabs(uid) {
      if (!uid) return
      const q = query(collection(db, 'labs_simple'), where('owner', '==', uid))
      const snap = await getDocs(q)
      this.myLabs = snap.docs.map(d => d.data())
    },
    async loadLab(id) {
      const d = await getDoc(doc(db, 'labs_simple', id))
      if (!d.exists()) return
      this.currentLab = d.data()
      this.items = this.currentLab.items || []
      // 订阅
      onSnapshot(doc(db, 'labs_simple', id), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          this.currentLab = data
          this.items = data.items || []
        }
      })
    },
    async save() {
      if (!this.currentLab?.id) return
      await updateDoc(doc(db, 'labs_simple', this.currentLab.id), { items: this.items, updatedAt: new Date().toISOString() })
    },
    async addItem(item) {
      const entity = { id: Math.random().toString(36).slice(2), createdAt: new Date().toISOString(), ...item }
      this.items.push(entity)
      await this.save()
      return entity
    },
    async updateItem(item) {
      const idx = this.items.findIndex(i => i.id === item.id)
      if (idx >= 0) {
        this.items[idx] = { ...item }
        await this.save()
      }
    },
    async removeItem(id) {
      this.items = this.items.filter(i => i.id !== id)
      await this.save()
    },
    async uploadFile(file) {
      const key = `labs_simple/${this.currentLab?.id || 'unknown'}/${Date.now()}_${file.name}`
      const r = storageRef(storage, key)
      await uploadBytes(r, file)
      const url = await getDownloadURL(r)
      return { url, key }
    },
    setItemRef(id, el) { if (el) this._itemRefs[id] = el },
    scrollIntoView(id) { const el = this._itemRefs[id]; if (el) el.scrollIntoView({ behavior:'smooth', block:'center' }) },
    async exportReport() {
      // 简易导出为 Markdown
      const lines = []
      lines.push(`# 报告 - ${this.currentLab?.name || ''}`)
      lines.push('')
      const byType = (t) => this.items.filter(i => i.type===t)
      // 计时器
      lines.push('## 计时器')
      for (const t of byType('timer')) {
        lines.push(`- ${t.title || '计时器'}：${t.isRunning ? '进行中' : '结束'} · 剩余 ${this._formatSec(this._remaining(t))}`)
      }
      // 便签
      lines.push('\n## 便签')
      for (const n of byType('note')) { lines.push(`- ${n.title || '便签'}\n\n${n.content || ''}\n`) }
      // Protocol
      lines.push('\n## Protocol')
      for (const p of byType('protocol')) {
        lines.push(`- ${p.title || 'Protocol'}`)
        for (const s of (p.steps||[])) { lines.push(`  - [${s.done?'x':' '}] ${s.text}${s.note?` （备注：${s.note}）`:''}`) }
      }
      // 文件
      lines.push('\n## 文件 & 图片')
      for (const f of byType('file')) { lines.push(`- 文件：${f.title} (${f.mimeType}) - ${f.url}`) }
      for (const img of byType('image')) { lines.push(`- 图片：${img.title} - ${img.url}`) }
      const content = lines.join('\n')
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${this.currentLab?.name || '报告'}.md`
      a.click()
    },
    _remaining(item) { if (!item.isRunning) return item.duration||0; const elapsed = Date.now()-(item.startTime||Date.now()); return Math.max(0, Math.ceil((item.duration*1000-elapsed)/1000)) },
    _formatSec(sec) { const m = Math.floor(sec/60); const s = sec%60; return `${m}:${String(s).padStart(2,'0')}` }
  }
})
