export type UserRole = 'admin' | 'dispatcher' | 'pilot' | 'cabin_crew';

export type JwtUser = {
  id: number;
  role: UserRole;
  email: string;
};
