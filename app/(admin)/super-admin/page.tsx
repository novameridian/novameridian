"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Shield, Users, TrendingUp, DollarSign, Settings, Plus, Edit2, Trash2, Eye, History, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"
import Link from "next/link"

interface InvestmentPlan {
  id: string
  name: string
  description: string
  min_amount: number
  max_amount: number
  duration_days: number
  is_active: boolean
  created_at: string
}

interface PlatformStats {
  totalUsers: number
  totalDeposits: number
  totalWithdrawals: number
  totalInvested: number
  activeOrders: number
  pendingDeposits: number
  pendingWithdrawals: number
}

interface AuditLog {
  id: string
  user_id: string
  action: string
  details: Record<string, unknown>
  created_at: string
  profiles: { full_name: string; email: string } | null
}

interface StaffMember {
  id: string
  full_name: string | null
  email: string
  role: string
  is_banned: boolean
  created_at: string
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null)
  const [isEditingPlan, setIsEditingPlan] = useState(false)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [newRole, setNewRole] = useState("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    min_amount: 0,
    max_amount: 0,
    duration_days: 0,
    is_active: true,
  })

  useEffect(() => {
    fetchStats()
    fetchPlans()
    fetchStaff()
    fetchAuditLogs()
  }, [])

  async function fetchStats() {
    try {
      const [usersRes, depositsRes, withdrawalsRes, ordersRes, pendingDepRes, pendingWithRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("deposits").select("amount").eq("status", "approved"),
        supabase.from("withdrawals").select("amount").eq("status", "approved"),
        supabase.from("orders").select("amount, is_active, is_completed").or("is_active.eq.true,is_completed.eq.true"),
        supabase.from("deposits").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ])

      const totalDeposits = depositsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0
      const totalWithdrawals = withdrawalsRes.data?.reduce((sum, w) => sum + Number(w.amount), 0) || 0
      const totalInvested = ordersRes.data?.reduce((sum, o) => sum + Number(o.amount), 0) || 0
      const activeOrders = ordersRes.data?.filter(o => o.is_active).length || 0

      setStats({
        totalUsers: usersRes.count || 0,
        totalDeposits,
        totalWithdrawals,
        totalInvested,
        activeOrders,
        pendingDeposits: pendingDepRes.count || 0,
        pendingWithdrawals: pendingWithRes.count || 0,
      })
    } catch (error) {
      console.error("[NovaMeridian] Error fetching stats:", error)
    }
  }

  async function fetchPlans() {
    const { data } = await supabase
      .from("investment_plans")
      .select("*")
      .order("created_at", { ascending: false })

    setPlans(data || [])
  }

  async function fetchStaff() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["moderator", "admin", "super_admin"])
      .neq("is_system_account", true) // Hide system accounts from UI
      .order("created_at", { ascending: false })

    setStaff(data || [])
  }

  async function fetchAuditLogs() {
    const { data } = await supabase
      .from("audit_logs")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100)

    setAuditLogs(data || [])
  }

  async function handleCreatePlan() {
    setProcessing(true)
    try {
      const { error } = await supabase.from("investment_plans").insert(planForm)

      if (error) throw error

      toast({
        title: "Plan Created",
        description: `${planForm.name} has been created successfully.`,
      })

      setIsCreatingPlan(false)
      setPlanForm({
        name: "",
        description: "",
        min_amount: 0,
        max_amount: 0,
        duration_days: 0,
        is_active: true,
      })
      fetchPlans()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create investment plan.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleUpdatePlan() {
    if (!selectedPlan) return
    setProcessing(true)
    try {
      const { error } = await supabase
        .from("investment_plans")
        .update(planForm)
        .eq("id", selectedPlan.id)

      if (error) throw error

      toast({
        title: "Plan Updated",
        description: `${planForm.name} has been updated successfully.`,
      })

      setIsEditingPlan(false)
      setSelectedPlan(null)
      fetchPlans()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update investment plan.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleDeletePlan(plan: InvestmentPlan) {
    if (!confirm(`Are you sure you want to delete "${plan.name}"?`)) return

    try {
      const { error } = await supabase
        .from("investment_plans")
        .delete()
        .eq("id", plan.id)

      if (error) throw error

      toast({
        title: "Plan Deleted",
        description: `${plan.name} has been deleted.`,
      })

      fetchPlans()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete plan. It may have active orders.",
        variant: "destructive",
      })
    }
  }

  async function handleTogglePlanStatus(plan: InvestmentPlan) {
    try {
      const { error } = await supabase
        .from("investment_plans")
        .update({ is_active: !plan.is_active })
        .eq("id", plan.id)

      if (error) throw error

      toast({
        title: plan.is_active ? "Plan Deactivated" : "Plan Activated",
        description: `${plan.name} has been ${plan.is_active ? "deactivated" : "activated"}.`,
      })

      fetchPlans()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update plan status.",
        variant: "destructive",
      })
    }
  }

  async function handleUpdateStaffRole() {
    if (!selectedStaff || !newRole) return
    setProcessing(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", selectedStaff.id)

      if (error) throw error

      // Log the action
      await supabase.from("audit_logs").insert({
        user_id: selectedStaff.id,
        action: "role_changed",
        details: { old_role: selectedStaff.role, new_role: newRole },
      })

      toast({
        title: "Role Updated",
        description: `${selectedStaff.full_name || selectedStaff.email}'s role has been changed to ${newRole}.`,
      })

      setSelectedStaff(null)
      setNewRole("")
      fetchStaff()
      fetchAuditLogs()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  function openEditPlan(plan: InvestmentPlan) {
    setSelectedPlan(plan)
    setPlanForm({
      name: plan.name,
      description: plan.description,
      min_amount: plan.min_amount,
      max_amount: plan.max_amount,
      duration_days: plan.duration_days,
      is_active: plan.is_active,
    })
    setIsEditingPlan(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Complete platform management and analytics</p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <Link href="/super-admin/users" className="text-xs text-primary hover:underline">
                View all users
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">ETB {stats.totalDeposits.toLocaleString()}</div>
              <Link href="/admin/deposits" className="text-xs text-primary hover:underline">
                {stats.pendingDeposits} pending - Review now
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
              <DollarSign className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">ETB {stats.totalWithdrawals.toLocaleString()}</div>
              <Link href="/admin/withdrawals" className="text-xs text-primary hover:underline">
                {stats.pendingWithdrawals} pending - Review now
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">ETB {stats.totalInvested.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{stats.activeOrders} active orders</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/deposits">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <ArrowDownToLine className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle className="text-base">Manage Deposits</CardTitle>
                <CardDescription>Review requests</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/withdrawals">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <ArrowUpFromLine className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-base">Manage Withdrawals</CardTitle>
                <CardDescription>Review requests</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/super-admin/users">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Manage Users</CardTitle>
                <CardDescription>View and adjust</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/super-admin/plans">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
              <div>
                <CardTitle className="text-base">Manage Plans</CardTitle>
                <CardDescription>Create and edit</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Investment Plans</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Investment Plans</CardTitle>
                <CardDescription>Manage investment plans and their parameters</CardDescription>
              </div>
              <Dialog open={isCreatingPlan} onOpenChange={setIsCreatingPlan}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Investment Plan</DialogTitle>
                    <DialogDescription>Add a new investment plan to the platform</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Plan Name</Label>
                      <Input
                        id="name"
                        value={planForm.name}
                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                        placeholder="e.g., Gold Plan"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={planForm.description}
                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                        placeholder="Plan description..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_amount">Min Amount ($)</Label>
                        <Input
                          id="min_amount"
                          type="number"
                          value={planForm.min_amount}
                          onChange={(e) => setPlanForm({ ...planForm, min_amount: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_amount">Max Amount ($)</Label>
                        <Input
                          id="max_amount"
                          type="number"
                          value={planForm.max_amount}
                          onChange={(e) => setPlanForm({ ...planForm, max_amount: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration (days)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={planForm.duration_days}
                          onChange={(e) => setPlanForm({ ...planForm, duration_days: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={planForm.is_active}
                        onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreatingPlan(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePlan} disabled={processing}>
                      Create Plan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Investment Range</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">{plan.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        ${plan.min_amount.toLocaleString()} - ${plan.max_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{plan.duration_days} days</TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditPlan(plan)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePlanStatus(plan)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePlan(plan)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {plans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No investment plans found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>Manage moderators and admins</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.full_name || "Not set"}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={
                          member.role === "super_admin" ? "default" :
                          member.role === "admin" ? "secondary" : "outline"
                        }>
                          {member.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStaff(member)
                            setNewRole(member.role)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {staff.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No staff members found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>Track all system actions and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.profiles?.full_name || "System"}</div>
                          <div className="text-sm text-muted-foreground">{log.profiles?.email || "—"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate font-mono text-xs">
                        {JSON.stringify(log.details)}
                      </TableCell>
                      <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {auditLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditingPlan} onOpenChange={setIsEditingPlan}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Investment Plan</DialogTitle>
            <DialogDescription>Update plan parameters</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Plan Name</Label>
              <Input
                id="edit-name"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-min">Min Amount ($)</Label>
                <Input
                  id="edit-min"
                  type="number"
                  value={planForm.min_amount}
                  onChange={(e) => setPlanForm({ ...planForm, min_amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="edit-max">Max Amount ($)</Label>
                <Input
                  id="edit-max"
                  type="number"
                  value={planForm.max_amount}
                  onChange={(e) => setPlanForm({ ...planForm, max_amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-duration">Duration (days)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={planForm.duration_days}
                  onChange={(e) => setPlanForm({ ...planForm, duration_days: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={planForm.is_active}
                onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingPlan(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan} disabled={processing}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update role for {selectedStaff?.full_name || selectedStaff?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Role</Label>
              <p className="font-medium capitalize">{selectedStaff?.role.replace("_", " ")}</p>
            </div>
            <div>
              <Label htmlFor="new-role">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedStaff(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStaffRole} disabled={processing}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
