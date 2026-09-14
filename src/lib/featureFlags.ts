// Feature flags — set NEXT_PUBLIC_ENABLE_DEMO_SEEDING=false in production to hide seeding UI
export const FEATURES = {
  DEMO_SEEDING: process.env.NEXT_PUBLIC_ENABLE_DEMO_SEEDING !== 'false',
} as const;
