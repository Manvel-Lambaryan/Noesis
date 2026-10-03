"use client";

import { useEffect } from "react";

function blockWheelZoom(event: WheelEvent) {
  if (event.ctrlKey) event.preventDefault();
}

function blockKeyZoom(event: KeyboardEvent) {
  const chord = event.ctrlKey || event.metaKey;
  const zoomKey = event.key === "+" || event.key === "-" || event.key === "=" || event.key === "0";
  if (chord && zoomKey) event.preventDefault();
}

function blockGesture(event: Event) {
  event.preventDefault();
}

export function ZoomLock() {
  useEffect(() => {
    document.addEventListener("wheel", blockWheelZoom, { passive: false });
    document.addEventListener("keydown", blockKeyZoom);
    document.addEventListener("gesturestart", blockGesture);
    return () => {
      document.removeEventListener("wheel", blockWheelZoom);
      document.removeEventListener("keydown", blockKeyZoom);
      document.removeEventListener("gesturestart", blockGesture);
    };
  }, []);

  return null;
}
