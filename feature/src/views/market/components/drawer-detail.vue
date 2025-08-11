<template>
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
    <div class="h-40px"></div>
  </a-spin>
</template>

<script setup lang="ts">
import { ref } from "vue";
import VueMarkdown from "vue-markdown-render";
import notFountJson from "@/assets/lottie/404.json";

defineProps<{
	plugin: any;
	content: string;
	htmlContent: string;
	loading: boolean;
}>();

const lottie = ref<any>(null);

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

<style scoped lang="less">
.drawer-detail {
}
</style>
