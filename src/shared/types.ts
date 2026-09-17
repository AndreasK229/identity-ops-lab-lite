export type AccountState = 'enabled' | 'disabled';
export type MfaState = 'registered' | 'reset_required' | 'not_registered';
export type TicketStatus = 'open' | 'in_progress' | 'closed';
export type TicketPriority = 'medium' | 'high' | 'critical';
export type SignInResult = 'success' | 'failure' | 'denied';
export type ScenarioType = 'missing_group' | 'mfa_reset' | 'non_compliant_device' | 'terminated_enabled';

export type Employee = {
  id: string;
  name: string;
  initials: string;
  title: string;
  department: string;
  manager: string;
  location: string;
  personality: 'direct' | 'careful' | 'urgent' | 'technical' | 'brief' | 'warm';
  accountState: AccountState;
  mfaState: MfaState;
  groupIds: string[];
  deviceId: string;
  employment: 'active' | 'terminated';
};

export type AppRegistration = {
  id: string;
  name: string;
  requiredGroupId: string;
  requiresMfa: boolean;
  requiresCompliantDevice: boolean;
};

export type Group = {
  id: string;
  name: string;
  description: string;
};

export type Device = {
  id: string;
  ownerId: string;
  name: string;
  os: string;
  managed: boolean;
  compliant: boolean;
  lastCheckIn: string;
};

export type SignInLog = {
  id: string;
  timestamp: string;
  employeeId: string;
  applicationId: string;
  applicationName: string;
  result: SignInResult;
  reason: string;
  mfa: 'satisfied' | 'required' | 'not_required' | 'blocked';
  device: string;
  ipAddress: string;
  correlationId: string;
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  details: string;
};

export type TicketMessage = {
  id: string;
  author: 'employee' | 'operator' | 'system';
  body: string;
  timestamp: string;
};

export type Ticket = {
  id: string;
  employeeId: string;
  applicationId: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

export type ResolutionRequirement = {
  label: string;
  satisfied: boolean;
};

export type ResolutionCheck = {
  ticketId: string;
  readyToClose: boolean;
  summary: string;
  requirements: ResolutionRequirement[];
};

export type ClosureReview = {
  ticketId: string;
  readyToClose: boolean;
  summary: string;
};

export type AccessDecision = {
  allowed: boolean;
  reason:
    | 'ALLOWED'
    | 'ACCOUNT_DISABLED'
    | 'MFA_RESET_REQUIRED'
    | 'MFA_NOT_REGISTERED'
    | 'MISSING_GROUP'
    | 'DEVICE_NOT_COMPLIANT';
  message: string;
  correlationId: string;
};

export type PublicState = {
  generatedAt: string;
  employees: Employee[];
  applications: AppRegistration[];
  groups: Group[];
  devices: Device[];
  tickets: Ticket[];
  signIns: SignInLog[];
  audit: AuditEvent[];
  resolution: Record<string, ClosureReview>;
};

export type AdminAction =
  | { type: 'add_group'; employeeId: string; groupId: string }
  | { type: 'remove_group'; employeeId: string; groupId: string }
  | { type: 'reset_mfa'; employeeId: string }
  | { type: 'complete_mfa_registration'; employeeId: string }
  | { type: 'mark_device_compliant'; deviceId: string }
  | { type: 'disable_account'; employeeId: string }
  | { type: 'revoke_sessions'; employeeId: string };

export type ActionResult = {
  ok: boolean;
  state: PublicState;
};

export type ChatResult = {
  message: TicketMessage;
  retry?: AccessDecision;
  resolution: ClosureReview;
  state: PublicState;
};
