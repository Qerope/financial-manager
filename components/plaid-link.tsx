"use client"

import { useState, useCallback, useEffect } from "react"
import { usePlaidLink } from "react-plaid-link"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import { createLinkToken, exchangePublicToken } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface PlaidLinkProps {
  onSuccess?: () => void
  buttonText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export default function PlaidLink({
  onSuccess,
  buttonText = "Connect Bank Account",
  variant = "gradient",
  size = "default",
  className = "",
}: PlaidLinkProps) {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const getToken = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await createLinkToken()
      setToken(response.link_token)
    } catch (error) {
      console.error("Error creating link token:", error)
      toast({
        title: "Error",
        description: "Failed to initialize bank connection. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    // We don't automatically get the token to avoid unnecessary API calls
    // The token will be fetched when the user clicks the button
  }, [])

  const onPlaidSuccess = useCallback(
    async (publicToken: string, metadata: any) => {
      setIsLoading(true)
      try {
        await exchangePublicToken({
          public_token: publicToken,
          institution_id: metadata.institution.institution_id,
          institution_name: metadata.institution.name,
          accounts: JSON.parse(metadata.accounts),
        })

        toast({
          title: "Success",
          description: "Bank account connected successfully!",
        })

        if (onSuccess) {
          onSuccess()
        }
      } catch (error) {
        console.error("Error exchanging public token:", error)
        toast({
          title: "Error",
          description: "Failed to connect bank account. Please try again.",
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
    onSuccess: onPlaidSuccess,
    onExit: (err, metadata) => {
      // User exited the Link flow
      if (err) {
        console.error("Plaid Link exit error:", err)
      }
    },
    onEvent: (eventName, metadata) => {
      // Optional: track events
      console.log("Plaid Link event:", eventName, metadata)
    },
  })

  const handleClick = useCallback(() => {
    if (token) {
      open()
    } else {
      getToken()
    }
  }, [token, open, getToken])

  useEffect(() => {
    if (token && ready) {
      open()
    }
  }, [token, ready, open])

  return (
    <Button onClick={handleClick} disabled={isLoading} variant={variant} size={size} className={className}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Plus className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  )
}
