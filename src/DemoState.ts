import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeModules, type EmitterSubscription } from 'react-native';
import DashX from '@dashx/react-native';
import { DASHX_CONFIG } from './config';
import { DemoLog } from './Logger';

// Demo-only native module (see ios/DashXDemoRN/FCMTokenBridge.swift).
// Not part of the DashX SDK — exposed here so the Unsubscribe button can
// force FCM to rotate the token, to verify the subscribe/unsubscribe round
// trip against the DashX backend.
const FCMTokenBridge: { deleteToken(): Promise<void> } | undefined =
  NativeModules.FCMTokenBridge;

/**
 * Mirrors `DemoState.swift` from the iOS demo: owns the button-driven state
 * machine and every SDK call. Each handler writes ≥3 log entries (pressed →
 * calling → success/failure) and updates the flags that drive button
 * enablement in `MainView`.
 *
 * Note: the RN bridge's `identify`, `subscribe`, `unsubscribe`, and
 * `configure` are fire-and-forget (no Promise return) on the native side —
 * we flip flags optimistically on call and rely on the log stream to surface
 * problems. The native SDK itself still queues failed calls via its offline
 * event queue.
 */
export interface DemoStateApi {
  uid: string;
  setUid(next: string): void;

  isConfigured: boolean;
  isIdentitySet: boolean;
  isIdentified: boolean;
  isSubscribed: boolean;

  configureError: string | null;
  identitySetError: string | null;
  identifyError: string | null;
  subscribeError: string | null;
  unsubscribeError: string | null;

  doConfigure(): void;
  doSetIdentity(): void;
  doIdentify(): void;
  doSubscribe(): Promise<void>;
  doUnsubscribe(): Promise<void>;
  doReset(): void;
}

function redact(key: string): string {
  return key.length > 6 ? `${key.slice(0, 4)}…${key.slice(-2)}` : '***';
}

export function useDemoState(): DemoStateApi {
  const [uid, setUid] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isIdentitySet, setIsIdentitySet] = useState(false);
  const [isIdentified, setIsIdentified] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [configureError, setConfigureError] = useState<string | null>(null);
  const [identitySetError, setIdentitySetError] = useState<string | null>(null);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [unsubscribeError, setUnsubscribeError] = useState<string | null>(null);

  // --- Global listeners — set up once, torn down on unmount. Writes every
  // inbound push event to the log stream so the user can see traffic in the
  // Logs sheet, mirroring the iOS demo's `DashXAppDelegate` callback prints.
  const subsRef = useRef<EmitterSubscription[] | null>(null);
  useEffect(() => {
    const subs = [
      DashX.onPushNotificationReceived((message) => {
        console.log('[DashXDemoRN] pushNotificationReceived:', JSON.stringify(message, null, 2));
        DemoLog.log('info', `pushNotificationReceived: ${JSON.stringify(message)}`);
      }),
      DashX.onNotificationClicked(({ action, actionIdentifier }) => {
        DemoLog.log(
          'info',
          `notificationClicked: actionId=${actionIdentifier} action=${JSON.stringify(action)}`
        );
      }),
      DashX.onLinkReceived((url) => {
        DemoLog.log('info', `linkReceived: ${url}`);
      }),
    ];
    subsRef.current = subs;
    return () => {
      subs.forEach((s) => s.remove());
      subsRef.current = null;
    };
  }, []);

  const doConfigure = useCallback(() => {
    DemoLog.log('info', 'Configure pressed');
    setConfigureError(null);
    try {
      DemoLog.log(
        'info',
        `Calling DashX.configure(publicKey: ${redact(DASHX_CONFIG.publicKey)}, baseURI: ${DASHX_CONFIG.baseURI}, targetEnv: ${DASHX_CONFIG.targetEnvironment})`
      );
      DashX.configure({
        publicKey: DASHX_CONFIG.publicKey,
        baseURI: DASHX_CONFIG.baseURI,
        targetEnvironment: DASHX_CONFIG.targetEnvironment,
      });
      setIsConfigured(true);
      DemoLog.log('info', 'configure → success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setConfigureError(msg);
      DemoLog.log('error', `configure → ${msg}`);
    }
  }, []);

  const doSetIdentity = useCallback(() => {
    DemoLog.log('info', `Set Identity pressed (uid=${uid})`);
    setIdentitySetError(null);
    try {
      DashX.setIdentity(uid, null);
      setIsIdentitySet(true);
      DemoLog.log('info', 'setIdentity → success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setIdentitySetError(msg);
      DemoLog.log('error', `setIdentity → ${msg}`);
    }
  }, [uid]);

  const doIdentify = useCallback(() => {
    DemoLog.log('info', `Identify Account pressed (uid=${uid})`);
    setIdentifyError(null);
    try {
      DemoLog.log('info', `Calling DashX.identify({ uid: "${uid}" })`);
      DashX.identify({ uid });
      setIsIdentified(true);
      DemoLog.log('info', 'identify → success (fire-and-forget; watch for errors in native logs)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setIdentifyError(msg);
      DemoLog.log('error', `identify → ${msg}`);
    }
  }, [uid]);

  const doSubscribe = useCallback(async () => {
    DemoLog.log('info', 'Subscribe to Notifications pressed');
    setSubscribeError(null);

    try {
      const status = await DashX.requestNotificationPermission();
      DemoLog.log('info', `Notification permission status: ${describeStatus(status)}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      DemoLog.log('error', `requestNotificationPermission → ${msg}`);
    }

    try {
      DemoLog.log('info', 'Calling DashX.subscribe()');
      DashX.subscribe();
      setIsSubscribed(true);
      DemoLog.log('info', 'subscribe → success (fire-and-forget)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSubscribeError(msg);
      DemoLog.log('error', `subscribe → ${msg}`);
    }
  }, []);

  const doUnsubscribe = useCallback(async () => {
    DemoLog.log('info', 'Unsubscribe pressed');
    setUnsubscribeError(null);
    try {
      DemoLog.log('info', 'Calling DashX.unsubscribe()');
      DashX.unsubscribe();
      setIsSubscribed(false);
      DemoLog.log('info', 'unsubscribe → success (fire-and-forget)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setUnsubscribeError(msg);
      DemoLog.log('error', `unsubscribe → ${msg}`);
    }

    // Rotate the FCM token after unsubscribe so a follow-up subscribe
    // produces a different token — makes the round trip against the DashX
    // backend obvious in logs. Demo-only; the SDK doesn't do this itself.
    if (FCMTokenBridge) {
      try {
        DemoLog.log('info', 'Calling FCMTokenBridge.deleteToken()');
        await FCMTokenBridge.deleteToken();
        DemoLog.log('info', 'deleteToken → success (FCM will mint a fresh token on next request)');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        DemoLog.log('error', `deleteToken → ${msg}`);
      }
    }
  }, []);

  const doReset = useCallback(() => {
    DemoLog.log('info', 'Reset pressed');
    DashX.reset();
    setUid('');
    setIsConfigured(false);
    setIsIdentitySet(false);
    setIsIdentified(false);
    setIsSubscribed(false);
    setConfigureError(null);
    setIdentitySetError(null);
    setIdentifyError(null);
    setSubscribeError(null);
    setUnsubscribeError(null);
    DemoLog.log('info', 'reset → all local state cleared');
  }, []);

  return {
    uid,
    setUid,
    isConfigured,
    isIdentitySet,
    isIdentified,
    isSubscribed,
    configureError,
    identitySetError,
    identifyError,
    subscribeError,
    unsubscribeError,
    doConfigure,
    doSetIdentity,
    doIdentify,
    doSubscribe,
    doUnsubscribe,
    doReset,
  };
}

function describeStatus(status: number): string {
  switch (status) {
    case 0: return 'notDetermined';
    case 1: return 'denied';
    case 2: return 'authorized';
    case 3: return 'provisional';
    case 4: return 'ephemeral';
    default: return `unknown(${status})`;
  }
}
