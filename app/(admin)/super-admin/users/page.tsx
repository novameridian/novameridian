"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, Ban, CheckCircle, Eye, Wallet, Trash2, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string
  kyc_verified: boolean
  is_banned: boolean
  created_at: string
  wallets: { balance: number }[] | null
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [walletAdjustment, setWalletAdjustment] = useState("")
  const [adjusting, setAdjusting] = useState(false)
  const [processingAction, setProcessingAction] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [filter])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?filter=${filter}`)
      const data = await res.json()
      
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to fetch users", variant: "destructive" })
        setUsers([])
      } else {
        setUsers(data.users || [])
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" })
      setUsers([])
    }
    setLoading(false)
  }

  async function toggleBan(userId: string, currentStatus: boolean) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "toggle_ban", value: !currentStatus }),
      })
      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" })
    }
  }

  async function toggleKyc(userId: string, currentStatus: boolean) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "toggle_kyc", value: !currentStatus }),
      })
      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" })
    }
  }

  async function adjustWallet(user: Profile) {
    const amount = parseFloat(walletAdjustment)
    if (isNaN(amount)) return

    setAdjusting(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action: "adjust_wallet", walletAdjustment: amount }),
      })
      
      if (res.ok) {
        toast({ 
          title: "Wallet adjusted", 
          description: `${amount > 0 ? "Added" : "Deducted"} ETB ${Math.abs(amount).toLocaleString()} ${amount > 0 ? "to" : "from"} user wallet.` 
        })
        setWalletAdjustment("")
        fetchUsers()
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.error || "Failed to adjust wallet", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to adjust wallet", variant: "destructive" })
    }
    setAdjusting(false)
  }

  async function handleSuspendUser(userId: string) {
    setProcessingAction(true)
    setActionInProgress(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "suspend_user" }),
      })
      
      if (res.ok) {
        toast({ 
          title: "User suspended", 
          description: "The user's account has been suspended. They cannot log in or perform transactions."
        })
        setSelectedUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.error || "Failed to suspend user", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to suspend user", variant: "destructive" })
    } finally {
      setProcessingAction(false)
      setActionInProgress(null)
    }
  }

  async function handleReactivateUser(userId: string) {
    setProcessingAction(true)
    setActionInProgress(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "reactivate_user" }),
      })
      
      if (res.ok) {
        toast({ 
          title: "User reactivated", 
          description: "The user's account has been reactivated. They can now log in."
        })
        setSelectedUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.error || "Failed to reactivate user", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reactivate user", variant: "destructive" })
    } finally {
      setProcessingAction(false)
      setActionInProgress(null)
    }
  }

  async function handleDeleteUser(userId: string) {
    setProcessingAction(true)
    setActionInProgress(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "delete_user" }),
      })
      
      if (res.ok) {
        toast({ 
          title: "User deleted", 
          description: "The user account has been permanently deleted."
        })
        setSelectedUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.error || "Failed to delete user", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" })
    } finally {
      setProcessingAction(false)
      setActionInProgress(null)
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.phone?.includes(search)
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
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Full control over all platform users and wallets</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} users found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="user">Regular Users</SelectItem>
                <SelectItem value="staff">Staff Only</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
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
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        ETB {(user.wallets?.[0]?.balance || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.is_banned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : user.kyc_verified ? (
                            <Badge className="bg-success text-success-foreground">Verified</Badge>
                          ) : (
                            <Badge variant="secondary">Active</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSelectedUser(user)}
                                title="View full user profile"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>User Profile & Management</DialogTitle>
                                <DialogDescription>
                                  Complete user information and administrative actions for {user.full_name || user.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6 pt-4">
                                {/* Account Information */}
                                <div className="space-y-3">
                                  <h3 className="font-semibold flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Account Information
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">User ID</p>
                                      <p className="font-mono text-xs">{user.id.slice(0, 8)}...</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Full Name</p>
                                      <p className="font-medium">{user.full_name || "N/A"}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Email</p>
                                      <p className="font-medium text-sm">{user.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Phone</p>
                                      <p className="font-medium">{user.phone || "N/A"}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Role</p>
                                      {getRoleBadge(user.role)}
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Registration Date</p>
                                      <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Account Status */}
                                <div className="space-y-3">
                                  <h3 className="font-semibold flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Account Status
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Status</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {user.is_banned ? (
                                          <>
                                            <Badge variant="destructive">Suspended</Badge>
                                            <span className="text-xs text-muted-foreground">(Cannot log in)</span>
                                          </>
                                        ) : (
                                          <Badge className="bg-success text-success-foreground">Active</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">KYC Verification</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {user.kyc_verified ? (
                                          <Badge className="bg-success text-success-foreground">Verified</Badge>
                                        ) : (
                                          <Badge variant="secondary">Unverified</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Wallet Information */}
                                <div className="space-y-3 border-t pt-4">
                                  <h3 className="font-semibold flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    Wallet & Transactions
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Current Balance</p>
                                      <p className="text-2xl font-bold">ETB {(user.wallets?.[0]?.balance || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Account Status</p>
                                      <p className="text-sm font-medium mt-1">{user.is_banned ? "Suspended Account" : "Active Account"}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Wallet Adjustment */}
                                <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                                  <Label className="flex items-center gap-2 font-semibold">
                                    <Wallet className="h-4 w-4" />
                                    Adjust Wallet Balance
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      placeholder="Enter amount (negative to deduct)"
                                      value={walletAdjustment}
                                      onChange={(e) => setWalletAdjustment(e.target.value)}
                                    />
                                    <Button 
                                      onClick={() => adjustWallet(user)}
                                      disabled={adjusting || !walletAdjustment}
                                    >
                                      {adjusting ? "Adjusting..." : "Apply"}
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Use positive numbers to add, negative to deduct. Creates audit log.
                                  </p>
                                </div>

                                {/* Account Actions */}
                                <div className="space-y-3 border-t pt-4">
                                  <h3 className="font-semibold">Administrative Actions</h3>
                                  <div className="grid grid-cols-2 gap-2">
                                    {user.is_banned ? (
                                      <Button
                                        onClick={() => handleReactivateUser(user.id)}
                                        disabled={processingAction && actionInProgress === user.id}
                                        className="bg-success text-success-foreground hover:bg-success/90"
                                      >
                                        {processingAction && actionInProgress === user.id ? "Reactivating..." : "Reactivate Account"}
                                      </Button>
                                    ) : (
                                      <Button
                                        onClick={() => handleSuspendUser(user.id)}
                                        disabled={processingAction && actionInProgress === user.id}
                                        variant="destructive"
                                      >
                                        {processingAction && actionInProgress === user.id ? "Suspending..." : "Suspend Account"}
                                      </Button>
                                    )}
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="gap-2">
                                          <Trash2 className="h-4 w-4" />
                                          Delete User
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                            <AlertTriangle className="h-5 w-5" />
                                            Permanently Delete User
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. The user account will be permanently deleted:
                                            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                                              <li>All authentication data will be removed</li>
                                              <li>User will no longer be able to log in</li>
                                              <li>The email can be used to create a new account</li>
                                              <li>All user records will be archived</li>
                                              <li>This action will be logged in audit trail</li>
                                            </ul>
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteUser(user.id)}
                                          disabled={processingAction && actionInProgress === user.id}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          {processingAction && actionInProgress === user.id ? "Deleting..." : "Yes, Delete Permanently"}
                                        </AlertDialogAction>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKyc(user.id, user.kyc_verified)}
                            title={user.kyc_verified ? "Unverify KYC" : "Verify KYC"}
                          >
                            <CheckCircle className={`h-4 w-4 ${user.kyc_verified ? "text-success" : "text-muted-foreground"}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => user.is_banned ? handleReactivateUser(user.id) : handleSuspendUser(user.id)}
                            disabled={processingAction && actionInProgress === user.id}
                            title={user.is_banned ? "Reactivate account" : "Suspend account"}
                          >
                            <Ban className={`h-4 w-4 ${user.is_banned ? "text-destructive" : "text-muted-foreground"}`} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                title="Delete user permanently"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                  <AlertTriangle className="h-5 w-5" />
                                  Delete User Permanently
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {user.full_name || user.email}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={processingAction && actionInProgress === user.id}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {processingAction && actionInProgress === user.id ? "Deleting..." : "Yes, Delete"}
                              </AlertDialogAction>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found
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
