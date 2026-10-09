"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Receipt, Search, ArrowUpCircle, ArrowDownCircle, TrendingUp, Gift, Settings } from "lucide-react"

interface Transaction {
  id: string
  user_id: string
  type: string
  amount: number
  status: string
  description: string | null
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const supabase = createClient()

  useEffect(() => {
    fetchTransactions()
  }, [filter])

  async function fetchTransactions() {
    setLoading(true)
    let query = supabase
      .from("transactions")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })

    if (filter !== "all") {
      query = query.eq("type", filter)
    }

    const { data } = await query.limit(200)
    setTransactions(data || [])
    setLoading(false)
  }

  const filteredTransactions = transactions.filter(tx =>
    tx.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    tx.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
    tx.description?.toLowerCase().includes(search.toLowerCase())
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="h-4 w-4 text-success" />
      case "withdrawal":
        return <ArrowUpCircle className="h-4 w-4 text-destructive" />
      case "investment":
        return <TrendingUp className="h-4 w-4 text-primary" />
      case "reward":
      case "referral_bonus":
        return <Gift className="h-4 w-4 text-warning" />
      case "admin_credit":
      case "admin_debit":
        return <Settings className="h-4 w-4 text-muted-foreground" />
      default:
        return <Receipt className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      deposit: "bg-success/10 text-success",
      withdrawal: "bg-destructive/10 text-destructive",
      investment: "bg-primary/10 text-primary",
      reward: "bg-warning/10 text-warning",
      referral_bonus: "bg-warning/10 text-warning",
      admin_credit: "bg-muted text-muted-foreground",
      admin_debit: "bg-muted text-muted-foreground",
    }
    return (
      <Badge className={colors[type] || "bg-muted text-muted-foreground"}>
        {type.replace(/_/g, " ")}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground">Completed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calculate summary stats
  const totalDeposits = transactions.filter(t => t.type === "deposit" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0)
  const totalWithdrawals = transactions.filter(t => t.type === "withdrawal" && t.status === "completed").reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const totalInvested = transactions.filter(t => t.type === "investment" && t.status === "completed").reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
        <p className="text-muted-foreground">View all platform transactions and financial logs</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ETB {totalDeposits.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ETB {totalWithdrawals.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ETB {totalInvested.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            All Transactions
          </CardTitle>
          <CardDescription>
            {filteredTransactions.length} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="investment">Investments</SelectItem>
                <SelectItem value="reward">Rewards</SelectItem>
                <SelectItem value="admin_credit">Admin Credits</SelectItem>
                <SelectItem value="admin_debit">Admin Debits</SelectItem>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.profiles?.full_name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{tx.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tx.type)}
                          {getTypeBadge(tx.type)}
                        </div>
                      </TableCell>
                      <TableCell className={`font-medium ${tx.amount >= 0 ? "text-success" : "text-destructive"}`}>
                        {tx.amount >= 0 ? "+" : ""}ETB {tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {tx.description || "-"}
                      </TableCell>
                      <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No transactions found
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
