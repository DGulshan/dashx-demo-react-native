package com.dashxdemo.rn

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

/**
 * Registers [FCMTokenBridge] with the React Native module registry so JS can
 * reach it via `NativeModules.FCMTokenBridge`. Wired up in [MainApplication]'s
 * `PackageList(...).packages.apply { add(FCMTokenBridgePackage()) }`.
 */
class FCMTokenBridgePackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
      listOf(FCMTokenBridge(reactContext))

  override fun createViewManagers(
      reactContext: ReactApplicationContext
  ): List<ViewManager<out View, out ReactShadowNode<*>>> = emptyList()
}
