module.exports = (api) => {
	api.cache(true);

	return {
		presets: ["babel-preset-expo"],

		// other config
		plugins: [
			// other plugins
			["react-native-unistyles/plugin"],
		],
	};
};
