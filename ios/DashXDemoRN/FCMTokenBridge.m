#import <React/RCTBridgeModule.h>

// Legacy bridge-module surface for the Swift `FCMTokenBridge` class. Works
// under the new architecture too — RN auto-promotes legacy modules into the
// TurboModule registry when no codegen spec exists.
@interface RCT_EXTERN_MODULE(FCMTokenBridge, NSObject)

RCT_EXTERN_METHOD(deleteToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
