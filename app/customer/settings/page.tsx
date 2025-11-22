"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { navItems } from "@/lib/customer-nav-config"
import { User, Bell, Shield, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { AccountSettingsTab } from "@/components/settings/account-settings-tab"
import { NotificationSettingsTab } from "@/components/settings/notification-settings-tab"
import { SecuritySettingsTab } from "@/components/settings/security-settings-tab"
import { PrivacySettingsTab } from "@/components/settings/privacy-settings-tab"

type CustomerVisibility = "public" | "private"

export default function CustomerSettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loadingSettings, setLoadingSettings] = useState(true)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [bookingUpdates, setBookingUpdates] = useState(true)
  const [quotationAlerts, setQuotationAlerts] = useState(true)
  const [promotions, setPromotions] = useState(false)
  const [newsletter, setNewsletter] = useState(false)

  const [profileVisibility, setProfileVisibility] = useState<CustomerVisibility>("public")
  const [showPhone, setShowPhone] = useState(true)
  const [showEmail, setShowEmail] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== "CUSTOMER")) {
      router.push("/login")
      return
    }

    let active = true

    const loadData = async () => {
      if (!user) return

      try {
        const [settings, profile] = await Promise.all([apiClient.getCustomerSettings(), apiClient.getProfile()])

        if (!active) return

        setEmailNotifications(settings.emailNotifications)
        setBookingUpdates(settings.bookingUpdates)
        setQuotationAlerts(settings.quotationAlerts)
        setPromotions(settings.promotions)
        setNewsletter(settings.newsletter)
        setProfileVisibility(settings.profileVisibility)
        setShowPhone(settings.showPhone)
        setShowEmail(settings.showEmail)

        const customerProfile = profile.customer
        if (customerProfile) {
          setFullName(customerProfile.full_name ?? "")
          setPhone(customerProfile.phone ?? "")
          setDateOfBirth(customerProfile.date_of_birth ?? "")
        }
      } catch (error) {
        if (!active) return
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Unable to load settings.",
          variant: "destructive",
        })
      } finally {
        if (active) {
          setLoadingSettings(false)
        }
      }
    }

    if (user) {
      loadData()
    }

    return () => {
      active = false
    }
  }, [user, loading, router, toast])

  const handleSaveAccount = async ({
    fullName: name,
    phone: phoneNumber,
    dateOfBirth: dob,
  }: {
    fullName: string
    phone: string
    dateOfBirth: string
  }) => {
    try {
      await apiClient.updateProfile({
        full_name: name,
        phone: phoneNumber,
        date_of_birth: dob || undefined,
      })

      setFullName(name)
      setPhone(phoneNumber)
      setDateOfBirth(dob)
    } catch (error) {
      throw error instanceof Error ? error : new Error("Unable to update profile information.")
    }
  }

  const handleSaveNotifications = async (payload: {
    emailNotifications: boolean
    bookingUpdates: boolean
    quotationAlerts: boolean
    promotions: boolean
    newsletter: boolean
  }) => {
    try {
      const updated = await apiClient.updateCustomerSettings(payload)
      setEmailNotifications(updated.emailNotifications)
      setBookingUpdates(updated.bookingUpdates)
      setQuotationAlerts(updated.quotationAlerts)
      setPromotions(updated.promotions)
      setNewsletter(updated.newsletter)
      toast({
        title: "Settings saved",
        description: "Notification preferences have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to update notification settings.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleSavePrivacy = async (payload: { profileVisibility: CustomerVisibility; showPhone: boolean; showEmail: boolean }) => {
    try {
      const updated = await apiClient.updateCustomerSettings(payload)
      setProfileVisibility(updated.profileVisibility)
      setShowPhone(updated.showPhone)
      setShowEmail(updated.showEmail)
      toast({
        title: "Settings saved",
        description: "Privacy preferences have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to update privacy settings.",
        variant: "destructive",
      })
      throw error
    }
  }

  if (loading || loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!user) return null

  return (
    <DashboardLayout navItems={navItems} title="Customer settings">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage how Home Express contacts you and how your profile is shown.</p>
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Account summary</CardTitle>
            <CardDescription>
              Update your profile information, notification preferences, password, and privacy controls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="account" className="space-y-6">
              <TabsList className="flex flex-wrap gap-2">
                <TabsTrigger value="account" className="gap-2">
                  <User className="h-4 w-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="privacy" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Privacy
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-6">
                <AccountSettingsTab
                  user={user}
                  fullName={fullName}
                  setFullName={setFullName}
                  phone={phone}
                  setPhone={setPhone}
                  dateOfBirth={dateOfBirth}
                  setDateOfBirth={setDateOfBirth}
                  onSave={handleSaveAccount}
                />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <NotificationSettingsTab
                  emailNotifications={emailNotifications}
                  setEmailNotifications={setEmailNotifications}
                  bookingUpdates={bookingUpdates}
                  setBookingUpdates={setBookingUpdates}
                  quotationAlerts={quotationAlerts}
                  setQuotationAlerts={setQuotationAlerts}
                  promotions={promotions}
                  setPromotions={setPromotions}
                  newsletter={newsletter}
                  setNewsletter={setNewsletter}
                  onSave={handleSaveNotifications}
                />
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <SecuritySettingsTab />
              </TabsContent>

              <TabsContent value="privacy" className="space-y-6">
                <PrivacySettingsTab
                  profileVisibility={profileVisibility}
                  setProfileVisibility={setProfileVisibility}
                  showPhone={showPhone}
                  setShowPhone={setShowPhone}
                  showEmail={showEmail}
                  setShowEmail={setShowEmail}
                  onSave={handleSavePrivacy}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
