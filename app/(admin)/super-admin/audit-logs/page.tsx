"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, RefreshCw, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
}

export default function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchLogs()
  }, [filter])

  async function fetchLogs() {
    setLoading(true)
    let query = supabase
      .from("audit_logs")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })

    if (filter !== "all") {
      query = query.eq("action", filter)
    }

    const { data } = await query.limit(200)
    setLogs(data || [])
    setLoading(false)
  }

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      login: "bg-info/10 text-info",
      signup: "bg-success/10 text-success",
      deposit: "bg-success/10 text-success",
      withdrawal: "bg-orange-500/10 text-orange-500",
      investment: "bg-purple-500/10 text-purple-500",
      role_change: "bg-warning/10 text-warning",
      wallet_adjustment: "bg-destructive/10 text-destructive",
      settings_update: "bg-pink-500/10 text-pink-500",
      ban: "bg-destructive/10 text-destructive",
      kyc_update: "bg-cyan-500/10 text-cyan-500",
    }
    return (
      <Badge className={colors[action] || "bg-muted text-muted-foreground"}>
        {action.replace(/_/g, " ")}
      </Badge>
    )
  }

  const uniqueActions = [...new Set(logs.map(l => l.action))]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Complete history of all platform activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            {logs.length} log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
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
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium capitalize">{log.entity_type}</p>
                          {log.entity_id && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {log.entity_id.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.profiles ? (
                          <div>
                            <p className="font-medium">{log.profiles.full_name || "N/A"}</p>
                            <p className="text-sm text-muted-foreground">{log.profiles.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{new Date(log.created_at).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.details && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Log Details</DialogTitle>
                                <DialogDescription>
                                  {log.action} on {log.entity_type} at {new Date(log.created_at).toLocaleString()}
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="max-h-[400px]">
                                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No audit logs found
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
