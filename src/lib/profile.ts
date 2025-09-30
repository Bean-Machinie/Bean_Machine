import { API_BASE_URL, apiFetch, type ApiSocialLinks, type ApiUser } from './api';

export type Profile = ApiUser;

export type UpdateProfilePayload = {
  displayName?: string;
  bio?: string;
  social?: ApiSocialLinks;
  avatarUrl?: string;
};

/**
 * Collection of helpers for interacting with the profile API endpoints.
 * These utilities keep components focused on rendering concerns while
 * abstracting fetch/JSON handling into a tiny service layer.
 */
export async function getProfile(): Promise<Profile> {
  const data = await apiFetch<{ profile: Profile }>('/api/profile', { method: 'GET' });
  return data.profile;
}

/**
 * Persist a partial profile update. Only the provided fields will be sent to
 * the API which keeps requests minimal and lets the backend handle validation.
 */
export async function updateProfile(payload: UpdateProfilePayload): Promise<Profile> {
  const data = await apiFetch<{ profile: Profile }>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return data.profile;
}

/**
 * Upload an avatar image and receive the hosted URL. Callers typically chain
 * this with `updateProfile` or `refreshUser` so the new image appears
 * everywhere without a full reload.
 */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string; profile: Profile }> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as { avatarUrl: string; profile: Profile; message?: string }) : null;

  if (!response.ok) {
    const message = data?.message ?? 'Failed to upload avatar.';
    throw new Error(message);
  }

  if (!data) {
    throw new Error('The server did not return an avatar URL.');
  }

  return { avatarUrl: data.avatarUrl, profile: data.profile };
}
