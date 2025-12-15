import { validateSession } from '@/app/(presentation-generator)/services/api/auth';
import { RootState } from '@/store/store';

export interface UserContext {
  userId: number | null;
  username: string | null;
}

/**
 * Extract user context from session token in API routes
 */
export async function getUserContextFromToken(authHeader: string | null): Promise<UserContext> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, username: null };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const response = await validateSession(token);
    if (response.valid) {
      return {
        userId: response.user_id || null,
        username: response.username || null,
      };
    }
  } catch (error) {
    // Validation failed, return null context
  }

  return { userId: null, username: null };
}

/**
 * Get user context from Redux store (client-side)
 */
export function getUserContextFromStore(state: RootState): UserContext {
  return {
    userId: state.auth.userId,
    username: state.auth.username,
  };
}
