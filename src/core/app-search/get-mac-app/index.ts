import app2png from "./app2png";
import getApps from "./getApps";

export default {
	getApps: () => {
		return new Promise((resolve, reject) => getApps(resolve, reject));
	},
	isInstalled: (appName) => {
		return new Promise((resolve, reject) => getApps(resolve, reject, appName));
	},
	app2png,
};
