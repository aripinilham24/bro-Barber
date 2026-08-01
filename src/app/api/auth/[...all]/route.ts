import { auth } from "@/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Route handler Better Auth — menangani /api/auth/*
export const { POST, GET } = toNextJsHandler(auth);
