import type React from "react"
import { MainLayout } from "@/components/main-layout"
import { AuthGuard } from "@/components/auth-guard"
import { PWAInstaller } from "@/app/pwa"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <PWAInstaller />
      <MainLayout>{children}</MainLayout>
    </AuthGuard>
  )
}

