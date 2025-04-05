"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { MobileNav } from "@/components/mobile-nav"
import { useAuth } from "@/context/auth-context"
import { Logo } from "@/components/logo"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  PieChart,
  Target,
  Settings,
  Menu,
  LogOut,
  TrendingUp,
} from "lucide-react"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Accounts", href: "/accounts", icon: CreditCard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Categories", href: "/categories", icon: PieChart },
  { name: "Budgets", href: "/budgets", icon: Target },
  { name: "Projections", href: "/projections", icon: TrendingUp },
  { name: "Reports", href: "/reports", icon: PieChart },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { logout } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 z-50 hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <ul className="grid gap-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${
                      isActive ? "bg-accent text-accent-foreground" : "transparent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static md:hidden">
        <Button variant="outline" size="icon" onClick={toggleMobileMenu}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <Link href="/dashboard" className="ml-2">
          <Logo />
        </Link>
        <div className="ml-auto">
          <ModeToggle />
        </div>
      </header>

      {/* Mobile menu */}
      <MobileNav items={navItems} isOpen={isMobileMenuOpen} onClose={closeMobileMenu} onLogout={logout} />

      {/* Main content */}
      <main className="flex-1 md:pl-64">
        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
        <nav className="grid grid-cols-5 py-2">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center px-2 py-1 text-xs ${
              pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <LayoutDashboard className="mb-1 h-5 w-5" />
            Home
          </Link>
          <Link
            href="/accounts"
            className={`flex flex-col items-center justify-center px-2 py-1 text-xs ${
              pathname?.startsWith("/accounts") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <CreditCard className="mb-1 h-5 w-5" />
            Accounts
          </Link>
          <Link href="/transactions/new" className="flex flex-col items-center justify-center px-2 py-1 text-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-xl font-bold">+</span>
            </div>
          </Link>
          <Link
            href="/transactions"
            className={`flex flex-col items-center justify-center px-2 py-1 text-xs ${
              pathname?.startsWith("/transactions") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Receipt className="mb-1 h-5 w-5" />
            Transactions
          </Link>
          <Link
            href="/projections"
            className={`flex flex-col items-center justify-center px-2 py-1 text-xs ${
              pathname?.startsWith("/projections") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <TrendingUp className="mb-1 h-5 w-5" />
            Projections
          </Link>
        </nav>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}

