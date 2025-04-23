export const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export function isValidAdminToken(token: string): boolean {
  return token === ADMIN_TOKEN;
}
