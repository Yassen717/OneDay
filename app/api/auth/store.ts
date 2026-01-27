// In-memory user store (replace with database in production)
export const users: Map<string, { email: string; password: string; name: string }> = new Map();
