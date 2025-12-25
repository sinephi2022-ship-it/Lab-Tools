<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded shadow w-[640px] max-w-[95vw]">
      <div class="border-b p-3 font-semibold">从文本生成 Protocol</div>
      <div class="p-3">
        <textarea v-model="value" class="w-full h-64 border rounded p-2" placeholder="粘贴任意文本，按行生成可勾选步骤。含 '|' 的行将作为表格行保留在备注中"></textarea>
      </div>
      <div class="flex justify-end gap-2 p-3 border-t">
        <button class="px-3 py-2 border rounded" @click="$emit('close')">取消</button>
        <button class="px-3 py-2 bg-blue-600 text-white rounded" @click="generate">生成</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProtocolPasteModal',
  emits: ['close','generate'],
  data() { return { value: '' } },
  methods: {
    generate() { this.$emit('generate', this.value) }
  }
}
</script>
