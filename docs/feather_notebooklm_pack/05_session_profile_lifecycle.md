# Feather Session and Profile Lifecycle

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains how sessions and profiles are created, initialized, tracked, and cleaned up.

## Launch Call Flow
Client -> `POST /v1/sessions` -> `LaunchSessionHandler` -> `SessionManager.launch` -> `FeatherSession`.

## LaunchSessionHandler
Handles the HTTP request, parses configuration, and delegates to the `SessionManager`.

## SessionManager.launch
Orchestrates profile setup, lock acquisition, browser launch, and session registration. Calls `spawnAndConnect()`.

## FeatherSession
In-memory session object that wraps the Playwright browser, contexts, and pages.

## Profile Paths and Locks
Profiles are stored in standard filesystem locations. The persistent profile lock prevents collisions.

## Browser Launch Modes
Chromium is launched headlessly by default, but can be configured for headed modes depending on debugging needs.

## Page Registration
Initial pages need explicit lifecycle listeners attached for events like close or crash.

## Close and Cleanup
On session close, resources are released and disposable profiles are removed.

## High-Risk Invariants
- Session id exists before disposable paths are derived.
- Persistent profile lock must be acquired before Chromium launch.
- Session is added to registry only after context and listeners are ready.
- Initial pages need explicit lifecycle listeners.
- Observe cache is invalidated on page removal and navigation.
- Persistent locks are released on close.
- Disposable profiles are removed or quarantined on close.

## Known Lifecycle Risks
Risk: if persistent launch fails after ProfileLock.create() but before normal close handling, the lock can remain while the server process is alive. This is a source-level observation from the current launch flow and should be verified before changing lifecycle code.
