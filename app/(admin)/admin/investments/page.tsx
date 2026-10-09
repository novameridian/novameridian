"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"

interface Order {
  id: string
  user_id: string
  amount: number
  expected_return: number
  status: string
  start_date: string
  end_date: string
  created_at: string
  investment_plans: { name: string; daily_reward_percentage: number } | null
  profiles: { full_name: string | null; email: string | null } | null
}

export default function AdminInvestmentsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [stats, setStats] = useState({
    totalInvested: 0,
    activeOrders: 0,
    completedOrders: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [filter])

  async function fetchOrders() {
    setLoading(true)
    let query = supabase
      .from("orders")
      .select("*, investment_plans(name, daily_reward_percentage), profiles(full_name, email)")
      .order("created_at", { ascending: false })

    if (filter !== "all") {
      query = query.eq("status", filter)
    }

    const { data } = await query.limit(100)
    setOrders(data || [])
    setLoading(false)
  }

  async function fetchStats() {
    const [activeRes, completedRes, totalRes] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("is_completed", true),
      supabase.from("orders").select("amount").eq("is_active", true),
    ])

    const totalInvested = totalRes.data?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0

    setStats({
      totalInvested,
      activeOrders: activeRes.count || 0,
      completedOrders: completedRes.count || 0,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground"><Clock className="h-3 w-3 mr-1" /> Active</Badge>
      case "completed":
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investment Orders</h1>
        <p className="text-muted-foreground">Track all user investments and returns</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ETB {stats.totalInvested.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active investments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">Currently earning</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            All Investment Orders
          </CardTitle>
          <CardDescription>
            {orders.length} orders found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.profiles?.full_name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{order.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.investment_plans?.name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.investment_plans?.daily_reward_percentage}% daily
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ETB {(Number(order?.amount ?? 0)).toLocaleString()}
                      </TableCell>

                      <TableCell className="font-medium text-success">
                        ETB {(Number(order?.expected_return ?? 0)).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(order?.status ?? "unknown")}
                      </TableCell>

                      <TableCell>
                        {order?.end_date
                          ? new Date(order.end_date).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No orders found
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
