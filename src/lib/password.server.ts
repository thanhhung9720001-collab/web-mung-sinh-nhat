import "server-only";

import { verifyPasswordAgainstHash } from "@/lib/password-hash";

export function verifyAdminPassword(password: string): boolean {
  return verifyPasswordAgainstHash(password, process.env.ADMIN_PASSWORD_HASH);
}

export function verifyGiftPassword(password: string): boolean {
  return verifyPasswordAgainstHash(password, process.env.GIFT_PASSWORD_HASH);
}
