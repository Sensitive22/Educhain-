"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Upload, BookOpen, ChartBar as BarChart3, Settings, LogOut, Bell, User, Eye, DollarSign, TrendingUp, Calendar, CreditCard as Edit, Trash2, MoveHorizontal as MoreHorizontal, Filter, Search, Plus, Play, Users, Clock, Star, Download, Wallet, Globe, ChevronDown, X, Check, CircleAlert as AlertCircle, FileText, Image as ImageIcon, Video, Award, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadFileToIPFS } from '@/lib/uploadToIPFS';
import { uploadProfilePicture } from '@/lib/uploadProfilePicture';
import { BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import NotificationPanel, { Notification } from '@/components/NotificationPanel';
import AnalyticsDashboard from '@/app/dashboard/analytics/page';

type Page = 'dashboard' | 'upload' | 'lectures' | 'analytics' | 'settings' | 'about' | 'features' | 'contact';
type PricingModel = 'free' | 'subscription' | 'rent';
type CurrencyType = 'inr' | 'crypto';

interface Lecture {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  views: number;
  pricingModel: PricingModel;
  currency: CurrencyType;
  price?: number;
  rentDuration?: number;
  status: 'published' | 'draft';
  uploadDate: string;
  earnings: number;
}


export default function TeacherDashboard() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'upload',
      title: 'Upload Successful',
      message: 'Your lecture "Blockchain Basics" has been published',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'like',
      title: 'New Like',
      message: 'Someone liked your lecture "Smart Contracts 101"',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      read: false,
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      userName: 'Priya Sharma'
    },
    {
      id: '3',
      type: 'follow',
      title: 'New Follower',
      message: 'Rahul Kumar started following you',
      timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
      read: true,
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      userName: 'Rahul Kumar'
    },
  ]);

  // Profile dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await supabase.auth.signOut();
        window.location.href = '/';
      } catch (error) {
        console.error('Logout failed:', error);
        alert('Failed to logout. Please try again.');
      }
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: '',
    pricingModel: 'free' as PricingModel,
    currency: 'inr' as CurrencyType,
    price: '',
    rentDuration: '',
    thumbnail: null as File | null,
    video: null as File | null
  });

  // Terms & Conditions state
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [lecturesLoading, setLecturesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    subject_expertise: 'Blockchain Technology',
    bio: '',
    profile_picture: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    upi_id: '',
    bank_account: '',
    ifsc_code: '',
    account_holder_name: '',
    polygon_wallet: '',
    notifications: {
      new_student: true,
      payment_received: true,
      lecture_comments: false,
      weekly_analytics: true,
      platform_updates: true,
    }
  });

  // Add these after the existing settings state variables:
  const [selectedProfilePicture, setSelectedProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [profilePictureUploading, setProfilePictureUploading] = useState(false);
  const [profilePictureError, setProfilePictureError] = useState<string | null>(null);
  
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const fetchLectures = useCallback(async () => {
    try {
      setLecturesLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Lecture[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        category: row.category || '',
        thumbnail: row.thumbnail_cid ? `https://gateway.pinata.cloud/ipfs/${row.thumbnail_cid}` : '',
        views: 0,
        pricingModel: row.pricing_model as PricingModel,
        currency: row.currency as CurrencyType,
        price: row.price,
        rentDuration: row.rent_duration,
        status: row.status as 'published' | 'draft',
        uploadDate: row.created_at,
        earnings: 0,
      }));

      setLectures(mapped);
    } catch (err) {
      console.error('Failed to fetch lectures:', err);
    } finally {
      setLecturesLoading(false);
    }
  }, []);

  const fetchUserSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettingsForm({
          full_name: data.full_name || '',
          email: user.email || '',
          phone: data.phone || '',
          subject_expertise: data.subject_expertise || 'Blockchain Technology',
          bio: data.bio || '',
          profile_picture: data.profile_picture || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
          upi_id: data.upi_id || '',
          bank_account: data.bank_account || '',
          ifsc_code: data.ifsc_code || '',
          account_holder_name: data.account_holder_name || '',
          polygon_wallet: data.polygon_wallet || '',
          notifications: data.notifications || {
            new_student: true,
            payment_received: true,
            lecture_comments: false,
            weekly_analytics: true,
            platform_updates: true,
          }
        });
      } else {
        setSettingsForm(prev => ({
          ...prev,
          email: user.email || '',
        }));
      }
    } catch (err) {
      console.error('Failed to fetch user settings:', err);
      setSettingsError('Failed to load settings. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const handleProfilePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  setProfilePictureError(null);

  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    setProfilePictureError('Only image files are allowed');
    return;
  }

  // Validate file size (3MB)
  const maxSize = 3 * 1024 * 1024;
  if (file.size > maxSize) {
    setProfilePictureError('Image size must be less than 3MB');
    return;
  }

  setSelectedProfilePicture(file);

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    setProfilePicturePreview(e.target?.result as string);
  };
  reader.readAsDataURL(file);
};

const handleProfilePictureUpload = async () => {
  if (!selectedProfilePicture) return;

  try {
    setProfilePictureUploading(true);
    setProfilePictureError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Upload to Supabase storage
    const publicUrl = await uploadProfilePicture(selectedProfilePicture, user.id);

    // Update settings form with new URL
    setSettingsForm(prev => ({
      ...prev,
      profile_picture: publicUrl
    }));

    // Update database
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        profile_picture: publicUrl,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;

    // Clear selection and show success
    setSelectedProfilePicture(null);
    setProfilePicturePreview(null);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);

  } catch (err: any) {
    console.error('Failed to upload profile picture:', err);
    setProfilePictureError(err.message || 'Failed to upload profile picture. Please try again.');
  } finally {
    setProfilePictureUploading(false);
  }
};

  useEffect(() => {
    fetchLectures();
    fetchUserSettings();
  }, [fetchLectures, fetchUserSettings]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
      }
    };
    checkAuth();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-dropdown') && !target.closest('.notification-button')) {
        setShowNotifications(false);
      }
      if (!target.closest('.profile-dropdown') && !target.closest('.profile-button')) {
        setShowProfileMenu(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const deleteLecture = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return;
    try {
      const { error } = await supabase.from('lectures').delete().eq('id', id);
      if (error) throw error;
      setLectures((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Failed to delete lecture:', err);
      alert('Failed to delete lecture. Please try again.');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase
        .from('lectures')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      setLectures((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: newStatus as 'published' | 'draft' } : l))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactError(null);
    setContactSuccess(false);

    try {
      // Validate form
      if (!contactForm.name.trim()) {
        throw new Error('Name is required');
      }
      if (!contactForm.email.trim()) {
        throw new Error('Email is required');
      }
      if (!contactForm.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      if (!contactForm.subject.trim()) {
        throw new Error('Subject is required');
      }
      if (!contactForm.message.trim()) {
        throw new Error('Message is required');
      }

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      // Save the contact message to Supabase
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            user_id: user?.id,
            name: contactForm.name,
            email: contactForm.email,
            subject: contactForm.subject,
            message: contactForm.message,
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) throw error;

      // Reset form and show success
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setContactSuccess(true);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setContactSuccess(false);
      }, 5000);

    } catch (err: any) {
      console.error('Contact form error:', err);
      setContactError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSettingsSaving(true);
      setSettingsError(null);
      setSettingsSuccess(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          full_name: settingsForm.full_name,
          phone: settingsForm.phone,
          subject_expertise: settingsForm.subject_expertise,
          bio: settingsForm.bio,
          profile_picture: settingsForm.profile_picture,
          upi_id: settingsForm.upi_id,
          bank_account: settingsForm.bank_account,
          ifsc_code: settingsForm.ifsc_code,
          account_holder_name: settingsForm.account_holder_name,
          polygon_wallet: settingsForm.polygon_wallet,
          notifications: settingsForm.notifications,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setSettingsError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const filteredLectures = lectures.filter((lecture) => {
    const matchesSearch = lecture.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || lecture.category === filterCategory;
    const matchesStatus = !filterStatus || lecture.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['Blockchain', 'Math', 'Physics', 'Chemistry', 'Computer Science', 'Economics', 'Biology'];

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({ ...uploadForm, thumbnail: file });
      const reader = new FileReader();
      reader.onload = (e) => setThumbnailPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({ ...uploadForm, video: file });
    }
  };

  const handleSubmitLecture = async () => {
    try {
      setUploadLoading(true);
      setUploadError(null);
      setUploadSuccess(false);
      setUploadProgress('');

      if (!uploadForm.title.trim()) {
        throw new Error('Title is required');
      }

      if (!uploadForm.video) {
        throw new Error('Video file is required');
      }

      if (!uploadForm.category) {
        throw new Error('Category is required');
      }

      if (!termsAccepted) {
        throw new Error('You must accept the Terms & Conditions to proceed');
      }

      const { data: { user } } = await supabase.auth.getUser();


      if (!user) {
        throw new Error('User not authenticated');
      }
      
      let teacherWallet: string | null = null;

if (uploadForm.currency === "crypto") {
  const { data: settings, error: walletError } = await supabase
    .from("user_settings")
    .select("polygon_wallet")
    .eq("user_id", user.id)
    .single();

  if (walletError) {
    throw new Error("Failed to fetch wallet.");
  }

  if (!settings?.polygon_wallet) {
    throw new Error(
      "Please add your Polygon wallet in Settings before uploading crypto lecture."
    );
  }

  teacherWallet = settings.polygon_wallet;
}


      setUploadProgress('Uploading video to IPFS...');
      const videoCid = await uploadFileToIPFS(uploadForm.video);

      let thumbnailCid: string | null = null;
      if (uploadForm.thumbnail) {
        setUploadProgress('Uploading thumbnail to IPFS...');
        thumbnailCid = await uploadFileToIPFS(uploadForm.thumbnail);
      }

      setUploadProgress('Saving lecture metadata...');
      const { error: insertError } = await supabase
        .from('lectures')
        .insert({
          user_id: user.id,
          title: uploadForm.title,
          description: uploadForm.description,
          category: uploadForm.category,
          thumbnail_cid: thumbnailCid,
          video_cid: videoCid,
          pricing_model: uploadForm.pricingModel,
          currency: uploadForm.currency,
          price: uploadForm.price ? parseFloat(uploadForm.price) : null,
          rent_duration: uploadForm.rentDuration ? parseInt(uploadForm.rentDuration) : null,
          teacher_wallet: teacherWallet,
          status: 'draft',
        });

      if (insertError) {
        throw new Error(`Failed to save lecture: ${insertError.message}`);
      }

      setUploadSuccess(true);
      setUploadProgress('');
      await fetchLectures();

      setUploadForm({
        title: '',
        description: '',
        category: '',
        pricingModel: 'free',
        currency: 'inr',
        price: '',
        rentDuration: '',
        thumbnail: null,
        video: null
      });
      setThumbnailPreview(null);
      setTermsAccepted(false);

      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during upload';
      setUploadError(message);
      setUploadProgress('');
    } finally {
      setUploadLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Lecture', icon: Upload },
    { id: 'lectures', label: 'My Lectures', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'about', label: 'About', icon: User },
    { id: 'features', label: 'Features', icon: Star },
    { id: 'contact', label: 'Contact', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderDashboard = () => {
    const totalLectures = lectures.length;
    const publishedLectures = lectures.filter((l) => l.status === 'published').length;
    const draftLectures = lectures.filter((l) => l.status === 'draft').length;
    const recentLectures = lectures.slice(0, 3);

    // Count lectures uploaded this week
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = lectures.filter((l) => new Date(l.uploadDate) >= weekAgo).length;
    
  

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Total Lectures */}
          <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Lectures</p>
                <p className="text-3xl font-bold text-gray-900 leading-none">
                  {lecturesLoading ? <span className="text-gray-300">—</span> : totalLectures.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="relative mt-4 flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">
                <Plus className="w-3 h-3" />{newThisWeek}
              </span>
              <span className="text-gray-400">new this week</span>
            </div>
          </div>

          {/* Published */}
          <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all duration-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Published</p>
                <p className="text-3xl font-bold text-gray-900 leading-none">
                  {lecturesLoading ? <span className="text-gray-300">—</span> : publishedLectures.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="relative mt-4">
              <p className="text-xs text-gray-400">out of <span className="text-gray-600 font-medium">{totalLectures}</span> total</p>
            </div>
          </div>

          {/* Drafts */}
          <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-violet-100 transition-all duration-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Drafts</p>
                <p className="text-3xl font-bold text-gray-900 leading-none">
                  {lecturesLoading ? <span className="text-gray-300">—</span> : draftLectures.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-violet-600" />
              </div>
            </div>
            <div className="relative mt-4">
              <p className="text-xs text-gray-400">pending to publish</p>
            </div>
          </div>

          {/* Categories */}
          <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-100 transition-all duration-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Categories</p>
                <p className="text-3xl font-bold text-gray-900 leading-none">
                  {lecturesLoading ? <span className="text-gray-300">—</span> : new Set(lectures.map((l) => l.category).filter(Boolean)).size}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="relative mt-4">
              <p className="text-xs text-gray-400">subjects covered</p>
            </div>
          </div>
        </div>

        {/* Recent Activity + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Recent Lectures — wider */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">Recent Lectures</h3>
              <button
                onClick={() => setCurrentPage('lectures')}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium"
              >
                View all →
              </button>
            </div>

            {lecturesLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            )}

            {!lecturesLoading && recentLectures.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No lectures yet</p>
                <p className="text-xs text-gray-400 mt-1">Upload your first lecture to get started</p>
              </div>
            )}

            {!lecturesLoading && recentLectures.length > 0 && (
              <div className="divide-y divide-gray-50">
                {recentLectures.map((lecture) => (
                  <div key={lecture.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    {lecture.thumbnail ? (
                      <img
                        src={lecture.thumbnail}
                        alt={lecture.title}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Video className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lecture.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{lecture.category || 'No category'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {lecture.pricingModel === 'free' ? 'Free' :
                         lecture.currency === 'inr' ? `₹${lecture.price}` : `${lecture.price} MATIC`}
                      </p>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 capitalize ${
                        lecture.status === 'published'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>{lecture.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions — narrower */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-5">Quick Actions</h3>
            <div className="space-y-2.5">
              <button
                onClick={() => setCurrentPage('upload')}
                className="w-full group flex items-center gap-3 p-3.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-100 hover:border-violet-200 transition-all duration-150 text-left"
              >
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-violet-700 transition-colors">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-violet-900">Upload New Lecture</span>
                <ChevronDown className="w-4 h-4 text-violet-400 ml-auto rotate-[-90deg]" />
              </button>

              <button
                onClick={() => setCurrentPage('analytics')}
                className="w-full group flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 transition-all duration-150 text-left"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-700 transition-colors">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-blue-900">View Analytics</span>
                <ChevronDown className="w-4 h-4 text-blue-400 ml-auto rotate-[-90deg]" />
              </button>

              <button
                onClick={() => setCurrentPage('lectures')}
                className="w-full group flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 transition-all duration-150 text-left"
              >
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-700 transition-colors">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-emerald-900">Manage Lectures</span>
                <ChevronDown className="w-4 h-4 text-emerald-400 ml-auto rotate-[-90deg]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUpload = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Page header strip */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">Upload New Lecture</h2>
          <p className="text-sm text-gray-500 mt-0.5">Share your knowledge with students worldwide</p>
        </div>

        <div className="p-8 space-y-7">
          {/* Basic Information */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Lecture Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-400 transition-shadow"
                  placeholder="Enter lecture title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category / Subject <span className="text-red-400">*</span>
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white transition-shadow"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-400 transition-shadow resize-none"
                placeholder="Describe what students will learn from this lecture"
              />
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Media Files</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Thumbnail Image</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-violet-300 hover:bg-violet-50/30 transition-all duration-150">
                  {thumbnailPreview ? (
                    <div className="relative">
                      <img src={thumbnailPreview} alt="Preview" className="w-full h-36 object-cover rounded-lg" />
                      <button
                        onClick={() => {
                          setThumbnailPreview(null);
                          setUploadForm({ ...uploadForm, thumbnail: null });
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mb-3">Upload thumbnail image</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                        id="thumbnail-upload"
                      />
                      <label
                        htmlFor="thumbnail-upload"
                        className="inline-flex items-center px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 cursor-pointer transition-colors"
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Video */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Video File <span className="text-red-400">*</span></label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-violet-300 hover:bg-violet-50/30 transition-all duration-150">
                  {uploadForm.video ? (
                    <div className="flex items-center justify-center gap-3 py-2">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Video className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{uploadForm.video.name}</p>
                        <p className="text-xs text-gray-400">{(uploadForm.video.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button
                        onClick={() => setUploadForm({ ...uploadForm, video: null })}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Video className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mb-3">Upload video file</p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                        id="video-upload"
                      />
                      <label
                        htmlFor="video-upload"
                        className="inline-flex items-center px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 cursor-pointer transition-colors"
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Model */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Pricing Model</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {(['free', 'subscription', 'rent'] as PricingModel[]).map((model) => (
                <label key={model} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="pricingModel"
                    value={model}
                    checked={uploadForm.pricingModel === model}
                    onChange={(e) => setUploadForm({ ...uploadForm, pricingModel: e.target.value as PricingModel })}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-xl transition-all duration-150 ${
                    uploadForm.pricingModel === model 
                      ? 'border-violet-500 bg-violet-50 shadow-sm' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800 capitalize">{model}</span>
                      {uploadForm.pricingModel === model && (
                        <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-snug">
                      {model === 'free' && 'Available to all users'}
                      {model === 'subscription' && 'Requires active subscription'}
                      {model === 'rent' && 'Pay per access with duration'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {(uploadForm.pricingModel === 'subscription' || uploadForm.pricingModel === 'rent') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency Type</label>
                  <select
                    value={uploadForm.currency}
                    onChange={(e) => setUploadForm({ ...uploadForm, currency: e.target.value as CurrencyType })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                  >
                    <option value="inr">INR (₹)</option>
                    <option value="crypto">Crypto (MATIC/USDT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Price {uploadForm.currency === 'inr' ? '(₹)' : '(MATIC/USDT)'}
                  </label>
                  <input
                    type="number"
                    value={uploadForm.price}
                    onChange={(e) => setUploadForm({ ...uploadForm, price: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder={uploadForm.currency === 'inr' ? '99' : '2'}
                  />
                </div>

                {uploadForm.pricingModel === 'rent' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Rent Duration (days)</label>
                    <input
                      type="number"
                      value={uploadForm.rentDuration}
                      onChange={(e) => setUploadForm({ ...uploadForm, rentDuration: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="30"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-500" />
              Terms & Conditions
            </h3>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 h-32 overflow-y-auto text-sm text-gray-600 leading-relaxed">
              <p className="mb-3 font-medium text-gray-700">By uploading content on this platform, you confirm that:</p>
              <ul className="space-y-1.5 list-disc pl-5 text-gray-500">
                <li>You are the original creator of the uploaded notes, lectures, or materials.</li>
                <li>You hold full rights to distribute and monetize this content.</li>
                <li>The platform is not responsible for any copyright violation caused by your uploads.</li>
                <li>If any copyright claim or legal issue arises, the responsibility will be solely yours.</li>
                <li>Plagiarized, pirated, or stolen content is strictly prohibited.</li>
                <li>The platform reserves the right to remove content or suspend accounts that violate policies.</li>
              </ul>
              <p className="mt-3 font-medium text-gray-700">
                By checking this box, you accept full responsibility for the content you upload.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500 focus:ring-2 cursor-pointer"
                />
              </div>
              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                I have read and agree to the Terms & Conditions. I confirm that I am the original creator of this content and accept full responsibility for any copyright issues.
              </span>
            </label>
          </div>

          {/* Status Messages */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">Upload Error</p>
                <p className="text-sm text-red-600 mt-0.5">{uploadError}</p>
              </div>
              <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {uploadSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">Upload Successful!</p>
                <p className="text-sm text-emerald-600 mt-0.5">Your lecture has been saved as a draft. You can publish it from the My Lectures section.</p>
              </div>
            </div>
          )}

          {uploadLoading && uploadProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <Loader className="w-5 h-5 text-blue-500 flex-shrink-0 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Uploading…</p>
                <p className="text-sm text-blue-600 mt-0.5">{uploadProgress}</p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-gray-100">
            {!termsAccepted && !uploadLoading && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5 order-last sm:order-first">
                <AlertCircle className="w-3.5 h-3.5" />
                Accept Terms & Conditions to enable publishing
              </p>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-medium border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={uploadLoading}
              >
                Save as Draft
              </button>
              <button
                onClick={handleSubmitLecture}
                disabled={uploadLoading || !termsAccepted}
                className="px-5 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
              >
                {uploadLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Save & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLectures = () => (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Lectures</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your uploaded content</p>
        </div>
        <button
          onClick={() => setCurrentPage('upload')}
          className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Upload New
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search lectures…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-gray-700"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-gray-700"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {lecturesLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-7 h-7 text-violet-500 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!lecturesLoading && filteredLectures.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No lectures found</h3>
          <p className="text-sm text-gray-400 mb-5">
            {lectures.length === 0
              ? "You haven't uploaded any lectures yet."
              : 'No lectures match your current filters.'}
          </p>
          {lectures.length === 0 && (
            <button
              onClick={() => setCurrentPage('upload')}
              className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Upload Your First Lecture
            </button>
          )}
        </div>
      )}

      {/* Lectures Grid */}
      {!lecturesLoading && filteredLectures.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLectures.map((lecture) => (
            <div key={lecture.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200">
              {/* Thumbnail */}
              <div className="relative overflow-hidden">
                {lecture.thumbnail ? (
                  <img
                    src={lecture.thumbnail}
                    alt={lecture.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                    <Video className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
                    lecture.status === 'published'
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-amber-400/90 text-white'
                  }`}>
                    {lecture.status}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-sm">{lecture.title}</h3>
                <p className="text-xs text-gray-400 mb-4 line-clamp-2 leading-relaxed">{lecture.description}</p>

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{lecture.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(lecture.uploadDate).toLocaleDateString()}</span>
                  </div>
                  {lecture.category && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">{lecture.category}</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-50">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {lecture.pricingModel === 'free' ? 'Free' :
                       lecture.currency === 'inr' ? `₹${lecture.price}` : `${lecture.price} MATIC`}
                    </p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">
                      {lecture.pricingModel}{lecture.pricingModel === 'rent' && ` · ${lecture.rentDuration}d`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      {lecture.currency === 'inr' ? `₹${lecture.earnings}` : `${lecture.earnings} MATIC`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Earned</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleStatus(lecture.id, lecture.status)}
                      className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                      title={lecture.status === 'published' ? 'Set to Draft' : 'Publish'}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteLecture(lecture.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => setCurrentPage('analytics')}
                    className="text-xs text-violet-600 hover:text-violet-700 font-semibold"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => {
    const totalLectures = lectures.length;
    const publishedCount = lectures.filter((l) => l.status === 'published').length;

    const inrLectures = lectures.filter((l) => l.pricingModel !== 'free' && l.currency === 'inr');
    const cryptoLectures = lectures.filter((l) => l.pricingModel !== 'free' && l.currency === 'crypto');
    const freeLectures = lectures.filter((l) => l.pricingModel === 'free');

    // Uploads per month for the bar chart
    const uploadsByMonth: Record<string, number> = {};
    lectures.forEach((l) => {
      const d = new Date(l.uploadDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      uploadsByMonth[key] = (uploadsByMonth[key] || 0) + 1;
    });
    const barData = Object.keys(uploadsByMonth)
      .sort()
      .map((key) => {
        const [year, month] = key.split('-');
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return { name: `${monthNames[parseInt(month) - 1]} ${year}`, uploads: uploadsByMonth[key] };
      });

    // Pie chart data: pricing model breakdown
    const pieData = [
      { name: 'Free', value: freeLectures.length, color: '#10b981' },
      { name: 'Subscription', value: lectures.filter((l) => l.pricingModel === 'subscription').length, color: '#8b5cf6' },
      { name: 'Rent', value: lectures.filter((l) => l.pricingModel === 'rent').length, color: '#f59e0b' },
    ].filter((d) => d.value > 0);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track your performance and earnings</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Lectures</h3>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{lecturesLoading ? '—' : totalLectures.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-2">{publishedCount} published</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">INR Lectures</h3>
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{lecturesLoading ? '—' : inrLectures.length}</p>
            <p className="text-xs text-gray-400 mt-2">priced in ₹</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Crypto Lectures</h3>
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-violet-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{lecturesLoading ? '—' : cryptoLectures.length}</p>
            <p className="text-xs text-gray-400 mt-2">priced in MATIC</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Free Lectures</h3>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{lecturesLoading ? '—' : freeLectures.length}</p>
            <p className="text-xs text-gray-400 mt-2">open access</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar Chart — Uploads Over Time */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Uploads Over Time</h3>
            {lecturesLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            ) : barData.length === 0 ? (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <BarChart3 className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">No data yet</p>
                </div>
              </div>
            ) : (
              <BarChart width={500} height={256} data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="uploads" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </div>

          {/* Pie Chart — Pricing Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
            {lecturesLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            ) : pieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">No data yet</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-8">
                <PieChart width={200} height={200}>
                  <Pie data={pieData} dataKey="value" cx={100} cy={100} outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
                <div className="space-y-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-sm text-gray-700">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lectures Table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">All Lectures</h3>
          {lecturesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
          ) : lectures.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">No lectures yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Lecture</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pricing</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lectures.map((lecture) => (
                    <tr key={lecture.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {lecture.thumbnail ? (
                            <img src={lecture.thumbnail} alt={lecture.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Video className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">{lecture.title}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 capitalize">{lecture.category || '—'}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-gray-900">
                          {lecture.pricingModel === 'free' ? 'Free' :
                           lecture.currency === 'inr' ? `₹${lecture.price}` : `${lecture.price} MATIC`}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">{lecture.pricingModel}{lecture.pricingModel === 'rent' ? ` · ${lecture.rentDuration}d` : ''}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                          lecture.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>{lecture.status}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-xs">{new Date(lecture.uploadDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAbout = () => {
    const totalLectures = lectures.filter((l) => l.status === 'published').length;
    const totalViews = lectures.reduce((sum, l) => sum + l.views, 0);
    const totalEarnings = lectures.reduce((sum, l) => sum + l.earnings, 0);
    const uniqueCategories = new Set(lectures.map((l) => l.category).filter(Boolean)).size;

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">About Me</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your profile as a content publisher on EduChain</p>
        </div>

        {settingsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-7 h-7 text-violet-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Publisher Profile Card */}
            <div className="relative bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-500 rounded-2xl shadow-lg p-8 text-white overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-white/5 rounded-full" />

              <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl">
                    <img
                      src={settingsForm.profile_picture}
                      alt={settingsForm.full_name || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-1">{settingsForm.full_name || 'Teacher'}</h3>
                  <p className="text-violet-200 text-sm mb-4">{settingsForm.subject_expertise}</p>

                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-5">
                    <div className="flex items-center gap-1.5 text-sm text-violet-100">
                      <Globe className="w-4 h-4" />
                      <span>{settingsForm.email}</span>
                    </div>
                    {settingsForm.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-violet-100">
                        <User className="w-4 h-4" />
                        <span>{settingsForm.phone}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-violet-100 text-sm leading-relaxed max-w-xl">
                    {settingsForm.bio || 'Passionate educator dedicated to creating innovative learning experiences and helping students achieve their goals.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">{lecturesLoading ? '—' : totalLectures}</p>
                <p className="text-xs text-gray-400">Lectures Published</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">{lecturesLoading ? '—' : totalViews.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Total Views</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Star className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">{lecturesLoading ? '—' : uniqueCategories}</p>
                <p className="text-xs text-gray-400">Categories Covered</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">{lecturesLoading ? '—' : `₹${totalEarnings.toLocaleString()}`}</p>
                <p className="text-xs text-gray-400">Total Earnings</p>
              </div>
            </div>

            {/* Expertise & Skills */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-5">Expertise & Skills</h3>
              {lectures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.from(new Set(lectures.map((l) => l.category).filter(Boolean))).map((category, index) => {
                    const colors = [
                      { bg: 'bg-violet-50', icon: 'bg-violet-100', text: 'text-violet-600' },
                      { bg: 'bg-blue-50', icon: 'bg-blue-100', text: 'text-blue-600' },
                      { bg: 'bg-emerald-50', icon: 'bg-emerald-100', text: 'text-emerald-600' },
                      { bg: 'bg-orange-50', icon: 'bg-orange-100', text: 'text-orange-600' },
                    ];
                    const color = colors[index % colors.length];
                    const categoryLectures = lectures.filter((l) => l.category === category);

                    return (
                      <div key={category} className={`flex items-center gap-3 p-4 ${color.bg} rounded-xl`}>
                        <div className={`w-9 h-9 ${color.icon} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <BookOpen className={`w-4 h-4 ${color.text}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{category}</p>
                          <p className="text-xs text-gray-500">{categoryLectures.length} lecture{categoryLectures.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">Upload lectures to showcase your expertise</p>
                </div>
              )}
            </div>

            {/* Recent Lectures */}
            {lectures.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-5">Recent Lectures</h3>
                <div className="space-y-3">
                  {lectures.slice(0, 5).map((lecture) => (
                    <div key={lecture.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      {lecture.thumbnail ? (
                        <img src={lecture.thumbnail} alt={lecture.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Video className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{lecture.title}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{lecture.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="capitalize">{lecture.category}</span>
                          <span>·</span>
                          <span>{new Date(lecture.uploadDate).toLocaleDateString()}</span>
                          <span>·</span>
                          <span className={lecture.status === 'published' ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
                            {lecture.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Profile Button */}
            <div className="flex justify-center pb-4">
              <button
                onClick={() => setCurrentPage('settings')}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderFeatures = () => (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Platform Features</h2>
        <p className="text-sm text-gray-500 mt-0.5">Powerful tools designed to enhance your teaching experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: Upload, color: 'violet',
            title: 'Easy Content Upload',
            desc: 'Upload lectures, videos, and course materials with our intuitive interface. Support for multiple formats and automatic optimization.'
          },
          {
            icon: Wallet, color: 'emerald',
            title: 'Flexible Pricing Models',
            desc: 'Choose between free, subscription, or rental models. Accept payments in INR or cryptocurrency (MATIC/USDT) to reach a global audience.'
          },
          {
            icon: BarChart3, color: 'blue',
            title: 'Advanced Analytics',
            desc: 'Track views, earnings, student engagement, and performance metrics with comprehensive analytics dashboard and detailed reports.'
          },
          {
            icon: Users, color: 'orange',
            title: 'Student Management',
            desc: 'Monitor student progress, engagement levels, and performance. Communicate directly with your students through integrated messaging.'
          },
          {
            icon: Globe, color: 'violet',
            title: 'Blockchain Integration',
            desc: 'Leverage blockchain technology for secure content ownership, transparent transactions, and verifiable certificates for students.'
          },
          {
            icon: Star, color: 'emerald',
            title: 'Quality Assurance',
            desc: 'Built-in quality checks, student feedback systems, and rating mechanisms ensure high-quality content and teaching standards.'
          },
          {
            icon: DollarSign, color: 'blue',
            title: 'Instant Payouts',
            desc: 'Receive earnings instantly through UPI, bank transfer, or cryptocurrency. Track all transactions with complete transparency.'
          },
          {
            icon: BookOpen, color: 'orange',
            title: 'Content Organization',
            desc: 'Organize courses into categories, create playlists, and structure learning paths for optimal student experience.'
          },
          {
            icon: Bell, color: 'violet',
            title: 'Smart Notifications',
            desc: 'Stay updated with real-time notifications for enrollments, comments, earnings, and important platform updates.'
          },
        ].map(({ icon: Icon, color, title, desc }) => {
          const colorMap: Record<string, string> = {
            violet: 'bg-violet-100 text-violet-600',
            emerald: 'bg-emerald-100 text-emerald-600',
            blue: 'bg-blue-100 text-blue-600',
            orange: 'bg-orange-100 text-orange-600',
          };
          return (
            <div key={title} className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          );
        })}
      </div>

      <div className="relative bg-gradient-to-r from-violet-600 to-indigo-500 rounded-2xl p-8 text-white text-center overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative">
          <h3 className="text-xl font-bold mb-2">Ready to Transform Education?</h3>
          <p className="text-sm mb-5 text-violet-100">
            Join thousands of educators who are already making an impact with our platform
          </p>
          <button
            onClick={() => setCurrentPage('upload')}
            className="bg-white text-violet-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-50 transition-colors shadow-sm"
          >
            Start Teaching Today
          </button>
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Get in Touch</h2>
        <p className="text-sm text-gray-500 mt-0.5">Have questions? We're here to help</p>
      </div>

      {/* Creator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Raj Prajapati */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-violet-100 flex-shrink-0">
              <img
                src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
                alt="Raj Prajapati"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Raj Prajapati</h3>
              <span className="inline-block px-2 py-0.5 text-xs bg-violet-50 text-violet-600 font-medium rounded-full">Creator</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <a href="mailto:rajprajapati_iot_2022@ltce.com" className="text-xs text-violet-600 hover:underline truncate">
              rajprajapati_iot_2022@ltce.com
            </a>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed bg-gray-50 rounded-xl p-3">
            Feel free to reach out for inquiries about courses, collaboration opportunities, or general platform questions.
          </p>
        </div>

        {/* Gautam Shaw */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Gautam Shaw</h3>
              <span className="inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-600 font-medium rounded-full">Creator</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <a href="mailto:gautamsaw10@gmail.com" className="text-xs text-blue-600 hover:underline truncate">
              gautamsaw10@gmail.com
            </a>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed bg-gray-50 rounded-xl p-3">
            Feel free to reach out for technical assistance, account issues, or platform-related questions. We typically respond within 24 hours.
          </p>
        </div>

        {/* Shubham Sharma */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Shubham Sharma</h3>
              <span className="inline-block px-2 py-0.5 text-xs bg-emerald-50 text-emerald-600 font-medium rounded-full">Creator</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="text-xs text-emerald-600 truncate">Contact via platform</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed bg-gray-50 rounded-xl p-3">
            Feel free to reach out for inquiries about courses, collaboration opportunities, or general platform questions.
          </p>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-5">Send us a Message</h3>
        
        {contactSuccess && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Message sent successfully!</p>
              <p className="text-xs text-emerald-600 mt-0.5">Thank you for reaching out. We'll get back to you soon.</p>
            </div>
          </div>
        )}

        {contactError && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Error</p>
              <p className="text-xs text-red-600 mt-0.5">{contactError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                disabled={contactSubmitting}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                disabled={contactSubmitting}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input
              type="text"
              placeholder="How can we help?"
              value={contactForm.subject}
              onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
              disabled={contactSubmitting}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
            <textarea
              rows={5}
              placeholder="Tell us more about your inquiry…"
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              disabled={contactSubmitting}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={contactSubmitting}
            className="w-full bg-violet-600 text-white py-2.5 rounded-xl hover:bg-violet-700 transition-colors text-sm font-semibold disabled:bg-violet-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {contactSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              'Send Message'
            )}
          </button>
        </form>
      </div>

      {/* Quick Links */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-6 border border-violet-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Dashboard', page: 'dashboard' },
            { label: 'Upload Content', page: 'upload' },
            { label: 'My Lectures', page: 'lectures' },
            { label: 'Analytics', page: 'analytics' },
          ].map(({ label, page }) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page as Page)}
              className="text-sm text-violet-600 hover:text-violet-800 font-medium text-left hover:underline transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your profile and payment preferences</p>
      </div>

      {settingsSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Settings saved successfully!</p>
            <p className="text-xs text-emerald-600 mt-0.5">Your changes have been applied.</p>
          </div>
        </div>
      )}

      {settingsError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Failed to save settings</p>
            <p className="text-xs text-red-600 mt-0.5">{settingsError}</p>
          </div>
        </div>
      )}

      {settingsLoading ? (
        <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 flex justify-center">
          <Loader className="w-7 h-7 text-violet-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Profile Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={settingsForm.full_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, full_name: e.target.value })}
                  placeholder="Raj Prajapati"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  disabled={settingsSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={settingsForm.email}
                  disabled
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  disabled={settingsSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Expertise</label>
                <select
                  value={settingsForm.subject_expertise}
                  onChange={(e) => setSettingsForm({ ...settingsForm, subject_expertise: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                  disabled={settingsSaving}
                >
                  <option>Blockchain Technology</option>
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Computer Science</option>
                </select>
              </div>
            </div>
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
              <textarea
                rows={4}
                value={settingsForm.bio}
                onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                placeholder="Tell students about yourself…"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                disabled={settingsSaving}
              />
            </div>

            {/* Profile Picture */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <img
                      src={profilePicturePreview || settingsForm.profile_picture}
                      alt="Profile Preview"
                      className="w-20 h-20 rounded-2xl object-cover border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + (settingsForm.full_name || 'User') + '&size=200&background=9333ea&color=fff';
                      }}
                    />
                    {profilePictureUploading && (
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                        <Loader className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureSelect}
                      className="hidden"
                      id="profile-picture-upload"
                      disabled={settingsSaving || profilePictureUploading}
                    />
                    <label
                      htmlFor="profile-picture-upload"
                      className="inline-flex items-center justify-center px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Photo
                    </label>
                    {selectedProfilePicture && (
                      <button
                        type="button"
                        onClick={handleProfilePictureUpload}
                        disabled={profilePictureUploading || settingsSaving}
                        className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {profilePictureUploading ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Uploading…
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Upload Now
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">JPG, PNG or GIF. Max size 3MB. Recommended: 400×400px square image.</p>
                  {selectedProfilePicture && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <p className="text-xs font-medium text-blue-800">{selectedProfilePicture.name}</p>
                      <p className="text-xs text-blue-500 mt-0.5">{(selectedProfilePicture.size / 1024).toFixed(2)} KB — Click "Upload Now" to save</p>
                    </div>
                  )}
                  {profilePictureError && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-600">{profilePictureError}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Payment Details</h3>
            
            <div className="space-y-5">
              {/* INR Payments */}
              <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">INR Payments</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID</label>
                    <input
                      type="text"
                      value={settingsForm.upi_id}
                      onChange={(e) => setSettingsForm({ ...settingsForm, upi_id: e.target.value })}
                      placeholder="your-upi@paytm"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                      disabled={settingsSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Account Number</label>
                    <input
                      type="text"
                      value={settingsForm.bank_account}
                      onChange={(e) => setSettingsForm({ ...settingsForm, bank_account: e.target.value })}
                      placeholder="1234567890"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                      disabled={settingsSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">IFSC Code</label>
                    <input
                      type="text"
                      value={settingsForm.ifsc_code}
                      onChange={(e) => setSettingsForm({ ...settingsForm, ifsc_code: e.target.value })}
                      placeholder="SBIN0001234"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                      disabled={settingsSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Holder Name</label>
                    <input
                      type="text"
                      value={settingsForm.account_holder_name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, account_holder_name: e.target.value })}
                      placeholder="Raj Prajapati"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                      disabled={settingsSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Crypto Payments */}
              <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-violet-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">Crypto Payments</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Polygon Wallet Address</label>
                    <input
                      type="text"
                      value={settingsForm.polygon_wallet}
                      onChange={(e) => setSettingsForm({ ...settingsForm, polygon_wallet: e.target.value })}
                      placeholder="0x1234567890abcdef1234567890abcdef12345678"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono bg-white"
                      disabled={settingsSaving}
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-800">Important Note</p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        Make sure this is your correct Polygon wallet address. Crypto payments sent to wrong addresses cannot be recovered.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Notification Preferences</h3>
            <div className="space-y-3">
              {[
                { id: 'new_student', label: 'New student enrollments' },
                { id: 'payment_received', label: 'Payment received notifications' },
                { id: 'lecture_comments', label: 'New comments on lectures' },
                { id: 'weekly_analytics', label: 'Weekly analytics report' },
                { id: 'platform_updates', label: 'Platform updates and announcements' },
              ].map((pref) => (
                <label key={pref.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                  <input
                    type="checkbox"
                    checked={settingsForm.notifications[pref.id as keyof typeof settingsForm.notifications]}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      notifications: {
                        ...settingsForm.notifications,
                        [pref.id]: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    disabled={settingsSaving}
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{pref.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pb-4">
            <button
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {settingsSaving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f8fc]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 shadow-sm transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl shadow-sm flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">EduChain</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id as Page);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                currentPage === item.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-60 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate">
                  Welcome back, {settingsForm.full_name || 'Teacher'} 👋
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">Ready to inspire students today?</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="notification-button relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">{unreadCount}</span>
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notification-dropdown absolute right-0 mt-2 w-96 z-50">
                    <NotificationPanel
                      notifications={notifications}
                      onMarkAsRead={handleMarkAsRead}
                      onMarkAllAsRead={handleMarkAllAsRead}
                      onClear={handleClearNotification}
                    />
                  </div>
                )}
              </div>

              {/* Profile Avatar with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="profile-button flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl overflow-hidden border border-violet-200 flex-shrink-0">
                    <img
                      src={settingsForm.profile_picture}
                      alt={settingsForm.full_name || 'Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + (settingsForm.full_name || 'User') + '&size=200&background=9333ea&color=fff';
                      }}
                    />
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>

                {showProfileMenu && (
                  <div className="profile-dropdown absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{settingsForm.full_name || 'Teacher'}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{settingsForm.email}</p>
                    </div>
                    
                    <button
                      onClick={() => { setCurrentPage('settings'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Profile Settings</span>
                    </button>
                    
                    <button
                      onClick={() => { setCurrentPage('analytics'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <BarChart3 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Analytics</span>
                    </button>

                    <div className="border-t border-gray-100 my-1" />
                    
                    <button
                      onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-500">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && renderDashboard()}
          {currentPage === 'upload' && renderUpload()}
          {currentPage === 'lectures' && renderLectures()}
          {currentPage === 'analytics' && <AnalyticsDashboard />}
          {currentPage === 'about' && renderAbout()}
          {currentPage === 'features' && renderFeatures()}
          {currentPage === 'contact' && renderContact()}
          {currentPage === 'settings' && renderSettings()}
        </main>
      </div>
    </div>
  );
}