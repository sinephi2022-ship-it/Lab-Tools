<template>
  <div id="app">
    <LabWorkspace />
  </div>
</template>

<script>
import LabWorkspace from './components/LabWorkspace.vue'

export default {
  name: 'App',
  components: {
    LabWorkspace
  }
}
</script>

<style>
#app {
  width: 100vw;
  height: 100vh;
  position: relative;
}
</style>