export type Role = "admin" | "manager" | "accountant" | "viewer";

export const defaultPermissions: Record<Role, string[]> = {
  admin: ["*"],
  manager: ["products:create", "products:read", "ledger:read", "sales:create", "purchases:create", "users:read"],
  accountant: ["ledger:read", "payments:update", "purchases:read", "sales:read"],
  viewer: ["ledger:read", "products:read"],
};

export const can = (role: Role, permission: string) => {
  const allowed = defaultPermissions[role] || [];
  return allowed.includes("*") || allowed.includes(permission);
};



