<template>
  <div class="finder h-full flex flex-col">
    <div class="flex items-center justify-between gap-16px mb-16px">
      <a-input v-model:value="discover.keywords" placeholder="搜索插件" @keyup.enter="discover.searchPlugin" />
      <a-button type="primary" class="install-btn" :loading="discover.isloading" @click="discover.searchPlugin">搜索</a-button>
    </div>
    <div class="grid grid-cols-2 gap-16px">
      <plugin-list-v2  :plugins="totalPlugins" @pick="plugin => drawerContent.name = plugin.name" />
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
import request from "@/assets/request";
import Git from "@/icons/DeviconGit.vue";
import Volta from "@/icons/FluentEmojiHighVoltage.vue";
import Yalc from "@/icons/IconParkTwotoneCoordinateSystem.vue";
import Asar from "@/icons/SkillIconsElectron.vue";
import PluginDetail from "../drawers/plugin-detail.vue";
import PluginListV2 from "./plugin-list-v2.vue";

const { t } = useI18n();

const store = useStore();

const dependencies = ref([
	{
		name: "Volta",
		version: "未安装",
		isdownload: false,
    isExtra: true,
		icon: markRaw(Volta),
		description: "Volta 是一种管理 JavaScript 命令行工具的轻松方式",
		update: () => updatePackageVersion("volta"),
		install: () => window.rubick.shellOpenExternal("https://volta.sh/"),
		homePage:
			"https://github.do/https://raw.githubusercontent.com/volta-cli/volta/refs/heads/main/README.md",
	},
	{
		name: "Git",
		version: "未安装",
		isdownload: false,
		isExtra: true,
		icon: markRaw(Git),
		description:
			"Git 是一个免费的开源分布式版本控制系统，旨在处理从小型到 非常大的项目，速度和效率。",
		update: () => updatePackageVersion("git"),
		install: () =>
			window.rubick.shellOpenExternal("https://git-scm.com/downloads"),
		homePage:
			"https://github.do/https://raw.githubusercontent.com/git/git/refs/heads/master/README.md",
	},
	{
		name: "yalc",
		version: "未安装",
		isdownload: false,
		isExtra: true,
		icon: markRaw(Yalc),
		description:
			"yalc 是一个更现代化的 Npm 包调试工具, 开发者相关的功能会用到它",
		update: () => updatePackageVersion("yalc"),
		install: () => installDependencies(["yalc"]),
		homePage:
			"https://github.do/https://raw.githubusercontent.com/wclr/yalc/refs/heads/master/README.md",
	},
	{
		name: "asar",
		version: "未安装",
		isdownload: false,
		isExtra: true,
		icon: markRaw(Asar),
		description: "asar 是 Electron 的打包工具, 或许有些意想不到的用途",
		update: () => updatePackageVersion("asar"),
		install: () => installDependencies(["@electron/asar"]),
		homePage:
			"https://github.do/https://raw.githubusercontent.com/electron-userland/asar/refs/heads/master/README.md",
	},
]);

const totalPlugins = computed(() => {
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
	const result = [...dependencies.value, ...merged, ...full];
	console.log("result", result);
	if (discover.keywords) {
		return result.filter((item: any) => {
			const name = (item.name || "").toLowerCase();
			const pluginName = (item.pluginName || "").toLowerCase();
			const keywords = discover.keywords.toLowerCase();
			return name.includes(keywords) || pluginName.includes(keywords);
		});
	}
	return result;
});

const drawerContent = reactive({
	name: null,
	data: computed((): any => {
		return totalPlugins.value.find((item) => item.name === drawerContent.name);
	}),
});

const discover = reactive({
	keywords: "",
	isloading: false,
	source: computed(() => {
		const keywords = discover.keywords.trim();
		if (!keywords) return null;
		if (keywords.startsWith("http")) {
			return "url";
		}
		return "npm";
	}),
	async searchPlugin() {
		discover.isloading = true;
		const keywords = discover.keywords.trim();
		if (!keywords) {
			discover.isloading = false;
			return;
		}
		const params = {
			source: discover.source,
			name: keywords,
			url: keywords,
		};
		await request.searchPlugin(params);
		store.dispatch("init");
		discover.isloading = false;
	},
});

const startDownload = (name: string) => store.dispatch("startDownload", name);
const successDownload = (name: string) =>
	store.dispatch("successDownload", name);

const downloadPlugin = async (plugin: any) => {
	if (plugin.install) {
		plugin.install();
		return;
	}
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

async function installDependencies(name: string[]) {
	const volta = dependencies.value.find((t) => t.name === "Volta")!;
	if (!volta.isdownload) {
		message.error("Volta 未安装，请先安装 Volta");
		return;
	}
	const result = await window.rubick.installGlobalPackages(name);
	if (result) {
		message.success("安装成功");
		store.dispatch("init");
	} else {
		message.error("安装失败了，以管理员身份运行也许能解决问题");
	}
}

function afterVisibleChange(visible: boolean) {
	if (!visible) {
		drawerContent.name = null;
	}
}

function updatePackageVersion(name: string) {
	window.rubick.getPackageVersion({ name }).then((version: string) => {
		const target = dependencies.value.find(
			(item) => item.name.toLowerCase() === name.toLowerCase(),
		)!;
		target.version = version;
		target.isdownload = version !== "未安装";
	});
}

onBeforeMount(() => {
	updatePackageVersion("volta");
	updatePackageVersion("git");
	updatePackageVersion("yalc");
	updatePackageVersion("asar");
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
