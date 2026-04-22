# DashXDemoRN — React Native + DashX push exerciser (iOS + Android)

A minimal React Native app that wires every push-notification surface of the
[`@dashx/react-native`](https://github.com/dashxhq/dashx-react-native) bridge
on both platforms:

- APNs token forwarding + FCM token handoff (iOS)
- FCM token registration via the auto-registered `DashXFirebaseMessagingService`
  (Android)
- Alert-push rendering (iOS 18.5 safe — DashX iOS 1.3.0+)
- Rich notifications (image attachments + dynamic action buttons + delivered
  tracking when the app is killed) via a Notification Service Extension target
  (iOS); equivalent handled in-process by the SDK on Android
- Deep-link and action-button tap handling via the new JS `onNotificationClicked`
  event, which surfaces a resolved `NavigationAction`
- Delivered / opened / dismissed message tracking through
  `DashXNotificationHandler` (iOS) / `DashXFirebaseMessagingService` (Android)

Mirrors the SwiftUI iOS demo at `../dashx-demo-ios` one-for-one. Same button
state machine, same Logs sheet, same button copy. Shared JS (`App.tsx`, `src/`)
drives both platforms — the only per-platform bits are the native
scaffolding under `ios/` and `android/`.

## Prerequisites

- Node ≥ 22.11.0, Yarn classic (or adjust `package.json` to your package
  manager)
- **iOS**: Xcode 15+, CocoaPods, Ruby bundler
- **Android**: JDK 17+, Android Studio (or plain `sdkmanager` + emulator)
- A physical device for push testing (FCM requires real APNs / real FCM;
  simulators can still exercise SDK calls but won't receive pushes)
- `../../dashx-ios` checked out as a sibling path — the Podfile points `DashX`
  at a local path so SDK iteration stays fast. Swap to the released tag (see
  Podfile comments) if you're integrating in production.

## Bundle / package ID & Firebase

- **iOS bundle ID**: `com.dashxdemo.rn`
- **Android package ID**: `com.dashxdemo.rn`
- Both targets are expected to live under the **same Firebase project**. The
  two config files — `ios/DashXDemoRN/GoogleService-Info.plist` and
  `android/app/google-services.json` — are **gitignored**; each contributor
  drops in their own (see the iOS and Android setup sections below). The
  `com.google.gms.google-services` gradle plugin is already wired in
  `android/build.gradle` + `android/app/build.gradle`.

## Android setup

1. In the [Firebase console](https://console.firebase.google.com), open the
   same project that owns the iOS credentials (see the `PROJECT_ID` in
   `ios/DashXDemoRN/GoogleService-Info.plist`). **Add app → Android**, package
   name `com.dashxdemo.rn`.
2. Download the generated `google-services.json` and drop it at
   `android/app/google-services.json`. The google-services gradle plugin
   picks it up at build time and initializes `FirebaseApp` via the
   auto-init content provider — no explicit `FirebaseApp.initializeApp(...)`
   call in `MainApplication.kt` needed.
3. `yarn install && yarn android`. The RN autolinker resolves
   `@dashx/react-native`, which transitively pulls in
   `com.dashx:dashx-android` and `firebase-messaging-ktx`. The
   `DashXFirebaseMessagingService` registers itself via manifest merger
   to handle delivered / clicked / dismissed events — no wiring needed in
   `MainApplication`.

**Notification permission** on Android 13+ is handled by the shared JS —
`DashX.requestNotificationPermission()` prompts for `POST_NOTIFICATIONS` on
the first `Subscribe` tap, same as iOS. On API ≤ 32 it's auto-granted.

## iOS setup

1. In the [Firebase console](https://console.firebase.google.com), open the
   same project you used for Android (or create a new one). **Add app → iOS**,
   bundle ID `com.dashxdemo.rn`.
2. Download the generated `GoogleService-Info.plist` and drop it at
   `ios/DashXDemoRN/GoogleService-Info.plist`. It's already wired into the
   Xcode project's Copy Bundle Resources phase via the RN template — you
   just need the file present for the build to succeed and for FCM to
   initialize.
3. Enable the **Push Notifications** and **Background modes → Remote
   notifications** capabilities on the `DashXDemoRN` target in Xcode if
   they aren't already, and upload your APNs auth key (`.p8`) to the
   Firebase console under **Project Settings → Cloud Messaging**.

## Setup

```bash
cd /Users/gulshan/Work/dashx-demo-apps/dashx-demo-react-native
yarn install
(cd ios && bundle install && bundle exec pod install)
```

Open `ios/DashXDemoRN.xcworkspace` in Xcode, select a simulator or a real
device, and ⌘R. Metro will boot from `yarn start` (or the default RN
autostart).

## What the UI does

Same state machine as the iOS demo:

| Button | Enabled when | On success |
|---|---|---|
| Configure DashX | always | `isConfigured = true` |
| User UID (input) | `isConfigured` | n/a |
| Set DashX Identity | `isConfigured && uid.length > 0` | `isIdentitySet = true` |
| Identify Account | `isConfigured && uid.length > 0` | `isIdentified = true` |
| Subscribe to Notifications | `isIdentitySet && isIdentified && !isSubscribed` | `isSubscribed = true` |
| Unsubscribe | `isSubscribed` | `isSubscribed = false` |
| Reset | always | all flags → false, `uid = ""`, `DashX.reset()` |

The **Logs** button opens a full-screen modal tailing every SDK call,
permission-status response, and inbound push event. It listens on:

- `onPushNotificationReceived` — raw APNs userInfo for delivered pushes
- `onNotificationClicked` — resolved `NavigationAction` + `actionIdentifier`
  when the user taps a notification or action button
- `onLinkReceived` — URL passed to `DashX.linkHandler` / `processURL`

## Notification Service Extension target

`ios/DashXDemoRNNotificationService/` is a second Xcode target that ships a
`DashXNotificationService` subclass. It runs in its own process
before iOS displays each notification and handles:

- Image attachments from `dashx.image`
- Dynamic action-button categories (`UNNotificationCategory` registered with a
  SHA-256-hashed identifier that matches what the backend stamps in `aps.category`)
- Default-sound fallback when the payload doesn't specify one
- Delivered tracking via a `trackMessage(status: DELIVERED)` GraphQL call,
  which fires even when the host app is killed

Bundle ID: `com.dashxdemo.rn.NotificationService`. Its `Info.plist` carries
the same `DASHX_BASE_URI` / `DASHX_PUBLIC_KEY` / `DASHX_TARGET_ENVIRONMENT`
keys as the main app (the NSE runs in a separate process and cannot read the
host app's bundle).

The NSE is an iOS-side concern — it applies identically to RN and native
iOS apps, and requires no RN-side (JS) changes.

## What's _not_ wired

- **Production error surfacing** — the RN bridge's `configure`, `identify`,
  `subscribe`, `unsubscribe` are currently fire-and-forget (no Promise
  returns). The demo flips flags optimistically on call and relies on the
  logs stream to surface problems.

## File layout

```
DashXDemoRN/
├── App.tsx                          SafeAreaProvider + MainView wrapper
├── src/
│   ├── config.ts                    DASHX public key + base URI + env
│   ├── DemoState.ts                 useDemoState() hook with every SDK call
│   ├── Logger.ts                    bounded log store + useLogEntries()
│   ├── LogsView.tsx                 Modal log viewer with Clear
│   └── MainView.tsx                 button stack + inline errors
├── ios/
│   ├── DashXDemoRN/
│   │   ├── AppDelegate.swift        DashXNotificationHandler wiring + Firebase
│   │   ├── DashXDemoRN.entitlements aps-environment = development
│   │   ├── GoogleService-Info.plist Firebase project config
│   │   └── Info.plist               DASHX_* keys + UIBackgroundModes + FirebaseAppDelegateProxyEnabled
│   ├── DashXDemoRNNotificationService/
│   │   ├── NotificationService.swift  final class : DashXNotificationService {}
│   │   └── Info.plist               NSExtension manifest + DASHX_* keys
│   └── Podfile                      pod 'DashX/SDK' + pod 'DashX/NotificationServiceExtension' (NSE target)
├── android/
│   ├── build.gradle                  google-services classpath
│   └── app/
│       ├── build.gradle              apply com.google.gms.google-services, namespace com.dashxdemo.rn
│       ├── google-services.json      ← YOU provide this (see Android setup)
│       └── src/main/
│           ├── AndroidManifest.xml   POST_NOTIFICATIONS permission
│           └── java/com/dashxdemo/rn/
│               ├── MainActivity.kt
│               ├── MainApplication.kt   registers FCMTokenBridgePackage
│               ├── FCMTokenBridge.kt    deleteToken() → FirebaseMessaging
│               └── FCMTokenBridgePackage.kt
└── package.json                     '@dashx/react-native': 'link:../../dashx-react-native'
```

## Iterating on the SDK

The Podfile uses a local path for `DashX/SDK`, and `package.json` uses
`link:../../dashx-react-native` for the RN bridge. Any change in either
upstream source is picked up on the next build — no republish needed. To
pin to the released 1.3.0 tag:

```ruby
# ios/Podfile — swap the local-path line for:
pod 'DashX/SDK', :git => 'https://github.com/dashxhq/dashx-ios.git', :tag => '1.3.0'
```

```json
// package.json — swap the link: line for:
"@dashx/react-native": "^1.3.0"
```

then `rm -rf ios/Pods ios/Podfile.lock node_modules && yarn install && cd ios && bundle exec pod install`.

## Caveats

- **Bundle-ID clash**: `com.dashxdemo.rn` is shared with the full-feature
  `dashx-demo-rn` RN app, so both can't be installed side-by-side on the
  same device/simulator.
- **Simulator push**: use `xcrun simctl push <device> com.dashxdemo.rn <payload.apns>`
  or drag an `.apns` file onto the simulator window. Real FCM round-trips
  require a physical device.
