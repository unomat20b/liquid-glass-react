<template>
  <LiquidGlass style="top:50%;left:50%;position:absolute;" @click="onClick">
    <div class="p-6">
      <h2>Your content here</h2>
      <p>This will have the liquid glass effect</p>
    </div>
  </LiquidGlass>
</template>

<script setup lang="ts">
import LiquidGlass from '../../vue/LiquidGlass.vue'

function onClick() {
  console.log('clicked')
}
</script>

<style>
body {
  margin: 0;
  height: 100vh;
  background-image: url('https://picsum.photos/2000/1200');
  background-size: cover;
  background-position: center;
}
</style>
