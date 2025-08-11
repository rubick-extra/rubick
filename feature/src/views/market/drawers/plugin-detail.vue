<template>
  <a-drawer width="77%" v-model:visible="drawer.visible" placement="right" :closable="false" class="dark:bg-#111827">
    <template #title v-if="plugin">
      <div class="plugin-title-info overflow-hidden">
        <div class="info">
          <plugin-logo :plugin="plugin" />

          <div class="plugin-desc">
            <div class="flex-1 overflow-hidden">
              <div class="title flex gap-10px">
                {{ plugin.pluginName || plugin.name }}<a-tag v-if="plugin.isdownload">{{ plugin.version }}</a-tag>
              </div>
              <div class="desc whitespace-nowrap overflow-hidden text-ellipsis w-full" :title="plugin.description">
                {{ plugin.description }}
              </div>
            </div>
            <a-button v-if="!plugin.isdownload" @click.stop="downloadPlugin(plugin)" shape="round" type="primary"
              :loading="plugin.isloading">
              <template #icon>
                <CloudDownloadOutlined v-show="!plugin.isloading && !plugin.isdownload" />
              </template>
              {{ $t('feature.market.install') }}
            </a-button>
            <a-button v-else-if="!plugin.isExtra" @click.stop="deletePlugin(plugin)" shape="round" type="primary"
              :loading="plugin.isloading">
              <template #icon>
                <DeleteOutlined v-show="!plugin.isloading && plugin.isdownload" />
              </template>
              {{ $t('feature.market.uninstall') }}
            </a-button>
          </div>
        </div>
      </div>
    </template>
    <div class="content-container wh-full relative" v-if="drawer.visible">
      <transition name="slide-fade">
        <component :is="renderComponent" :plugin="plugin" :content="content"
          :htmlContent="htmlContent" :loading="loading" class="absolute top-0 left-0 wh-full" />
      </transition>
      <div class="fixed bottom-40px right-10px flex-col gap-10px cursor-default select-none">
        <read-outlined class="text-18px bg-blue hover:bg-blue-600 text-white rounded-full p-10px flex-center"
          :class="{ 'bg-blue-600!': tab === 'readme' }" @click="tab = 'readme'" />
        <tool-outlined class="text-18px bg-blue hover:bg-blue-600 text-white rounded-full p-10px flex-center"
          :class="{ 'bg-blue-600!': tab === 'settings' }" @click="tab = 'settings'" />
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import {
	CloudDownloadOutlined,
	DeleteOutlined,
	ReadOutlined,
	ToolOutlined,
} from "@ant-design/icons-vue";
import { Tag as ATag, message } from "ant-design-vue";
import axios from "axios";
import { computed, inject, reactive, ref, toRaw, watchEffect } from "vue";
import { useStore } from "vuex";
import DrawerDetail from "../components/drawer-detail.vue";
import DrawerSetting from "../components/drawer-setting.vue";

const downloadPlugin = inject<any>("downloadPlugin");

const props = defineProps<{
	plugin: any;
}>();

const loading = ref(false);
const content = ref("");
const htmlContent = ref("");
const error = ref(false);
const tab = ref("readme");

const renderComponent = computed(() => {
	switch (tab.value) {
		case "readme":
			return DrawerDetail;
		case "settings":
			return DrawerSetting;
	}
});

const drawer = reactive({
	visible: false,
	plugin: null,
	show: (plugin: any) => {
		drawer.visible = true;
		drawer.plugin = plugin;
	},
});

watchEffect(async () => {
	if (!props.plugin) return;
	drawer.show(props.plugin);
	content.value = "";
	htmlContent.value = "";
	error.value = false;
	if (props.plugin.readme) {
		content.value = props.plugin.readme;
	} else if (props.plugin.homePage) {
		loading.value = true;
		const response = await axios.get(props.plugin.homePage).catch(() => null);
		loading.value = false;
		if (!response) {
			error.value = true;
			return;
		}
		if (response.headers["content-type"].includes("text/html")) {
			htmlContent.value = response.data;
			return;
		}
		content.value = response.data;
	}
});

const superPanelPlugins = ref(
	window.rubick.db.get("super-panel-user-plugins") || {
		data: [],
		_id: "super-panel-user-plugins",
	},
);
const store = useStore();
const updateLocalPlugin = () => store.dispatch("updateLocalPlugin");
const startUnDownload = (name: string) =>
	store.dispatch("startUnDownload", name);
const errorUnDownload = (name: string) =>
	store.dispatch("errorUnDownload", name);
const deletePlugin = async (plugin: any) => {
	startUnDownload(plugin.name);
	const timer = setTimeout(() => {
		errorUnDownload(plugin.name);
		message.error("卸载超时，请重试！");
	}, 20000);
	await window.market.deletePlugin(plugin);
	removePluginToSuperPanel({ name: plugin.name } as any);
	updateLocalPlugin();
	clearTimeout(timer);
};

const removePluginToSuperPanel = ({
	cmd,
	name,
}: {
	cmd: string;
	name: string;
}) => {
	superPanelPlugins.value.data = toRaw(superPanelPlugins.value).data.filter(
		(item: any) => {
			if (name) return item.name !== name;
			return item.cmd !== cmd;
		},
	);
	const { rev } = window.rubick.db.put(toRaw(superPanelPlugins.value));
	superPanelPlugins.value._rev = rev;
};
</script>

<style lang="less">
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.dark {
  .plugin-title-info {
    .back-icon {
      filter: invert(1) brightness(200%);
    }
  }

  .ant-drawer-content,
  .ant-drawer-header {
    background-color: #111827;
  }

  .ant-drawer-header {
    border-bottom: 1px solid #212937;
  }

  .ant-spin-blur::after {
    opacity: 0 !important;
  }
}

.plugin-title-info {
  display: flex;
  align-items: flex-start;
  width: 100%;

  .info {
    width: 100%;
    display: flex;
    align-items: flex-start;
    overflow: hidden;
    gap: 20px;

    .plugin-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
    }

    .plugin-desc {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;

      .title {
        font-size: 18px;
        font-weight: bold;
        color: var(--color-text-primary);
      }

      .desc {
        font-size: 12px;
        font-weight: normal;
        color: var(--color-text-desc);
      }
    }
  }
}

.error-content {
  &.ant-result {
    padding: 0;
  }
}

.home-page-container {
  min-height: 200px;

  * {
    color: var(--color-text-content);
  }

  img {
    max-width: 100%;
    object-fit: contain;
  }
}

.ant-drawer-header,
.ant-drawer-header-title,
.ant-drawer-title {
  width: 100%;
  flex-shrink: 0;
  overflow: hidden;
}

// 表格基础变量
@table-bg: #fff;
@table-border-color: #e5e7eb;
@table-text-color: #374151;
@table-header-bg: #f9fafb;
@table-header-text: #111827;
@table-row-hover: #f3f4f6;
@table-stripe-bg: #f9fafb;
@table-cell-padding: 0.75rem 1rem;
@table-border-radius: 0.5rem;
@table-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

// 表格基础样式
table {
  width: 100%;
  max-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: @table-bg;
  color: @table-text-color;
  border-radius: @table-border-radius;
  box-shadow: @table-shadow;
  overflow: hidden;

  // 表头样式
  thead {
    background-color: @table-header-bg;

    th {
      padding: @table-cell-padding;
      text-align: left;
      font-weight: 600;
      color: @table-header-text;
      border-bottom: 2px solid @table-border-color;
      vertical-align: middle;
    }
  }

  // 表体样式
  tbody {
    tr {
      transition: background-color 0.2s ease;

      &:last-child td {
        border-bottom: none;
      }

      // 条纹效果
      &:nth-child(even) {
        background-color: @table-stripe-bg;
      }

      // 悬停效果
      &:hover {
        background-color: @table-row-hover;
      }
    }

    td {
      padding: @table-cell-padding;
      border-bottom: 1px solid @table-border-color;
      vertical-align: middle;
      word-break: break-all;
    }
  }

  // 单元格边框处理
  th,
  td {
    &:first-child {
      border-left: none;
    }

    &:last-child {
      border-right: none;
    }
  }

  // 紧凑模式
  &.table-compact {

    th,
    td {
      padding: 0.5rem 0.75rem;
    }
  }

  // 响应式处理
  @media (max-width: 768px) {
    display: block;
    width: 100%;
    overflow-x: auto;

    thead,
    tbody,
    th,
    td,
    tr {
      display: block;
    }

    thead tr {
      position: absolute;
      top: -9999px;
      left: -9999px;
    }

    tr {
      margin-bottom: 1rem;
      border: 1px solid @table-border-color;
      border-radius: @table-border-radius;
    }

    td {
      border: none;
      position: relative;
      padding-left: 50%;
    }

    td:before {
      position: absolute;
      top: @table-cell-padding;
      left: @table-cell-padding;
      width: 45%;
      padding-right: 10px;
      white-space: nowrap;
      font-weight: 600;
      content: attr(data-label);
    }
  }
}
</style>