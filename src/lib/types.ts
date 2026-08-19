export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  timestamp: string;
  data: T;
  meta?: Meta;
}

export interface Translation {
  id: string;
  locale: string;
  title: string;
  description?: string | null;
  content?: string | null;
}

export interface Season {
  id: string;
  slug: string;
  platform: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: string | null;
  sortOrder: number;
  createdAt: string;
  translations: Translation[];
  _count?: { episodes: number };
  episodes?: Episode[];
  author?: PublicUser | null;
}

export interface Episode {
  id: string;
  slug: string;
  seasonId: string | null;
  platform: string;
  coverImage: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  duration: number | null;
  episodeNumber: number | null;
  published: boolean;
  publishedAt: string | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  translations: Translation[];
  season?: Season | null;
  author?: PublicUser | null;
}

export interface Playlist {
  id: string;
  slug: string;
  kind: string;
  platform: string;
  ownerId: string | null;
  coverImage: string | null;
  isPublic: boolean;
  createdAt: string;
  translations: Translation[];
  items?: PlaylistEntry[];
  _count?: { items: number };
}

export interface PlaylistEntry {
  id: string;
  episodeId: string | null;
  sortOrder: number;
  addedAt: string;
  episode?: Episode | null;
}

export interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  position: string;
  active: boolean;
  sortOrder: number;
  translations: { id: string; locale: string; title: string; subtitle?: string | null }[];
}

export interface PublicUser {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
}

export interface CommentItem {
  id: string;
  body: string;
  contentType: string;
  contentId: string;
  parentId: string | null;
  likesCount: number;
  edited: boolean;
  status: string;
  createdAt: string;
  user: PublicUser;
  likedByMe?: boolean;
  replies?: CommentItem[];
  _count?: { replies: number };
}

export interface ProgressEntry {
  id: string;
  userId: string;
  episodeId: string;
  positionSeconds: number;
  durationSeconds: number | null;
  percent: number;
  updatedAt: string;
  episode?: Episode | null;
}

export interface LikeHistoryItem {
  id: string;
  type: string;
  contentType: string;
  contentId: string;
  createdAt: string;
  episode?: Episode | null;
}

export interface ViewHistoryItem {
  id: string;
  contentType: string;
  contentId: string;
  platform: string;
  locale: string;
  durationSec: number | null;
  completed: boolean;
  watchedAt: string;
  title?: string | null;
  coverImage?: string | null;
  slug?: string | null;
  episode?: Episode | null;
}

export interface UserProfile {
  id: string;
  email: string;
  emailVerified: string | null;
  name: string;
  username: string;
  publicId?: string | null;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  bio: string | null;
  status: string;
  locale: string;
  createdAt: string;
  twoFactorEnabled: boolean;
  twoFactorMethod?: "EMAIL" | "APP";
  referralCode?: string | null;
  phone?: string | null;
  phoneVerifiedAt?: string | null;
  telegramChatId?: string | null;
  telegramUsername?: string | null;
  onboardedAt?: string | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  hasPassword?: boolean;
  phoneLinked?: boolean;
  googleLinked?: boolean;
  githubLinked?: boolean;
  facebookLinked?: boolean;
}

export interface Article {
  id: string;
  slug: string;
  authorId: string | null;
  seasonId: string | null;
  platform: string;
  coverImage: string | null;
  category: string | null;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  translations: (Translation & {
    excerpt?: string | null;
    body?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  })[];
  author?: PublicUser | null;
  season?: Season | null;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserSession {
  id: string;
  platform: string | null;
  deviceType: string | null;
  deviceName: string | null;
  os: string | null;
  browser: string | null;
  ip: string | null;
  country: string | null;
  city: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface SearchResult {
  type: "episode" | "article" | "season" | "playlist";
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  publishedAt?: string | null;
  viewsCount?: number;
}

export interface Suggestion {
  type: "episode" | "article" | "season" | "playlist";
  slug: string;
  title: string;
  coverImage?: string;
}

export interface FriendUser {
  id: string;
  name: string | null;
  username: string;
  publicId?: string | null;
  avatarUrl: string | null;
  bio?: string | null;
}

export interface FriendRequestItem {
  id: string;
  sender: FriendUser;
  receiver?: FriendUser;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FriendRelation {
  status: "none" | "pending" | "accepted" | "rejected" | "blocked";
  id?: string;
  incoming?: boolean;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  type?: string;
  body: string;
  attachmentUrl?: string | null;
  attachmentMime?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  durationSec?: number | null;
  readAt: string | null;
  createdAt: string;
  sender?: FriendUser;
}

export interface GroupInfo {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  memberCount?: number;
}

export interface GroupMember {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
}

export interface GroupDetail extends GroupInfo {
  createdById: string | null;
  members: GroupMember[];
}

export interface ConversationSummary {
  id: string;
  kind: "direct" | "group";
  other?: FriendUser | null;
  group?: GroupInfo | null;
  lastMessage: MessageItem | null;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface ConversationDetail {
  conversation: {
    id: string;
    kind: "direct" | "group";
    other?: FriendUser | null;
    group?: GroupDetail | null;
  };
  messages: MessageItem[];
  meta: Meta;
}

export interface PublicProfile {
  id: string;
  name: string | null;
  username: string;
  publicId?: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  locale: string;
  createdAt: string;
  verified: boolean;
  stats: {
    friendsCount: number;
    ratingsCount: number;
    articlesCount: number;
    playlistsCount: number;
  };
}
