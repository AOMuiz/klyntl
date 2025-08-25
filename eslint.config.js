// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
        "babel-module": {
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
            assets: "./assets",
          },
        },
      },
    },
  },
]);
