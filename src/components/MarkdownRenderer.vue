<template>
  <div class="markdown-renderer" v-html="html"></div>
</template>

<script>
import MarkdownIt from 'markdown-it'
import mk from 'markdown-it-katex'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
}).use(mk)

export default {
  name: 'MarkdownRenderer',
  props: { text: { type: String, default: '' } },
  computed: {
    html() { return md.render(this.text || '') }
  }
}
</script>

<style scoped>
.markdown-renderer {
  font-size: 12px;
  color: #374151;
}
.markdown-renderer table {
  width: 100%;
  border-collapse: collapse;
  margin: 6px 0;
}
.markdown-renderer th, .markdown-renderer td {
  border: 1px solid #e5e7eb;
  padding: 4px 6px;
}
.markdown-renderer code {
  background: #f3f4f6;
  padding: 0 3px;
  border-radius: 3px;
}
</style>
