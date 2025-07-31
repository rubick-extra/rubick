<template>
  <div class="finder h-full flex flex-col">
    <div class="grid grid-cols-2 gap-16px">
      <div class="bg-#99999911 rounded-lg border shadow-md hover:shadow-lg transition-shadow"
        v-for="plugin in totalPlugins" @click="drawerContent = plugin">
        <div class="p-5 flex-col h-full">
          <!-- 插件头部 - Logo和名称 -->
          <div class="flex items-start mb-4 flex-1">
            <div
              class="w-12 h-12 rounded-md overflow-hidden mr-3 bg-gray-200 flex items-center justify-center flex-shrink-0">
              <a-image :src="plugin.logo" v-if="plugin.logo" :fallback="defaultLogo" class="w-full h-full object-contain p-1" />
              <component :is="plugin.icon" class="text-24px" v-else-if="plugin.icon" />
              <img src="@/assets/logo.png" :alt="plugin.name + ' logo'" v-else class="w-full h-full object-contain p-1">
            </div>
            <div>
              <h3 class="font-semibold text-base">{{ plugin.pluginName || plugin.name }}</h3>
              <p class="text-sm text-gray-600 mb-4 line-clamp-2">{{ plugin.description }}</p>
            </div>
          </div>
          <div class="">
            <div class="flex justify-end items-end text-sm">
              <span class="font-medium">{{ plugin.isdownload ? plugin.version : '未安装' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <a-divider />
    <plugin-detail :plugin="drawerContent" @after-visible-change="afterVisibleChange" />
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeMount, ref } from "vue";
import { useStore } from "vuex";
import Git from "@/icons/DeviconGit.vue";
import Volta from "@/icons/FluentEmojiHighVoltage.vue";
import PluginDetail from "../drawers/plugin-detail.vue";

const defaultLogo = require("@/assets/logo.png");

const store = useStore();

const dependencies = ref([
	{
		name: "Volta",
		version: "未安装",
		isdownload: false,
		icon: markRaw(Volta),
		description: "Volta 是一种管理 JavaScript 命令行工具的轻松方式",
		update: updateVoltaVersion,
    homePage: 'https://raw.githubusercontent.com/volta-cli/volta/refs/heads/main/README.md'
	},
	{
		name: "Git",
		version: "未安装",
		isdownload: false,
		icon: markRaw(Git),
		description:
			"Git 是一个免费的开源分布式版本控制系统，旨在处理从小型到 非常大的项目，速度和效率。",
		update: updateGitVersion,
    homePage: 'https://raw.githubusercontent.com/git/git/refs/heads/master/README.md'
	},
]);

const totalPlugins = computed(() => {
	const full = [...store.state.totalPlugins];
	const local = [...store.state.localPlugins];
	full.sort((a, b) => {
		return a.isdownload ? -1 : 1;
	});
	const merged = local.filter((t) => {
		const exist = full.find((f) => f.name === t.name);
		if (exist) {
			exist.isdownload = true;
			Object.assign(exist, t);
		}
		t.isdownload = true;
		return !exist;
	});
	return [...dependencies.value, ...merged, ...full];
});

const drawerContent = ref(null);

function afterVisibleChange(visible: boolean) {
  if (!visible) {
    drawerContent.value = null;
  }
}


function updateVoltaVersion() {
	window.rubick.getVoltaVersion().then((version: string) => {
		const target = dependencies.value.find((item) => item.name === "Volta")!;
		target.version = version;
		target.isdownload = version !== "未安装";
	});
}

function updateGitVersion() {
	window.rubick.getGitVersion().then((version: string) => {
		const target = dependencies.value.find((item) => item.name === "Git")!;
		target.version = version;
		target.isdownload = version !== "未安装";
	});
}

onBeforeMount(() => {
	updateVoltaVersion();
	updateGitVersion();
});
</script>

<style lang="less">
.finder {
  position: relative;
  width: 100%;
  overflow-x: visible;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 0;
  }

  .ant-divider-horizontal {
    margin: 17px 0;
  }
}
</style>
