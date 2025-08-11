<template>
  <div class="drawer-setting wh-full">
    <div class="flex justify-between mb-16px">
      <span>启用调试</span>
      <a-switch v-model:checked="plugin.enableDevelopment" @change="handleDevelopmentChange" :loading="developmentLoading" />
    </div>
    <div class="feature-container">
      <template :key="index" v-for="(item, index) in plugin.features">
        <div class="desc-item mb-16px" v-if="item.cmds.filter((cmd: any) => !cmd.label).length > 0">
          <div>{{ item.explain }}</div>
          <div class="flex gap-2 mt-2">
            <template :key="cmd" v-for="cmd in item.cmds">
              <a-dropdown v-if="!cmd.label" :class="{ executable: !cmd.label }">
                <template #overlay>
                <a-menu @click="({ key }: { key: string }) => handleMenuClick(key, item, cmd)">
                  <a-menu-item key="open">
                    <CaretRightOutlined />
                    运行
                  </a-menu-item>
                  <a-menu-item v-if="!hasAdded(cmd)" key="add">
                    <PushpinOutlined />
                    固定到超级面板
                  </a-menu-item>
                  <a-menu-item v-else key="remove">
                    <PushpinFilled />
                    从超级面板中取消固定
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button size="small" class="keyword-tag">
                {{ cmd.label || cmd }}
                <DownOutlined />
              </a-button>
              </a-dropdown>
            </template>
          </div>
        </div>
      </template>
    </div>
    <div class="h-40px"></div>
  </div>
</template>

<script setup lang="ts">
import {
	CaretRightOutlined,
	DownOutlined,
	PushpinFilled,
	PushpinOutlined,
} from "@ant-design/icons-vue";
import { ref, toRaw } from "vue";

const remote = window.require("@electron/remote");

const props = defineProps<{
	plugin: any;
	content: string;
	htmlContent: string;
	loading: boolean;
}>();

const superPanelPlugins = ref(
	window.rubick.db.get("super-panel-user-plugins") || {
		data: [],
		_id: "super-panel-user-plugins",
	},
);

const handleMenuClick = (key: string, item: any, cmd: any) => {
	if (key === "open") {
		openPlugin({
			code: item.code,
			cmd,
		});
	} else if (key === "add") {
		addCmdToSuperPanel({ cmd, code: item.code });
	} else {
		removePluginToSuperPanel({ cmd, name: item.name });
	}
};

const addCmdToSuperPanel = ({ cmd, code }: { cmd: any; code: string }) => {
	const plugin = {
		...toRaw(props.plugin),
		cmd,
		ext: {
			code,
			type: "text",
			payload: null,
		},
	};
	superPanelPlugins.value.data.push(plugin);
	const { rev } = window.rubick.db.put(
		JSON.parse(JSON.stringify(superPanelPlugins.value)),
	);
	superPanelPlugins.value._rev = rev;
};

const removePluginToSuperPanel = ({
	cmd,
	name,
}: {
	cmd: any;
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

const openPlugin = ({ cmd, code }: { cmd: any; code: string }) => {
	window.rubick.openPlugin(
		JSON.parse(
			JSON.stringify({
				...props.plugin,
				cmd,
				ext: {
					code,
					type: "text",
					payload: null,
				},
			}),
		),
	);
};

const hasAdded = (cmd: any) => {
	let added = false;
	superPanelPlugins.value.data.some((item: any) => {
		if (item.cmd === cmd) {
			added = true;
			return true;
		}
		return false;
	});
	return added;
};

const developmentLoading = ref(false);
const handleDevelopmentChange = (checked: boolean) => {
	developmentLoading.value = true;
  const plugin = {
    ...props.plugin,
    enableDevelopment: checked,
  }
  remote.getGlobal("LOCAL_PLUGINS").updatePlugin(plugin);
  developmentLoading.value = false;
};
</script>

<style scoped lang="less">
.drawer-setting {

}
</style>
