<template>
  <div class="fixed top-2 left-1/2 -translate-x-1/2 z-50">
    <div v-if="timers && timers.length" class="bg-black/80 text-white rounded shadow flex gap-2 px-3 py-2">
      <span class="text-xs">计时提醒：</span>
      <div v-for="t in timers" :key="t.id" class="flex items-center gap-1">
        <button class="text-xs px-2 py-1 bg-red-600 rounded" @click="$emit('focus-timer', t.id)">{{ t.title || '计时器' }} · {{ formatTime(remaining(t)) }}</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GlobalTimerAlerts',
  props: { timers: { type: Array, default: () => [] } },
  methods: {
    remaining(item) {
      if (!item.isRunning) return item.duration || 0
      const elapsed = Date.now() - (item.startTime || Date.now())
      return Math.max(0, Math.ceil((item.duration*1000 - elapsed)/1000))
    },
    formatTime(sec) {
      const m = Math.floor(sec/60)
      const s = sec%60
      return `${m}:${String(s).padStart(2,'0')}`
    }
  }
}
</script>
