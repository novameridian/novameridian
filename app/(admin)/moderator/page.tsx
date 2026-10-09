"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Users, Search, Ban, UserCheck, Eye, AlertTriangle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface User {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  role: string
  is_banned: boolean
  kyc_verified: boolean
  created_at: string
  wallets: { balance: number } | null
}

interface SecurityFlag {
  id: string
  user_id: string
  flag_type: string
  description: string
  resolved: boolean
  created_at: string
  profiles: { full_name: string; email: string } | null
}

export default function ModeratorDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [flags, setFlags] = useState<SecurityFlag[]>([])
  const [userFilter, setUserFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
    fetchFlags()
  }, [userFilter])

  async function fetchUsers() {
    let query = supabase
      .from("profiles")
      .select("*, wallets(balance)")
      .neq("is_system_account", true) // Hide system accounts from UI
      .order("created_at", { ascending: false })

    if (userFilter === "banned") {
      query = query.eq("is_banned", true)
    } else if (userFilter === "verified") {
      query = query.eq("kyc_verified", true)
    } else if (userFilter === "unverified") {
      query = query.eq("kyc_verified", false)
    }

    const { data } = await query.limit(100)
    setUsers(data || [])
  }

  async function fetchFlags() {
    const { data } = await supabase
      .from("security_flags")
      .select("*, profiles(full_name, email)")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(50)

    setFlags(data || [])
  }

  async function handleBanUser(user: User) {
    setProcessing(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !user.is_banned })
        .eq("id", user.id)

      if (error) throw error

      // Log the action
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: user.is_banned ? "user_unbanned" : "user_banned",
        details: { reason: banReason },
      })

      toast({
        title: user.is_banned ? "User Unbanned" : "User Banned",
        description: `${user.full_name || user.email} has been ${user.is_banned ? "unbanned" : "banned"}.`,
      })

      setSelectedUser(null)
      setBanReason("")
      fetchUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleResolveFlag(flag: SecurityFlag) {
    try {
      const { error } = await supabase
        .from("security_flags")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", flag.id)

      if (error) throw error

      toast({
        title: "Flag Resolved",
        description: "The security flag has been marked as resolved.",
      })

      fetchFlags()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve flag.",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Moderator Dashboard</h1>
        <p className="text-muted-foreground">Manage users and security flags</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
            <Ban className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.is_banned).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Flags</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flags.length}</div>
          </CardContent>
        </Card>
      </div>

      {flags.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Security Flags
            </CardTitle>
            <CardDescription>Active security concerns requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{flag.profiles?.full_name || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">{flag.profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{flag.flag_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{flag.description}</TableCell>
                    <TableCell>{new Date(flag.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveFlag(flag)}
                      >
                        Resolve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage user accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="verified">KYC Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.full_name || "No name"}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{user.phone || "—"}</TableCell>
                  <TableCell className="font-medium">
                    ${Number(user.wallets?.balance || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.is_banned && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                      {user.kyc_verified ? (
                        <Badge variant="default">Verified</Badge>
                      ) : (
                        <Badge variant="secondary">Unverified</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View and manage user account</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedUser.full_name || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedUser.phone || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Balance</Label>
                  <p className="font-medium">${Number(selectedUser.wallets?.balance || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="font-medium capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedUser.is_banned && (
                  <Badge variant="destructive">Banned</Badge>
                )}
                {selectedUser.kyc_verified ? (
                  <Badge variant="default">KYC Verified</Badge>
                ) : (
                  <Badge variant="secondary">KYC Pending</Badge>
                )}
              </div>

              {!selectedUser.is_banned && (
                <div>
                  <Label htmlFor="banReason">Reason for banning (optional)</Label>
                  <Textarea
                    id="banReason"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedUser && (
              <Button
                variant={selectedUser.is_banned ? "default" : "destructive"}
                onClick={() => handleBanUser(selectedUser)}
                disabled={processing}
              >
                {selectedUser.is_banned ? (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Unban User
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    Ban User
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
