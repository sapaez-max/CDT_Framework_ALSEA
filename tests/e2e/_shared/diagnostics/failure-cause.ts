export type FailureCause =
  | 'configuration'
  | 'authentication'
  | 'navigation'
  | 'assertion'
  | 'timeout'
  | 'download'
  | 'upload'
  | 'unknown';

export function classifyFailure(message: string): FailureCause {
  const normalized = message.toLowerCase();

  if (normalized.includes('configura') || normalized.includes('base_url')) return 'configuration';
  if (normalized.includes('login') || normalized.includes('password') || normalized.includes('unauthorized')) return 'authentication';
  if (normalized.includes('goto') || normalized.includes('navigation')) return 'navigation';
  if (normalized.includes('expect') || normalized.includes('to be')) return 'assertion';
  if (normalized.includes('timeout')) return 'timeout';
  if (normalized.includes('download')) return 'download';
  if (normalized.includes('upload') || normalized.includes('file')) return 'upload';

  return 'unknown';
}
