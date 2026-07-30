import { randomBytes } from "crypto";
import { sql } from "@/lib/db";

const TOKEN_TTL_MS: Record<"invite" | "reset", number> = {
  invite: 7 * 24 * 60 * 60 * 1000, // 7 days
  reset: 60 * 60 * 1000, // 1 hour
};

export async function createAuthToken(
  userId: number,
  type: "invite" | "reset",
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS[type]);

  await sql`
    INSERT INTO auth_tokens (user_id, token, type, expires_at)
    VALUES (${userId}, ${token}, ${type}, ${expiresAt.toISOString()})
  `;

  return token;
}

export type AuthTokenRecord = {
  id: number;
  user_id: number;
  type: "invite" | "reset";
  expires_at: string;
  used_at: string | null;
};

export async function consumeAuthToken(token: string): Promise<AuthTokenRecord | null> {
  const [record] = (await sql`
    SELECT id, user_id, type, expires_at, used_at
    FROM auth_tokens
    WHERE token = ${token}
  `) as AuthTokenRecord[];

  if (!record) return null;
  if (record.used_at) return null;
  if (new Date(record.expires_at).getTime() < Date.now()) return null;

  await sql`UPDATE auth_tokens SET used_at = now() WHERE id = ${record.id}`;

  return record;
}
