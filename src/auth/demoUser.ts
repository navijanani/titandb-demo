import type { User } from "../types/auth";
import { S } from "../demo/store";

export const getMeSync = (): User => ({ ...S.user });
