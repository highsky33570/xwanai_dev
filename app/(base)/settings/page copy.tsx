"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Switch,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Chip,
} from "@heroui/react";
import {
  ArrowLeft,
  Upload,
  User,
  Mail,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  Palette,
  Bell,
  Shield,
  Trash2,
  Save,
  AlertTriangle,
  ChevronDown,
  Crown,
  Star,
  Sparkles, // 🎯 添加 Sparkles 图标用于试用会员
} from "lucide-react";
import { authOperations } from "@/lib/supabase/auth";
import { databaseOperations } from "@/lib/supabase/database";
import { userAPI } from "@/lib/api/client";
import { logger } from "@/lib/utils/logger";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Tables } from "@/lib/supabase/types";
import { useSubscription } from "@/hooks/use-subscription";
import { InvitationCard } from "@/components/invitation/invitation-card";

type Profile = Tables<"profiles">;

interface FormData {
  username: string;
  full_name: string;
  bio: string;
  location: string;
  birth_date: string;
  theme: "light" | "dark" | "system";
  public_profile: boolean;
  show_email: boolean;
  email_notifications: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { subscription } = useSubscription();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // 🔒 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await authOperations.getCurrentUser();
      if (!currentUser) {
        logger.warn({ module: "settings-page", operation: "checkAuth" }, "User not logged in, redirecting to login");
        const { toast } = await import("sonner");
        toast.error("请先登录以访问设置页面");
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState<FormData>({
    username: "",
    full_name: "",
    bio: "",
    location: "",
    birth_date: "",
    theme: "light",
    public_profile: true,
    show_email: false,
    email_notifications: true,
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setErrors({});

      // Get authenticated user
      const currentUser = await authOperations.getCurrentUser();
      if (!currentUser) {
        logger.warn(
          {
            module: "settings",
            operation: "load_user_profile",
          },
          "No authenticated user found, redirecting to login"
        );
        router.push("/login");
        return;
      }

      setUser(currentUser);

      // Try to get profile from database first
      let userProfile: Profile | null = null;
      try {
        userProfile = await databaseOperations.getUserProfile(currentUser.id);
      } catch (dbError) {
        logger.error(
          {
            module: "settings",
            operation: "get_profile_from_db",
            error: dbError,
            data: { userId: currentUser.id },
          },
          "Failed to load profile from database, falling back to auth metadata"
        );
      }

      // If no profile in database, create one from auth metadata or defaults
      if (!userProfile) {
        const metadata = currentUser.user_metadata || {};

        userProfile = {
          id: currentUser.id,
          username: metadata.username || null,
          full_name: metadata.full_name || null,
          avatar_url: metadata.avatar_url || null,
          email: currentUser.email || "",
          created_at: currentUser.created_at,
          updated_at: currentUser.updated_at || currentUser.created_at,
        };

        // Try to save this profile to database for future use
        try {
          await databaseOperations.createUserProfile({
            id: userProfile.id,
            username: userProfile.username,
            full_name: userProfile.full_name,
            avatar_url: userProfile.avatar_url,
            email: userProfile.email,
          });
        } catch (createError) {
          logger.warn(
            {
              module: "settings",
              operation: "create_profile_in_db",
              error: createError,
              data: { userId: currentUser.id },
            },
            "Failed to create profile in database, continuing with in-memory profile"
          );
        }
      }

      setProfile(userProfile);

      // Extract preferences from user metadata (these aren't stored in profiles table)
      const metadata = currentUser.user_metadata || {};
      const preferences = {
        theme: metadata.theme || "light",
        public_profile: metadata.public_profile ?? true,
        show_email: metadata.show_email ?? false,
        email_notifications: metadata.email_notifications ?? true,
        bio: metadata.bio || "",
        location: metadata.location || "",
        birth_date: metadata.birth_date || "",
      };

      // Populate form with existing data
      const populatedFormData: FormData = {
        username: userProfile.username || "",
        full_name: userProfile.full_name || "",
        bio: preferences.bio,
        location: preferences.location,
        birth_date: preferences.birth_date,
        theme: preferences.theme as "light" | "dark" | "system",
        public_profile: preferences.public_profile,
        show_email: preferences.show_email,
        email_notifications: preferences.email_notifications,
      };

      setFormData(populatedFormData);

      // Set avatar preview if available
      if (userProfile.avatar_url) {
        setAvatarPreview(userProfile.avatar_url);
      }
    } catch (error) {
      logger.error(
        {
          module: "settings",
          operation: "load_user_profile",
          error,
        },
        "Failed to load user profile"
      );
      setErrors({ general: "Failed to load profile. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, hyphens, and underscores";
    }

    if (formData.bio.length > 500) {
      newErrors.bio = "Bio must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific errors
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    handleInputChange("theme", theme);
  };

  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
      default:
        return "System";
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ avatar: "File size must be less than 5MB" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors({ avatar: "Please select an image file" });
      return;
    }

    setAvatarFile(file);
    setErrors({ avatar: "" });

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setAvatarPreview(preview);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    try {
      setIsUploading(true);

      const response = await userAPI.uploadAvatar(avatarFile);

      return response.file_id;
    } catch (error) {
      logger.error(
        {
          module: "settings",
          operation: "upload_avatar",
          error,
          data: { fileName: avatarFile.name, userId: user.id },
        },
        "Failed to upload avatar"
      );
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    try {
      setSaving(true);
      setErrors({});
      setSuccessMessage("");

      let avatarUrl = avatarPreview;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const avatarFileId = await uploadAvatar();
        if (avatarFileId) {
          avatarUrl = avatarFileId;
        }
      }

      // Prepare profile updates for database
      const profileUpdates = {
        username: formData.username.trim() || null,
        full_name: formData.full_name.trim() || null,
        avatar_url: avatarUrl,
      };

      // Prepare metadata updates for auth
      const metadataUpdates = {
        name: formData.username.trim(), // 用于后端RPC函数
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        birth_date: formData.birth_date,
        theme: formData.theme,
        public_profile: formData.public_profile,
        show_email: formData.show_email,
        email_notifications: formData.email_notifications,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      // Update profile in database
      if (profile) {
        try {
          await databaseOperations.updateUserProfile(user.id, profileUpdates);
        } catch (dbError) {
          logger.error(
            {
              module: "settings",
              operation: "update_profile_db",
              error: dbError,
              data: { userId: user.id },
            },
            "Failed to update profile in database"
          );
          // Continue with auth metadata update even if DB update fails
        }
      }

      // Update user metadata in auth
      const { error: authError } = await authOperations.updateUser({
        data: metadataUpdates,
      });

      if (authError) {
        throw authError;
      }

      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          username: profileUpdates.username,
          full_name: profileUpdates.full_name,
          avatar_url: profileUpdates.avatar_url,
          updated_at: new Date().toISOString(),
        });
      }

      setSuccessMessage("Profile updated successfully!");
      setAvatarFile(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      logger.error(
        {
          module: "settings",
          operation: "save_profile",
          error,
          data: { userId: user.id },
        },
        "Failed to save profile"
      );
      setErrors({ general: "Failed to save profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    logger.warn(
      {
        module: "settings",
        operation: "delete_account",
        data: { userId: user.id },
      },
      "User requesting account deletion"
    );

    try {
      // Sign out user (actual account deletion would be implemented here)
      await authOperations.signOut();
      router.push("/");
    } catch (error) {
      logger.error(
        {
          module: "settings",
          operation: "delete_account",
          error,
        },
        "Failed to delete account"
      );
      setErrors({ general: "Failed to delete account. Please try again." });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-content1 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-foreground-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-content1 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardBody className="text-center">
            <p>Please log in to access settings.</p>
            <Button
              color="primary"
              className="mt-4"
              onClick={() => router.push("/login")}
            >
              Go to Login
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button isIconOnly variant="light" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">User Settings</h1>
            <p className="text-foreground-600">
              Manage your account and preferences
            </p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Card className="mb-6 border-success">
            <CardBody>
              <p className="text-success">{successMessage}</p>
            </CardBody>
          </Card>
        )}

        {/* General Error */}
        {errors.general && (
          <Card className="mb-6 border-danger">
            <CardBody>
              <p className="text-danger">{errors.general}</p>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-10">
            {/* Basic Information */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </h2>
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <Avatar
                  src={avatarPreview || undefined}
                  name={formData.username || formData.full_name || user.email}
                  size="lg"
                  className="w-20 h-20"
                />
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload">
                    <Button
                      as="span"
                      variant="bordered"
                      startContent={
                        isUploading ? (
                          <Spinner size="sm" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )
                      }
                      disabled={isUploading}
                      className="cursor-pointer"
                    >
                      {isUploading ? "Uploading..." : "Change Avatar"}
                    </Button>
                  </label>
                  {errors.avatar && (
                    <p className="text-danger text-sm mt-1">{errors.avatar}</p>
                  )}
                  <p className="text-foreground-600 text-sm mt-1">
                    Max 5MB, JPG/PNG only
                  </p>
                </div>
              </div>

              {/* Username */}
              <Input
                label="Username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                isInvalid={!!errors.username}
                errorMessage={errors.username}
                startContent={<User className="w-4 h-4 text-foreground-400" />}
                isRequired
              />

              {/* Full Name */}
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                startContent={<User className="w-4 h-4 text-foreground-400" />}
              />

              {/* Email (Read-only) */}
              <Input
                label="Email"
                value={user.email || ""}
                isReadOnly
                startContent={<Mail className="w-4 h-4 text-foreground-400" />}
                description="Contact support to change your email address"
              />

              {/* Bio */}
              <Textarea
                label="Bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                maxRows={4}
                isInvalid={!!errors.bio}
                errorMessage={errors.bio}
                description={`${formData.bio.length}/500 characters`}
              />

              {/* Location */}
              <Input
                label="Location"
                placeholder="Where are you from?"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                startContent={
                  <MapPin className="w-4 h-4 text-foreground-400" />
                }
              />

              {/* Birth Date */}
              <Input
                label="Birth Date"
                type="date"
                value={formData.birth_date}
                onChange={(e) =>
                  handleInputChange("birth_date", e.target.value)
                }
                startContent={
                  <Calendar className="w-4 h-4 text-foreground-400" />
                }
                description="Used for astrology features"
              />
            </section>

            {/* Preferences */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Preferences
              </h2>
              {/* Theme Selection */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-foreground-600">
                    Theme is locked to dark mode
                  </p>
                </div>
                <Button
                  variant="bordered"
                  className="w-32 justify-between"
                  isDisabled
                >
                  Dark (locked)
                </Button>
                {/* Theme selection disabled - locked to dark mode */}
                {/* <Dropdown>
                    <DropdownTrigger>
                      <Button
                        variant="bordered"
                        className="w-32 justify-between"
                        endContent={<ChevronDown className="w-4 h-4" />}
                      >
                        {getThemeLabel(formData.theme)}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu onAction={(key) => handleThemeChange(key as "light" | "dark" | "system")}>
                      <DropdownItem key="light">Light</DropdownItem>
                      <DropdownItem key="dark">Dark</DropdownItem>
                      <DropdownItem key="system">System</DropdownItem>
                    </DropdownMenu>
                  </Dropdown> */}
              </div>
            </section>

            {/* Privacy Settings */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Notifications
              </h2>
              {/* Public Profile */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Public Profile</p>
                  <p className="text-sm text-foreground-600">
                    Allow others to view your profile
                  </p>
                </div>
                <Switch
                  isSelected={formData.public_profile}
                  onValueChange={(value) =>
                    handleInputChange("public_profile", value)
                  }
                  startContent={<Eye className="w-4 h-4" />}
                  endContent={<EyeOff className="w-4 h-4" />}
                />
              </div>

              {/* Show Email */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Email on Profile</p>
                  <p className="text-sm text-foreground-600">
                    Display your email on your public profile
                  </p>
                </div>
                <Switch
                  isSelected={formData.show_email}
                  onValueChange={(value) =>
                    handleInputChange("show_email", value)
                  }
                  isDisabled={!formData.public_profile}
                />
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-foreground-600">
                    Receive updates and notifications via email
                  </p>
                </div>
                <Switch
                  isSelected={formData.email_notifications}
                  onValueChange={(value) =>
                    handleInputChange("email_notifications", value)
                  }
                  startContent={<Bell className="w-4 h-4" />}
                />
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-10">
            {/* Save Button */}
            <section>
              <Button
                color="primary"
                className="w-full"
                onPress={handleSave}
                isLoading={isSaving}
                startContent={
                  !isSaving ? <Save className="w-4 h-4" /> : undefined
                }
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </section>

            {/* Account Info */}
            <section className="space-y-2">
              <h3 className="font-semibold">Account Information</h3>
              <div>
                <p className="text-sm text-foreground-600">Subscription Plan</p>
                <Chip
                  color={
                    subscription?.subscription_tier === "yearly"
                      ? "warning"
                      : subscription?.subscription_tier === "monthly"
                      ? "secondary"
                      : subscription?.subscription_tier === "premium"
                      ? "primary" // 🎯 试用会员使用主题色
                      : "default"
                  }
                  variant="flat"
                  size="sm"
                  startContent={
                    subscription?.subscription_tier === "yearly" ? (
                      <Crown className="w-3 h-3" />
                    ) : subscription?.subscription_tier === "monthly" ? (
                      <Star className="w-3 h-3" />
                    ) : subscription?.subscription_tier === "premium" ? (
                      <Sparkles className="w-3 h-3" /> // 🎯 试用会员使用星星图标
                    ) : null
                  }
                  className="mt-1"
                >
                  {subscription?.subscription_tier === "yearly"
                    ? "Annual Premium"
                    : subscription?.subscription_tier === "monthly"
                    ? "Monthly Premium"
                    : subscription?.subscription_tier === "premium"
                    ? "Trial Premium (7 days)" // 🎯 试用会员显示
                    : "Free Plan"}
                </Chip>
              </div>
              {subscription?.days_remaining && subscription.days_remaining > 0 && (
                <div>
                  <p className="text-sm text-foreground-600">Days Remaining</p>
                  <p className="font-medium text-success">
                    {subscription.days_remaining} days
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-foreground-600">Member since</p>
                <p className="font-medium">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm text-foreground-600">User ID</p>
                <p className="font-mono text-xs">{user.id}</p>
              </div>
              {profile && (
                <div>
                  <p className="text-sm text-foreground-600">Profile Status</p>
                  <p className="font-medium text-success">Active</p>
                </div>
              )}
            </section>

            {/* Invitation Section */}
            <section>
              <InvitationCard />
            </section>

            {/* Danger Zone */}
            <section>
              <h3 className="font-semibold text-danger flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </h3>
              <p className="text-sm text-foreground-600 mb-4 mt-2">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <Button
                color="danger"
                variant="bordered"
                className="w-full"
                onPress={onDeleteOpen}
                startContent={<Trash2 className="w-4 h-4" />}
              >
                Delete Account
              </Button>
            </section>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-danger">Delete Account</h3>
              </ModalHeader>
              <ModalBody>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-danger mt-0.5" />
                  <div>
                    <p className="font-medium mb-2">
                      This action cannot be undone.
                    </p>
                    <p className="text-sm text-foreground-600">
                      This will permanently delete your account and remove all
                      of your data from our servers.
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" onPress={handleDeleteAccount}>
                  Delete Account
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
