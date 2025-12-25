<template>
  <div class="p-4 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold">实验大厅（简易版）</h1>
      <div class="flex gap-2">
        <button class="px-3 py-2 bg-blue-600 text-white rounded" @click="createLab(false)">新建个人实验室</button>
        <button class="px-3 py-2 bg-green-600 text-white rounded" @click="createLab(true)">新建多人实验室</button>
      </div>
    </div>

    <div class="mb-4">
      <label class="text-sm text-gray-600">多人实验室为公开可见</label>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="lab in publicLabs" :key="lab.id" class="border rounded p-3 hover:shadow">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold">{{ lab.name }}</h2>
            <p class="text-xs text-gray-500">所有人可见 · {{ new Date(lab.createdAt).toLocaleString() }}</p>
          </div>
          <button class="px-3 py-2 bg-blue-500 text-white rounded" @click="enterLab(lab.id)">进入</button>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h3 class="font-semibold mb-2">我的实验室</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="lab in myLabs" :key="lab.id" class="border rounded p-3 hover:shadow">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-semibold">{{ lab.name }}</h2>
              <p class="text-xs text-gray-500">仅自己可见 · {{ new Date(lab.createdAt).toLocaleString() }}</p>
            </div>
            <button class="px-3 py-2 bg-blue-500 text-white rounded" @click="enterLab(lab.id)">进入</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import { useSimpleLabStore } from '../stores/simpleLab'

export default {
  name: 'SimpleLabLobby',
  setup() {
    const auth = useAuthStore()
    const simple = useSimpleLabStore()

    simple.fetchPublicLabs()
    simple.fetchMyLabs(auth.user?.uid)

    const createLab = async (isPublic) => {
      const name = prompt('实验室名称', isPublic ? '我的多人实验室' : '我的个人实验室')
      if (!name) return
      const id = await simple.createLab({ name, isPublic, owner: auth.user?.uid })
      window.location.hash = `#/simple/${id}`
    }

    const enterLab = (id) => {
      window.location.hash = `#/simple/${id}`
    }

    return {
      publicLabs: simple.publicLabs,
      myLabs: simple.myLabs,
      createLab,
      enterLab
    }
  }
}
</script>
