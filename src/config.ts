/**
 * Equivalent of the iOS demo's `Info.plist` DASHX_* keys — hardcoded for the
 * demo so the button-driven flow just works. Swap these out for your own
 * values, or wire a build-time injector (e.g. react-native-config) if you
 * need per-environment configs.
 */
export const DASHX_CONFIG = {
  publicKey: '0nvA5vBRv2MiD1wJPT6y4Dw1',
  baseURI: 'https://api.dashx-staging.com/graphql',
  targetEnvironment: 'staging',
} as const;
