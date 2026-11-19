import { User } from '../models';

// Ask the customer to agree to the terms only when the server says the version in force was not agreed
// to yet AND this app shows that same version (TERMS_VERSION in TermsAndPrivacy/terms.ts). So an app
// still carrying older terms, or a server not yet moved to new ones, never asks for agreement to text the
// customer cannot read. `terms` comes with GET /account/me (refreshed on every app load) and with the
// answer to agreeing; accounts saved before that have none, and are not asked until it arrives.
export const shouldAskForTerms = (account: User | undefined, appVersion: string) => {
  const terms = account?.terms;
  return !!terms && terms.needsAcceptance && terms.current === appVersion;
};
