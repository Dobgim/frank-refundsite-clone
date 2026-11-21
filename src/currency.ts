export const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
] as const

export type Currency = (typeof currencyOptions)[number]['value']

export function isCurrency(value: string | null): value is Currency {
  return currencyOptions.some((option) => option.value === value)
}

export function formatCurrency(amount: number, currency: Currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}
