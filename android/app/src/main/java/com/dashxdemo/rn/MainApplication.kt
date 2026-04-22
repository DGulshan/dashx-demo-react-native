package com.dashxdemo.rn

import android.app.Application
import com.dashx.android.DashX
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // Demo-only FCM token bridge — exposes `FirebaseMessaging.deleteToken()` to
          // JS so the Unsubscribe button can force a token rotation. Not part of the
          // DashX SDK. Mirrors `ios/DashXDemoRN/FCMTokenBridge.swift`.
          add(FCMTokenBridgePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()

    // Configure DashX at process-start so the SDK is ready when FCM wakes the
    // app headlessly (`DashXFirebaseMessagingService.onMessageReceived` runs
    // before any JS is loaded, so the `DashX.configure()` call driven from
    // JS in `src/DemoState.ts` is too late to mark delivered pushes and to
    // track taps from a killed state).
    //
    // Values match `src/config.ts` on purpose — the JS "Configure DashX"
    // button re-calls this with the same args later, which is a no-op.
    // iOS solves the equivalent problem via its Notification Service
    // Extension, which carries its own copy of DASHX_* keys in its
    // Info.plist and runs as a separate process.
    DashX.configure(
      context = this,
      publicKey = "0nvA5vBRv2MiD1wJPT6y4Dw1",
      baseURI = "https://api.dashx-staging.com/graphql",
      targetEnvironment = "staging",
    )

    loadReactNative(this)
  }
}
