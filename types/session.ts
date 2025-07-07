export interface Session {
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
  expires: string;
  token?: {
    googleAuthTimestamp?: number;
  };
}