import { Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function Logo({ className, iconClassName, textClassName, showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <Wallet className={cn("text-violet-600 dark:text-violet-400", sizeClasses[size], iconClassName)} />
        <div className="absolute inset-0 bg-violet-600 opacity-20 blur-sm rounded-full transform scale-75" />
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight", textSizeClasses[size], textClassName)}>Finflow</span>
      )}
    </div>
  )
}

