<template>
  <a-drawer width="77%" v-model:visible="drawer.visible" placement="right" :closable="false">
    <template #title v-if="plugin">
      <div class="plugin-title-info overflow-hidden">
        <div class="info">
          <a-image :src="plugin.logo" v-if="plugin.logo" :x="plugin.logo" :fallback="defaultLogo" class="plugin-icon h-12 w-12" />
          <component :is="plugin.icon" v-else-if="plugin.icon" class="plugin-icon h-12 w-12" />
          <img src="@/assets/logo.png" v-else class="plugin-icon h-12 w-12" />

          <div class="plugin-desc">
            <div class="flex-1 overflow-hidden">
              <div class="title">
                {{ plugin.pluginName || plugin.name }}
              </div>
              <div class="desc whitespace-nowrap overflow-hidden text-ellipsis w-full" :title="plugin.description">
                {{ plugin.description }}
              </div>
            </div>
            <a-button
              v-if="!plugin.isdownload"
              @click.stop="downloadPlugin(plugin)"
              shape="round"
              type="primary"
              :loading="plugin.isloading"
            >
              <template #icon>
                <CloudDownloadOutlined
                  v-show="!plugin.isloading && !plugin.isdownload"
                />
              </template>
              {{ $t('feature.market.install') }}
            </a-button>
          </div>
        </div>
      </div>
    </template>
    <a-spin :spinning="loading" tip="内容加载中..." v-if="plugin">
      <VueMarkdown v-if="content" :source="content" :options="{ html: true }" class="home-page-container"></VueMarkdown>
      <iframe v-else-if="plugin.homePage && !error" :src="plugin.homePage" frameborder="0"></iframe>
      <a-result
        class="error-content"
        v-else
        sub-title="插件主页内容走丢啦！"
      >
        <template #icon>
          <Vue3Lottie :animationData="notFountJson" :height="240" :width="240" />
        </template>
      </a-result>
    </a-spin>
  </a-drawer>
</template>

<script setup lang="ts">
import {
	CloudDownloadOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { reactive, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useStore } from "vuex";
import notFountJson from "@/assets/lottie/404.json";
import VueMarkdown from "vue-markdown-render";
import axios from "axios";

const defaultLogo = require("@/assets/logo.png");

const props = defineProps<{
	plugin: any;
}>();

const store = useStore();
const { t } = useI18n();
const content = ref("");
const loading = ref(false);
const error = ref(false);

const startDownload = (name: string) => store.dispatch("startDownload", name);
const successDownload = (name: string) =>
	store.dispatch("successDownload", name);

const drawer = reactive({
	visible: false,
	plugin: null,
	show: (plugin: any) => {
		drawer.visible = true;
		drawer.plugin = plugin;
	},
});

const downloadPlugin = async (plugin: any) => {
	startDownload(plugin.name);
	await window.market.downloadPlugin(plugin);
	message.success(
		t("feature.dev.installSuccess", { pluginName: plugin.pluginName }),
	);
	successDownload(plugin.name);
};

watchEffect(() => {
	if (props.plugin) {
		drawer.show(props.plugin);
		content.value = "";
		error.value = false;
		if (props.plugin.homePage) {
			loading.value = true;
			axios
				.get(props.plugin.homePage)
				.then((res: any) => {
					content.value = res.data;
					loading.value = false;
				})
				.catch(() => {
					loading.value = false;
					error.value = true;
				});
		} else {
			content.value = props.plugin.readme;
		}
	}
});
</script>

<style lang="less">
.dark {
  .plugin-title-info {
    .back-icon {
      filter: invert(1) brightness(200%);
    }
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
.ant-drawer-header,.ant-drawer-header-title, .ant-drawer-title {
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
  th, td {
    &:first-child {
      border-left: none;
    }
    &:last-child {
      border-right: none;
    }
  }

  // 紧凑模式
  &.table-compact {
    th, td {
      padding: 0.5rem 0.75rem;
    }
  }

  // 响应式处理
  @media (max-width: 768px) {
    display: block;
    width: 100%;
    overflow-x: auto;

    thead, tbody, th, td, tr {
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