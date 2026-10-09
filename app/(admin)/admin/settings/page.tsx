"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlatformSettings {
  id: string
  setting_key: string
  setting_value: string
  description: string | null
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    min_deposit: "2000",
    min_withdrawal: "1500",
    max_daily_withdrawal: "50000",
    deposits_enabled: "true",
    withdrawals_enabled: "true",
    investments_enabled: "true",
    kyc_required: "false",
    cbe_account: "",
    telebirr_account: "",
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
      data.forEach((s: PlatformSettings) => {
        settingsMap[s.setting_key] = s.setting_value
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
          setting_key: key, 
          setting_value: value,
          description: getDescription(key)
        }, { onConflict: "setting_key" })
    }

    toast({ title: "Settings saved", description: "Platform settings have been updated." })
    setSaving(false)
  }

  function getDescription(key: string): string {
    const descriptions: Record<string, string> = {
      min_deposit: "Minimum deposit amount in ETB",
      min_withdrawal: "Minimum withdrawal amount in ETB",
      max_daily_withdrawal: "Maximum daily withdrawal limit in ETB",
      deposits_enabled: "Allow users to make deposits",
      withdrawals_enabled: "Allow users to make withdrawals",
      investments_enabled: "Allow users to invest in plans",
      kyc_required: "Require KYC verification for transactions",
      cbe_account: "CBE account number for deposits",
      telebirr_account: "TeleBirr account number for deposits",
    }
    return descriptions[key] || ""
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
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Configure platform-wide settings and limits</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Transaction Limits
            </CardTitle>
            <CardDescription>Set minimum and maximum transaction amounts</CardDescription>
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
            <CardTitle>Feature Toggles</CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <CardTitle>Payment Accounts</CardTitle>
            <CardDescription>Configure payment account details for deposits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cbe_account">CBE Account Number</Label>
                <Input
                  id="cbe_account"
                  value={settings.cbe_account}
                  onChange={(e) => setSettings(prev => ({ ...prev, cbe_account: e.target.value }))}
                  placeholder="Enter CBE account number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telebirr_account">TeleBirr Account Number</Label>
                <Input
                  id="telebirr_account"
                  value={settings.telebirr_account}
                  onChange={(e) => setSettings(prev => ({ ...prev, telebirr_account: e.target.value }))}
                  placeholder="Enter TeleBirr account number"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
