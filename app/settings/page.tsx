"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, User, Mail, Lock, DollarSign, Bell, Moon, LogOut } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    currency: user?.currency || "USD",
  })
  const [preferencesData, setPreferencesData] = useState({
    darkMode: user?.preferences?.darkMode || false,
    notificationsEnabled: user?.preferences?.notificationsEnabled || true,
    emailNotifications: user?.preferences?.emailNotifications || true,
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData({
      ...profileData,
      [name]: value,
    })
  }

  const handlePreferencesChange = (name, value) => {
    setPreferencesData({
      ...preferencesData,
      [name]: value,
    })
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData({
      ...passwordData,
      [name]: value,
    })
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await updateUser(profileData)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await updateUser({ preferences: preferencesData })
      toast({
        title: "Preferences updated",
        description: "Your preferences have been updated successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      await updateUser({
        password: passwordData.newPassword,
        currentPassword: passwordData.currentPassword,
      })

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update password. Please check your current password.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const userInitials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "U"

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 p-8 text-white">
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
          <AvatarImage src={user?.profilePicture} alt={`${user?.firstName} ${user?.lastName}`} />
          <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
        </Avatar>
        <h2 className="mt-4 text-2xl font-bold">
          {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-violet-100">{user?.email}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger
            value="profile"
            className="rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Preferences
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="animate-fade-in">
          <Card className="hover-card">
            <form onSubmit={handleProfileSubmit}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="firstName"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        className="pl-10 transition-all focus-visible:ring-violet-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="lastName"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        className="pl-10 transition-all focus-visible:ring-violet-500"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="pl-10 transition-all focus-visible:ring-violet-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-violet-500" />
                    Default Currency
                  </Label>
                  <Select
                    value={profileData.currency}
                    onValueChange={(value) => setProfileData({ ...profileData, currency: value })}
                  >
                    <SelectTrigger className="transition-all focus-visible:ring-violet-500">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} variant="gradient" className="ml-auto shadow-sm">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="animate-fade-in">
          <Card className="hover-card">
            <form onSubmit={handlePreferencesSubmit}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize your application experience</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-full bg-violet-100 p-1.5 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="darkMode" className="text-base">
                        Dark Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">Enable dark mode for the application</p>
                    </div>
                  </div>
                  <Switch
                    id="darkMode"
                    checked={preferencesData.darkMode}
                    onCheckedChange={(checked) => handlePreferencesChange("darkMode", checked)}
                    className="data-[state=checked]:bg-violet-600"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-full bg-violet-100 p-1.5 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="notificationsEnabled" className="text-base">
                        Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">Enable in-app notifications</p>
                    </div>
                  </div>
                  <Switch
                    id="notificationsEnabled"
                    checked={preferencesData.notificationsEnabled}
                    onCheckedChange={(checked) => handlePreferencesChange("notificationsEnabled", checked)}
                    className="data-[state=checked]:bg-violet-600"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-full bg-violet-100 p-1.5 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications" className="text-base">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={preferencesData.emailNotifications}
                    onCheckedChange={(checked) => handlePreferencesChange("emailNotifications", checked)}
                    className="data-[state=checked]:bg-violet-600"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} variant="gradient" className="ml-auto shadow-sm">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="animate-fade-in">
          <Card className="hover-card">
            <form onSubmit={handlePasswordSubmit}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Update your password and security settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="pl-10 transition-all focus-visible:ring-violet-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="pl-10 transition-all focus-visible:ring-violet-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="pl-10 transition-all focus-visible:ring-violet-500"
                      required
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-dashed border-destructive/50 p-4">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-destructive/10 p-1.5 text-destructive">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium">Log Out</h3>
                      <p className="text-sm text-muted-foreground">Log out from all devices</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={logout}
                    className="mt-4 w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} variant="gradient" className="ml-auto shadow-sm">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

