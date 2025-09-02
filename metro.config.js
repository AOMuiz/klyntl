const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable CSS support.
  isCSSEnabled: false,
});

// Ensure deterministic builds by configuring Metro
config.resolver = {
  ...config.resolver,
  // Add any custom resolver options if needed
};

module.exports = config;
