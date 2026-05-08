"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, UserPlus, UserMinus, Search, TrendingUp,
  Heart, Eye, Loader, BookOpen, Clock, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  name: string;
  avatar: string;
  college?: string;
  subject?: string;
  followers: number;
  uploads: number;
  isFollowing: boolean;
}

export interface FollowedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  noteTitle: string;
  noteThumbnail: string;
  category: string;
  timestamp: string;
  likes: number;
  views: number;
}

const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

const ipfsUrl = (cid: string | null): string =>
  cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : '';

const fallbackAvatar = (name: string): string =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=6d28d9&color=fff`;

export default function CommunityPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'discover' | 'following' | 'feed'>('feed');
  const [searchQuery, setSearchQuery] = useState('');

  const [feedPosts, setFeedPosts] = useState<FollowedPost[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<User[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [feedLoading, setFeedLoading] = useState(true);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, []);

  const fetchFollowingIds = useCallback(async (userId: string) => {
    try {
      setFollowingLoading(true);
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
      if (error) throw error;
      const ids = new Set<string>((data || []).map((r: any) => r.following_id as string));
      setFollowingIds(ids);
    } catch (err) {
      console.error('Failed to fetch following ids:', err);
    } finally {
      setFollowingLoading(false);
    }
  }, []);

  const fetchFeed = useCallback(async () => {
    try {
      setFeedLoading(true);
      const { data, error } = await supabase
        .from('lectures')
        .select('id, user_id, title, category, thumbnail_cid, teacher_name, teacher_profile_picture, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      const posts: FollowedPost[] = (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.teacher_name || 'Unknown Teacher',
        userAvatar: row.teacher_profile_picture || fallbackAvatar(row.teacher_name || 'T'),
        noteTitle: row.title,
        noteThumbnail: ipfsUrl(row.thumbnail_cid),
        category: row.category || 'General',
        timestamp: row.created_at,
        likes: 0,
        views: 0,
      }));
      setFeedPosts(posts);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
      setError('Failed to load feed. Please try again.');
    } finally {
      setFeedLoading(false);
    }
  }, []);

  const fetchDiscover = useCallback(async () => {
    try {
      setDiscoverLoading(true);
      const { data, error } = await supabase
        .from('lectures')
        .select('user_id, teacher_name, teacher_profile_picture, category')
        .eq('status', 'published');
      if (error) throw error;

      const teacherMap = new Map<string, { name: string; avatar: string; subject: string; uploads: number }>();
      (data || []).forEach((row: any) => {
        const uid: string = row.user_id;
        if (!uid) return;
        if (teacherMap.has(uid)) {
          teacherMap.get(uid)!.uploads += 1;
        } else {
          teacherMap.set(uid, {
            name: row.teacher_name || 'Unknown Teacher',
            avatar: row.teacher_profile_picture || fallbackAvatar(row.teacher_name || 'T'),
            subject: row.category || 'General',
            uploads: 1,
          });
        }
      });

      const users: User[] = Array.from(teacherMap.entries()).map(([id, info]) => ({
        id,
        name: info.name,
        avatar: info.avatar,
        subject: info.subject,
        followers: 0,
        uploads: info.uploads,
        isFollowing: false,
      }));
      setDiscoverUsers(users);
    } catch (err) {
      console.error('Failed to fetch discover:', err);
      setError('Failed to load teachers. Please try again.');
    } finally {
      setDiscoverLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    fetchDiscover();
  }, [fetchFeed, fetchDiscover]);

  useEffect(() => {
    if (currentUserId) fetchFollowingIds(currentUserId);
  }, [currentUserId, fetchFollowingIds]);

  const usersWithFollowState: User[] = discoverUsers.map(u => ({
    ...u,
    isFollowing: followingIds.has(u.id),
  }));

  const followingUsers = usersWithFollowState.filter(u => u.isFollowing);

  const handleFollow = async (teacherId: string) => {
    if (!currentUserId) return;
    if (followingIds.has(teacherId)) return;

    setActionLoadingId(teacherId);
    try {
      const { error } = await supabase.from('follows').insert({
        follower_id: currentUserId,
        following_id: teacherId,
      });
      if (error) throw error;
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.add(teacherId);
        return next;
      });
    } catch (err) {
      console.error('Follow failed:', err);
      setError('Failed to follow. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnfollow = async (teacherId: string) => {
    if (!currentUserId) return;

    setActionLoadingId(teacherId);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', teacherId);
      if (error) throw error;
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.delete(teacherId);
        return next;
      });
    } catch (err) {
      console.error('Unfollow failed:', err);
      setError('Failed to unfollow. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewNote = (noteId: string) => {
    router.push(`/dashboard/student`);
  };

  const filteredUsers = usersWithFollowState.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const followingFeedPosts = feedPosts.filter(p => followingIds.has(p.userId));

  const UserCard = ({ user }: { user: User }) => {
    const isLoading = actionLoadingId === user.id;
    return (
      <div className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-violet-100 hover:shadow-sm transition-all duration-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-11 h-11 rounded-xl object-cover border border-gray-100"
              onError={(e) => { e.currentTarget.src = fallbackAvatar(user.name); }}
            />
            {user.isFollowing && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-violet-600 rounded-full border-2 border-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            {user.subject && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{user.subject}</p>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />{user.uploads} uploads
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
          disabled={isLoading}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
            user.isFollowing
              ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent'
              : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
          }`}
        >
          {isLoading ? (
            <Loader className="w-3.5 h-3.5 animate-spin" />
          ) : user.isFollowing ? (
            <><UserMinus className="w-3.5 h-3.5" /> Unfollow</>
          ) : (
            <><UserPlus className="w-3.5 h-3.5" /> Follow</>
          )}
        </button>
      </div>
    );
  };

  const tabConfig = [
    { id: 'feed', label: 'Feed' },
    { id: 'following', label: 'Following', count: followingUsers.length },
    { id: 'discover', label: 'Discover' },
  ] as const;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Community</h3>
          </div>
          <button
            onClick={() => {
              fetchFeed();
              fetchDiscover();
              if (currentUserId) fetchFollowingIds(currentUserId);
            }}
            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-gray-100">
          {tabConfig.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg ${
                activeTab === tab.id
                  ? 'text-violet-600 bg-violet-50/70'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {'count' in tab && tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full font-semibold ${
                  activeTab === tab.id ? 'bg-violet-200 text-violet-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-center gap-2">
            <span className="w-4 h-4 flex-shrink-0">⚠️</span>
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* FEED TAB */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {feedLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            ) : followingIds.size === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Your feed is empty</p>
                <p className="text-xs text-gray-400 mb-5">Follow teachers to see their uploads here</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
                >
                  Discover Teachers
                </button>
              </div>
            ) : followingFeedPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-violet-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No posts yet</p>
                <p className="text-xs text-gray-400">The teachers you follow haven't published anything yet.</p>
              </div>
            ) : (
              followingFeedPosts.map((post) => (
                <div
                  key={post.id}
                  className="group border border-gray-100 rounded-2xl overflow-hidden hover:border-violet-100 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                    <img
                      src={post.userAvatar}
                      alt={post.userName}
                      className="w-8 h-8 rounded-xl object-cover flex-shrink-0 border border-gray-200"
                      onError={(e) => { e.currentTarget.src = fallbackAvatar(post.userName); }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{post.userName}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeAgo(post.timestamp)}</span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-xs px-2.5 py-1 bg-violet-100 text-violet-700 font-semibold rounded-full">
                      {post.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 p-4">
                    {post.noteThumbnail ? (
                      <img
                        src={post.noteThumbnail}
                        alt={post.noteTitle}
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-7 h-7 text-violet-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-2">
                        {post.noteTitle}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{post.likes}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{post.views}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => window.location.href = '/dashboard/student'}
                      className="flex-shrink-0 px-3.5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* FOLLOWING TAB */}
        {activeTab === 'following' && (
          <div className="space-y-3">
            {followingLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            ) : followingUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Not following anyone yet</p>
                <p className="text-xs text-gray-400 mb-5">Follow teachers to keep up with their latest uploads</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
                >
                  Discover Teachers
                </button>
              </div>
            ) : (
              followingUsers.map(user => <UserCard key={user.id} user={user} />)
            )}
          </div>
        )}

        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or subject…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-400 bg-gray-50 transition-shadow"
              />
            </div>

            <div className="space-y-3">
              {discoverLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader className="w-6 h-6 text-violet-500 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">No teachers found</p>
                  <p className="text-xs text-gray-400">Try a different search term</p>
                </div>
              ) : (
                filteredUsers.map(user => <UserCard key={user.id} user={user} />)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}