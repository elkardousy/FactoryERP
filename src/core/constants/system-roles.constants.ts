export const SystemRoles = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SUPERVISOR: 'SUPERVISOR',
  STAFF: 'STAFF',
} as const;

export type SystemRole = (typeof SystemRoles)[keyof typeof SystemRoles];
