type User = { userId: string; email?: string; name?: string; picture?: string; scope: string };
type ApiResponse<T = unknown> = { data: T };

const unavailable = (feature: string) => {
  const error = new Error(
    feature+' requires the AppDeploy runtime. Local Vite uses guest-only demo behaviour.'
  ) as Error & { code?: string };
  error.code = 'appdeploy_unavailable';
  return error;
};

export const auth = {
  isSignedIn: () => false,
  getUser: async (): Promise<User> => {
    throw unavailable('Account sign-in');
  },
  signIn: async (): Promise<{ user: User }> => {
    throw unavailable('Account sign-in');
  },
  signOut: async (): Promise<void> => undefined,
};

export const api = {
  get: async <T = unknown>(): Promise<ApiResponse<T>> => {
    throw unavailable('Authenticated API access');
  },
  post: async <T = unknown>(): Promise<ApiResponse<T>> => {
    throw unavailable('Authenticated API access');
  },
};
