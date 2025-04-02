"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  CreditCard,
  Receipt,
  PieChart,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Plus,
  BarChart3,
  Target,
  Wallet,
} from "lucide-react"
import { MobileNav } from "@/components/mobile-nav"

export function MainLayout({ children }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false)
  }, [pathname])

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      mobileIcon: <Home className="h-6 w-6" />,
    },
    {
      title: "Accounts",
      href: "/accounts",
      icon: <CreditCard className="h-5 w-5" />,
      mobileIcon: <Wallet className="h-6 w-6" />,
    },
    {
      title: "Transactions",
      href: "/transactions",
      icon: <Receipt className="h-5 w-5" />,
      mobileIcon: <Receipt className="h-6 w-6" />,
    },
    {
      title: "Categories",
      href: "/categories",
      icon: <PieChart className="h-5 w-5" />,
      mobileIcon: <PieChart className="h-6 w-6" />,
    },
    {
      title: "Budgets",
      href: "/budgets",
      icon: <Target className="h-5 w-5" />,
      mobileIcon: <Target className="h-6 w-6" />,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <BarChart3 className="h-5 w-5" />,
      mobileIcon: <BarChart3 className="h-6 w-6" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      mobileIcon: <Settings className="h-6 w-6" />,
    },
  ]

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="rounded-full bg-violet-600 p-1">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">FinanceTracker</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex md:gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/transactions/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Link>
            </Button>
            <ModeToggle />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-auto py-2">
              <nav className="grid items-start px-2 text-sm font-medium">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-foreground ${
                      pathname === item.href
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation */}
        <MobileNav isOpen={isMobileMenuOpen} navItems={navItems} pathname={pathname} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background md:hidden">
        <div className="grid h-16 grid-cols-5 items-center">
          {navItems.slice(0, 5).map((item, index) => (
            <Link key={index} href={item.href} className="flex flex-col items-center justify-center gap-1 text-xs">
              <div
                className={`rounded-full p-1 ${
                  pathname === item.href
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                    : "text-muted-foreground"
                }`}
              >
                {item.mobileIcon}
              </div>
              <span
                className={pathname === item.href ? "text-violet-700 dark:text-violet-300" : "text-muted-foreground"}
              >
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Add Transaction Button */}
      <div className="fixed bottom-20 right-4 z-20 md:hidden">
        <Button asChild size="icon" className="h-14 w-14 rounded-full shadow-lg" variant="gradient">
          <Link href="/transactions/new">
            <Plus className="h-6 w-6" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

