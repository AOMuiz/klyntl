module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-reanimated/plugin",
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src",
            "@/components": "./src/components",
            "@/services": "./src/services",
            "@/stores": "./src/stores",
            "@/types": "./src/types",
            "@/hooks": "./src/hooks",
            "@/constants": "./src/constants",
            "@/utils": "./src/utils",
            "@/screens": "./src/screens",
            "@/navigation": "./src/navigation",
            "assets": "./assets",
          },
        },
      ],
    ],
  };
};
