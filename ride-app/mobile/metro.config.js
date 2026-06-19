const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Redirect react-native-maps to a web-safe mock on web platform
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === "web" &&
    (moduleName === "react-native-maps" ||
      moduleName.startsWith("react-native-maps/"))
  ) {
    return {
      filePath: path.resolve(__dirname, "mocks/react-native-maps.js"),
      type: "sourceFile",
    };
  }
  // Fall back to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
