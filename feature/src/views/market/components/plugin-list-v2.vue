<template>
  <div class="bg-#99999911 rounded-lg border shadow-md hover:shadow-lg transition-shadow relative plugin-item"
    v-for="plugin in plugins" @click="emit('pick', plugin)">
    <div class="p-5 flex-col h-full">
      <!-- 插件头部 - Logo和名称 -->
      <div class="flex items-start mb-4 flex-1">
        <div
          class="w-12 h-12 rounded-md overflow-hidden mr-3 bg-gray-200 flex items-center justify-center flex-shrink-0">
          <a-image :src="plugin.logo" v-if="plugin.logo" :fallback="defaultLogo" :preview="false" class="w-full h-full object-contain p-1" />
          <component :is="plugin.icon" class="text-24px" v-else-if="plugin.icon" />
          <img src="@/assets/logo.png" :alt="plugin.name + ' logo'" v-else class="w-full h-full object-contain p-1">
        </div>
        <div>
          <h3 class="font-semibold text-base dark:text-white">{{ plugin.pluginName || plugin.name }}</h3>
          <p class="text-sm text-gray-600 mb-4 line-clamp-2 dark:text-#ccc">{{ plugin.description }}</p>
        </div>
      </div>
      <div class="">
        <div class="flex justify-end items-end text-sm">
          <span class="font-medium dark:text-#ccc">{{ plugin.isdownload ? plugin.version : '' }}</span>
          <a-button type="primary" size="small" class="install-btn text-xs" @click.stop="downloadPlugin(plugin)" v-if="!plugin.isdownload" :loading="plugin.isloading">立即安装</a-button>
        </div>
      </div>
    </div>

    <ph-dev-to-logo v-if="plugin.isDev" class="text-32px absolute bottom-3 left-6 opacity-10 dark:opacity-70" />
    <vscode-icons-file-type-npm v-else-if="plugin.source === 'npm'" class="text-48px absolute bottom-0 left-4 opacity-10 dark:opacity-70" />
    <devicon-git v-else-if="plugin.source === 'url'" class="text-32px absolute bottom-4 left-6 opacity-10 dark:opacity-70" />
    <div v-else class="text-16px absolute bottom-4 left-4 opacity-30 dark:opacity-70 color-#F34F29">
      built-in
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";
import DeviconGit from "@/icons/DeviconGit.vue";
import PhDevToLogo from "@/icons/PhDevToLogo.vue";
import VscodeIconsFileTypeNpm from "@/icons/VscodeIconsFileTypeNpm.vue";

const defaultLogo = require("@/assets/logo.png");
defineProps<{
	plugins: any[];
}>();

const downloadPlugin = inject<any>("downloadPlugin");

const emit = defineEmits<(e: "pick", plugin: any) => void>();
</script>

<style lang="less">
.plugin-list-v2 {
}
</style>
