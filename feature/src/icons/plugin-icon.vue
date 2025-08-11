<template>
  <a-image :src="plugin.logo" v-if="plugin.logo" :x="plugin.logo" :preview="false" :fallback="defaultLogo"
    class="plugin-icon h-12 w-12" />
  <component :is="plugin.icon" v-else-if="plugin.icon" class="plugin-icon h-12 w-12" />
  <img src="@/assets/logo.png" v-else class="plugin-icon h-12 w-12" />
</template>

<script setup lang="ts">
defineProps<{
  plugin: any;
}>();

const defaultLogo = require("@/assets/logo.png");
</script>