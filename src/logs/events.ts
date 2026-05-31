export const EVENTS = {
  SERVICE_STARTED: "service.started",
  SESSION_LAUNCH_REQUESTED: "session.launch.requested",
  SESSION_LAUNCH_COMPLETED: "session.launch.completed",
  SESSION_LAUNCH_FAILED: "session.launch.failed",
  PROFILE_LOCK_CREATED: "profile.lock.created",
  PROFILE_LOCK_REJECTED: "profile.lock.rejected",
  PAGE_NAVIGATE_REQUESTED: "page.navigate.requested",
  PAGE_NAVIGATE_COMPLETED: "page.navigate.completed",
  PAGE_NAVIGATE_FAILED: "page.navigate.failed",
  PAGE_SNAPSHOT_COMPLETED: "page.snapshot.completed",
  PAGE_EXTRACT_COMPLETED: "page.extract.completed",
  PAGE_SCREENSHOT_COMPLETED: "page.screenshot.completed",
  DEBUG_BUNDLE_CREATED: "debug.bundle.created",
  SESSION_CLOSE_REQUESTED: "session.close.requested",
  SESSION_CLOSE_COMPLETED: "session.close.completed",
  SESSION_CLOSE_FAILED: "session.close.failed",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
