import { supabase } from '../services/supabase.js'

export async function requireAdminRole(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const adminSecretHeader = req.headers['x-admin-secret']
    const expectedSecret = process.env.ADMIN_SECRET_KEY ?? 'vibetours-admin-dev-secret'

    // 1. Check development/demo secret header first
    if (adminSecretHeader && adminSecretHeader === expectedSecret) {
      req.isAdmin = true
      return next()
    }

    // 2. Extract Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: Authentication token is required for admin endpoints.'
      })
    }

    const token = authHeader.split(' ')[1]
    if (!supabase) {
      // If Supabase is not configured (demo mode), allow dev secret fallback
      return res.status(401).json({
        error: 'Unauthorized: Supabase authentication service is offline.'
      })
    }

    // 3. Verify Supabase JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired authentication token.'
      })
    }

    // 4. Verify admin status in admin_account table
    const { data: adminRecord } = await supabase
      .from('admin_account')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRecord) {
      return res.status(403).json({
        error: 'Forbidden: User does not possess administrator privileges.'
      })
    }

    req.user = user
    req.isAdmin = true
    next()
  } catch (err) {
    console.error('[authMiddleware] error:', err.message)
    res.status(500).json({ error: 'Internal server security error.' })
  }
}
