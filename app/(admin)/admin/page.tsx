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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Users, DollarSign, TrendingUp, Clock, Search, CheckCircle, XCircle, Eye } from "lucide-react"

interface Deposit {
  id: string
  user_id: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  profiles: { full_name: string; email: string } | null
}

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  payment_method: string
  payment_address: string
  status: string
  created_at: string
  profiles: { full_name: string; email: string } | null
}

interface Stats {
  totalUsers: number
  pendingDeposits: number
  pendingWithdrawals: number
  totalInvested: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, pendingDeposits: 0, pendingWithdrawals: 0, totalInvested: 0 })
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [depositFilter, setDepositFilter] = useState("pending")
  const [withdrawalFilter, setWithdrawalFilter] = useState("pending")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
    fetchDeposits()
    fetchWithdrawals()
  }, [depositFilter, withdrawalFilter])

  async function fetchStats() {
    const [usersRes, depositsRes, withdrawalsRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).neq("is_system_account", true),
      supabase.from("deposits").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("amount").or("is_active.eq.true,is_completed.eq.true"),
    ])

    const totalInvested = ordersRes.data?.reduce((sum, o) => sum + Number(o.amount), 0) || 0

    setStats({
      totalUsers: usersRes.count || 0,
      pendingDeposits: depositsRes.count || 0,
      pendingWithdrawals: withdrawalsRes.count || 0,
      totalInvested,
    })
  }

  async function fetchDeposits() {
    let query = supabase
      .from("deposits")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })

    if (depositFilter !== "all") {
      query = query.eq("status", depositFilter)
    }

    const { data } = await query.limit(50)
    setDeposits(data || [])
  }

  async function fetchWithdrawals() {
    let query = supabase
      .from("withdrawals")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })

    if (withdrawalFilter !== "all") {
      query = query.eq("status", withdrawalFilter)
    }

    const { data } = await query.limit(50)
    setWithdrawals(data || [])
  }

  async function handleDepositAction(deposit: Deposit, action: "approved" | "rejected") {
    setProcessing(true)
    try {
      const { error: depositError } = await supabase
        .from("deposits")
        .update({ 
          status: action, 
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", deposit.id)

      if (depositError) throw depositError

      if (action === "approved") {
        // Credit wallet
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", deposit.user_id)
          .single()

        if (wallet) {
          const newBalance = Number(wallet.balance) + Number(deposit.amount)
          await supabase
            .from("wallets")
            .update({ balance: newBalance })
            .eq("user_id", deposit.user_id)

          // Create transaction record
          await supabase.from("transactions").insert({
            user_id: deposit.user_id,
            type: "deposit",
            amount: deposit.amount,
            description: `Deposit via ${deposit.payment_method}`,
            reference_id: deposit.id,
          })
        }
      }

      toast({
        title: action === "approved" ? "Deposit Approved" : "Deposit Rejected",
        description: `The deposit of $${deposit.amount} has been ${action}.`,
      })

      setSelectedDeposit(null)
      fetchDeposits()
      fetchStats()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process deposit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleWithdrawalAction(withdrawal: Withdrawal, action: "approved" | "rejected") {
    setProcessing(true)
    try {
      if (action === "approved") {
        // Check wallet balance
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", withdrawal.user_id)
          .single()

        if (!wallet || Number(wallet.balance) < Number(withdrawal.amount)) {
          toast({
            title: "Insufficient Balance",
            description: "User does not have enough balance for this withdrawal.",
            variant: "destructive",
          })
          setProcessing(false)
          return
        }

        // Deduct from wallet
        const newBalance = Number(wallet.balance) - Number(withdrawal.amount)
        await supabase
          .from("wallets")
          .update({ balance: newBalance })
          .eq("user_id", withdrawal.user_id)

        // Create transaction record
        await supabase.from("transactions").insert({
          user_id: withdrawal.user_id,
          type: "withdrawal",
          amount: -withdrawal.amount,
          description: `Withdrawal to ${withdrawal.payment_method}`,
          reference_id: withdrawal.id,
        })
      }

      const { error } = await supabase
        .from("withdrawals")
        .update({ 
          status: action, 
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id)

      if (error) throw error

      toast({
        title: action === "approved" ? "Withdrawal Approved" : "Withdrawal Rejected",
        description: `The withdrawal of $${withdrawal.amount} has been ${action}.`,
      })

      setSelectedWithdrawal(null)
      fetchWithdrawals()
      fetchStats()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process withdrawal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const filteredDeposits = deposits.filter(d => 
    d.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredWithdrawals = withdrawals.filter(w => 
    w.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage deposits, withdrawals, and users</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDeposits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingWithdrawals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalInvested.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="deposits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={depositFilter} onValueChange={setDepositFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Deposit Requests</CardTitle>
              <CardDescription>Review and manage deposit requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deposit.profiles?.full_name || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">{deposit.profiles?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">${Number(deposit.amount).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{deposit.payment_method}</TableCell>
                      <TableCell>{new Date(deposit.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          deposit.status === "approved" ? "default" :
                          deposit.status === "rejected" ? "destructive" : "secondary"
                        }>
                          {deposit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDeposit(deposit)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredDeposits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No deposits found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={withdrawalFilter} onValueChange={setWithdrawalFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
              <CardDescription>Review and manage withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{withdrawal.profiles?.full_name || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">{withdrawal.profiles?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">${Number(withdrawal.amount).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{withdrawal.payment_method}</TableCell>
                      <TableCell className="max-w-32 truncate font-mono text-xs">{withdrawal.payment_address}</TableCell>
                      <TableCell>{new Date(withdrawal.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          withdrawal.status === "approved" ? "default" :
                          withdrawal.status === "rejected" ? "destructive" : "secondary"
                        }>
                          {withdrawal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedWithdrawal(withdrawal)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredWithdrawals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No withdrawals found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deposit Detail Dialog */}
      <Dialog open={!!selectedDeposit} onOpenChange={() => setSelectedDeposit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit Details</DialogTitle>
            <DialogDescription>Review deposit request from {selectedDeposit?.profiles?.full_name}</DialogDescription>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-xl font-bold">${Number(selectedDeposit.amount).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Method</Label>
                  <p className="font-medium capitalize">{selectedDeposit.payment_method}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User Email</Label>
                  <p className="font-medium">{selectedDeposit.profiles?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{new Date(selectedDeposit.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedDeposit?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleDepositAction(selectedDeposit, "rejected")}
                  disabled={processing}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleDepositAction(selectedDeposit, "approved")}
                  disabled={processing}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Detail Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
            <DialogDescription>Review withdrawal request from {selectedWithdrawal?.profiles?.full_name}</DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-xl font-bold">${Number(selectedWithdrawal.amount).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Method</Label>
                  <p className="font-medium capitalize">{selectedWithdrawal.payment_method}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Payment Address</Label>
                  <p className="font-mono text-sm break-all bg-muted p-2 rounded mt-1">{selectedWithdrawal.payment_address}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User Email</Label>
                  <p className="font-medium">{selectedWithdrawal.profiles?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{new Date(selectedWithdrawal.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedWithdrawal?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleWithdrawalAction(selectedWithdrawal, "rejected")}
                  disabled={processing}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleWithdrawalAction(selectedWithdrawal, "approved")}
                  disabled={processing}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
