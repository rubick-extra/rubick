<template>
  <div class="system">
    <PluginList
      v-if="dev && !!dev.length"
      @downloadSuccess="downloadSuccess"
      :title="$t('feature.market.developTool')"
      :list="dev"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeMount, ref } from "vue";
import { useStore } from "vuex";
import request from "../../../assets/request/index";
import PluginList from "./plugin-list.vue";

const store = useStore();
const totalPlugins = computed(() => store.state.totalPlugins);

const data = ref([]);

onBeforeMount(async () => {
	data.value = await request.getDevDetail();
});

const dev = computed(() => {
	const defaultData = data.value || [];
	if (!defaultData.length) return [];
	return defaultData.map((plugin) => {
		let searchInfo = null;
		totalPlugins.value.forEach((t) => {
			if (t.name === plugin) {
				searchInfo = t;
			}
		});
		return searchInfo;
	});
});
</script>

<style lang="less">
.system {
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}
</style>
