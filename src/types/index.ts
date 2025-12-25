export interface User {
  uid: string
  email: string
  displayName: string
  avatar?: string
}

export interface Lab {
  id: string
  name: string
  type: 'private' | 'public'
  owner: string
  members: string[]
  createdAt: Date
  updatedAt: Date
}

export interface LabItem {
  id: string
  type: 'note' | 'timer' | 'protocol' | 'file'
  name: string
  content?: any
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface NoteItem extends LabItem {
  type: 'note'
  content: string
  color: string
}

export interface TimerItem extends LabItem {
  type: 'timer'
  duration: number // 秒
  startTime?: Date
  endTime?: Date
  isRunning: boolean
  isCompleted: boolean
}

export interface ProtocolItem extends LabItem {
  type: 'protocol'
  steps: ProtocolStep[]
}

export interface ProtocolStep {
  id: string
  text: string
  checked: boolean
  notes?: string
}

export interface FileItem extends LabItem {
  type: 'file'
  url: string
  size: number
  mimeType: string
}