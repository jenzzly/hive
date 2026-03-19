import type { Currency } from '../types';

export function formatCurrency(amount: number, currency: Currency = 'USD') {
  if (currency === 'RWF') {
    return `${amount.toLocaleString()} RWF`;
  }
  return `$${amount.toLocaleString()}`;
}

export function getCurrencySymbol(currency: Currency = 'USD') {
  return currency === 'RWF' ? 'RWF' : '$';
}
