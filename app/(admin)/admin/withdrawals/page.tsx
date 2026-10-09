"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpCircle, CheckCircle, XCircle, Eye, Clock, Loader2, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  payment_method: string
  account_details: string | null
  status: string
  notes: string | null
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchWithdrawals()
  }, [filter])

  async function fetchWithdrawals() {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/withdrawals?filter=${filter}`)
      const data = await response.json()
      
      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" })
        setWithdrawals([])
      } else {
        setWithdrawals(data.withdrawals || [])
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error)
      toast({ title: "Error", description: "Failed to fetch withdrawals", variant: "destructive" })
      setWithdrawals([])
    }
    setLoading(false)
  }

  async function handleAction(withdrawal: Withdrawal, action: "approve" | "reject") {
    setProcessing(true)
    try {
      const response = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId: withdrawal.id,
          action,
          adminNotes,
        }),
      })

      const data = await response.json()

      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      } else {
        toast({
          title: action === "approve" ? "Withdrawal Approved" : "Withdrawal Rejected",
          description: action === "approve"
            ? `ETB ${withdrawal.amount.toLocaleString()} withdrawal approved.`
            : "The withdrawal has been rejected and funds refunded to the user.",
        })
        setSelectedWithdrawal(null)
        setAdminNotes("")
        fetchWithdrawals()
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error)
      toast({ title: "Error", description: "Failed to process withdrawal", variant: "destructive" })
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
          <h1 className="text-3xl font-bold tracking-tight">Withdrawal Requests</h1>
          <p className="text-muted-foreground">Review and approve user withdrawal requests</p>
        </div>
        <Button variant="outline" onClick={() => fetchWithdrawals()} disabled={loading} className="bg-transparent">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5" />
            All Withdrawals
          </CardTitle>
          <CardDescription>
            {withdrawals.length} withdrawals found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter withdrawals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Withdrawals</SelectItem>
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
                    <TableHead>Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{withdrawal.profiles?.full_name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{withdrawal.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ETB {withdrawal.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="uppercase">{withdrawal.payment_method}</TableCell>
                      <TableCell className="font-mono text-sm">{withdrawal.account_details || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                      <TableCell>{new Date(withdrawal.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedWithdrawal(withdrawal)
                              setAdminNotes(withdrawal.notes || "")
                            }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Withdrawal Details</DialogTitle>
                              <DialogDescription>
                                Review withdrawal request from {withdrawal.profiles?.full_name || withdrawal.profiles?.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Amount</p>
                                  <p className="text-xl font-bold">ETB {withdrawal.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Payment Method</p>
                                  <p className="font-medium uppercase">{withdrawal.payment_method}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-muted-foreground">Account Details</p>
                                  <p className="font-mono font-medium">{withdrawal.account_details || "Not provided"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Date</p>
                                  <p className="font-medium">{new Date(withdrawal.created_at).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Status</p>
                                  {getStatusBadge(withdrawal.status)}
                                </div>
                              </div>

                              <div>
                                <p className="text-sm text-muted-foreground mb-2">Admin Notes</p>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add notes about this withdrawal..."
                                  disabled={withdrawal.status !== "pending"}
                                />
                              </div>

                              {withdrawal.status === "pending" && (
                                <div className="flex gap-2 pt-4">
                                  <Button
                                    className="flex-1"
                                    onClick={() => handleAction(withdrawal, "approve")}
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
                                    onClick={() => handleAction(withdrawal, "reject")}
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
                  {withdrawals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No withdrawals found
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
