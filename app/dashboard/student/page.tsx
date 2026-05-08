"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, BookOpen, ShoppingCart, Settings, LogOut, Bell, User, Eye, Search, Filter, Star, Clock, DollarSign, Check, X, Calendar, TrendingUp, Award, Globe, Wallet, Play, ChevronDown, Users, Upload, Camera } from 'lucide-react';
import NotificationPanel, { Notification } from '@/components/NotificationPanel';
import CommunityPanel from '@/components/CommunityPanel';
import { supabase } from '@/lib/supabase';
import { getContract } from "@/lib/contract";
import { ethers } from "ethers";

type Page = 'dashboard' | 'browse' | 'my-notes' | 'settings' | 'about' | 'community';
type ViewMode = 'grid' | 'list';

interface Note {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_cid: string | null;
  video_cid: string;
  teacherName?: string;
  teacherAvatar?: string;
  views: number;
  rating: number;
  pricingModel: 'free' | 'subscription' | 'rent';
  currency: 'inr' | 'crypto';
  price?: number;
  rentDuration?: number;
  status: 'available' | 'owned' | 'rented';
  teacher_wallet: string | null;
}

interface MyNote extends Note {
  purchaseDate: string;
  accessType: 'purchased' | 'rented' | 'free';
  rentExpiresAt?: string;
}

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoCid: string;
  isPreview: boolean;
  title: string;
}

interface UserSettings {
  full_name: string;
  phone: string;
  profile_picture: string | null;
  interested_subjects: string;
  card_number: string;
  polygon_wallet: string;
  upi_id: string;
}

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, videoCid, isPreview, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewEnded, setPreviewEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setPreviewEnded(false);
      setCurrentTime(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isPreview) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
      if (current >= 20) {
        video.pause();
        setPreviewEnded(true);
      }
    };

    const handleSeeking = () => {
      if (video.currentTime > 20) {
        video.currentTime = 20;
        video.pause();
        setPreviewEnded(true);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
    };
  }, [isPreview]);

  if (!isOpen) return null;

  const videoUrl = `https://gateway.pinata.cloud/ipfs/${videoCid}`;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 truncate pr-4">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="relative">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full"
            style={{ maxHeight: 'calc(90vh - 120px)' }}
          >
            Your browser does not support the video tag.
          </video>
          {isPreview && previewEnded && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 shadow-xl">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Preview Ended</h4>
                <p className="text-sm text-gray-500 mb-6">Buy or rent this lecture to watch the full content</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          )}
          {isPreview && !previewEnded && (
            <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
              Preview: {Math.max(0, 20 - Math.floor(currentTime))}s remaining
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'upload',
    title: 'New Upload',
    message: 'Raj Prajapati uploaded "Advanced Data Structures" in Computer Science',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    read: false,
    avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    userName: 'Raj Prajapati'
  },
  {
    id: '2',
    type: 'like',
    title: 'Someone liked your comment',
    message: 'Priya Singh liked your comment on "Blockchain Technology"',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    read: false,
    avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    userName: 'Priya Singh'
  },
  {
    id: '3',
    type: 'approval',
    title: 'Note Approved',
    message: 'Your note "Quantum Physics Basics" has been approved by admin',
    timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    read: true
  },
  {
    id: '4',
    type: 'follow',
    title: 'New Follower',
    message: 'Amit Kumar started following you',
    timestamp: new Date(Date.now() - 5 * 60 * 60000).toISOString(),
    read: true,
    avatarUrl: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    userName: 'Amit Kumar'
  },
  {
    id: '5',
    type: 'comment',
    title: 'New Comment',
    message: 'Sara Khan commented on your note "Machine Learning Essentials"',
    timestamp: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    read: true,
    avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    userName: 'Sara Khan'
  }
];

export default function StudentDashboard() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [myNotes, setMyNotes] = useState<MyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [userSettings, setUserSettings] = useState<UserSettings>({
    full_name: '',
    phone: '',
    profile_picture: null,
    interested_subjects: 'Computer Science',
    card_number: '',
    polygon_wallet: '',
    upi_id: ''
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoModal, setVideoModal] = useState<{
    isOpen: boolean;
    videoCid: string;
    isPreview: boolean;
    title: string;
  }>({
    isOpen: false,
    videoCid: '',
    isPreview: false,
    title: ''
  });

  const categories = ['All', 'Blockchain', 'Math', 'Physics', 'Computer Science', 'Chemistry', 'Biology', 'Economics'];

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadUserSettings(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const loadUserSettings = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setUserSettings({
          full_name: data.full_name || '',
          phone: data.phone || '',
          profile_picture: data.profile_picture || null,
          interested_subjects: data.interested_subjects || 'Computer Science',
          card_number: data.card_number || '',
          polygon_wallet: data.polygon_wallet || '',
          upi_id: data.upi_id || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('File size must be less than 3MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          profile_picture: publicUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (updateError) throw updateError;

      setUserSettings(prev => ({ ...prev, profile_picture: publicUrl }));
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!userId) return;
    setSettingsSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          full_name: userSettings.full_name,
          phone: userSettings.phone,
          profile_picture: userSettings.profile_picture,
          interested_subjects: userSettings.interested_subjects,
          card_number: userSettings.card_number,
          polygon_wallet: userSettings.polygon_wallet,
          upi_id: userSettings.upi_id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSettingsSaving(false);
    }
  };

  useEffect(() => {
    const fetchLectures = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lectures')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedNotes: Note[] = (data || []).map((lecture: any) => ({
          id: lecture.id,
          title: lecture.title,
          teacher_wallet: lecture.teacher_wallet || null,
          description: lecture.description || '',
          category: lecture.category || 'Uncategorized',
          thumbnail_cid: lecture.thumbnail_cid,
          video_cid: lecture.video_cid,
          teacherName: lecture.teacher_name || 'Unknown Teacher',
          teacherAvatar: lecture.teacher_profile_picture || '/default-avatar.png',
          views: Math.floor(Math.random() * 2000),
          rating: 4.5 + Math.random() * 0.5,
          pricingModel: lecture.pricing_model as 'free' | 'subscription' | 'rent',
          currency: lecture.currency as 'inr' | 'crypto',
          price: lecture.price || 0,
          rentDuration: lecture.rent_duration || 30,
          status: 'available'
        }));

        setAllNotes(formattedNotes);
      } catch (error) {
        console.error('Error fetching lectures:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, []);

  useEffect(() => {
    const fetchMyNotes = async () => {
      if (!userId) return;

      try {
        const { data: purchases, error } = await supabase
          .from('purchases')
          .select(`*, lectures (*)`)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedMyNotes: MyNote[] = (purchases || []).map((purchase: any) => {
          const lecture = purchase.lectures;
          return {
            id: lecture.id,
            title: lecture.title,
            teacher_wallet: lecture.teacher_wallet || null,
            description: lecture.description || '',
            category: lecture.category || 'Uncategorized',
            thumbnail_cid: lecture.thumbnail_cid,
            video_cid: lecture.video_cid,
            teacherName: lecture.teacher_name || 'Unknown Teacher',
            teacherAvatar: lecture.teacher_profile_picture || '/default-avatar.png',
            views: Math.floor(Math.random() * 2000),
            rating: 4.5 + Math.random() * 0.5,
            pricingModel: lecture.pricing_model as 'free' | 'subscription' | 'rent',
            currency: lecture.currency as 'inr' | 'crypto',
            price: lecture.price || 0,
            rentDuration: lecture.rent_duration || 30,
            status: purchase.type === 'rent' ? 'rented' : 'owned',
            purchaseDate: purchase.created_at,
            accessType: purchase.type === 'free' ? 'free' : purchase.type === 'rent' ? 'rented' : 'purchased',
            rentExpiresAt: purchase.rent_expires_at
          };
        });

        setMyNotes(formattedMyNotes);
      } catch (error) {
        console.error('Error fetching purchases:', error);
      }
    };

    fetchMyNotes();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showNotifications || showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showProfileDropdown]);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await supabase.auth.signOut();
      window.location.href = '/';
    }
  };

  const handleAccessFreeNote = async (noteId: string) => {
    if (!userId) {
      alert('Please log in to access this lecture');
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('lecture_id', noteId)
        .single();

      if (existing) {
        alert('You already have access to this lecture!');
        setCurrentPage('my-notes');
        return;
      }

      const { error } = await supabase
        .from('purchases')
        .insert({ user_id: userId, lecture_id: noteId, type: 'free', amount: 0 });

      if (error) throw error;

      alert('Lecture added to your library!');

      const { data: purchases } = await supabase
        .from('purchases')
        .select(`*, lectures (*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (purchases) {
        const formattedMyNotes: MyNote[] = purchases.map((purchase: any) => {
          const lecture = purchase.lectures;
          return {
            id: lecture.id,
            title: lecture.title,
            teacher_wallet: lecture.teacher_wallet || null,
            description: lecture.description || '',
            category: lecture.category || 'Uncategorized',
            thumbnail_cid: lecture.thumbnail_cid,
            video_cid: lecture.video_cid,
            teacherName: lecture.teacher_name || 'Unknown Teacher',
            teacherAvatar: lecture.teacher_profile_picture || '/default-avatar.png',
            views: Math.floor(Math.random() * 2000),
            rating: 4.5 + Math.random() * 0.5,
            pricingModel: lecture.pricing_model as 'free' | 'subscription' | 'rent',
            currency: lecture.currency as 'inr' | 'crypto',
            price: lecture.price || 0,
            rentDuration: lecture.rent_duration || 30,
            status: purchase.type === 'rent' ? 'rented' : 'owned',
            purchaseDate: purchase.created_at,
            accessType: purchase.type === 'free' ? 'free' : purchase.type === 'rent' ? 'rented' : 'purchased',
            rentExpiresAt: purchase.rent_expires_at
          };
        });
        setMyNotes(formattedMyNotes);
      }
    } catch (error) {
      console.error('Error accessing free lecture:', error);
      alert('Failed to access lecture. Please try again.');
    }
  };

  const handlePurchaseOrRent = async (note: Note) => {
    if (!userId) {
      alert("Login first");
      return;
    }

    const { data: existing } = await supabase
      .from("purchases")
      .select("*")
      .eq("user_id", userId)
      .eq("lecture_id", note.id)
      .single();

    if (existing) {
      alert("You already own this lecture");
      setCurrentPage("my-notes");
      return;
    }

    if (note.pricingModel === "free") return;

    if (note.currency === "crypto") {
      try {
        if (typeof window === "undefined" || !window.ethereum) {
          alert("MetaMask not found. Please install it to continue.");
          return;
        }

        if (!note.teacher_wallet) {
          alert("Teacher wallet address not found");
          return;
        }

        await window.ethereum.request({ method: "eth_requestAccounts" });

        const { ethers } = await import("ethers");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();

        if (network.chainId !== BigInt(80002)) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x13882" }],
            });
          } catch (switchErr: any) {
            if (switchErr.code === 4902) {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                  chainId: "0x13882",
                  chainName: "Polygon Amoy Testnet",
                  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                  rpcUrls: ["https://rpc-amoy.polygon.technology"],
                  blockExplorerUrls: ["https://amoy.polygonscan.com"],
                }],
              });
            } else {
              alert("Please switch to Polygon Amoy testnet in MetaMask.");
              return;
            }
          }
        }

        const finalProvider = new ethers.BrowserProvider(window.ethereum);
        const signer = await finalProvider.getSigner();

        const CONTRACT_ABI = ["function purchase(address teacherWallet) external payable"];
        const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const valueInWei = ethers.parseEther(String(note.price));

        let tx;
        try {
          tx = await contract.purchase(note.teacher_wallet, { value: valueInWei });
        } catch (txErr: any) {
          if (txErr.code === "ACTION_REJECTED" || txErr.code === 4001) {
            alert("Transaction rejected by user.");
          } else {
            alert(txErr.message || "Transaction failed. Please try again.");
          }
          return;
        }

        alert("Transaction submitted! Waiting for confirmation...");
        await tx.wait();

        const verifyRes = await fetch("/api/verify-crypto-purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: tx.hash, lectureId: note.id, userId }),
        });

        const result = await verifyRes.json();

        if (!verifyRes.ok) {
          alert(result.error || "Verification failed. Contact support.");
          return;
        }

        alert("🎉 Crypto Payment Successful! Lecture unlocked.");
        window.location.reload();
      } catch (err: any) {
        console.error("Crypto purchase error:", err);
        alert(err.message || "Crypto transaction failed. Please try again.");
      }
      return;
    }

    if (note.currency === "inr") {
      try {
        const res = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lectureId: note.id, amount: note.price, type: note.pricingModel }),
        });

        const data = await res.json();

        if (!data.success) {
          alert("Order creation failed");
          return;
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.order.amount,
          currency: "INR",
          name: "EduChain",
          description: note.title,
          order_id: data.order.id,
          handler: async function (response: any) {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                lectureId: note.id,
                type: note.pricingModel,
                userId
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              alert("Payment success 🎉 Lecture unlocked");
              window.location.reload();
            } else {
              alert("Payment verification failed");
            }
          },
          theme: { color: "#2563eb" },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error(err);
        alert("Payment failed");
      }
    }
  };

  const handlePreview = (note: Note) => {
    setVideoModal({ isOpen: true, videoCid: note.video_cid, isPreview: true, title: note.title });
  };

  const handleOpenFullVideo = (note: MyNote) => {
    setVideoModal({ isOpen: true, videoCid: note.video_cid, isPreview: false, title: note.title });
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getThumbnailUrl = (thumbnailCid: string | null) => {
    if (thumbnailCid) return `https://gateway.pinata.cloud/ipfs/${thumbnailCid}`;
    return 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop';
  };

  const getProfilePictureUrl = () => {
    if (userSettings.profile_picture) return userSettings.profile_picture;
    return null;
  };

  const filteredNotes = allNotes.filter(note => {
    const matchesCategory = selectedCategory === 'all' || note.category?.toLowerCase() === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sidebarItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'browse', label: 'Browse Notes', icon: BookOpen },
    { id: 'my-notes', label: 'My Notes', icon: ShoppingCart },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'about', label: 'About', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // ─── Page Renderers ────────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Notes</p>
              <p className="text-3xl font-bold text-gray-900 leading-none">{myNotes.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="relative mt-4 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">
              <TrendingUp className="w-3 h-3" />{myNotes.length} new
            </span>
            <span className="text-gray-400">this week</span>
          </div>
        </div>

        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all duration-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900 leading-none">₹0</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="relative mt-4">
            <p className="text-xs text-gray-400">No purchases yet</p>
          </div>
        </div>

        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-100 transition-all duration-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Rented Notes</p>
              <p className="text-3xl font-bold text-gray-900 leading-none">{myNotes.filter(n => n.accessType === 'rented').length}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="relative mt-4">
            <p className="text-xs text-gray-400">Active rentals</p>
          </div>
        </div>

        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-violet-100 transition-all duration-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Available Notes</p>
              <p className="text-3xl font-bold text-gray-900 leading-none">{allNotes.length}</p>
            </div>
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <div className="relative mt-4">
            <p className="text-xs text-gray-400">Ready to explore</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-900">Recently Added to Library</h3>
            <button onClick={() => setCurrentPage('my-notes')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {myNotes.slice(0, 3).map((note) => (
              <div key={note.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <img src={getThumbnailUrl(note.thumbnail_cid)} alt={note.title} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{note.teacherName}</p>
                </div>
                <button
                  onClick={() => handleOpenFullVideo(note)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />View
                </button>
              </div>
            ))}
            {myNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-2">
                  <BookOpen className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No notes in your library yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-900">Recommended</h3>
            <button onClick={() => setCurrentPage('browse')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Browse all →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {allNotes.slice(0, 3).map((note) => (
              <div key={note.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <img src={getThumbnailUrl(note.thumbnail_cid)} alt={note.title} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{note.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-400">{note.rating.toFixed(1)}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-400">{note.views} views</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-800 flex-shrink-0">
                  {note.pricingModel === 'free' ? 'Free' : note.currency === 'inr' ? `₹${note.price}` : `${note.price} MATIC`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-500 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute -top-6 -right-6 w-36 h-36 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white/5 rounded-full" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold mb-1">Explore Premium Content</h3>
            <p className="text-blue-100 text-sm">Access exclusive notes from top educators</p>
          </div>
          <button
            onClick={() => setCurrentPage('browse')}
            className="flex-shrink-0 bg-white text-blue-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm"
          >
            Browse Notes
          </button>
        </div>
      </div>
    </div>
  );

  const renderBrowse = () => (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Browse Notes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Discover notes from expert educators</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notes by title, category, or teacher…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 bg-gray-50/50 transition-shadow"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat.toLowerCase()}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading lectures…</p>
          </div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No lectures found</h3>
          <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200">
              <div className="relative overflow-hidden">
                <img
                  src={getThumbnailUrl(note.thumbnail_cid)}
                  alt={note.title}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
                    note.pricingModel === 'free' ? 'bg-emerald-500/90 text-white' :
                    note.pricingModel === 'rent' ? 'bg-orange-500/90 text-white' : 'bg-blue-600/90 text-white'
                  }`}>
                    {note.pricingModel === 'free' ? 'Free' : note.pricingModel === 'rent' ? 'Rent' : 'Purchase'}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <img src={note.teacherAvatar} alt={note.teacherName} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-500 truncate">{note.teacherName}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-snug">{note.title}</h3>
                <p className="text-xs text-gray-400 mb-4 line-clamp-2 leading-relaxed">{note.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />{note.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />{note.views}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">{note.category}</span>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                  <button
                    onClick={() => handlePreview(note)}
                    className="flex-1 px-3 py-2 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-xs font-semibold"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      if (note.pricingModel === 'free') handleAccessFreeNote(note.id);
                      else handlePurchaseOrRent(note);
                    }}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-colors shadow-sm ${
                      note.pricingModel === 'free' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      note.pricingModel === 'rent' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {note.pricingModel === 'free' ? 'Free Access' :
                     note.currency === 'inr' ? `₹${note.price}` : `${note.price} MATIC`}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMyNotes = () => (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Notes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Access your purchased and rented notes</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2">
          <button className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl">All ({myNotes.length})</button>
          <button className="px-3.5 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors">
            Purchased ({myNotes.filter(n => n.accessType === 'purchased').length})
          </button>
          <button className="px-3.5 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors">
            Rented ({myNotes.filter(n => n.accessType === 'rented').length})
          </button>
          <button className="px-3.5 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors">
            Free ({myNotes.filter(n => n.accessType === 'free').length})
          </button>
        </div>
      </div>

      {myNotes.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No notes yet</h3>
          <p className="text-sm text-gray-400 mb-5">Start exploring and add notes to your library</p>
          <button
            onClick={() => setCurrentPage('browse')}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Browse Notes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {myNotes.map((note) => (
            <div key={note.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200">
              <div className="relative overflow-hidden">
                <img
                  src={getThumbnailUrl(note.thumbnail_cid)}
                  alt={note.title}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
                    note.accessType === 'free' ? 'bg-emerald-500/90 text-white' :
                    note.accessType === 'rented' ? 'bg-orange-500/90 text-white' : 'bg-blue-600/90 text-white'
                  }`}>
                    {note.accessType === 'free' ? 'Free Access' : note.accessType === 'rented' ? 'Rented' : 'Owned'}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <img src={note.teacherAvatar} alt={note.teacherName} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-500 truncate">{note.teacherName}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-snug">{note.title}</h3>
                <p className="text-xs text-gray-400 mb-4 line-clamp-2 leading-relaxed">{note.description}</p>

                <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Added {new Date(note.purchaseDate).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">{note.category}</span>
                </div>

                {note.accessType === 'rented' && note.rentExpiresAt && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-orange-700 font-medium">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      Expires {new Date(note.rentExpiresAt).toLocaleDateString()}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-50">
                  <button
                    onClick={() => handleOpenFullVideo(note)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Play className="w-4 h-4" />Watch Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAbout = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">About EduChain</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your decentralized learning platform</p>
      </div>

      <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 rounded-2xl p-8 text-white overflow-hidden shadow-lg">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-white/5 rounded-full" />
        <div className="relative text-center max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-3">Welcome to EduChain Student Portal</h3>
          <p className="text-blue-100 text-sm leading-relaxed">
            Access high-quality educational content from expert teachers. Purchase, rent, or access free notes
            to enhance your learning journey. Built on blockchain technology for transparency and security.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: BookOpen, color: 'blue', title: 'Quality Content', desc: 'Access notes from verified educators with expertise in various subjects' },
          { icon: Wallet, color: 'emerald', title: 'Flexible Pricing', desc: 'Choose to purchase, rent, or access free content based on your needs' },
          { icon: Award, color: 'violet', title: 'Blockchain Secured', desc: 'Your purchases and access rights are secured on the blockchain' },
        ].map(({ icon: Icon, color, title, desc }) => {
          const colorMap: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-600',
            emerald: 'bg-emerald-100 text-emerald-600',
            violet: 'bg-violet-100 text-violet-600'
          };
          return (
            <div key={title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center hover:shadow-md transition-all duration-200">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-5">How It Works</h3>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Browse Notes', desc: 'Explore our catalog of educational notes across various subjects and categories' },
            { step: '2', title: 'Choose Access Type', desc: 'Purchase for lifetime access, rent for a period, or get free content instantly' },
            { step: '3', title: 'Secure Payment', desc: 'Pay with INR or cryptocurrency through our secure payment gateway' },
            { step: '4', title: 'Start Learning', desc: 'Access your notes anytime from your library and enhance your knowledge' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-4 p-4 bg-gray-50/80 rounded-xl">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold">{step}</div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your profile and preferences</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Profile Picture</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex-shrink-0">
            {getProfilePictureUrl() ? (
              <img src={getProfilePictureUrl()!} alt="Profile" className="w-24 h-24 rounded-2xl object-cover border border-gray-200" />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold border border-gray-200">
                {userSettings.full_name ? userSettings.full_name.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors shadow-md"
              disabled={uploadingImage}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">{userSettings.full_name || 'Student User'}</h4>
            <p className="text-xs text-gray-400 mb-4">Update your profile picture</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Upload className="w-4 h-4" />
              {uploadingImage ? 'Uploading…' : 'Upload Photo'}
            </button>
            <p className="text-xs text-gray-400 mt-2">Max size: 3MB. JPG, PNG only.</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={userSettings.full_name}
              onChange={(e) => setUserSettings(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={userSettings.phone}
              onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              placeholder="+91 98765 43210"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Interested Subjects</label>
            <select
              value={userSettings.interested_subjects}
              onChange={(e) => setUserSettings(prev => ({ ...prev, interested_subjects: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Economics">Economics</option>
              <option value="Blockchain">Blockchain</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Payment Methods</h3>
        <div className="space-y-4">
          <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-sm font-semibold text-gray-800">UPI / Bank Details</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID</label>
                <input
                  type="text"
                  value={userSettings.upi_id}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, upi_id: e.target.value }))}
                  placeholder="your-upi@paytm"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Number</label>
                <input
                  type="text"
                  value={userSettings.card_number}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, card_number: e.target.value }))}
                  placeholder="4111 1111 1111 1111"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-violet-600" />
              </div>
              <h4 className="text-sm font-semibold text-gray-800">Crypto Wallet</h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Polygon Wallet Address</label>
              <input
                type="text"
                value={userSettings.polygon_wallet}
                onChange={(e) => setUserSettings(prev => ({ ...prev, polygon_wallet: e.target.value }))}
                placeholder="0x1234567890abcdef1234567890abcdef12345678"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Notification Preferences</h3>
        <div className="space-y-2">
          {[
            { id: 'new-notes', label: 'New notes from favorite teachers', checked: true },
            { id: 'rental-expiry', label: 'Rental expiration reminders', checked: true },
            { id: 'recommendations', label: 'Personalized recommendations', checked: false },
            { id: 'updates', label: 'Platform updates and announcements', checked: true },
          ].map((pref) => (
            <label key={pref.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
              <input
                type="checkbox"
                defaultChecked={pref.checked}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{pref.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end pb-4">
        <button
          onClick={handleSaveSettings}
          disabled={settingsSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {settingsSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  // ── Community renders CommunityPanel with no props ──────────────────────────
  const renderCommunity = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Community</h2>
        <p className="text-sm text-gray-500 mt-0.5">Connect with fellow students and discover new content</p>
      </div>
      <CommunityPanel />
    </div>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#f8f8fc]">
      <VideoModal
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal({ ...videoModal, isOpen: false })}
        videoCid={videoModal.videoCid}
        isPreview={videoModal.isPreview}
        title={videoModal.title}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 shadow-sm transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">EduChain</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setCurrentPage(item.id as Page); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                currentPage === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

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

      <div className="lg:ml-60 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate">Welcome back! 👋</h1>
                <p className="text-xs text-gray-400 hidden sm:block">Continue your learning journey</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 z-50">
                    <NotificationPanel
                      notifications={notifications}
                      onMarkAsRead={handleMarkAsRead}
                      onMarkAllAsRead={handleMarkAllAsRead}
                      onClear={handleClearNotification}
                    />
                  </div>
                )}
              </div>

              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  {getProfilePictureUrl() ? (
                    <img src={getProfilePictureUrl()!} alt="Profile" className="w-8 h-8 rounded-xl object-cover border border-gray-200" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                      {userSettings.full_name ? userSettings.full_name.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userSettings.full_name || 'Student User'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Student Account</p>
                    </div>
                    <button
                      onClick={() => { setCurrentPage('settings'); setShowProfileDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-gray-400" />My Profile
                    </button>
                    <button
                      onClick={() => { setCurrentPage('my-notes'); setShowProfileDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <BookOpen className="w-4 h-4 text-gray-400" />My Notes
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && renderDashboard()}
          {currentPage === 'browse' && renderBrowse()}
          {currentPage === 'my-notes' && renderMyNotes()}
          {currentPage === 'community' && renderCommunity()}
          {currentPage === 'about' && renderAbout()}
          {currentPage === 'settings' && renderSettings()}
        </main>
      </div>
    </div>
  );
}