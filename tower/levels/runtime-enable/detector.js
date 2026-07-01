// tower/levels/runtime-enable/detector.js
//
// VENDORED — see ./VENDORED.md for provenance + license (MIT). Do not "clean up" the probe body
// without re-reading that file; the getter/counter shape is the load-bearing measurement.
//
// Source: github.com/rebrowser/rebrowser-bot-detector  index.js @ e1a25b1  ·  runtimeEnableLeakInit()
//
// This script runs in the MEASURED browser (the agentic tool under test), NOT in Tower. Tower never
// attaches CDP/Playwright to this browser — the verdict is computed HERE, in-page, because only the
// client can see the Runtime.enable side channel, and is self-reported to the same-origin nonce sink
// (POST /sink/:nonce). That is the no-attach invariant.
//
// How the probe works: CDP `Runtime.enable` makes the browser eagerly serialize the arguments of
// console.* calls out-of-page. Serializing an Error reads its `.stack`. We hand console.debug an
// Error whose `stack` is an accessor whose getter increments a counter when read. If the counter
// moved, some out-of-page consumer (CDP with Runtime.enable — i.e. an automation driver) read the
// stack. A plain human tab has no such consumer, so the counter stays 0.

(function () {
  "use strict";

  var PROBE_VERSION = "runtimeEnableLeak@e1a25b1"; // upstream commit this probe was vendored from
  var SETTLE_MS = 2500; // re-probe window — catch a LATE Runtime.enable, not only one present at load

  window.runtimeEnableLeakVars = { stackLookupCount: 0 };

  function probe() {
    var e = new Error();
    Object.defineProperty(e, "stack", {
      configurable: true,
      enumerable: false,
      get: function () {
        window.runtimeEnableLeakVars.stackLookupCount += 1;
        return "";
      },
    });
    // If Runtime.enable is on, CDP serializes this arg out-of-page → fires the getter above.
    console.debug(e);
  }

  function report() {
    var count = window.runtimeEnableLeakVars.stackLookupCount;

    // count  > 0  → the stack getter fired → Runtime.enable leaked → tool detected → 'blocked'.
    // count === 0 → 'ok' FOR NOW.
    //   NOTE (calibration): the V8 May-2025 getter-guard may have killed this classic side channel,
    //   in which case a LEAKING browser-use 0.13.1 would also read 0 — a false 'ok'. The live
    //   CALIBRATION GATE (see VENDORED.md) decides empirically whether count===0 on the target
    //   Chromium is a trustworthy 'ok' or must instead be reported as 'gated' (uncertain). Until
    //   calibration proves the probe still fires, count===0 maps to 'ok' here.
    var verdict = count > 0 ? "blocked" : "ok";

    var nonce = new URLSearchParams(location.search).get("nonce");
    var report = {
      nonce: nonce,
      detectorId: "runtimeEnableLeak",
      verdict: verdict,
      // Keep detail TINY — both fetch(keepalive) and sendBeacon cap at 64 KiB.
      detail: { stackLookupCount: count, settleMs: SETTLE_MS, probeVersion: PROBE_VERSION },
    };

    // Primary: awaited POST; keepalive lets it outlive a navigation during the drive.
    fetch("/sink/" + nonce, {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(report),
    }).catch(function () {});

    // Backup: flush the SAME report on page hide. sendBeacon posts text/plain; the sink's text/plain
    // parser JSON.parses it, so the beacon is interchangeable with the fetch (whichever lands first
    // wins on the single-use nonce; the other 409s).
    addEventListener("pagehide", function () {
      navigator.sendBeacon("/sink/" + nonce, JSON.stringify(report));
    });
  }

  // Probe immediately, then every 100ms across the settle window, then finalize + report once.
  probe();
  var iv = setInterval(probe, 100);
  setTimeout(function () {
    clearInterval(iv);
    report();
  }, SETTLE_MS);
})();
