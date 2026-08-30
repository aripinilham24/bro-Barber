"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Klien Better Auth untuk komponen React (client-side).
 * Sesi disimpan dalam cookie HttpOnly oleh server.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
