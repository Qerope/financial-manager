"use client"

import { useEffect } from "react"

export function PWAInstaller() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && window.workbox !== undefined) {
      // Register service worker
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js")
      }
    }
  }, [])

  return null
}

