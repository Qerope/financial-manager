"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { WifiOff, RefreshCw } from "lucide-react"

export default function OfflinePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if we're back online
    const handleOnline = () => {
      router.push("/dashboard")
    }

    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [router])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">You're Offline</CardTitle>
          <CardDescription>It seems you've lost your internet connection</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="bg-violet-100 dark:bg-violet-900/30 p-6 rounded-full mb-6">
            <WifiOff className="h-12 w-12 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-center text-muted-foreground mb-4">
            Don't worry! Some features are still available while you're offline. We'll automatically reconnect when your
            internet is back.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleRefresh} className="w-full" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

