"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDownCircle, CheckCircle, XCircle, Eye, Clock, Loader2, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface Deposit {
  id: string
  user_id: string
  amount: number
  payment_method: string
  status: string
  notes: string | null
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchDeposits()
  }, [filter])

  async function fetchDeposits() {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/deposits?filter=${filter}`)
      const data = await response.json()
      
      if (!response.ok) {
        console.error("[NovaMeridian] API error:", response.status, data.error)
        toast({ title: "Error", description: data.error || "Failed to fetch deposits", variant: "destructive" })
        setDeposits([])
      } else if (data.error) {
        console.error("[NovaMeridian] Data error:", data.error)
        toast({ title: "Error", description: data.error, variant: "destructive" })
        setDeposits([])
      } else {
        setDeposits(data.deposits || [])
      }
    } catch (error) {
      console.error("[NovaMeridian] Error fetching deposits:", error)
      toast({ title: "Error", description: "Failed to fetch deposits", variant: "destructive" })
      setDeposits([])
    }
    setLoading(false)
  }

  async function handleAction(deposit: Deposit, action: "approve" | "reject") {
    setProcessing(true)
    try {
      const response = await fetch("/api/admin/deposits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositId: deposit.id,
          action,
          adminNotes,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        console.error("[NovaMeridian] Action failed:", data.error)
        toast({ title: "Error", description: data.error || "Failed to process deposit", variant: "destructive" })
      } else {
        toast({
          title: action === "approve" ? "Deposit Approved" : "Deposit Rejected",
          description: action === "approve"
            ? `ETB ${deposit.amount.toLocaleString()} added to user's wallet.`
            : "The deposit has been rejected.",
        })
        setSelectedDeposit(null)
        setAdminNotes("")
        fetchDeposits()
      }
    } catch (error) {
      console.error("[NovaMeridian] Error processing deposit:", error)
      toast({ title: "Error", description: "Failed to process deposit", variant: "destructive" })
    }
    setProcessing(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
      case "approved":
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deposit Requests</h1>
          <p className="text-muted-foreground">Review and approve user deposit requests</p>
        </div>
        <Button variant="outline" onClick={() => fetchDeposits()} disabled={loading} className="bg-transparent">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5" />
            All Deposits
          </CardTitle>
          <CardDescription>
            {deposits.length} deposits found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter deposits" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deposits</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{deposit.profiles?.full_name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{deposit.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ETB {deposit.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="uppercase">{deposit.payment_method}</TableCell>
                      <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                      <TableCell>{new Date(deposit.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedDeposit(deposit)
                              setAdminNotes(deposit.notes || "")
                            }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Deposit Details</DialogTitle>
                              <DialogDescription>
                                Review deposit request from {deposit.profiles?.full_name || deposit.profiles?.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Amount</p>
                                  <p className="text-xl font-bold">ETB {deposit.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Payment Method</p>
                                  <p className="font-medium uppercase">{deposit.payment_method}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Date</p>
                                  <p className="font-medium">{new Date(deposit.created_at).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Status</p>
                                  {getStatusBadge(deposit.status)}
                                </div>
                              </div>

                              <div>
                                <p className="text-sm text-muted-foreground mb-2">Admin Notes</p>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add notes about this deposit..."
                                  disabled={deposit.status !== "pending"}
                                />
                              </div>

                              {deposit.status === "pending" && (
                                <div className="flex gap-2 pt-4">
                                  <Button
                                    className="flex-1"
                                    onClick={() => handleAction(deposit, "approve")}
                                    disabled={processing}
                                  >
                                    {processing ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                    )}
                                    {processing ? "Processing..." : "Approve"}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleAction(deposit, "reject")}
                                    disabled={processing}
                                  >
                                    {processing ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4 mr-2" />
                                    )}
                                    {processing ? "Processing..." : "Reject"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {deposits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No deposits found
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
