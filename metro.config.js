const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// `@dashx/react-native` is installed via `link:../../dashx-react-native` so the
// dep symlinks outside this project root. Metro's default resolver doesn't
// follow symlinks across project boundaries — opt into symlink support and
// tell Metro to watch the sibling dir so edits in the SDK source hot-reload.
const dashxReactNativePath = path.resolve(__dirname, '..', '..', 'dashx-react-native');

// The SDK has its own `node_modules/react-native` + `node_modules/react` at
// DIFFERENT versions than this demo (they're dev deps for the SDK's standalone
// lint/build). When Metro follows the symlink into the SDK source it would
// otherwise pull those copies, causing "TurboModuleRegistry: 'PlatformConstants'
// could not be found" at runtime (two different react-natives loaded).
// Block them so Metro only sees this project's copies + `extraNodeModules`
// provides the redirect.
const dashxSdkNodeModules = path.join(dashxReactNativePath, 'node_modules');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [dashxReactNativePath],
  resolver: {
    unstable_enableSymlinks: true,
    blockList: [
      new RegExp(`${escapeRegex(dashxSdkNodeModules)}/react-native/.*`),
      new RegExp(`${escapeRegex(dashxSdkNodeModules)}/react/.*`),
    ],
    extraNodeModules: {
      react: path.resolve(__dirname, 'node_modules', 'react'),
      'react-native': path.resolve(__dirname, 'node_modules', 'react-native'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
