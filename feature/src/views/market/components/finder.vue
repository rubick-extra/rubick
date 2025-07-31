<template>
  <div class="finder h-full flex flex-col">
    <div class="grid grid-cols-2 gap-16px">
      <div class="bg-#99999911 rounded-lg border shadow-md hover:shadow-lg transition-shadow relative plugin-item"
        v-for="plugin in totalPlugins" @click="drawerContent.name = plugin.name">
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
        <vscode-icons-file-type-npm v-if="plugin.source === 'npm'" class="text-48px absolute bottom-0 left-4 opacity-10 dark:opacity-70" />
        <devicon-git v-if="plugin.source === 'url'" class="text-32px absolute bottom-4 left-6 opacity-10 dark:opacity-70" />
      </div>
    </div>
    <a-divider />
    <plugin-detail :plugin="drawerContent.data" @after-visible-change="afterVisibleChange" />
  </div>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { computed, markRaw, onBeforeMount, provide, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useStore } from "vuex";
import Git from "@/icons/DeviconGit.vue";
import DeviconGit from "@/icons/DeviconGit.vue";
import Volta from "@/icons/FluentEmojiHighVoltage.vue";
import VscodeIconsFileTypeNpm from "@/icons/VscodeIconsFileTypeNpm.vue";
import PluginDetail from "../drawers/plugin-detail.vue";

const { t } = useI18n();

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
		homePage:
			"https://raw.githubusercontent.com/volta-cli/volta/refs/heads/main/README.md",
	},
	{
		name: "Git",
		version: "未安装",
		isdownload: false,
		icon: markRaw(Git),
		description:
			"Git 是一个免费的开源分布式版本控制系统，旨在处理从小型到 非常大的项目，速度和效率。",
		update: updateGitVersion,
		homePage:
			"https://raw.githubusercontent.com/git/git/refs/heads/master/README.md",
	},
]);

const totalPlugins = computed(() => {
	console.log("render totalPlugins");
	const full = JSON.parse(JSON.stringify(store.state.totalPlugins));
	const local = JSON.parse(JSON.stringify(store.state.localPlugins));
	full.sort((a: any, b: any) => {
		return a.isdownload ? -1 : 1;
	});
	const merged = local.filter((t: any) => {
		const exist = full.find((f: any) => f.name === t.name);
		if (exist) {
			Object.assign(exist, t);
			exist.isdownload = true;
		}
		t.isdownload = true;
		return !exist;
	});
	return [...dependencies.value, ...merged, ...full];
});

const drawerContent = reactive({
	name: null,
	data: computed((): any => {
		return totalPlugins.value.find((item) => item.name === drawerContent.name);
	}),
});

const startDownload = (name: string) => store.dispatch("startDownload", name);
const successDownload = (name: string) =>
	store.dispatch("successDownload", name);

const downloadPlugin = async (plugin: any) => {
	startDownload(plugin.name);
	await window.market.downloadPlugin(plugin);
	message.success(
		t("feature.dev.installSuccess", { pluginName: plugin.pluginName }),
	);
	successDownload(plugin.name);
};

provide("downloadPlugin", downloadPlugin);
provide("startDownload", startDownload);
provide("successDownload", successDownload);

function afterVisibleChange(visible: boolean) {
	if (!visible) {
		drawerContent.name = null;
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

  .plugin-item {
    .install-btn {
      opacity: 0;
    }
    &:hover {
      .install-btn {
        opacity: 1;
      }
    }
  }
}
</style>
