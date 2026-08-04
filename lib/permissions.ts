export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "مدير النظام",
  ASSOCIATION_MANAGER: "مدير الجمعية",
  PROGRAM_COORDINATOR: "منسق البرنامج",
  CENTER_MANAGER: "مدير المركز",
  FACILITATOR: "المنشط التربوي",
  SOCIAL_WORKER: "الأخصائي الاجتماعي",
  VOCATIONAL_TRAINER: "المكون المهني",
  INTEGRATION_OFFICER: "مسؤول الإدماج",
  VIEWER: "قارئ فقط"
};

const rolePaths: Record<string, string[]> = {
  PROGRAM_COORDINATOR: [
    "/", "/beneficiaries", "/admissions", "/workflow", "/attendance",
    "/academic-tracking", "/social-support", "/vocational-training",
    "/integration", "/reports"
  ],
  CENTER_MANAGER: [
    "/", "/beneficiaries", "/admissions", "/workflow", "/attendance",
    "/academic-tracking", "/social-support", "/reports"
  ],
  FACILITATOR: ["/", "/beneficiaries", "/attendance", "/academic-tracking"],
  SOCIAL_WORKER: ["/", "/beneficiaries", "/social-support"],
  VOCATIONAL_TRAINER: ["/", "/beneficiaries", "/vocational-training"],
  INTEGRATION_OFFICER: ["/", "/beneficiaries", "/vocational-training", "/integration"],
  VIEWER: [
    "/", "/beneficiaries", "/admissions", "/workflow", "/attendance",
    "/academic-tracking", "/social-support", "/vocational-training",
    "/integration", "/reports"
  ]
};

const apiToPage: [string, string][] = [
  ["/api/beneficiaries", "/beneficiaries"],
  ["/api/admission-assessment", "/admissions"],
  ["/api/admissions", "/admissions"],
  ["/api/admission", "/admissions"],
  ["/api/workflow", "/workflow"],
  ["/api/groups", "/attendance"],
  ["/api/enrollments", "/attendance"],
  ["/api/attendance", "/attendance"],
  ["/api/academic-support-plans", "/academic-tracking"],
  ["/api/academic-results", "/academic-tracking"],
  ["/api/assessments", "/academic-tracking"],
  ["/api/academic", "/academic-tracking"],
  ["/api/social-follow-ups", "/social-support"],
  ["/api/social", "/social-support"],
  ["/api/vocational-training", "/vocational-training"],
  ["/api/vocational", "/vocational-training"],
  ["/api/integration", "/integration"],
  ["/api/activity-log", "/beneficiaries"],
  ["/api/users", "/settings/users"]
];

function normalizedPath(pathname: string) {
  const apiMatch = apiToPage.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return apiMatch ? apiMatch[1] : pathname;
}

function matchesPath(allowed: string, pathname: string) {
  if (allowed === "/") return pathname === "/";
  return pathname === allowed || pathname.startsWith(`${allowed}/`);
}

export function canAccessPath(role: string, pathname: string, method = "GET") {
  if (["/login", "/setup", "/forbidden"].some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  if (pathname.startsWith("/api/auth/")) return true;

  const isAdmin = ["SUPER_ADMIN", "ASSOCIATION_MANAGER"].includes(role);
  if (isAdmin) return true;

  const target = normalizedPath(pathname);
  if (target.startsWith("/settings")) return false;

  const allowed = rolePaths[role] || [];
  const routeAllowed = allowed.some((path) => matchesPath(path, target));
  if (!routeAllowed) return false;

  if (role === "VIEWER" && !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) return false;
  return true;
}

export function visibleForRole(role: string, href: string) {
  return canAccessPath(role, href, "GET");
}
