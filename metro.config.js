// Learn more: https://docs.expo.dev/guides/customizing-metro/
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web only: React Native Firebase creates Auth without persistence on web, so a
// page reload would sign the user out. Swap its internal Firebase JS SDK auth
// module for ours, which adds browser persistence (see the file for details).
const RNFB_WEB_AUTH_MODULE = '@react-native-firebase/app/dist/module/internal/web/firebaseAuth';
const WEB_AUTH_WITH_PERSISTENCE = path.resolve(__dirname, 'src/services/firebase/webAuthPersistence.ts');

const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === RNFB_WEB_AUTH_MODULE) {
    return { type: 'sourceFile', filePath: WEB_AUTH_WITH_PERSISTENCE };
  }
  return (upstreamResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
