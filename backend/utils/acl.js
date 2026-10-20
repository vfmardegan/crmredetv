const PERMISSIONS = {
  admin: [
    "can_view_dashboard",
    "can_view_pipeline",
    "can_view_planning",
    "can_edit_planning",
    "can_view_clients",
    "can_edit_clients",
    "can_view_executivos",
    "can_manage_users",
    "can_view_audit_logs",
    "can_manage_executivos_links",
    "can_assign_carteira",
    "can_send_proposals",
    "can_schedule_meetings",
    "can_view_contacts",
    "can_edit_contacts",
    "can_record_audio",
    "can_create_opportunities",
    "can_edit_opportunities",
    "can_delete_opportunities",
    "can_manage_proposal_templates",
    "can_view_engajamento"
  ],
  diretor: [
    "can_view_dashboard",
    "can_view_pipeline",
    "can_view_planning",
    "can_edit_planning",
    "can_view_clients",
    "can_edit_clients",
    "can_view_executivos",
    "can_manage_executivos_links",
    "can_send_proposals",
    "can_schedule_meetings",
    "can_view_contacts",
    "can_edit_contacts",
    "can_record_audio",
    "can_create_opportunities",
    "can_edit_opportunities",
    "can_manage_proposal_templates",
    "can_view_engajamento"
  ],
  especialista: [
    "can_view_pipeline",
    "can_view_planning",
    "can_edit_planning",
    "can_view_clients",
    "can_view_executivos",
    "can_view_contacts",
    "can_edit_contacts",
    "can_record_audio",
    "can_edit_opportunities",
    "can_manage_proposal_templates"
  ],
  executivo: [
    "can_view_dashboard",
    "can_view_pipeline",
    "can_view_clients",
    "can_edit_clients",
    "can_send_proposals",
    "can_schedule_meetings",
    "can_view_contacts",
    "can_edit_contacts",
    "can_record_audio",
    "can_create_opportunities",
    "can_edit_opportunities",
    "can_manage_proposal_templates"
  ]
};

function hasPermission(userPerfil, permission) {
  if (!userPerfil || !PERMISSIONS[userPerfil]) return false;
  return PERMISSIONS[userPerfil].includes(permission);
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (req.user && hasPermission(req.user.perfil, permission)) {
      next();
    } else {
      res.status(403).json({ error: `Acesso negado. Esta operação exige a permissão: ${permission}` });
    }
  };
}

module.exports = {
  PERMISSIONS,
  hasPermission,
  requirePermission
};
