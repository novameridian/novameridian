'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit2, Trash2, Eye, AlertTriangle } from 'lucide-react'

interface InvestmentPlan {
  id: string
  name: string
  description: string
  min_amount: number
  max_amount: number
  duration_days: number
  daily_reward_percentage: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function InvestmentPlansPage() {
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null)
  const [processing, setProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    min_amount: 0,
    max_amount: 0,
    duration_days: 0,
    daily_reward_percentage: 0,
    is_active: true,
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('[NovaMeridian] Error fetching plans:', error)
      toast({ title: 'Error', description: 'Failed to fetch plans', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  function calculateTotalProfit(daily_reward_percentage: number, duration_days: number, min_amount: number, max_amount: number) {
    const calc_total_amount = daily_reward_percentage * duration_days
    const calc_total_min_amount = Math.round(calc_total_amount * min_amount / 100)
    const calc_total_max_amount = Math.round(calc_total_amount * max_amount / 100)

    const calc_total_profit = `${String(calc_total_min_amount)} - ${String(calc_total_max_amount)}`

    return calc_total_profit
  }

  async function handleCreatePlan() {
    if (!formData.name || !formData.min_amount || !formData.max_amount || !formData.duration_days || !formData.daily_reward_percentage) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' })
      return
    }

    setProcessing(true)
    try {

      const { error } = await supabase.from('investment_plans').insert({
        ...formData,
      })

      if (error) throw error

      toast({ title: 'Success', description: 'Investment plan created successfully' })
      setIsCreating(false)
      resetForm()
      fetchPlans()

      // Log action
      await supabase.from('audit_logs').insert({
        action: 'plan_created',
        entity_type: 'investment_plan',
        details: { plan_name: formData.name },
      })
    } catch (error) {
      console.error('[NovaMeridian] Error creating plan:', error)
      toast({ title: 'Error', description: 'Failed to create plan', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleUpdatePlan() {
    if (!selectedPlan) return

    setProcessing(true)
    try {

      const { error } = await supabase
        .from('investment_plans')
        .update({ ...formData })
        .eq('id', selectedPlan.id)

      if (error) throw error

      toast({ title: 'Success', description: 'Investment plan updated successfully' })
      setIsEditing(false)
      setSelectedPlan(null)
      fetchPlans()

      // Log action
      await supabase.from('audit_logs').insert({
        action: 'plan_updated',
        entity_type: 'investment_plan',
        entity_id: selectedPlan.id,
        details: { plan_name: formData.name },
      })
    } catch (error) {
      console.error('[NovaMeridian] Error updating plan:', error)
      toast({ title: 'Error', description: 'Failed to update plan', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleDeletePlan(plan: InvestmentPlan) {
    setProcessing(true)
    try {
      const { error } = await supabase.from('investment_plans').delete().eq('id', plan.id)

      if (error) throw error

      toast({ title: 'Success', description: 'Investment plan deleted successfully' })
      fetchPlans()

      // Log action
      await supabase.from('audit_logs').insert({
        action: 'plan_deleted',
        entity_type: 'investment_plan',
        entity_id: plan.id,
        details: { plan_name: plan.name },
      })
    } catch (error) {
      console.error('[NovaMeridian] Error deleting plan:', error)
      toast({ title: 'Error', description: 'Failed to delete plan', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  async function handleToggleStatus(plan: InvestmentPlan) {
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('investment_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: `Plan ${!plan.is_active ? 'activated' : 'deactivated'} successfully`,
      })
      fetchPlans()

      // Log action
      await supabase.from('audit_logs').insert({
        action: !plan.is_active ? 'plan_activated' : 'plan_deactivated',
        entity_type: 'investment_plan',
        entity_id: plan.id,
        details: { plan_name: plan.name },
      })
    } catch (error) {
      console.error('[NovaMeridian] Error toggling status:', error)
      toast({ title: 'Error', description: 'Failed to toggle status', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      min_amount: 0,
      max_amount: 0,
      duration_days: 0,
      daily_reward_percentage: 0,
      is_active: true,
    })
  }

  function openEditDialog(plan: InvestmentPlan) {
    setSelectedPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description,
      min_amount: plan.min_amount,
      max_amount: plan.max_amount,
      duration_days: plan.duration_days,
      daily_reward_percentage: plan.daily_reward_percentage,
      is_active: plan.is_active,
    })
    setIsEditing(true)
  }

  const filteredPlans = plans.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investment Plans Management</h1>
        <p className="text-muted-foreground">Create, edit, and manage investment plans</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Investment Plans</CardTitle>
            <CardDescription>Total Plans: {plans.length}</CardDescription>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Investment Plan</DialogTitle>
                <DialogDescription>Add a new investment plan with all required details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Plan Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Gold Plan"
                    />
                  </div>
                  <div>
                    <Label>Daily Reward (%) *</Label>
                    <Input
                      type="number"
                      value={`${formData.daily_reward_percentage}`}
                      onChange={(e) => setFormData({ ...formData, daily_reward_percentage: parseFloat(e.target.value) })}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label>Minimum amount (ETB) *</Label>
                    <Input
                      type="number"
                      value={formData.min_amount}
                      onChange={(e) => setFormData({ ...formData, min_amount: parseFloat(e.target.value) })}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <Label>Maximum amount (ETB) *</Label>
                    <Input
                      type="number"
                      value={formData.max_amount}
                      onChange={(e) => setFormData({ ...formData, max_amount: parseFloat(e.target.value) })}
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <Label>Duration (Days) *</Label>
                    <Input
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <Label>Total Profit (Auto-calculated)</Label>
                  <div className="p-3 bg-muted rounded text-sm font-semibold">
                    ETB {calculateTotalProfit(formData.daily_reward_percentage, formData.duration_days, formData.min_amount, formData.max_amount).toLocaleString()}
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Plan details and benefits..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border"
                      />
                      <span className="text-sm">{formData.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleCreatePlan} disabled={processing} className="w-full">
                  {processing ? 'Creating...' : 'Create Plan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Investment</TableHead>
                    <TableHead>Daily Reward</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>ETB {plan.min_amount?.toLocaleString() ?? "0"} - {plan.max_amount?.toLocaleString() ?? "0"}</TableCell>
                      <TableCell>{plan.daily_reward_percentage?.toLocaleString() ?? "0"} %</TableCell>
                      <TableCell>{plan.duration_days} days</TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(plan)}
                            title="Edit plan"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(plan)}
                            disabled={processing}
                            title={plan.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <Eye className={`h-4 w-4 ${plan.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-destructive" />
                                  Delete Plan
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;{plan.name}&quot;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePlan(plan)}
                                disabled={processing}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {processing ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPlans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {plans.length === 0 ? 'No plans yet. Create one to get started.' : 'No plans match your search.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Investment Plan</DialogTitle>
            <DialogDescription>Update plan details and settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Gold Plan"
                />
              </div>
              <div>
                <Label>Min Investment (ETB) *</Label>
                <Input
                  type="number"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: parseFloat(e.target.value) })}
                  placeholder="1000"
                />
              </div>
              <div>
                <Label>Max Investment (ETB) *</Label>
                <Input
                  type="number"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: parseFloat(e.target.value) })}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label>Daily Reward (%) *</Label>
                <Input
                  type="number"
                  value={`${formData.daily_reward_percentage} %`}
                  onChange={(e) => setFormData({ ...formData, daily_reward_percentage: parseFloat(e.target.value) })}
                  placeholder="10"
                />
              </div>
              <div>
                <Label>Duration (Days) *</Label>
                <Input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                  placeholder="30"
                />
              </div>
            </div>

            <div>
              <Label>Total Profit (Auto-calculated)</Label>
              <div className="p-3 bg-muted rounded text-sm font-semibold">
                ETB {calculateTotalProfit(formData.daily_reward_percentage, formData.duration_days, formData.min_amount, formData.max_amount).toLocaleString()}
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Plan details and benefits..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border"
                  />
                  <span className="text-sm">{formData.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>

            <Button onClick={handleUpdatePlan} disabled={processing} className="w-full">
              {processing ? 'Updating...' : 'Update Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
