/**
 * Customer Profile Page
 *
 * Allows customers to view and edit their profile information.
 */

"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Camera, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { navItems } from "@/lib/customer-nav-config"
import { http } from "@/lib/http"
import { normalizeVNPhone, isValidVNPhone } from "@/utils/phone"

type ProfileResponse = {
  full_name: string
  phone: string
  address: string
  date_of_birth: string
  avatar_url: string
}

const DEFAULT_PROFILE: ProfileResponse = {
  full_name: "",
  phone: "",
  address: "",
  date_of_birth: "",
  avatar_url: "",
}

const CustomerProfile = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [profile, setProfile] = useState<ProfileResponse>(DEFAULT_PROFILE)
  const [saving, setSaving] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== "CUSTOMER")) {
      router.push("/login")
      return
    }

    let active = true

    const loadProfile = async () => {
      try {
        const data = await http<ProfileResponse>("/api/me", {
          timeoutMs: 10000,
          retries: 1,
        })
        if (!active) return
        setProfile({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          date_of_birth: data.date_of_birth ?? "",
          avatar_url: data.avatar_url ?? "",
        })
      } catch (error) {
        if (!active) return
        toast({
          title: "Error",
          description: "Unable to load your profile data.",
          variant: "destructive",
        })
      } finally {
        if (active) {
          setLoadingProfile(false)
        }
      }
    }

    if (user) {
      loadProfile()
    }

    return () => {
      active = false
    }
  }, [user, loading, router, toast])

  const handleSave = async () => {
    if (profile.full_name.trim().length < 2) {
      toast({
        title: "Error",
        description: "Full name must contain at least two characters.",
        variant: "destructive",
      })
      return
    }

    const normalizedPhone = normalizeVNPhone(profile.phone)
    if (!isValidVNPhone(normalizedPhone)) {
      toast({
        title: "Error",
        description: "Phone number is not valid.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await http("/api/me", {
        method: "PUT",
        timeoutMs: 10000,
        retries: 1,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, phone: normalizedPhone }),
      })

      toast({
        title: "Profile updated",
        description: "Your information has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to update profile.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const response = await apiClient.uploadAvatar(formData)
      setProfile((prev) => ({ ...prev, avatar_url: response.avatar_url }))
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to upload profile picture.",
        variant: "destructive",
      })
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const getInitials = () => {
    if (!profile.full_name) return "U"
    return profile.full_name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFieldChange = (field: keyof ProfileResponse) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!user) return null

  return (
    <DashboardLayout navItems={navItems} title="Customer profile">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Profile details</h1>
          <p className="text-muted-foreground">Manage your personal information and account preferences.</p>
        </div>

        {loadingProfile ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-green" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
            <div className="space-y-6">
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>Profile picture</CardTitle>
                  <CardDescription>Upload an image so other users can recognise your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                      <AvatarFallback className="bg-accent-green text-white text-2xl">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Camera className="mr-2 h-4 w-4" />
                      Change picture
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Personal information</CardTitle>
                <CardDescription>Update your contact details and personal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={handleFieldChange("full_name")}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={handleFieldChange("phone")}
                      placeholder="0901234567"
                      inputMode="tel"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profile.address}
                      onChange={handleFieldChange("address")}
                      placeholder="Street address, city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={profile.date_of_birth || ""}
                      onChange={handleFieldChange("date_of_birth")}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving} className="bg-accent-green hover:bg-accent-green-dark">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default CustomerProfile
