import Foundation
import FirebaseMessaging
import React

/// Demo-only native module — not part of the DashX SDK. Exposes
/// `Messaging.messaging().deleteToken` to JS so the Unsubscribe button can
/// force FCM to rotate the token, which is useful for verifying the
/// subscribe/unsubscribe round trip end-to-end against the DashX backend.
@objc(FCMTokenBridge)
final class FCMTokenBridge: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc(deleteToken:rejecter:)
  func deleteToken(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Messaging.messaging().deleteToken { error in
      if let error = error {
        reject("EDELETE_FCM_TOKEN", error.localizedDescription, error)
      } else {
        resolve(nil)
      }
    }
  }
}
