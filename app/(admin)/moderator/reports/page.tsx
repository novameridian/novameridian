"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, CheckCircle, XCircle, Eye, Flag } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface SecurityFlag {
  id: string
  user_id: string
  flag_type: string
  description: string | null
  status: string
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
}

export default function ModeratorReportsPage() {
  const [flags, setFlags] = useState<SecurityFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("pending")
  const [selectedFlag, setSelectedFlag] = useState<SecurityFlag | null>(null)
  const [resolution, setResolution] = useState("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchFlags()
  }, [filter])

  async function fetchFlags() {
    setLoading(true)
    let query = supabase
      .from("security_flags")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })

    if (filter !== "all") {
      query = query.eq("status", filter)
    }

    const { data } = await query.limit(100)
    setFlags(data || [])
    setLoading(false)
  }

  async function resolveFlag(flag: SecurityFlag, newStatus: "resolved" | "dismissed") {
    setProcessing(true)
    
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from("security_flags")
      .update({ 
        status: newStatus, 
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", flag.id)

    await supabase.from("audit_logs").insert({
      user_id: user?.id,
      action: "flag_resolution",
      entity_type: "security_flag",
      entity_id: flag.id,
      details: { 
        flag_type: flag.flag_type, 
        resolution: newStatus,
        note: resolution,
        flagged_user: flag.user_id,
      },
    })

    toast({ 
      title: newStatus === "resolved" ? "Flag resolved" : "Flag dismissed", 
      description: `The security flag has been ${newStatus}.` 
    })
    setSelectedFlag(null)
    setResolution("")
    setProcessing(false)
    fetchFlags()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" /> Pending</Badge>
      case "resolved":
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" /> Resolved</Badge>
      case "dismissed":
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" /> Dismissed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getFlagTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      suspicious_activity: "bg-destructive/10 text-destructive",
      multiple_accounts: "bg-orange-500/10 text-orange-500",
      unusual_transaction: "bg-warning/10 text-warning",
      fraud_report: "bg-destructive/10 text-destructive",
      kyc_issue: "bg-info/10 text-info",
      other: "bg-muted text-muted-foreground",
    }
    return (
      <Badge className={colors[type] || colors.other}>
        {type.replace(/_/g, " ")}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Flags</h1>
        <p className="text-muted-foreground">Review and resolve security flags and user reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {flags.filter(f => f.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {flags.filter(f => 
                f.status === "resolved" && 
                new Date(f.resolved_at || "").toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully handled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flags.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Security Flags
          </CardTitle>
          <CardDescription>
            {flags.length} flags found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter flags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flags</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
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
                    <TableHead>Flag Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flags.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{flag.profiles?.full_name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{flag.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getFlagTypeBadge(flag.flag_type)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {flag.description || "No description"}
                      </TableCell>
                      <TableCell>{getStatusBadge(flag.status)}</TableCell>
                      <TableCell>{new Date(flag.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedFlag(flag)
                              setResolution("")
                            }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Flag Details</DialogTitle>
                              <DialogDescription>
                                Review security flag for {flag.profiles?.full_name || flag.profiles?.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Flag Type</p>
                                  {getFlagTypeBadge(flag.flag_type)}
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Status</p>
                                  {getStatusBadge(flag.status)}
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Created</p>
                                  <p className="font-medium">{new Date(flag.created_at).toLocaleString()}</p>
                                </div>
                                {flag.resolved_at && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Resolved</p>
                                    <p className="font-medium">{new Date(flag.resolved_at).toLocaleString()}</p>
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">Description</p>
                                <p className="bg-muted p-3 rounded-md">{flag.description || "No description provided"}</p>
                              </div>

                              {flag.status === "pending" && (
                                <>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">Resolution Notes</p>
                                    <Textarea
                                      value={resolution}
                                      onChange={(e) => setResolution(e.target.value)}
                                      placeholder="Add notes about how this flag was resolved..."
                                    />
                                  </div>
                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      className="flex-1"
                                      onClick={() => resolveFlag(flag, "resolved")}
                                      disabled={processing}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Resolve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="flex-1 bg-transparent"
                                      onClick={() => resolveFlag(flag, "dismissed")}
                                      disabled={processing}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Dismiss
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {flags.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No security flags found
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
