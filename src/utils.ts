/**
 * Helper utilities for formatting and Gmail deep-linking
 */

export function createGmailComposeUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: to || '',
    su: subject || '',
    body: body || '',
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function createMailtoUrl(to: string, subject: string, body: string): string {
  const encSubject = encodeURIComponent(subject || '');
  const encBody = encodeURIComponent(body || '');
  return `mailto:${encodeURIComponent(to || '')}?subject=${encSubject}&body=${encBody}`;
}

export function formatDatePt(isoDateStr?: string): string {
  if (!isoDateStr) return '—';
  try {
    const parts = isoDateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDateStr;
  } catch {
    return isoDateStr;
  }
}

export function getStatusBadgeStyle(status: string): { bg: string; text: string; border: string; label: string } {
  switch (status) {
    case 'novo':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'Novo' };
    case 'visto':
      return { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200', label: 'Visto' };
    case 'preparada':
      return { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', label: 'Preparada' };
    case 'enviado':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Enviado' };
    case 'ignorado':
      return { bg: 'bg-neutral-50', text: 'text-neutral-400', border: 'border-neutral-200', label: 'Ignorado' };
    default:
      return { bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-200', label: status };
  }
}
