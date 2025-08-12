/**
 * Utility functions for formatting data consistently across the application
 */

/**
 * Format currency amount in French locale
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

/**
 * Format date in French locale
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR').format(date);
};

/**
 * Format date with time in French locale
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Format number with French locale
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};