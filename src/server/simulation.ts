import type {
  AccessDecision,
  AdminAction,
  AppRegistration,
  AuditEvent,
  ChatResult,
  Device,
  Employee,
  Group,
  PublicState,
  ResolutionCheck,
  ScenarioType,
  SignInLog,
  Ticket,
  TicketMessage
} from '../shared/types.js';

type Scenario = {
  id: string;
  type: ScenarioType;
  ticketId: string;
  employeeId: string;
  applicationId: string;
  expectedRemediation: string[];
};

type InternalTicket = Ticket & {
  scenarioType: ScenarioType;
};

type Store = {
  employees: Employee[];
  applications: AppRegistration[];
  groups: Group[];
  devices: Device[];
  tickets: InternalTicket[];
  signIns: SignInLog[];
  audit: AuditEvent[];
  scenarios: Scenario[];
  sequence: number;
};

const t0 = Date.parse('2026-09-08T08:15:00.000Z');

const groups: Group[] = [
  { id: 'grp-finance', name: 'Finance Workspace Users', description: 'Access to LedgerPro and finance reports.' },
  { id: 'grp-hr', name: 'People Hub Users', description: 'Access to HR case and employee systems.' },
  { id: 'grp-sales', name: 'CRM Users', description: 'Access to Northwind CRM.' },
  { id: 'grp-ops', name: 'Ops Portal Users', description: 'Access to factory and warehouse operations.' },
  { id: 'grp-admin', name: 'Identity Admins', description: 'Privileged lab-only admin group.' }
];

const applications: AppRegistration[] = [
  { id: 'app-ledger', name: 'LedgerPro', requiredGroupId: 'grp-finance', requiresMfa: true, requiresCompliantDevice: true },
  { id: 'app-people', name: 'People Hub', requiredGroupId: 'grp-hr', requiresMfa: true, requiresCompliantDevice: false },
  { id: 'app-crm', name: 'Northwind CRM', requiredGroupId: 'grp-sales', requiresMfa: true, requiresCompliantDevice: true },
  { id: 'app-ops', name: 'Ops Portal', requiredGroupId: 'grp-ops', requiresMfa: false, requiresCompliantDevice: true },
  { id: 'app-admin', name: 'Admin Center', requiredGroupId: 'grp-admin', requiresMfa: true, requiresCompliantDevice: true }
];

function stamp(offset: number) {
  return new Date(t0 + offset * 60_000).toISOString();
}

function makeStore(): Store {
  const employees: Employee[] = [
    { id: 'emp-ada', name: 'Ada Holm', initials: 'AH', title: 'Financial Controller', department: 'Finance', manager: 'Mira Shah', location: 'Stockholm', personality: 'careful', accountState: 'enabled', mfaState: 'registered', groupIds: [], deviceId: 'dev-ada', employment: 'active' },
    { id: 'emp-ben', name: 'Ben Carter', initials: 'BC', title: 'HR Partner', department: 'People', manager: 'Mira Shah', location: 'London', personality: 'warm', accountState: 'enabled', mfaState: 'reset_required', groupIds: ['grp-hr'], deviceId: 'dev-ben', employment: 'active' },
    { id: 'emp-cora', name: 'Cora Lind', initials: 'CL', title: 'Account Executive', department: 'Sales', manager: 'Nina Berg', location: 'Gothenburg', personality: 'urgent', accountState: 'enabled', mfaState: 'registered', groupIds: ['grp-sales'], deviceId: 'dev-cora', employment: 'active' },
    { id: 'emp-dan', name: 'Dan Novak', initials: 'DN', title: 'Operations Lead', department: 'Operations', manager: 'Noah Kim', location: 'Malmo', personality: 'direct', accountState: 'enabled', mfaState: 'registered', groupIds: ['grp-ops'], deviceId: 'dev-dan', employment: 'terminated' },
    { id: 'emp-elin', name: 'Elin Park', initials: 'EP', title: 'Support Engineer', department: 'IT', manager: 'Noah Kim', location: 'Helsinki', personality: 'technical', accountState: 'enabled', mfaState: 'registered', groupIds: ['grp-admin'], deviceId: 'dev-elin', employment: 'active' },
    { id: 'emp-finn', name: 'Finn Meyer', initials: 'FM', title: 'Warehouse Planner', department: 'Operations', manager: 'Noah Kim', location: 'Copenhagen', personality: 'brief', accountState: 'enabled', mfaState: 'registered', groupIds: ['grp-ops'], deviceId: 'dev-finn', employment: 'active' }
  ];

  const devices: Device[] = [
    { id: 'dev-ada', ownerId: 'emp-ada', name: 'AH-WIN-042', os: 'Windows 11', managed: true, compliant: true, lastCheckIn: stamp(-45) },
    { id: 'dev-ben', ownerId: 'emp-ben', name: 'BC-MAC-118', os: 'macOS 15', managed: true, compliant: true, lastCheckIn: stamp(-38) },
    { id: 'dev-cora', ownerId: 'emp-cora', name: 'CL-WIN-219', os: 'Windows 11', managed: true, compliant: false, lastCheckIn: stamp(-120) },
    { id: 'dev-dan', ownerId: 'emp-dan', name: 'DN-WIN-077', os: 'Windows 10', managed: true, compliant: true, lastCheckIn: stamp(-1440) },
    { id: 'dev-elin', ownerId: 'emp-elin', name: 'EP-WIN-004', os: 'Windows 11', managed: true, compliant: true, lastCheckIn: stamp(-25) },
    { id: 'dev-finn', ownerId: 'emp-finn', name: 'FM-ANDROID-12', os: 'Android 15', managed: true, compliant: true, lastCheckIn: stamp(-60) }
  ];

  const tickets: InternalTicket[] = [
    ticket('tick-1001', 'missing_group', 'emp-ada', 'app-ledger', 'LedgerPro opens but says I am not assigned', 'Ada can authenticate successfully, but LedgerPro denies app access after sign-in.', 'high', -28),
    ticket('tick-1002', 'mfa_reset', 'emp-ben', 'app-people', 'New phone broke my People Hub sign-in', 'Ben replaced a phone and cannot satisfy MFA for People Hub.', 'medium', -24),
    ticket('tick-1003', 'non_compliant_device', 'emp-cora', 'app-crm', 'CRM blocked by device compliance', 'Cora needs CRM before a customer call, but Conditional Access blocks the device.', 'high', -18),
    ticket('tick-1004', 'terminated_enabled', 'emp-dan', 'app-ops', 'Leaver account still appears active', 'A terminated operations lead still has an enabled account and active sessions.', 'critical', -12)
  ];

  const scenarios = tickets.map((item) => ({
    id: `scn-${item.id}`,
    type: item.scenarioType,
    ticketId: item.id,
    employeeId: item.employeeId,
    applicationId: item.applicationId,
    expectedRemediation: remediationFor(item.scenarioType)
  }));

  const next: Store = { employees, applications, groups, devices, tickets, scenarios, signIns: [], audit: [], sequence: 1 };
  for (const current of tickets) {
    appendSignIn(next, current.employeeId, current.applicationId, evaluateAccess(next, current.employeeId, current.applicationId));
  }
  next.audit.push(event(next, 'system', 'seed_scenarios', 'identity-ops-lab-lite', 'Loaded deterministic public demo data.'));
  return next;
}

function ticket(id: string, scenarioType: ScenarioType, employeeId: string, applicationId: string, title: string, description: string, priority: Ticket['priority'], offset: number): InternalTicket {
  return {
    id,
    scenarioType,
    employeeId,
    applicationId,
    title,
    description,
    priority,
    status: 'open',
    createdAt: stamp(offset),
    updatedAt: stamp(offset),
    messages: [
      { id: `${id}-m1`, author: 'employee', body: description, timestamp: stamp(offset) },
      { id: `${id}-m2`, author: 'system', body: 'Ticket opened from simulated identity support intake.', timestamp: stamp(offset + 1) }
    ]
  };
}

let store = makeStore();

export function resetSimulation() {
  store = makeStore();
  return publicState();
}

export function checkAccess(employeeId: string, applicationId: string) {
  return evaluateAccess(store, employeeId, applicationId);
}

export function publicState(): PublicState {
  const resolution = Object.fromEntries(store.tickets.map((item) => [item.id, getResolution(item.id)]));
  return {
    generatedAt: new Date().toISOString(),
    employees: store.employees,
    applications: store.applications,
    groups: store.groups,
    devices: store.devices,
    tickets: store.tickets.map((ticketItem) => ({
      id: ticketItem.id,
      employeeId: ticketItem.employeeId,
      applicationId: ticketItem.applicationId,
      title: ticketItem.title,
      description: ticketItem.description,
      priority: ticketItem.priority,
      status: ticketItem.status,
      createdAt: ticketItem.createdAt,
      updatedAt: ticketItem.updatedAt,
      messages: ticketItem.messages
    })),
    signIns: store.signIns.slice(-18).reverse(),
    audit: store.audit.slice(-30).reverse(),
    resolution
  };
}

export function evaluateAccess(current: Store, employeeId: string, applicationId: string): AccessDecision {
  const employee = must(current.employees.find((item) => item.id === employeeId), 'employee');
  const app = must(current.applications.find((item) => item.id === applicationId), 'application');
  const device = must(current.devices.find((item) => item.id === employee.deviceId), 'device');
  const correlationId = `corr-${current.sequence.toString().padStart(4, '0')}`;
  current.sequence += 1;

  if (employee.accountState === 'disabled') return decision(false, 'ACCOUNT_DISABLED', 'Account is disabled.', correlationId);
  if (!employee.groupIds.includes(app.requiredGroupId)) return decision(false, 'MISSING_GROUP', `User is not assigned to ${app.name}.`, correlationId);
  if (app.requiresMfa && employee.mfaState === 'reset_required') return decision(false, 'MFA_RESET_REQUIRED', 'MFA registration must be completed after reset.', correlationId);
  if (app.requiresMfa && employee.mfaState === 'not_registered') return decision(false, 'MFA_NOT_REGISTERED', 'MFA is required but not registered.', correlationId);
  if (app.requiresCompliantDevice && !device.compliant) return decision(false, 'DEVICE_NOT_COMPLIANT', 'Conditional Access requires a compliant managed device.', correlationId);
  return decision(true, 'ALLOWED', 'Access granted by simulated identity policy.', correlationId);
}

export function applyAdminAction(action: AdminAction) {
  const actor = 'Demo Operator';
  if (action.type === 'add_group') {
    const employee = employeeById(action.employeeId);
    const group = groupById(action.groupId);
    if (!employee.groupIds.includes(group.id)) employee.groupIds.push(group.id);
    store.audit.push(event(store, actor, 'add_group', employee.name, `Added ${group.name}.`));
  }
  if (action.type === 'remove_group') {
    const employee = employeeById(action.employeeId);
    const group = groupById(action.groupId);
    employee.groupIds = employee.groupIds.filter((idValue) => idValue !== group.id);
    store.audit.push(event(store, actor, 'remove_group', employee.name, `Removed ${group.name}.`));
  }
  if (action.type === 'reset_mfa') {
    const employee = employeeById(action.employeeId);
    employee.mfaState = 'reset_required';
    store.audit.push(event(store, actor, 'reset_mfa', employee.name, 'Marked MFA registration as reset required.'));
  }
  if (action.type === 'complete_mfa_registration') {
    const employee = employeeById(action.employeeId);
    employee.mfaState = 'registered';
    store.audit.push(event(store, actor, 'complete_mfa_registration', employee.name, 'Completed simulated MFA registration.'));
  }
  if (action.type === 'mark_device_compliant') {
    const device = deviceById(action.deviceId);
    device.compliant = true;
    device.lastCheckIn = new Date().toISOString();
    store.audit.push(event(store, actor, 'mark_device_compliant', device.name, 'Device marked compliant in simulator.'));
  }
  if (action.type === 'disable_account') {
    const employee = employeeById(action.employeeId);
    employee.accountState = 'disabled';
    store.audit.push(event(store, actor, 'disable_account', employee.name, 'Account disabled.'));
  }
  if (action.type === 'revoke_sessions') {
    const employee = employeeById(action.employeeId);
    store.audit.push(event(store, actor, 'revoke_sessions', employee.name, 'Active sessions revoked in simulator.'));
  }
  return publicState();
}

export function sendTicketMessage(ticketId: string, body: string): ChatResult {
  const ticketItem = ticketById(ticketId);
  const now = new Date().toISOString();
  ticketItem.messages.push({ id: id('msg'), author: 'operator', body, timestamp: now });
  ticketItem.status = ticketItem.status === 'open' ? 'in_progress' : ticketItem.status;
  ticketItem.updatedAt = now;

  const retryRequested = /\b(test login again|try again|retry|testa logga in igen)\b/i.test(body);
  let retry: AccessDecision | undefined;
  let reply: string;

  if (retryRequested) {
    retry = evaluateAccess(store, ticketItem.employeeId, ticketItem.applicationId);
    appendSignIn(store, ticketItem.employeeId, ticketItem.applicationId, retry);
    reply = retry.allowed
      ? `${personaPrefix(ticketItem.employeeId)} I tried again just now and I can get in. Looks fixed from my side.`
      : `${personaPrefix(ticketItem.employeeId)} I tried again, but it is still blocked: ${retry.message}`;
  } else {
    reply = scriptedReply(ticketItem.employeeId, body);
  }

  const message: TicketMessage = { id: id('msg'), author: 'employee', body: reply, timestamp: new Date().toISOString() };
  ticketItem.messages.push(message);
  ticketItem.updatedAt = message.timestamp;
  return { message, retry, resolution: getResolution(ticketItem.id), state: publicState() };
}

export function closeTicket(ticketId: string) {
  const ticketItem = ticketById(ticketId);
  const resolution = getResolution(ticketId);
  if (!resolution.readyToClose) {
    ticketItem.messages.push({ id: id('msg'), author: 'system', body: `Close blocked: ${resolution.summary}`, timestamp: new Date().toISOString() });
    return { closed: false, resolution, state: publicState() };
  }
  ticketItem.status = 'closed';
  ticketItem.updatedAt = new Date().toISOString();
  store.audit.push(event(store, 'Demo Operator', 'close_ticket', ticketItem.id, resolution.summary));
  return { closed: true, resolution, state: publicState() };
}

export function getResolution(ticketId: string): ResolutionCheck {
  const ticketItem = ticketById(ticketId);
  const employee = employeeById(ticketItem.employeeId);
  const app = appById(ticketItem.applicationId);
  const device = deviceById(employee.deviceId);
  const hasAppGroup = employee.groupIds.includes(app.requiredGroupId);
  const sessionsRevoked = store.audit.some((audit) => audit.action === 'revoke_sessions' && audit.target === employee.name);

  const requirements =
    ticketItem.scenarioType === 'terminated_enabled'
      ? [
          { label: 'Terminated user account disabled', satisfied: employee.accountState === 'disabled' },
          { label: 'Active sessions revoked', satisfied: sessionsRevoked }
        ]
      : [
          { label: `Assigned to ${groupById(app.requiredGroupId).name}`, satisfied: hasAppGroup },
          { label: 'MFA registration healthy', satisfied: !app.requiresMfa || employee.mfaState === 'registered' },
          { label: 'Managed device compliant', satisfied: !app.requiresCompliantDevice || device.compliant },
          { label: 'Account enabled for active employee', satisfied: employee.employment === 'active' && employee.accountState === 'enabled' }
        ];

  const readyToClose = requirements.every((item) => item.satisfied);
  return {
    ticketId,
    readyToClose,
    summary: readyToClose ? 'All simulated remediation requirements are satisfied.' : 'Required remediation is still incomplete.',
    requirements
  };
}

export function scenarioSummaries() {
  return store.scenarios.map((scenario) => ({
    id: scenario.id,
    type: scenario.type,
    ticketId: scenario.ticketId,
    employeeId: scenario.employeeId,
    applicationId: scenario.applicationId
  }));
}

function appendSignIn(current: Store, employeeId: string, applicationId: string, access: AccessDecision) {
  const employee = must(current.employees.find((item) => item.id === employeeId), 'employee');
  const app = must(current.applications.find((item) => item.id === applicationId), 'application');
  const device = must(current.devices.find((item) => item.id === employee.deviceId), 'device');
  current.signIns.push({
    id: id('signin', current),
    timestamp: new Date().toISOString(),
    employeeId,
    applicationId,
    applicationName: app.name,
    result: access.allowed ? 'success' : access.reason === 'MISSING_GROUP' ? 'failure' : 'denied',
    reason: access.message,
    mfa: app.requiresMfa ? (access.reason.startsWith('MFA') ? 'required' : 'satisfied') : 'not_required',
    device: device.name,
    ipAddress: employee.location === 'Stockholm' ? '198.51.100.24' : '203.0.113.18',
    correlationId: access.correlationId
  });
}

function scriptedReply(employeeId: string, body: string) {
  const employee = employeeById(employeeId);
  const text = body.toLowerCase();
  if (text.includes('phone') || text.includes('mfa')) return `${personaPrefix(employeeId)} My old phone is gone, so I cannot approve the prompt.`;
  if (text.includes('device') || text.includes('compliant')) return `${personaPrefix(employeeId)} I am on my normal work device. Company Portal says it checked in earlier.`;
  if (text.includes('group') || text.includes('access')) return `${personaPrefix(employeeId)} I had access before, but today the app says I am not assigned.`;
  if (employee.personality === 'urgent') return 'I have a customer call shortly, so I appreciate quick checks. I can test whenever you ask.';
  if (employee.personality === 'technical') return 'I can share exact timestamps and correlation IDs if useful.';
  return 'Thanks. I am here and can try again when you are ready.';
}

function personaPrefix(employeeId: string) {
  const employee = employeeById(employeeId);
  if (employee.personality === 'brief') return 'Short version:';
  if (employee.personality === 'careful') return 'I checked carefully:';
  if (employee.personality === 'urgent') return 'Quick update:';
  if (employee.personality === 'technical') return 'From my side:';
  return 'Thanks,';
}

function remediationFor(type: ScenarioType) {
  if (type === 'missing_group') return ['add required application group'];
  if (type === 'mfa_reset') return ['complete MFA registration'];
  if (type === 'non_compliant_device') return ['mark managed device compliant'];
  return ['disable account', 'revoke sessions'];
}

function decision(allowed: boolean, reason: AccessDecision['reason'], message: string, correlationId: string): AccessDecision {
  return { allowed, reason, message, correlationId };
}

function event(current: Store, actor: string, action: string, target: string, details: string): AuditEvent {
  return { id: id('audit', current), timestamp: new Date().toISOString(), actor, action, target, details };
}

function id(prefix: string, current = store) {
  const value = `${prefix}-${current.sequence.toString().padStart(4, '0')}`;
  current.sequence += 1;
  return value;
}

function employeeById(employeeId: string) {
  return must(store.employees.find((item) => item.id === employeeId), 'employee');
}

function appById(applicationId: string) {
  return must(store.applications.find((item) => item.id === applicationId), 'application');
}

function groupById(groupId: string) {
  return must(store.groups.find((item) => item.id === groupId), 'group');
}

function deviceById(deviceId: string) {
  return must(store.devices.find((item) => item.id === deviceId), 'device');
}

function ticketById(ticketId: string) {
  return must(store.tickets.find((item) => item.id === ticketId), 'ticket');
}

function must<T>(item: T | undefined, name: string): T {
  if (!item) throw new Error(`Unknown ${name}`);
  return item;
}
