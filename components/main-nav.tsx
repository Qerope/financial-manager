"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, CreditCard, DollarSign, PieChart, BarChart3, Target, Settings, TrendingUp, Link2 } from "lucide-react"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
      icon: Home,
    },
    {
      href: "/accounts",
      label: "Accounts",
      active: pathname === "/accounts" || pathname.startsWith("/accounts/"),
      icon: CreditCard,
    },
    {
      href: "/accounts/connect",
      label: "Connect Banks",
      active: pathname === "/accounts/connect",
      icon: Link2,
    },
    {
      href: "/transactions",
      label: "Transactions",
      active: pathname === "/transactions" || pathname.startsWith("/transactions/"),
      icon: DollarSign,
    },
    {
      href: "/categories",
      label: "Categories",
      active: pathname === "/categories" || pathname.startsWith("/categories/"),
      icon: PieChart,
    },
    {
      href: "/budgets",
      label: "Budgets",
      active: pathname === "/budgets" || pathname.startsWith("/budgets/"),
      icon: BarChart3,
    },
    {
      href: "/projections",
      label: "Projections",
      active: pathname === "/projections",
      icon: TrendingUp,
    },
    {
      href: "/goals",
      label: "Goals",
      active: pathname === "/goals" || pathname.startsWith("/goals/"),
      icon: Target,
    },
    {
      href: "/settings",
      label: "Settings",
      active: pathname === "/settings",
      icon: Settings,
    },
  ]

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      {routes.map((route) => {
        const Icon = route.icon
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-primary",
              route.active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {route.label}
          </Link>
        )
      })}
    </nav>
  )
}
