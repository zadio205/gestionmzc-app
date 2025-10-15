-- Vue optimisée pour les statistiques du dashboard
-- Évite les N+1 queries en pré-calculant les agrégations

CREATE OR REPLACE VIEW dashboard_stats AS
WITH user_stats AS (
  SELECT
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'client' THEN 1 END) as total_clients,
    COUNT(CASE WHEN role = 'collaborateur' THEN 1 END) as total_collaborateurs,
    COUNT(CASE WHEN last_activity >= NOW() - INTERVAL '30 days' THEN 1 END) as active_clients_last_30d
  FROM profiles
),

document_stats AS (
  SELECT
    COUNT(*) as total_documents,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_documents,
    COUNT(CASE WHEN uploaded_at >= NOW() - INTERVAL '7 days' THEN 1 END) as documents_this_week
  FROM justificatifs
),

message_stats AS (
  SELECT
    COUNT(*) as total_messages,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_messages,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as messages_this_week
  FROM messages
),

task_stats AS (
  SELECT
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN due_date >= NOW() - INTERVAL '7 days' AND due_date <= NOW() + INTERVAL '7 days' THEN 1 END) as tasks_this_week,
    COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_tasks
  FROM tasks
),

alert_stats AS (
  SELECT
    COUNT(*) as total_alerts,
    COUNT(CASE WHEN resolved = false THEN 1 END) as system_alerts,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as alerts_today
  FROM system_alerts
)

SELECT
  'admin' as user_role,
  null as user_id,
  (SELECT total_users FROM user_stats) as total_users,
  (SELECT active_clients_last_30d FROM user_stats) as active_clients,
  (SELECT total_documents FROM document_stats) as total_documents,
  (SELECT unread_messages FROM message_stats) as unread_messages,
  (SELECT pending_tasks FROM task_stats) as pending_tasks,
  (SELECT system_alerts FROM alert_stats) as system_alerts,
  null as my_clients,
  (SELECT pending_documents FROM document_stats) as pending_documents,
  (SELECT completed_tasks FROM task_stats) as completed_tasks,
  (SELECT tasks_this_week FROM task_stats) as this_week_tasks

UNION ALL

-- Stats pour les collaborateurs
SELECT
  'collaborateur' as user_role,
  p.id as user_id,
  0 as total_users, -- Les collaborateurs ne voient pas cette stat
  (SELECT COUNT(*) FROM profiles WHERE role = 'client' AND assigned_to = p.id) as active_clients,
  (SELECT COUNT(*) FROM justificatifs WHERE assigned_to = p.id) as total_documents,
  (SELECT COUNT(*) FROM messages WHERE assigned_to = p.id AND is_read = false) as unread_messages,
  (SELECT COUNT(*) FROM tasks WHERE assigned_to = p.id AND status = 'pending') as pending_tasks,
  0 as system_alerts, -- Les collaborateurs ne voient pas les alertes système
  (SELECT COUNT(*) FROM profiles WHERE role = 'client' AND assigned_to = p.id) as my_clients,
  (SELECT COUNT(*) FROM justificatifs WHERE assigned_to = p.id AND status = 'pending') as pending_documents,
  (SELECT COUNT(*) FROM tasks WHERE assigned_to = p.id AND status = 'completed' AND completed_at >= NOW() - INTERVAL '7 days') as completed_tasks,
  (SELECT COUNT(*) FROM tasks WHERE assigned_to = p.id AND due_date >= NOW() - INTERVAL '7 days' AND due_date <= NOW() + INTERVAL '7 days') as this_week_tasks
FROM profiles p
WHERE p.role = 'collaborateur';

-- Vue optimisée pour les aperçus clients avec jointures pré-calculées
CREATE OR REPLACE VIEW client_overviews AS
WITH client_documents AS (
  SELECT
    client_id,
    COUNT(*) as documents_count,
    MAX(uploaded_at) as last_document_activity
  FROM justificatifs
  GROUP BY client_id
),

client_messages AS (
  SELECT
    client_id,
    COUNT(*) as messages_count,
    MAX(created_at) as last_message_activity,
    COUNT(CASE WHEN is_read = false AND sender_role = 'client' THEN 1 END) as unread_from_client
  FROM messages
  GROUP BY client_id
),

client_tasks AS (
  SELECT
    client_id,
    COUNT(*) as tasks_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks_count,
    COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_tasks_count,
    MAX(due_date) as next_task_due
  FROM tasks
  WHERE client_id IS NOT NULL
  GROUP BY client_id
),

client_alerts AS (
  SELECT
    client_id,
    COUNT(*) as alerts_count,
    MAX(created_at) as last_alert_activity
  FROM system_alerts
  WHERE client_id IS NOT NULL
  GROUP BY client_id
)

SELECT
  p.id,
  p.full_name as name,
  p.metadata->>'industry' as industry,
  COALESCE(cd.documents_count, 0) as documents_count,
  COALESCE(cm.messages_count, 0) as messages_count,
  COALESCE(ca.alerts_count, 0) as alerts_count,
  GREATEST(
    p.last_activity,
    COALESCE(cd.last_document_activity, p.created_at),
    COALESCE(cm.last_message_activity, p.created_at),
    COALESCE(ca.last_alert_activity, p.created_at),
    COALESCE(ct.next_task_due, p.created_at)
  ) as last_activity,
  CASE
    WHEN p.last_activity >= NOW() - INTERVAL '30 days' THEN 'active'
    WHEN p.last_activity >= NOW() - INTERVAL '90 days' THEN 'inactive'
    ELSE 'pending'
  END as status,
  -- TODO: Ajouter les champs IA quand ils seront implémentés
  null as ai_risk_score,
  ARRAY[]::text[] as ai_recommendations,
  COALESCE(ct.pending_tasks_count, 0) as pending_tasks,
  COALESCE(ct.overdue_tasks_count, 0) as overdue_tasks
FROM profiles p
LEFT JOIN client_documents cd ON p.id = cd.client_id
LEFT JOIN client_messages cm ON p.id = cm.client_id
LEFT JOIN client_tasks ct ON p.id = ct.client_id
LEFT JOIN client_alerts ca ON p.id = ca.client_id
WHERE p.role = 'client';

-- Fonction optimisée pour récupérer les activités récentes avec jointures
CREATE OR REPLACE FUNCTION get_recent_activities(
  p_user_id TEXT DEFAULT NULL,
  p_user_role TEXT DEFAULT 'admin',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  type TEXT,
  title TEXT,
  description TEXT,
  timestamp TIMESTAMPTZ,
  user_name TEXT,
  client_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_activities AS (
    -- Activités des utilisateurs
    SELECT
      'user_' || p.id::TEXT as id,
      'user' as type,
      'Nouvel utilisateur inscrit' as title,
      p.full_name || ' a rejoint la plateforme' as description,
      p.created_at as timestamp,
      p.full_name as user_name,
      null as client_name,
      p.created_at
    FROM profiles p
    WHERE p.created_at >= NOW() - INTERVAL '7 days'

    UNION ALL

    -- Activités des documents
    SELECT
      'doc_' || j.id::TEXT as id,
      'document' as type,
      'Nouveau document téléversé' as title,
      j.filename || ' par ' || COALESCE(p.full_name, 'Utilisateur') as description,
      j.uploaded_at as timestamp,
      p.full_name as user_name,
      c.full_name as client_name,
      j.uploaded_at
    FROM justificatifs j
    JOIN profiles p ON j.uploaded_by = p.id
    LEFT JOIN profiles c ON j.client_id = c.id
    WHERE j.uploaded_at >= NOW() - INTERVAL '7 days'

    UNION ALL

    -- Activités des messages
    SELECT
      'msg_' || m.id::TEXT as id,
      'message' as type,
      'Nouveau message' as title,
      m.subject || ' de ' || p.full_name as description,
      m.created_at as timestamp,
      p.full_name as user_name,
      c.full_name as client_name,
      m.created_at
    FROM messages m
    JOIN profiles p ON m.sender_id = p.id
    LEFT JOIN profiles c ON m.client_id = c.id
    WHERE m.created_at >= NOW() - INTERVAL '7 days'

    UNION ALL

    -- Activités des tâches
    SELECT
      'task_' || t.id::TEXT as id,
      'task' as type,
      CASE
        WHEN t.status = 'completed' THEN 'Tâche complétée'
        WHEN t.status = 'in_progress' THEN 'Tâche en cours'
        ELSE 'Nouvelle tâche'
      END as title,
      t.title || CASE
        WHEN c.full_name IS NOT NULL THEN ' pour ' || c.full_name
        ELSE ''
      END as description,
      t.created_at as timestamp,
      p.full_name as user_name,
      c.full_name as client_name,
      t.created_at
    FROM tasks t
    LEFT JOIN profiles p ON t.assigned_to = p.id
    LEFT JOIN profiles c ON t.client_id = c.id
    WHERE t.created_at >= NOW() - INTERVAL '7 days'

    UNION ALL

    -- Activités des alertes système
    SELECT
      'alert_' || a.id::TEXT as id,
      'alert' as type,
      'Alerte système' as title,
      a.title as description,
      a.created_at as timestamp,
      null as user_name,
      c.full_name as client_name,
      a.created_at
    FROM system_alerts a
    LEFT JOIN profiles c ON a.client_id = c.id
    WHERE a.created_at >= NOW() - INTERVAL '7 days'
  )
  SELECT
    id,
    type,
    title,
    description,
    timestamp,
    user_name,
    client_name
  FROM recent_activities
  WHERE
    (p_user_id IS NULL OR user_name IS NOT NULL) -- Si c'est un admin, on montre tout
    OR (p_user_role = 'collaborateur' AND (
      -- Pour les collaborateurs, filtrer selon leurs assignations
      EXISTS (
        SELECT 1 FROM profiles assigned
        WHERE assigned.id = p_user_id
        AND (
          assigned.id = user_name OR -- Le collaborateur lui-même
          EXISTS ( -- Le client est assigné au collaborateur
            SELECT 1 FROM profiles client
            WHERE client.id = client_name::TEXT
            AND client.assigned_to = p_user_id
          )
        )
      )
    ))
  ORDER BY timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Index pour optimiser les performances des requêtes dashboard
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON profiles(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_to ON profiles(assigned_to);

CREATE INDEX IF NOT EXISTS idx_justificatifs_uploaded_at ON justificatifs(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_justificatifs_assigned_to ON justificatifs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_justificatifs_client_id ON justificatifs(client_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);

CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);