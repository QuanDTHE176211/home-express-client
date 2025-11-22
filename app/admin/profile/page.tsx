"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { adminNavItems } from "@/lib/admin-nav-config"
import { Mail, Shield, Phone, Building, Calendar } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

type ManagerProfile = {
  full_name: string
  phone: string
  employee_id: string | null
  department: string | null
  permissions: string[] | null
  created_at: string | null
}

const DEFAULT_MANAGER: ManagerProfile = {
  full_name: "",
  phone: "",
  employee_id: null,
  department: null,
  permissions: null,
  created_at: null,
}

export default function AdminProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [manager, setManager] = useState<ManagerProfile>(DEFAULT_MANAGER)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== "MANAGER")) {
      router.push("/login")
      return
    }

    let active = true

    const loadProfile = async () => {
      try {
        const response = await apiClient.getProfile()
        if (!active) return

        const managerProfile = response.manager
        if (managerProfile) {
          setManager({
            full_name: managerProfile.full_name ?? "",
            phone: managerProfile.phone ?? "",
            employee_id: managerProfile.employee_id,
            department: managerProfile.department,
            permissions: managerProfile.permissions,
            created_at: managerProfile.created_at ?? null,
          })
        }
      } catch (error) {
        if (!active) return
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Unable to load profile information.",
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

  const getInitials = () => {
    if (!manager.full_name) {
      return user?.email?.charAt(0).toUpperCase() ?? "A"
    }

    return manager.full_name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!user) return null

  return (
    <DashboardLayout navItems={adminNavItems} title="Admin profile">
      <div className="space-y-6">
        <AdminBreadcrumbs />

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile overview</h1>
          <p className="text-muted-foreground">View information about your administrator account.</p>
        </div>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>Basic information about this administrator account.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[280px,1fr]">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-28 w-28">
                <AvatarImage src="/placeholder.svg" alt={manager.full_name || user.email} />
                <AvatarFallback className="bg-accent-green text-white text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">{manager.full_name || user.email}</h2>
                <Badge className="bg-accent-green hover:bg-accent-green-dark">System administrator</Badge>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium break-all">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium">Manager</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{manager.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Department:</span>
                <span className="font-medium">{manager.department || "Not assigned"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {manager.created_at ? new Date(manager.created_at).toLocaleDateString() : "Unknown"}
                </span>
              </div>
              {manager.employee_id ? (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Employee ID:</span>
                  <span className="font-medium">{manager.employee_id}</span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {manager.permissions && manager.permissions.length > 0 ? (
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Capabilities assigned to this administrator.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {manager.permissions.map((permission) => (
                <Badge key={permission} variant="secondary">
                  {permission}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
