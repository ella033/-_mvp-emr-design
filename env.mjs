// env.mjs
import { z } from "zod";

const serverSchema = z.object({
  NEXTAUTH_SECRET: z.string(),
  APP_API_URL: z.string().url().optional(), // 런타임 환경변수 (선택적)
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_API_URL: z.string().url(),
});

export const env = {
  ...serverSchema.parse(process.env),
  ...clientSchema.parse(process.env),
};
