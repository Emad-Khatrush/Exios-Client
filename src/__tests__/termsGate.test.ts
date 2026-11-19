import { shouldAskForTerms } from '../utils/termsGate';

const account = (terms?: { current: string, accepted: string | null, needsAcceptance: boolean }) => ({ terms } as any);

describe('shouldAskForTerms', () => {
  it('asks when the server says the current version was not agreed to, and this app shows that version', () => {
    expect(shouldAskForTerms(account({ current: '2.0', accepted: null, needsAcceptance: true }), '2.0')).toBe(true);
    expect(shouldAskForTerms(account({ current: '2.0', accepted: '1.0', needsAcceptance: true }), '2.0')).toBe(true);
  });

  it('does not ask once agreed', () => {
    expect(shouldAskForTerms(account({ current: '2.0', accepted: '2.0', needsAcceptance: false }), '2.0')).toBe(false);
  });

  it('does not ask while this app still shows other terms than the server asks for', () => {
    expect(shouldAskForTerms(account({ current: '2.0', accepted: null, needsAcceptance: true }), '1.0')).toBe(false);
  });

  it('does not ask before the account came from the server', () => {
    expect(shouldAskForTerms(account(undefined), '2.0')).toBe(false);
    expect(shouldAskForTerms(undefined, '2.0')).toBe(false);
  });
});
