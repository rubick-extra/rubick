import axios from "axios";

let baseURL = "https://rubick.ydys.cc";
let access_token = "";

try {
	const dbdata = window.rubick.db.get("rubick-localhost-config");
	baseURL = dbdata.data.database;
	access_token = dbdata.data.access_token;
} catch (e) {
	// ignore
}

const instance = axios.create({
	timeout: 4000,
	baseURL,
});

export default {
	async getTotalPlugins() {
		let targetPath = "plugins/total-plugins.json";
		if (access_token) {
			targetPath = `${encodeURIComponent(
				targetPath,
			)}?access_token=${access_token}&ref=master`;
		}
		const res = await instance.get(targetPath);
		console.log("total plugsin", res);
		return res.data;
	},
};
