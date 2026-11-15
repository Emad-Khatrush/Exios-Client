import { useState } from 'react';

// Copies a value and remembers which one for a moment, so its button can say "copied"
export const useCopy = () => {
  const [copied, setCopied] = useState('');
  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Older browsers: a hidden field and the copy command
      const field = document.createElement('textarea');
      field.value = value;
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setCopied(id);
    window.setTimeout(() => setCopied((v) => (v === id ? '' : v)), 1600);
  };
  return { copied, copy };
};
