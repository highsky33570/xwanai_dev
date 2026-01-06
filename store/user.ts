import { makeAutoObservable } from "mobx";
import { subscriptionAPI, SubscriptionInfo } from "@/lib/api/subscription";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";

interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  avatar_id?: string;
  auth_id?: string;
}

class UserStore {
  currentUser: UserProfile | null = null;
  subscription: SubscriptionInfo | null = null;
  isLoadingSubscription: boolean = false;

  constructor() {
    makeAutoObservable(this);
    // 只在客户端环境加载用户信息
    if (typeof window !== "undefined") {
      this.loadUserFromStorage();
      this.loadSubscriptionFromStorage();
    }
  }

  setUser(user: UserProfile | null) {
    this.currentUser = user;
    if (typeof window !== "undefined") {
      if (user) {
        // 保存到 localStorage
        try {
          localStorage.setItem("current_user", JSON.stringify(user));
        } catch (error) {
          console.error("Failed to save user to localStorage:", error);
        }
      } else {
        localStorage.removeItem("current_user");
      }
    }
  }

  loadUserFromStorage() {
    if (typeof window === "undefined") return;
    
    try {
      const savedUser = localStorage.getItem("current_user");
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    } catch (error) {
      console.error("Failed to load user from localStorage:", error);
    }
  }

  clearUser() {
    this.currentUser = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("current_user");
    }
    // 同时清除订阅信息
    this.clearSubscription();
  }

  // 订阅状态管理
  setSubscription(subscription: SubscriptionInfo | null) {
    this.subscription = subscription;
    if (typeof window !== "undefined") {
      if (subscription) {
        try {
          localStorage.setItem("user_subscription", JSON.stringify(subscription));
        } catch (error) {
          console.error("Failed to save subscription to localStorage:", error);
        }
      } else {
        localStorage.removeItem("user_subscription");
      }
    }
  }

  loadSubscriptionFromStorage() {
    if (typeof window === "undefined") return;
    
    try {
      const savedSubscription = localStorage.getItem("user_subscription");
      if (savedSubscription) {
        this.subscription = JSON.parse(savedSubscription);
      }
    } catch (error) {
      console.error("Failed to load subscription from localStorage:", error);
    }
  }

  async fetchSubscription() {
    if (!this.currentUser) {
      return;
    }

    try {
      this.isLoadingSubscription = true;
      const data = await subscriptionAPI.getSubscriptionStatus();
      this.setSubscription(data);
    } catch (error) {
      // 🔒 优雅地处理错误，不在控制台显示（可能是未登录或网络问题）
      console.warn("Failed to fetch subscription (user may not be logged in):", error);
      this.subscription = null;
    } finally {
      this.isLoadingSubscription = false;
    }
  }

  clearSubscription() {
    this.subscription = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_subscription");
    }
  }

  // Getters
  get isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  get userAvatar(): string {
    return getAvatarPublicUrl(this.currentUser?.avatar_url, this.currentUser?.id || null) || "/placeholder-user.jpg";
  }

  get userName(): string {
    return this.currentUser?.username || this.currentUser?.email || "用户";
  }

  get userId(): string | undefined {
    return this.currentUser?.id;
  }

  get user(): UserProfile | null {
    return this.currentUser;
  }

  // 订阅相关 getters
  get isPremium(): boolean {
    return this.subscription?.is_premium ?? false;
  }

  get subscriptionTier(): string {
    return this.subscription?.subscription_tier ?? "free";
  }

  get subscriptionStatus(): string {
    return this.subscription?.subscription_status ?? "free";
  }

  get daysRemaining(): number | null {
    return this.subscription?.days_remaining ?? null;
  }
}

export default UserStore;
