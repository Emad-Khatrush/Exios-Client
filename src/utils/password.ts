// How strong the password is, in words a customer understands
export const passwordStrength = (p: string) => {
  if (!p) return { score: 0, label: '' };
  let s = 0;
  if (p.length >= 6) s += 1;
  if (p.length >= 10) s += 1;
  if (/[a-z]/i.test(p) && /\d/.test(p)) s += 1;
  if (/[^a-z0-9]/i.test(p) || /[A-Z]/.test(p)) s += 1;
  if (p.length < 6) return { score: 1, label: 'قصيرة' };
  return [
    { score: 1, label: 'ضعيفة' }, { score: 2, label: 'مقبولة' }, { score: 3, label: 'جيدة' }, { score: 4, label: 'قوية' },
  ][Math.min(3, Math.max(0, s - 1))];
};
