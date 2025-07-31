<template>
  <a-drawer width="77%" v-model:visible="drawer.visible" placement="right" :closable="false" class="dark:bg-#111827">
    <template #title v-if="plugin">
      <div class="plugin-title-info overflow-hidden">
        <div class="info">
          <a-image :src="plugin.logo" v-if="plugin.logo" :x="plugin.logo" :preview="false" :fallback="defaultLogo" class="plugin-icon h-12 w-12" />
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
      <div v-else-if="htmlContent" v-html="htmlContent"></div>
      <a-result
        class="error-content"
        v-else-if="!loading"
        sub-title="插件主页内容走丢啦！"
      >
        <template #icon>
          <Vue3Lottie ref="lottie" :animationData="notFountJson" :height="240" :width="240" @onAnimationLoaded="onAnimationLoaded" />
        </template>
      </a-result>
      <div v-else class="w-full min-h-300px"></div>
    </a-spin>
  </a-drawer>
</template>

<script setup lang="ts">
import { CloudDownloadOutlined } from "@ant-design/icons-vue";
import axios from "axios";
import { inject, reactive, ref, watchEffect } from "vue";
import VueMarkdown from "vue-markdown-render";
import notFountJson from "@/assets/lottie/404.json";

const downloadPlugin = inject<any>("downloadPlugin");

const defaultLogo = require("@/assets/logo.png");

const props = defineProps<{
	plugin: any;
}>();

const lottie = ref<any>(null);
const content = ref("");
const htmlContent = ref("");
const loading = ref(false);
const error = ref(false);

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
	if (props.plugin.homePage) {
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
	} else {
		content.value = props.plugin.readme;
	}
});

const onAnimationLoaded = async () => {
  const isDark = document.body.classList.contains("dark");
	if (lottie.value && isDark) {
		const el = lottie.value.$el.querySelector("path");
		if (el) {
			el.setAttribute("fill", "#111827");
		}
	}
};
</script>

<style lang="less">
.dark {
  .plugin-title-info {
    .back-icon {
      filter: invert(1) brightness(200%);
    }
  }
  .ant-drawer-content, .ant-drawer-header {
    background-color: #111827;
  }
  .ant-drawer-header {
    border-bottom: 1px solid #212937;
  }
  .ant-spin-blur::after {
    opacity: 0!important;
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