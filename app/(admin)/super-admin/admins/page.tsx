"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Shield, UserPlus, Ban } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string
  is_banned: boolean
  created_at: string
}

export default function SuperAdminAdminsPage() {
  const [staff, setStaff] = useState<Profile[]>([])
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [newStaffEmail, setNewStaffEmail] = useState("")
  const [newStaffRole, setNewStaffRole] = useState<string>("moderator")
  const [promoting, setPromoting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchStaff()
    fetchAllUsers()
  }, [])

  async function fetchStaff() {
    setLoading(true)
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["moderator", "admin", "super_admin"])
      .neq("is_system_account", true)
      .order("created_at", { ascending: false })

    setStaff(data || [])
    setLoading(false)
  }

  async function fetchAllUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "user")
      .neq("is_system_account", true)
      .order("full_name", { ascending: true })

    setAllUsers(data || [])
  }

  async function promoteUser() {
    if (!newStaffEmail || !newStaffRole) return

    setPromoting(true)
    const user = allUsers.find(u => u.email === newStaffEmail)
    
    if (!user) {
      toast({ title: "Error", description: "User not found", variant: "destructive" })
      setPromoting(false)
      return
    }

    await supabase
      .from("profiles")
      .update({ role: newStaffRole })
      .eq("id", user.id)

    await supabase.from("audit_logs").insert({
      action: "role_change",
      entity_type: "profile",
      entity_id: user.id,
      details: { old_role: "user", new_role: newStaffRole, email: user.email },
    })

    toast({ title: "Success", description: `${user.email} has been promoted to ${newStaffRole}` })
    setNewStaffEmail("")
    setNewStaffRole("moderator")
    setPromoting(false)
    fetchStaff()
    fetchAllUsers()
  }

  async function changeRole(userId: string, currentRole: string, newRole: string) {
    await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)

    await supabase.from("audit_logs").insert({
      action: "role_change",
      entity_type: "profile",
      entity_id: userId,
      details: { old_role: currentRole, new_role: newRole },
    })

    toast({ title: "Role updated", description: `User role changed to ${newRole}` })
    fetchStaff()
    if (newRole === "user") fetchAllUsers()
  }

  async function toggleBan(userId: string, currentStatus: boolean) {
    await supabase
      .from("profiles")
      .update({ is_banned: !currentStatus })
      .eq("id", userId)
    fetchStaff()
  }

  const filteredStaff = staff.filter(user =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-primary text-primary-foreground">Super Admin</Badge>
      case "admin":
        return <Badge variant="secondary">Admin</Badge>
      case "moderator":
        return <Badge variant="outline">Moderator</Badge>
      default:
        return <Badge variant="secondary">User</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
        <p className="text-muted-foreground">Manage admins, moderators, and their permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Promote User to Staff
          </CardTitle>
          <CardDescription>Select a user to promote to moderator or admin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Label className="mb-2 block">Select User</Label>
              <Select value={newStaffEmail} onValueChange={setNewStaffEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user to promote" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((user) => (
                    <SelectItem key={user.id} value={user.email || ""}>
                      {user.full_name || user.email} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Label className="mb-2 block">Role</Label>
              <Select value={newStaffRole} onValueChange={setNewStaffRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={promoteUser} disabled={promoting || !newStaffEmail}>
                <UserPlus className="h-4 w-4 mr-2" />
                Promote
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Staff
          </CardTitle>
          <CardDescription>
            {filteredStaff.length} staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {user.is_banned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => changeRole(user.id, user.role, newRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBan(user.id, user.is_banned)}
                          >
                            <Ban className={`h-4 w-4 ${user.is_banned ? "text-destructive" : "text-muted-foreground"}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStaff.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No staff members found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
