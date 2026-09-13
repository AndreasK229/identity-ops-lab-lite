import { Check, CircleAlert, GitBranch, History, Lock, MessageSquare, RefreshCcw, RotateCcw, ShieldCheck, UserRound } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { closeTicket, loadState, resetState, runAction, sendMessage } from './api';
import type { AdminAction, AuditEvent, Employee, PublicState, SignInLog, Ticket } from '../shared/types';

export function App() {
  const [state, setState] = useState<PublicState | null>(null);
  const [selectedId, setSelectedId] = useState('tick-1001');
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('Loading simulator...');

  useEffect(() => {
    loadState()
      .then((next) => {
        setState(next);
        setNotice('Demo role: IAM Support Operator');
      })
      .catch((error: Error) => setNotice(error.message));
  }, []);

  const selected = useMemo(() => state?.tickets.find((ticket) => ticket.id === selectedId) ?? state?.tickets[0], [selectedId, state]);
  const employee = selected && state?.employees.find((item) => item.id === selected.employeeId);
  const device = employee && state?.devices.find((item) => item.id === employee.deviceId);
  const app = selected && state?.applications.find((item) => item.id === selected.applicationId);
  const resolution = selected && state?.resolution[selected.id];
  const ticketLogs = selected ? state?.signIns.filter((log) => log.employeeId === selected.employeeId) ?? [] : [];
  const employeeGroups = employee ? state?.groups.filter((group) => employee.groupIds.includes(group.id)) ?? [] : [];
  const requiredGroup = state?.groups.find((group) => group.id === app?.requiredGroupId);
  const latestDecision = ticketLogs[0];
  const timeline = selected && state ? buildTimeline(selected, state, ticketLogs) : [];

  async function action(nextAction: AdminAction, label: string) {
    const result = await runAction(nextAction);
    setState(result.state);
    setNotice(label);
  }

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    if (!selected || !draft.trim()) return;
    const result = await sendMessage(selected.id, draft.trim());
    setDraft('');
    setState(result.state);
    setNotice(result.retry ? result.retry.message : 'Persona replied.');
  }

  async function tryClose() {
    if (!selected) return;
    const result = await closeTicket(selected.id);
    setState(result.state);
    setNotice(result.closed ? 'Ticket closed.' : 'Close blocked until remediation is complete.');
  }

  async function reset() {
    const next = await resetState();
    setState(next);
    setSelectedId('tick-1001');
    setNotice('Simulator reset to deterministic seed data.');
  }

  if (!state || !selected || !employee || !device || !app || !resolution) {
    return <main className="shell"><div className="status-line">{notice}</div></main>;
  }

  return (
    <main className="console">
      <header className="topbar">
        <div>
          <p className="eyebrow">Identity Ops Lab Lite</p>
          <h1>IAM Operations Console</h1>
        </div>
        <div className="top-actions">
          <span className="status-line">{notice}</span>
          <button type="button" className="icon-button" onClick={reset} title="Reset simulator">
            <RotateCcw size={17} />
          </button>
        </div>
      </header>

      <section className="layout">
        <aside className="queue" aria-label="Ticket queue">
          <div className="panel-heading">
              <h2>Identity Cases</h2>
            <span>{state.tickets.filter((ticket) => ticket.status !== 'closed').length} open</span>
          </div>
          {state.tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              className={`ticket-row ${ticket.id === selected.id ? 'active' : ''}`}
              onClick={() => setSelectedId(ticket.id)}
            >
              <span className={`priority ${ticket.priority}`}>{ticket.priority}</span>
              <strong>{ticket.title}</strong>
              <span>{employeeName(state, ticket)} · {ticket.status}</span>
            </button>
          ))}
        </aside>

        <section className="ticket-detail">
          <div className="detail-header">
            <div>
              <p className="eyebrow">Identity case · {selected.id} · {app.name}</p>
              <h2>{selected.title}</h2>
              <p>{selected.description}</p>
            </div>
            <button type="button" onClick={tryClose}>
              <Lock size={16} /> Close ticket
            </button>
          </div>

          <div className="workspace-grid">
            <section className="conversation">
              <h3><MessageSquare size={16} /> Conversation</h3>
              <div className="messages">
                {selected.messages.map((message) => (
                  <article key={message.id} className={`message ${message.author}`}>
                    <span>{message.author}</span>
                    <p>{message.body}</p>
                  </article>
                ))}
              </div>
              <form onSubmit={submitMessage} className="chat-form">
                <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask a diagnostic question or type retry" />
                <button type="submit"><RefreshCcw size={16} /> Send</button>
              </form>
            </section>

            <section className="profile-panel">
              <h3><UserRound size={16} /> Employee</h3>
              <div className="identity-card">
                <span>{employee.initials}</span>
                <div>
                  <strong>{employee.name}</strong>
                  <p>{employee.title}</p>
                </div>
              </div>
              <dl>
                <dt>Department</dt><dd>{employee.department}</dd>
                <dt>Manager</dt><dd>{employee.manager}</dd>
                <dt>Account</dt><dd>{employee.accountState}</dd>
                <dt>MFA</dt><dd>{employee.mfaState.replace('_', ' ')}</dd>
                <dt>Employment</dt><dd>{employee.employment}</dd>
                <dt>Device</dt><dd>{device.name} · {device.compliant ? 'compliant' : 'non-compliant'}</dd>
              </dl>
              <h4>Groups</h4>
              <div className="chips">{employeeGroups.map((group) => <span key={group.id}>{group.name}</span>)}</div>
            </section>
          </div>
        </section>

        <aside className="evidence">
          <section>
            <h3><GitBranch size={16} /> Policy Evidence</h3>
            <div className="evidence-grid">
              <EvidenceItem label="Required group" value={requiredGroup?.name ?? 'Unknown group'} state={employee.groupIds.includes(app.requiredGroupId)} />
              <EvidenceItem label="Actual assignment" value={employee.groupIds.includes(app.requiredGroupId) ? 'Assigned' : 'Missing'} state={employee.groupIds.includes(app.requiredGroupId)} />
              <EvidenceItem label="MFA requirement" value={app.requiresMfa ? `Required · ${employee.mfaState.replace('_', ' ')}` : 'Not required'} state={!app.requiresMfa || employee.mfaState === 'registered'} />
              <EvidenceItem label="Device requirement" value={app.requiresCompliantDevice ? `${device.name} · ${device.compliant ? 'compliant' : 'non-compliant'}` : 'Not required'} state={!app.requiresCompliantDevice || device.compliant} />
              <EvidenceItem label="Account state" value={`${employee.accountState} · ${employee.employment}`} state={employee.employment === 'terminated' ? employee.accountState === 'disabled' : employee.accountState === 'enabled'} />
              <EvidenceItem label="Latest decision" value={latestDecision ? `${latestDecision.result} · ${latestDecision.correlationId}` : 'No access check yet'} state={latestDecision?.result === 'success'} />
            </div>
          </section>

          <section>
            <h3><ShieldCheck size={16} /> Identity Resolution Gate</h3>
            {resolution.requirements.map((item) => (
              <div className="check-row" key={item.label}>
                {item.satisfied ? <Check size={16} /> : <CircleAlert size={16} />}
                <span>{item.label}</span>
              </div>
            ))}
          </section>

          <section>
            <h3>Simulated Admin Actions</h3>
            <div className="actions">
              <button type="button" onClick={() => action({ type: 'add_group', employeeId: employee.id, groupId: app.requiredGroupId }, 'Group membership updated.')}>Add app group</button>
              <button type="button" onClick={() => action({ type: 'remove_group', employeeId: employee.id, groupId: app.requiredGroupId }, 'Group membership removed.')}>Remove app group</button>
              <button type="button" onClick={() => action({ type: 'reset_mfa', employeeId: employee.id }, 'MFA reset required.')}>Reset MFA</button>
              <button type="button" onClick={() => action({ type: 'complete_mfa_registration', employeeId: employee.id }, 'MFA registration completed.')}>Complete MFA</button>
              <button type="button" onClick={() => action({ type: 'mark_device_compliant', deviceId: device.id }, 'Device marked compliant.')}>Mark device compliant</button>
              <button type="button" onClick={() => action({ type: 'disable_account', employeeId: employee.id }, 'Account disabled.')}>Disable account</button>
              <button type="button" onClick={() => action({ type: 'revoke_sessions', employeeId: employee.id }, 'Sessions revoked.')}>Revoke sessions</button>
            </div>
          </section>

          <section>
            <h3>Access Check Timeline</h3>
            <div className="timeline">
              {timeline.map((item) => (
                <article key={item.id} className={`timeline-item ${item.kind}`}>
                  <span>{item.label}</span>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <small>{new Date(item.timestamp).toLocaleTimeString()}</small>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h3>Authentication & CA Evidence</h3>
            <div className="log-list">
              {ticketLogs.map((log) => (
                <article key={log.id}>
                  <strong>{log.applicationName} · {log.result}</strong>
                  <span>{log.reason}</span>
                  <small>{log.correlationId} · {new Date(log.timestamp).toLocaleTimeString()}</small>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h3><History size={16} /> Audit Log</h3>
            <div className="log-list">
              {state.audit.map((event) => (
                <article key={event.id}>
                  <strong>{event.action}</strong>
                  <span>{event.target}: {event.details}</span>
                  <small>{event.actor}</small>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function EvidenceItem({ label, value, state }: { label: string; value: string; state: boolean }) {
  return (
    <div className={`evidence-item ${state ? 'ok' : 'blocked'}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function employeeName(state: PublicState, ticket: Ticket) {
  return state.employees.find((employee: Employee) => employee.id === ticket.employeeId)?.name ?? 'Unknown employee';
}

function buildTimeline(ticket: Ticket, state: PublicState, logs: SignInLog[]) {
  const employee = state.employees.find((item) => item.id === ticket.employeeId);
  const device = employee ? state.devices.find((item) => item.id === employee.deviceId) : undefined;
  const relatedAudit = employee
    ? state.audit.filter(
        (event) =>
          event.target === employee.name ||
          event.target === device?.name ||
          event.target === ticket.id ||
          event.details.toLowerCase().includes(employee.name.toLowerCase())
      )
    : [];

  return [
    {
      id: `${ticket.id}-opened`,
      kind: 'case',
      timestamp: ticket.createdAt,
      label: 'Case opened',
      title: ticket.title,
      detail: ticket.description
    },
    ...logs.map((log) => ({
      id: log.id,
      kind: log.result === 'success' ? 'success' : 'blocked',
      timestamp: log.timestamp,
      label: 'Access check',
      title: `${log.applicationName} · ${log.result}`,
      detail: `${log.reason} · ${log.correlationId}`
    })),
    ...relatedAudit.map((event: AuditEvent) => ({
      id: event.id,
      kind: 'admin',
      timestamp: event.timestamp,
      label: 'Admin action',
      title: event.action,
      detail: `${event.target}: ${event.details}`
    }))
  ]
    .sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp))
    .slice(-8);
}
