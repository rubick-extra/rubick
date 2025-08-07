import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHashHistory } from "vue-router";

const routes: Array<RouteRecordRaw> = [
	{
		path: "/result",
		name: "result",
		component: () => import("../views/market/components/result.vue"),
	},
	{
		path: "/devPlugin",
		name: "devPlugin",
		component: () => import("../views/market/components/devlopment.vue"),
	},
	{
		path: "/finder",
		name: "finder",
		component: () => import("../views/market/components/finder.vue"),
	},
	{
		path: "/installed",
		name: "installed",
		component: () => import("../views/installed/index.vue"),
	},
	{
		path: "/account",
		name: "account",
		component: () => import("../views/account/index.vue"),
	},
	{
		path: "/settings",
		name: "settings",
		component: () => import("../views/settings/user.vue"),
	},
	{
		path: "/dev",
		name: "dev",
		component: () => import("../views/dev/index.vue"),
	},
	{
		path: "/:catchAll(.*)",
		name: "finder",
		component: () => import("../views/market/components/finder.vue"),
	},
];

const router = createRouter({
	history: createWebHashHistory(),
	routes,
});

export default router;
