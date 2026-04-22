package com.dashxdemo.rn

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.firebase.messaging.FirebaseMessaging

/**
 * Demo-only native module — not part of the DashX SDK. Exposes
 * [FirebaseMessaging.deleteToken] to JS so the Unsubscribe button can force
 * FCM to rotate the token, which is useful for verifying the
 * subscribe/unsubscribe round trip end-to-end against the DashX backend.
 *
 * Matches `ios/DashXDemoRN/FCMTokenBridge.swift` on the iOS side.
 */
class FCMTokenBridge(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun deleteToken(promise: Promise) {
    FirebaseMessaging.getInstance().deleteToken()
        .addOnCompleteListener { task ->
          if (task.isSuccessful) {
            promise.resolve(null)
          } else {
            val error = task.exception
            promise.reject(
                "EDELETE_FCM_TOKEN",
                error?.localizedMessage ?: "deleteToken failed",
                error
            )
          }
        }
  }

  companion object {
    const val NAME = "FCMTokenBridge"
  }
}
