// Under the CocoaPods binary distribution, `DashX/NotificationServiceExtension`
// ships as a prebuilt xcframework whose module is named
// `DashXNotificationServiceExtension`. Same module name applies under SPM.
import DashXNotificationServiceExtension

/// Subclasses `DashXNotificationService` to opt into DashX 1.3.0+
/// rich-push handling before iOS displays the banner:
///
/// - Image attachments from `dashx.image`.
/// - Dynamic action buttons: registers a `UNNotificationCategory` matching
///   the hash the backend stamps into `aps.category`.
/// - Delivered tracking: fires a `trackMessage(status: DELIVERED)` GraphQL
///   mutation even when the host app isn't running — requires this target's
///   Info.plist to carry the same `DASHX_BASE_URI` / `DASHX_PUBLIC_KEY` keys
///   as the main app.
final class NotificationService: DashXNotificationService {}
