import UIKit
import UserNotifications
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import DashX
import DashXReactNative
import FirebaseCore
import FirebaseMessaging

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Firebase first — must be before anything that reads a FirebaseApp.
    FirebaseApp.configure()
    Messaging.messaging().delegate = self
    UNUserNotificationCenter.current().delegate = self
    application.registerForRemoteNotifications()
    print("[DashXDemoRN] AppDelegate.didFinishLaunching — Firebase configured, APNs registered")

    DashXLog.setLogLevel(to: .debug)

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "DashXDemoRN",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // MARK: - APNs / FCM

  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    DashXNotificationHandler.handleDeviceToken(deviceToken)
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: any Error
  ) {
    // Fires if APNs registration itself failed — without this, a silent
    // failure means DashX gets a stale FCM token that always 410s.
    print("[DashXDemoRN] APNs registration failed: \(error)")
  }

  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    DashXNotificationHandler.handleRemoteNotification(
      userInfo: userInfo,
      completionHandler: completionHandler
    )
  }

  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    guard let token = fcmToken else { return }
    print("[DashXDemoRN] didReceiveRegistrationToken (len=\(token.count)). Forwarding to DashX.")
    DashX.setFCMToken(to: token)
  }

  // MARK: - UNUserNotificationCenterDelegate

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    DashXNotificationHandler.handleForegroundNotification(
      notification,
      completionHandler: completionHandler
    )
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    _ = DashXNotificationHandler.handleNotificationResponse(response)
    completionHandler()
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
