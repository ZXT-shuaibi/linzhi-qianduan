import type { AuthenticatedUser } from "@/types/auth";
import type { ProfileResponse } from "@/types/profile";

export type ProfileApiPayload = {
  userId: string;
  nickname: string;
  avatar?: string | null;
  bio?: string | null;
  account?: string | null;
  phone?: string | null;
  email?: string | null;
  gender?: ProfileResponse["gender"];
  birthday?: string | null;
  school?: string | null;
  tags?: string[];
  socialCounters?: ProfileResponse["socialCounters"];
  relationStatus?: ProfileResponse["relationStatus"];
  self?: boolean;
};

export const mapProfileResponse = (profile: ProfileApiPayload): ProfileResponse => {
  const tags = profile.tags ?? [];

  return {
    id: profile.userId,
    userId: profile.userId,
    nickname: profile.nickname,
    avatar: profile.avatar ?? null,
    bio: profile.bio ?? null,
    account: profile.account ?? null,
    phone: profile.phone ?? null,
    email: profile.email ?? null,
    gender: profile.gender,
    birthday: profile.birthday ?? null,
    school: profile.school ?? null,
    tags,
    skills: tags,
    tagJson: JSON.stringify(tags),
    socialCounters: profile.socialCounters,
    relationStatus: profile.relationStatus,
    self: profile.self ?? false
  };
};

export const mapAuthenticatedUser = (profile: ProfileResponse): AuthenticatedUser => ({
  id: profile.userId,
  userId: profile.userId,
  phone: profile.phone ?? null,
  account: profile.account ?? null,
  email: profile.email ?? null,
  nickname: profile.nickname,
  avatar: profile.avatar ?? null,
  bio: profile.bio ?? null,
  gender: profile.gender,
  birthday: profile.birthday ?? null,
  school: profile.school ?? null,
  tags: profile.tags ?? [],
  skills: profile.tags ?? [],
  tagJson: JSON.stringify(profile.tags ?? []),
  self: profile.self
});
