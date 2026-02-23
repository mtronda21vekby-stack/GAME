export type Env = {
  DB: D1Database;
  MEDIA: R2Bucket;

  SESSION_SECRET: string;
  UPLOAD_SECRET: string;

  ADMIN_PASSWORD: string; // set in CF env
};
