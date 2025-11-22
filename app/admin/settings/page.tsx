"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { adminNavItems } from "@/lib/admin-nav-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Bell, Shield, Palette, Database, Mail, Save, User } from "lucide-react"
import { http } from "@/lib/http"

export default function AdminSettingsPage() {
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("")

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    const [emailNotifications, setEmailNotifications] = useState(false)
    const [systemAlerts, setSystemAlerts] = useState(false)
    const [userRegistrations, setUserRegistrations] = useState(false)
    const [transportVerifications, setTransportVerifications] = useState(false)
    const [bookingAlerts, setBookingAlerts] = useState(false)
    const [reviewModeration, setReviewModeration] = useState(false)

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [sessionTimeout, setSessionTimeout] = useState("")
    const [loginNotifications, setLoginNotifications] = useState(false)

    const [theme, setTheme] = useState("")
    const [dateFormat, setDateFormat] = useState("")
    const [timezone, setTimezone] = useState("")

    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [autoBackup, setAutoBackup] = useState(false)
    const [backupFrequency, setBackupFrequency] = useState("")
    const [emailProvider, setEmailProvider] = useState("")
    const [smtpHost, setSmtpHost] = useState("")
    const [smtpPort, setSmtpPort] = useState("")
    const [smtpUser, setSmtpUser] = useState("")
    const [smtpPassword, setSmtpPassword] = useState("")

    const showSuccess = useCallback((message: string) => {
        toast({
            title: "Success",
            description: message,
        })
    }, [toast])

    const showError = useCallback((message: string) => {
        toast({
            title: "Error",
            description: message,
            variant: "destructive",
        })
    }, [toast])

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true)
                const response = await http<{ success: boolean; data: any }>("/api/v1/admin/settings", {
                    method: "GET",
                })
                const settings = response.data

                setFullName(settings.fullName || "")
                setPhone(settings.phone || "")
                setEmailNotifications(settings.emailNotifications || false)
                setSystemAlerts(settings.systemAlerts || false)
                setUserRegistrations(settings.userRegistrations || false)
                setTransportVerifications(settings.transportVerifications || false)
                setBookingAlerts(settings.bookingAlerts || false)
                setReviewModeration(settings.reviewModeration || false)
                setTwoFactorEnabled(settings.twoFactorEnabled || false)
                setSessionTimeout(settings.sessionTimeoutMinutes?.toString() || "30")
                setLoginNotifications(settings.loginNotifications || false)
                setTheme(settings.theme || "light")
                setDateFormat(settings.dateFormat || "DD/MM/YYYY")
                setTimezone(settings.timezone || "Asia/Ho_Chi_Minh")
                setMaintenanceMode(settings.maintenanceMode || false)
                setAutoBackup(settings.autoBackup || false)
                setBackupFrequency(settings.backupFrequency || "daily")
                setEmailProvider(settings.emailProvider || "smtp")
                setSmtpHost(settings.smtpHost || "")
                setSmtpPort(settings.smtpPort || "")
                setSmtpUser(settings.smtpUsername || "")
            } catch (error: any) {
                showError(error.response?.data?.message || "Failed to load settings")
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [showError])

    const handleSaveAccount = async () => {
        setSaving(true)
        try {
            await http("/api/v1/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, phone }),
            } as RequestInit)
            showSuccess("Account information saved.")
        } catch (error: any) {
            showError(error.message || "Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            showError("Confirm password does not match.")
            return
        }
        if (newPassword.length < 8) {
            showError("New password must contain at least 8 characters.")
            return
        }
        setSaving(true)
        try {
            await http("/api/v1/admin/settings/change-password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            })
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            showSuccess("Password updated successfully.")
        } catch (error: any) {
            showError(error.message || "Failed to change password")
        } finally {
            setSaving(false)
        }
    }

    const handleSaveNotifications = async () => {
        setSaving(true)
        try {
            await http("/api/v1/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emailNotifications,
                    systemAlerts,
                    userRegistrations,
                    transportVerifications,
                    bookingAlerts,
                    reviewModeration,
                }),
            } as RequestInit)
            showSuccess("Notification preferences saved.")
        } catch (error: any) {
            showError(error.message || "Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    const handleSaveSecurity = async () => {
        setSaving(true)
        try {
            await http("/api/v1/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    twoFactorEnabled,
                    sessionTimeoutMinutes: parseInt(sessionTimeout) || 30,
                    loginNotifications,
                }),
            } as RequestInit)
            showSuccess("Security settings saved.")
        } catch (error: any) {
            showError(error.message || "Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    const handleSaveAppearance = async () => {
        setSaving(true)
        try {
            await http("/api/v1/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ theme, dateFormat, timezone }),
            } as RequestInit)
            showSuccess("Appearance settings saved.")
        } catch (error: any) {
            showError(error.message || "Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    const handleSaveSystem = async () => {
        setSaving(true)
        try {
            await http("/api/v1/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ maintenanceMode, autoBackup, backupFrequency }),
            } as RequestInit)
            showSuccess("System preferences saved.")
        } catch (error: any) {
            showError(error.message || "Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    const handleSaveEmail = async () => {
        setSaving(true)
        try {
            await http("/api/v1/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emailProvider,
                    smtpHost,
                    smtpPort,
                    smtpUsername: smtpUser,
                    smtpPassword: smtpPassword || undefined,
                }),
            } as RequestInit)
            showSuccess("Email configuration saved.")
        } catch (error: any) {
            showError(error.message || "Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout navItems={adminNavItems} title="Admin Settings">
                <div className="space-y-6">
                    <AdminBreadcrumbs />
                    <div className="flex items-center justify-center h-[400px]">
                        <p className="text-muted-foreground">Loading settings...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout navItems={adminNavItems} title="Admin Settings">
            <div className="space-y-6">
                <AdminBreadcrumbs />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Administration Settings</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage account preferences, notifications, security rules, and platform defaults.
                        </p>
                    </div>
                    <Badge className="bg-accent-green/10 text-accent-green border-accent-green">In production</Badge>
                </div>

                <Tabs defaultValue="account">
                    <TabsList className="flex flex-wrap gap-2">
                        <TabsTrigger value="account">
                            <User className="mr-2 h-4 w-4" />
                            Account
                        </TabsTrigger>
                        <TabsTrigger value="password">Password</TabsTrigger>
                        <TabsTrigger value="notifications">
                            <Bell className="mr-2 h-4 w-4" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="security">
                            <Shield className="mr-2 h-4 w-4" />
                            Security
                        </TabsTrigger>
                        <TabsTrigger value="appearance">
                            <Palette className="mr-2 h-4 w-4" />
                            Appearance
                        </TabsTrigger>
                        <TabsTrigger value="system">
                            <Database className="mr-2 h-4 w-4" />
                            System
                        </TabsTrigger>
                        <TabsTrigger value="email">
                            <Mail className="mr-2 h-4 w-4" />
                            Email
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="account" className="space-y-6 pt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>Edit your profile information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="full-name">Full name</Label>
                                        <Input
                                            id="full-name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone number</Label>
                                        <Input
                                            id="phone"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input value="admin@homeexpress.vn" disabled className="h-11 bg-muted" />
                                    <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Input value="Administrator" disabled className="h-11 bg-muted" />
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleSaveAccount}
                                        disabled={saving}
                                        className="bg-accent-green hover:bg-accent-green-dark"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {saving ? "Saving..." : "Save changes"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="password" className="space-y-6 pt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Update password</CardTitle>
                                <CardDescription>
                                    Set a strong password and enable two-step verification to protect your account.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">Current password</Label>
                                        <div className="relative">
                                            <Input
                                                id="current-password"
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="h-11 pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() => setShowCurrentPassword((prev) => !prev)}
                                            >
                                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New password</Label>
                                        <div className="relative">
                                            <Input
                                                id="new-password"
                                                type={showNewPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="At least 8 characters"
                                                className="h-11 pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() => setShowNewPassword((prev) => !prev)}
                                            >
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Passwords must contain at least 8 characters.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm new password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat the new password"
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => setCurrentPassword("")}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleChangePassword}
                                        disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                                        className="bg-accent-green hover:bg-accent-green-dark"
                                    >
                                        {saving ? "Saving..." : "Update password"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-6 pt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Email notifications</CardTitle>
                                <CardDescription>Choose which events should trigger an email.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email-notifications">General notifications</Label>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">Receive updates by email</p>
                                            <p className="text-sm text-muted-foreground">
                                                Always notify me about important administrative events.
                                            </p>
                                        </div>
                                        <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="system-alerts">System alerts</Label>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">Platform alerts</p>
                                            <p className="text-sm text-muted-foreground">
                                                Receive alerts about outages, deployments, and maintenance windows.
                                            </p>
                                        </div>
                                        <Switch id="system-alerts" checked={systemAlerts} onCheckedChange={setSystemAlerts} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user-registrations">New registrations</Label>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">New users</p>
                                            <p className="text-sm text-muted-foreground">Send me an email whenever a new user registers.</p>
                                        </div>
                                        <Switch id="user-registrations" checked={userRegistrations} onCheckedChange={setUserRegistrations} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="transport-verifications">Transport verification</Label>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">Verification requests</p>
                                            <p className="text-sm text-muted-foreground">Notify me when a transport partner needs approval.</p>
                                        </div>
                                        <Switch
                                            id="transport-verifications"
                                            checked={transportVerifications}
                                            onCheckedChange={setTransportVerifications}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="booking-alerts">Booking alerts</Label>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">Booking requests</p>
                                            <p className="text-sm text-muted-foreground">Receive an email when a customer needs assistance.</p>
                                        </div>
                                        <Switch id="booking-alerts" checked={bookingAlerts} onCheckedChange={setBookingAlerts} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="review-moderation">Review moderation</Label>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">Review queue</p>
                                            <p className="text-sm text-muted-foreground">Warn me when a new review needs moderation.</p>
                                        </div>
                                        <Switch id="review-moderation" checked={reviewModeration} onCheckedChange={setReviewModeration} />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleSaveNotifications} disabled={saving}>
                                        {saving ? "Saving..." : "Save preferences"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6 pt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Two-factor authentication</CardTitle>
                                <CardDescription>Protect critical accounts with an additional verification step.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">Enable 2FA</p>
                                        <p className="text-sm text-muted-foreground">
                                            Require an authenticator code when administrators sign in.
                                        </p>
                                    </div>
                                    <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">Login notifications</p>
                                        <p className="text-sm text-muted-foreground">Alert me whenever an admin signs in from a new device.</p>
                                    </div>
                                    <Switch checked={loginNotifications} onCheckedChange={setLoginNotifications} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="session-timeout">Session timeout (minutes)</Label>
                                    <Input
                                        id="session-timeout"
                                        value={sessionTimeout}
                                        onChange={(e) => setSessionTimeout(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleSaveSecurity} disabled={saving}>
                                        {saving ? "Saving..." : "Save security rules"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-6 pt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Interface</CardTitle>
                                <CardDescription>Personalize the admin interface.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="theme">Theme</Label>
                                        <Select value={theme} onValueChange={setTheme}>
                                            <SelectTrigger id="theme">
                                                <SelectValue placeholder="Choose a theme" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="light">Light</SelectItem>
                                                <SelectItem value="dark">Dark</SelectItem>
                                                <SelectItem value="system">System default</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date-format">Date format</Label>
                                        <Select value={dateFormat} onValueChange={setDateFormat}>
                                            <SelectTrigger id="date-format">
                                                <SelectValue placeholder="Select a format" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Timezone</Label>
                                        <Select value={timezone} onValueChange={setTimezone}>
                                            <SelectTrigger id="timezone">
                                                <SelectValue placeholder="Select a timezone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Asia/Ho_Chi_Minh">Vietnam (GMT+7)</SelectItem>
                                                <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                                                <SelectItem value="UTC">UTC</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleSaveAppearance} disabled={saving}>
                                        {saving ? "Saving..." : "Save interface"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="system" className="space-y-6 pt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform maintenance</CardTitle>
                                <CardDescription>Temporarily disable the customer portal while running maintenance.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">Maintenance mode</p>
                                        <p className="text-sm text-muted-foreground">
                                            While enabled, customers will see a maintenance notice instead of the normal interface.
                                        </p>
                                    </div>
                                    <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="auto-backup">Automatic backups</Label>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">Enable automatic backups</p>
                                            <p className="text-sm text-muted-foreground">
                                                Perform automated database backups based on the schedule below.
                                            </p>
                                        </div>
                                        <Switch checked={autoBackup} onCheckedChange={setAutoBackup} id="auto-backup" />
                                    </div>
                                </div>
                                {autoBackup && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="backup-frequency">Backup frequency</Label>
                                            <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                                                <SelectTrigger id="backup-frequency">
                                                    <SelectValue placeholder="Select frequency" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="daily">Daily</SelectItem>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="hourly">Hourly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="backup-retention">Retention (days)</Label>
                                            <Input id="backup-retention" defaultValue="7" className="h-11" />
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <Button onClick={handleSaveSystem} disabled={saving}>
                                        {saving ? "Saving..." : "Save system settings"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="email" className="space-y-6 pt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Email gateway</CardTitle>
                                <CardDescription>Configure the SMTP server used for transactional messages.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email-provider">Provider</Label>
                                        <Select value={emailProvider} onValueChange={setEmailProvider}>
                                            <SelectTrigger id="email-provider">
                                                <SelectValue placeholder="Select provider" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="smtp">SMTP</SelectItem>
                                                <SelectItem value="sendgrid">SendGrid</SelectItem>
                                                <SelectItem value="mailgun">Mailgun</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="smtp-host">SMTP host</Label>
                                        <Input
                                            id="smtp-host"
                                            value={smtpHost}
                                            onChange={(e) => setSmtpHost(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="smtp-port">SMTP port</Label>
                                        <Input
                                            id="smtp-port"
                                            value={smtpPort}
                                            onChange={(e) => setSmtpPort(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="smtp-user">SMTP username</Label>
                                        <Input
                                            id="smtp-user"
                                            value={smtpUser}
                                            onChange={(e) => setSmtpUser(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="smtp-password">SMTP password</Label>
                                        <Input
                                            id="smtp-password"
                                            type="password"
                                            value={smtpPassword}
                                            onChange={(e) => setSmtpPassword(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex flex-wrap gap-3 justify-end">
                                    <Button variant="outline" onClick={() => showSuccess("Test email sent.")}>
                                        Send test email
                                    </Button>
                                    <Button onClick={handleSaveEmail} disabled={saving}>
                                        {saving ? "Saving..." : "Save configuration"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}

