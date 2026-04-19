# DashXDemoRN — React Native + DashX push exerciser (iOS)

A minimal React Native app that wires every push-notification surface of the
[`@dashx/react-native`](https://github.com/dashxhq/dashx-react-native) bridge:

- APNs token forwarding + FCM token handoff
- Alert-push rendering (iOS 18.5 safe — DashX iOS 1.3.0+)
- Rich notifications (image attachments + dynamic action buttons + delivered
  tracking when the app is killed) via a Notification Service Extension target
- Deep-link and action-button tap handling via the new JS `onNotificationClicked`
  event, which surfaces a resolved `NavigationAction`
- Delivered / opened / dismissed message tracking through
  `DashXNotificationHandler`

Mirrors the SwiftUI iOS demo at `../dashx-demo-ios` one-for-one. Same button
state machine, same Logs sheet, same button copy. Android is not wired yet.

## Prerequisites

- Xcode 15+, CocoaPods, Ruby bundler
- Node ≥ 22.11.0, Yarn classic (or adjust `package.json` to your package
  manager)
- A physical iOS device (FCM push requires real APNs; Simulator can still run
  the app and exercise SDK calls but won't receive pushes)
- `../../dashx-ios` checked out as a sibling path — the Podfile points `DashX`
  at a local path so SDK iteration stays fast. Swap to the released `1.3.0`
  tag (see Podfile comments) if you're integrating in production.

## Bundle ID & Firebase

- Bundle ID: `com.dashxdemo.rn`
- `GoogleService-Info.plist` copied from `../../dashx-demo-rn/ios/` (same
  Firebase project, same FCM sender as the full-feature RN demo). No user
  action needed.

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

- `onMessageReceived` — raw APNs userInfo for delivered pushes
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

- **Android** — the `android/` directory is the stock RN scaffold with no
  DashX wiring.
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
