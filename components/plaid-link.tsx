"use client"

import { useState, useCallback, useEffect } from "react"
import { usePlaidLink } from "react-plaid-link"
import { Button } from "@/components/ui/button"
import { createLinkToken, exchangePublicToken } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface PlaidLinkProps {
  onSuccess?: () => void
  onExit?: () => void
  buttonText?: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function PlaidLink({
  onSuccess,
  onExit,
  buttonText = "Connect a bank account",
  className,
  variant = "default",
}: PlaidLinkProps) {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fetchToken = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await createLinkToken()
      if (response.success) {
        setToken(response.link_token)
      } else {
        toast({
          title: "Error",
          description: "Failed to create link token",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching link token:", error)
      toast({
        title: "Error",
        description: "Failed to create link token",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  const onPlaidSuccess = useCallback(
    async (publicToken: string, metadata: any) => {
      setIsLoading(true)
      try {
        const response = await exchangePublicToken(publicToken, metadata)
        if (response.success) {
          toast({
            title: "Success",
            description: "Bank account connected successfully",
          })
          if (onSuccess) onSuccess()
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to connect bank account",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error exchanging public token:", error)
        toast({
          title: "Error",
          description: "Failed to connect bank account",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [onSuccess, toast],
  )

  const { open, ready } = usePlaidLink({
    token,
    onSuccess: (public_token, metadata) => {
      onPlaidSuccess(public_token, metadata)
    },
    onExit: (err, metadata) => {
      if (err) {
        console.error("Plaid Link exit error:", err)
      }
      if (onExit) onExit()
    },
  })

  const handleClick = () => {
    if (ready) {
      open()
    } else {
      toast({
        title: "Please wait",
        description: "Plaid Link is initializing",
      })
    }
  }

  return (
    <Button onClick={handleClick} disabled={!ready || isLoading} className={className} variant={variant}>
      {isLoading ? "Loading..." : buttonText}
    </Button>
  )
}
