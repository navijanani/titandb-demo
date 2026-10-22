/**
 * DEMO auth API. There are no accounts, tokens or sign-in in the demo; the visitor is
 * always the preloaded "Demo Visitor" user. Only profile edits are kept (in memory).
 */
import type { User, ProfileUpdateRequest } from "../types/auth";
import { S } from "../demo/store";

const view = (): User => ({ ...S.user });

export async function getMeApi(): Promise<User> {
  return view();
}

export async function updateProfileApi(req: ProfileUpdateRequest): Promise<User> {
  if (req.display_name !== undefined && req.display_name.trim()) S.user.display_name = req.display_name.trim();
  if (req.email !== undefined && req.email.trim()) S.user.email = req.email.trim();
  return view();
}
