"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, Ban, CheckCircle, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [filter])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?filter=${filter}&roleFilter=users_only`)
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

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.phone?.includes(search)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">View and manage all platform users</p>
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
                    <TableHead>Contact</TableHead>
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
                      <TableCell>{user.phone || "N/A"}</TableCell>
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
                            <Badge variant="secondary">Unverified</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>User Details</DialogTitle>
                                <DialogDescription>
                                  Detailed information about {user.full_name || user.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Full Name</p>
                                    <p className="font-medium">{user.full_name || "N/A"}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{user.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium">{user.phone || "N/A"}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Balance</p>
                                    <p className="font-medium">ETB {(user.wallets?.[0]?.balance || 0).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Joined</p>
                                    <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <div className="flex gap-2 mt-1">
                                      {user.is_banned ? (
                                        <Badge variant="destructive">Banned</Badge>
                                      ) : (
                                        <Badge className="bg-success text-success-foreground">Active</Badge>
                                      )}
                                      {user.kyc_verified && (
                                        <Badge variant="outline">KYC Verified</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKyc(user.id, user.kyc_verified)}
                          >
                            <CheckCircle className={`h-4 w-4 ${user.kyc_verified ? "text-success" : "text-muted-foreground"}`} />
                          </Button>
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
