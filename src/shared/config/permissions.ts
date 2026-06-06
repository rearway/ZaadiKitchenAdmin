import type { Role } from './roles';

const ALLOWED: Record<Role, string[]> = {
  admin: ['dashboard', 'ops', 'labels', 'revenue', 'menu', 'customers', 'comms', 'areas'],
  ops: ['ops', 'labels'],
};

export function canAccess(role: Role, feature: string): boolean {
  return ALLOWED[role].includes(feature);
}
