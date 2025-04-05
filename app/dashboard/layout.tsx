import type React from "react"
import { MainLayout } from "@/components/main-layout"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}

