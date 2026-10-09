"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Save, Shield, CreditCard, Bell, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    min_deposit: "2000",
    min_withdrawal: "1500",
    max_daily_withdrawal: "50000",
    max_single_withdrawal: "25000",
    deposits_enabled: "true",
    withdrawals_enabled: "true",
    investments_enabled: "true",
    signups_enabled: "true",
    kyc_required: "false",
    cbe_account_name: "",
    cbe_account_number: "",
    cbe_enabled: "true",
    telebirr_account_name: "",
    telebirr_account_number: "",
    telebirr_enabled: "true",
    awash_account_name: "",
    awash_account_number: "",
    awash_enabled: "true",
    platform_name: "Nova Meridian",
    support_email: "",
    support_phone: "",
    maintenance_mode: "false",
    maintenance_message: "We are currently under maintenance. Please check back later.",
    referral_bonus: "100",
    referral_enabled: "false",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    const { data } = await supabase
      .from("platform_settings")
      .select("*")

    if (data) {
      const settingsMap: Record<string, string> = {}
      data.forEach((s: { key: string; value: string }) => {
        settingsMap[s.key] = s.value
      })
      setSettings(prev => ({ ...prev, ...settingsMap }))
    }
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    
    for (const [key, value] of Object.entries(settings)) {
      await supabase
        .from("platform_settings")
        .upsert({ 
          key: key, 
          value: value,
        }, { onConflict: "key" })
    }

    await supabase.from("audit_logs").insert({
      action: "settings_update",
      entity_type: "platform_settings",
      details: { settings_updated: Object.keys(settings) },
    })

    toast({ title: "Settings saved", description: "All platform settings have been updated." })
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Configure all platform-wide settings and controls</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Transaction Limits
            </CardTitle>
            <CardDescription>Set financial limits for the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="min_deposit">Minimum Deposit (ETB)</Label>
              <Input
                id="min_deposit"
                type="number"
                value={settings.min_deposit}
                onChange={(e) => setSettings(prev => ({ ...prev, min_deposit: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_withdrawal">Minimum Withdrawal (ETB)</Label>
              <Input
                id="min_withdrawal"
                type="number"
                value={settings.min_withdrawal}
                onChange={(e) => setSettings(prev => ({ ...prev, min_withdrawal: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_single_withdrawal">Max Single Withdrawal (ETB)</Label>
              <Input
                id="max_single_withdrawal"
                type="number"
                value={settings.max_single_withdrawal}
                onChange={(e) => setSettings(prev => ({ ...prev, max_single_withdrawal: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_daily_withdrawal">Max Daily Withdrawal (ETB)</Label>
              <Input
                id="max_daily_withdrawal"
                type="number"
                value={settings.max_daily_withdrawal}
                onChange={(e) => setSettings(prev => ({ ...prev, max_daily_withdrawal: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Feature Controls
            </CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Signups Enabled</Label>
                <p className="text-sm text-muted-foreground">Allow new user registrations</p>
              </div>
              <Switch
                checked={settings.signups_enabled === "true"}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, signups_enabled: checked ? "true" : "false" }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Deposits Enabled</Label>
                <p className="text-sm text-muted-foreground">Allow users to deposit funds</p>
              </div>
              <Switch
                checked={settings.deposits_enabled === "true"}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, deposits_enabled: checked ? "true" : "false" }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Withdrawals Enabled</Label>
                <p className="text-sm text-muted-foreground">Allow users to withdraw funds</p>
              </div>
              <Switch
                checked={settings.withdrawals_enabled === "true"}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, withdrawals_enabled: checked ? "true" : "false" }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Investments Enabled</Label>
                <p className="text-sm text-muted-foreground">Allow users to invest in plans</p>
              </div>
              <Switch
                checked={settings.investments_enabled === "true"}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, investments_enabled: checked ? "true" : "false" }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>KYC Required</Label>
                <p className="text-sm text-muted-foreground">Require verification for transactions</p>
              </div>
              <Switch
                checked={settings.kyc_required === "true"}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, kyc_required: checked ? "true" : "false" }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Accounts
            </CardTitle>
            <CardDescription>Configure payment receiving accounts for deposits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CBE Bank */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">CBE Bank</h4>
                  <p className="text-sm text-muted-foreground">Commercial Bank of Ethiopia</p>
                </div>
                <Switch
                  checked={settings.cbe_enabled === "true"}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, cbe_enabled: checked ? "true" : "false" }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cbe_account_name">Account Name</Label>
                  <Input
                    id="cbe_account_name"
                    value={settings.cbe_account_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, cbe_account_name: e.target.value }))}
                    placeholder="Enter account holder name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cbe_account_number">Account Number</Label>
                  <Input
                    id="cbe_account_number"
                    value={settings.cbe_account_number}
                    onChange={(e) => setSettings(prev => ({ ...prev, cbe_account_number: e.target.value }))}
                    placeholder="Enter CBE account number"
                  />
                </div>
              </div>
            </div>

            {/* TeleBirr */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">TeleBirr</h4>
                  <p className="text-sm text-muted-foreground">Ethio Telecom Mobile Money</p>
                </div>
                <Switch
                  checked={settings.telebirr_enabled === "true"}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, telebirr_enabled: checked ? "true" : "false" }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telebirr_account_name">Account Name</Label>
                  <Input
                    id="telebirr_account_name"
                    value={settings.telebirr_account_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, telebirr_account_name: e.target.value }))}
                    placeholder="Enter account holder name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telebirr_account_number">Phone Number</Label>
                  <Input
                    id="telebirr_account_number"
                    value={settings.telebirr_account_number}
                    onChange={(e) => setSettings(prev => ({ ...prev, telebirr_account_number: e.target.value }))}
                    placeholder="Enter TeleBirr phone number"
                  />
                </div>
              </div>
            </div>

            {/* Awash Bank */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Awash Bank</h4>
                  <p className="text-sm text-muted-foreground">Awash International Bank</p>
                </div>
                <Switch
                  checked={settings.awash_enabled === "true"}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, awash_enabled: checked ? "true" : "false" }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="awash_account_name">Account Name</Label>
                  <Input
                    id="awash_account_name"
                    value={settings.awash_account_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, awash_account_name: e.target.value }))}
                    placeholder="Enter account holder name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awash_account_number">Account Number</Label>
                  <Input
                    id="awash_account_number"
                    value={settings.awash_account_number}
                    onChange={(e) => setSettings(prev => ({ ...prev, awash_account_number: e.target.value }))}
                    placeholder="Enter Awash account number"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Info
            </CardTitle>
            <CardDescription>General platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform_name">Platform Name</Label>
              <Input
                id="platform_name"
                value={settings.platform_name}
                onChange={(e) => setSettings(prev => ({ ...prev, platform_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support_email">Support Email</Label>
              <Input
                id="support_email"
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings(prev => ({ ...prev, support_email: e.target.value }))}
                placeholder="support@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support_phone">Support Phone</Label>
              <Input
                id="support_phone"
                value={settings.support_phone}
                onChange={(e) => setSettings(prev => ({ ...prev, support_phone: e.target.value }))}
                placeholder="+251..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-warning/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Maintenance Mode
            </CardTitle>
            <CardDescription>Put the platform into maintenance mode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Users will see a maintenance message</p>
              </div>
              <Switch
                checked={settings.maintenance_mode === "true"}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenance_mode: checked ? "true" : "false" }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance_message">Maintenance Message</Label>
              <Textarea
                id="maintenance_message"
                value={settings.maintenance_message}
                onChange={(e) => setSettings(prev => ({ ...prev, maintenance_message: e.target.value }))}
                placeholder="Enter message to display during maintenance"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  )
}
