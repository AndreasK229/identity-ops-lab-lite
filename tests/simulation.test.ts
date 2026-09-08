import { beforeEach, describe, expect, it } from 'vitest';
import { applyAdminAction, checkAccess, closeTicket, publicState, resetSimulation, scenarioSummaries, sendTicketMessage } from '../src/server/simulation';

describe('identity ops lite simulation', () => {
  beforeEach(() => {
    resetSimulation();
  });

  it('keeps access decision logic server-side and deterministic', () => {
    expect(checkAccess('emp-ada', 'app-ledger')).toMatchObject({ allowed: false, reason: 'MISSING_GROUP' });
    expect(checkAccess('emp-ben', 'app-people')).toMatchObject({ allowed: false, reason: 'MFA_RESET_REQUIRED' });
    expect(checkAccess('emp-cora', 'app-crm')).toMatchObject({ allowed: false, reason: 'DEVICE_NOT_COMPLIANT' });
  });

  it('activates the four lite scenarios without exposing remediation truth', () => {
    const scenarios = scenarioSummaries();
    expect(scenarios).toHaveLength(4);
    expect(scenarios.map((scenario) => scenario.type)).toEqual([
      'missing_group',
      'mfa_reset',
      'non_compliant_device',
      'terminated_enabled'
    ]);
    expect(JSON.stringify(scenarios)).not.toContain('expectedRemediation');
  });

  it('admin remediation actions update identity state and write audit events', () => {
    applyAdminAction({ type: 'add_group', employeeId: 'emp-ada', groupId: 'grp-finance' });
    applyAdminAction({ type: 'complete_mfa_registration', employeeId: 'emp-ben' });
    applyAdminAction({ type: 'mark_device_compliant', deviceId: 'dev-cora' });

    const state = publicState();
    expect(state.employees.find((employee) => employee.id === 'emp-ada')?.groupIds).toContain('grp-finance');
    expect(state.employees.find((employee) => employee.id === 'emp-ben')?.mfaState).toBe('registered');
    expect(state.devices.find((device) => device.id === 'dev-cora')?.compliant).toBe(true);
    expect(state.audit.map((event) => event.action)).toEqual(
      expect.arrayContaining(['add_group', 'complete_mfa_registration', 'mark_device_compliant'])
    );
  });

  it('blocks close before remediation is complete', () => {
    const result = closeTicket('tick-1001');
    expect(result.closed).toBe(false);
    expect(result.resolution.readyToClose).toBe(false);
    expect(result.state.tickets.find((ticket) => ticket.id === 'tick-1001')?.status).not.toBe('closed');
  });

  it('allows close after successful remediation', () => {
    applyAdminAction({ type: 'add_group', employeeId: 'emp-ada', groupId: 'grp-finance' });
    const result = closeTicket('tick-1001');
    expect(result.closed).toBe(true);
    expect(result.state.tickets.find((ticket) => ticket.id === 'tick-1001')?.status).toBe('closed');
  });

  it('runs a fresh ticket retry verification from natural language', () => {
    const blocked = sendTicketMessage('tick-1003', 'please test login again');
    expect(blocked.retry).toMatchObject({ allowed: false, reason: 'DEVICE_NOT_COMPLIANT' });
    expect(blocked.message.body).toContain('still blocked');

    applyAdminAction({ type: 'mark_device_compliant', deviceId: 'dev-cora' });
    const fixed = sendTicketMessage('tick-1003', 'testa logga in igen');
    expect(fixed.retry).toMatchObject({ allowed: true, reason: 'ALLOWED' });
    expect(fixed.message.body).toContain('I can get in');
  });
});
