"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, X } from "lucide-react"
import { Logo } from "./logo"

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      // Show the install prompt after a delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    })

    // Hide the prompt if the app is installed
    window.addEventListener("appinstalled", () => {
      setShowPrompt(false)
      setIsInstalled(true)
    })
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    // We no longer need the prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleClose = () => {
    setShowPrompt(false)
    // Don't show again for this session
    localStorage.setItem("pwa-prompt-dismissed", "true")
  }

  // Don't show if already installed, dismissed, or not eligible
  if (isInstalled || !showPrompt || (localStorage.getItem("pwa-prompt-dismissed") === "true" && !isIOS)) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe">
      <Card className="shadow-lg border-violet-200 dark:border-violet-800/30 animate-fade-in">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Logo />
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <CardTitle className="text-lg mt-2">Install Finflow</CardTitle>
          <CardDescription>
            {isIOS
              ? "Add to Home Screen for the best experience"
              : "Install our app for faster access and offline features"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          {isIOS ? (
            <div className="text-sm text-muted-foreground">
              <p>
                Tap{" "}
                <span className="inline-flex items-center">
                  <svg className="h-4 w-4 mx-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 12h8M12 8v8" />
                  </svg>
                </span>{" "}
                then &quot;Add to Home Screen&quot;
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Install Finflow on your device for quick access to your finances, even offline.
            </p>
          )}
        </CardContent>
        <CardFooter>
          {!isIOS && (
            <Button onClick={handleInstallClick} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Install App
            </Button>
          )}
          {isIOS && (
            <Button variant="outline" onClick={handleClose} className="w-full">
              Got it
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

