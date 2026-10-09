import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = await createClient()

    // Fetch all investment plans
    const { data: plansData, error: plansError } = await supabaseAdmin
      .from('investment_plans')
      .select('*')
      .order('created_at', { ascending: true })

    if (plansError) {
      console.error('[NovaMeridian] Error fetching plans:', plansError)
      return NextResponse.json({ error: plansError.message }, { status: 500 })
    }

    return NextResponse.json({ plans: plansData || [] })
  } catch (error) {
    console.error('[NovaMeridian] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = await createClient()
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can create plans' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, image_url, investment_price, daily_income, duration_days, is_active } = body

    if (!name || !investment_price || !daily_income || !duration_days) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const total_profit = daily_income * duration_days

    const { data, error } = await supabaseAdmin.from('investment_plans').insert({
      name,
      description,
      image_url,
      investment_price,
      daily_income,
      duration_days,
      total_profit,
      is_active: is_active ?? true,
    }).select()

    if (error) {
      console.error('[NovaMeridian] Error creating plan:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log action
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'plan_created',
      entity_type: 'investment_plan',
      entity_id: data[0]?.id,
      details: { plan_name: name },
    })

    return NextResponse.json({ success: true, plan: data[0] })
  } catch (error) {
    console.error('[NovaMeridian] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseAdmin = await createClient()
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can update plans' }, { status: 403 })
    }

    const body = await request.json()
    const { planId, action, ...updateData } = body

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    if (action === 'toggle_status') {
      const { data, error } = await supabaseAdmin
        .from('investment_plans')
        .update({ is_active: updateData.is_active })
        .eq('id', planId)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Log action
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: updateData.is_active ? 'plan_activated' : 'plan_deactivated',
        entity_type: 'investment_plan',
        entity_id: planId,
        details: { plan_name: data[0]?.name },
      })

      return NextResponse.json({ success: true, plan: data[0] })
    } else {
      // Regular update
      const total_profit = updateData.daily_income && updateData.duration_days 
        ? updateData.daily_income * updateData.duration_days 
        : undefined

      const dataToUpdate = {
        ...updateData,
        ...(total_profit && { total_profit }),
      }

      const { data, error } = await supabaseAdmin
        .from('investment_plans')
        .update(dataToUpdate)
        .eq('id', planId)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Log action
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'plan_updated',
        entity_type: 'investment_plan',
        entity_id: planId,
        details: { plan_name: data[0]?.name },
      })

      return NextResponse.json({ success: true, plan: data[0] })
    }
  } catch (error) {
    console.error('[NovaMeridian] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = await createClient()
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can delete plans' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Get plan details before deletion
    const { data: planData } = await supabaseAdmin
      .from('investment_plans')
      .select('name')
      .eq('id', planId)
      .single()

    const { error } = await supabaseAdmin
      .from('investment_plans')
      .delete()
      .eq('id', planId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log action
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'plan_deleted',
      entity_type: 'investment_plan',
      entity_id: planId,
      details: { plan_name: planData?.name },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[NovaMeridian] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
