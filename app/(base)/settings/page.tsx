"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
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
  Skeleton,
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
  Info,
  Copy,
  // userRound,
} from "lucide-react";
import { authOperations } from "@/lib/supabase/auth";
import { databaseOperations } from "@/lib/supabase/database";
import { userAPI } from "@/lib/api/client";
import { logger } from "@/lib/utils/logger";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Tables } from "@/lib/supabase/types";
import { useSubscription } from "@/hooks/use-subscription";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { useAppGlobal } from "@/lib/context/GlobalContext";
import { useTranslation } from "@/lib/utils/translations";

type Profile = Tables<"profiles">;

interface FormData {
  username: string;
  full_name?: string;
  bio: string;
  location: string;
  birth_date: string;
  theme: "light" | "dark" | "system";
  public_profile: boolean;
  show_email: boolean;
  email_notifications: boolean;
}

function ProfileSkeleton() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4 my-8 justify-between">
          <Button isIconOnly variant="light" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-grow flex items-center justify-center gap-2 ">
            <User className="w-4 h-4 text-foreground-400" />
            <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
            {/* <p className="text-foreground-600">
              Manage your account and preferences
            </p> */}
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-center justify-center gap-4">
          <Skeleton className="rounded-full w-20 h-20" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-4 w-36 rounded-md" />
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              {/* <Skeleton className="h-4 w-28 rounded-md" /> */}
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ))}

          {/* Bio textarea */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>

        {/* Account Info */}
        <Card>
          <CardBody className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Preferences */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>

        {/* Danger Zone */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* Sticky Save Button */}
        <div className="sticky bottom-0 bg-content1 pt-6">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { subscription } = useSubscription();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

  const { user } = useAppGlobal();

  // const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // 🔒 检查登录状态
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const currentUser = await authOperations.getCurrentUser();
  //     if (!currentUser) {
  //       logger.warn({ module: "settings-page", operation: "checkAuth" }, "User not logged in, redirecting to login");
  //       const { toast } = await import("sonner");
  //       toast.error("请先登录以访问设置页面");
  //       router.push("/login");
  //     }
  //   };
  //   checkAuth();
  // }, [router]);

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

  // Store initial form data to detect changes
  const [initialFormData, setInitialFormData] = useState<FormData | null>(null);
  const [initialAvatarPreview, setInitialAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setErrors({});

      // Try to get profile from database first
      let userProfile: Profile | null = null;
      try {
        userProfile = await databaseOperations.getUserProfile(user?.id ?? '');
      } catch (dbError) {
        logger.error(
          {
            module: "settings",
            operation: "get_profile_from_db",
            error: dbError,
            data: { userId: user?.id ?? '' },
          },
          "Failed to load profile from database, falling back to auth metadata"
        );
      }

      // If no profile in database, create one from auth metadata or defaults
      if (!userProfile) {
        const metadata = user?.user_metadata || {};

        userProfile = {
          id: user?.id ?? '',
          username: metadata.username || null,
          full_name: metadata.full_name || null,
          avatar_url: metadata.avatar_url || null,
          email: user?.email || "",
          created_at: user?.created_at ?? "0000-00-00",
          updated_at: user?.updated_at ?? "0000-00-00",
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
              data: { userId: user?.id },
            },
            "Failed to create profile in database, continuing with in-memory profile"
          );
        }
      }

      setProfile(userProfile);

      // Extract preferences from user metadata (these aren't stored in profiles table)
      const metadata = user?.user_metadata || {};
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
      // Store initial form data for change detection
      setInitialFormData({ ...populatedFormData });

      // Set avatar preview if available
      if (userProfile.avatar_url) {
        setAvatarPreview(userProfile.avatar_url);
        setInitialAvatarPreview(userProfile.avatar_url);
      } else {
        setInitialAvatarPreview(null);
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

  // Check if form has been modified
  const hasChanges = useMemo(() => {
    if (!initialFormData) return false;

    // Check if form data has changed
    const formChanged = 
      formData.username !== initialFormData.username ||
      formData.full_name !== initialFormData.full_name ||
      formData.bio !== initialFormData.bio ||
      formData.location !== initialFormData.location ||
      formData.birth_date !== initialFormData.birth_date ||
      formData.theme !== initialFormData.theme ||
      formData.public_profile !== initialFormData.public_profile ||
      formData.show_email !== initialFormData.show_email ||
      formData.email_notifications !== initialFormData.email_notifications;

    // Check if avatar has changed
    const avatarChanged = avatarFile !== null || avatarPreview !== initialAvatarPreview;

    return formChanged || avatarChanged;
  }, [formData, initialFormData, avatarFile, avatarPreview, initialAvatarPreview]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = t("settings.usernameRequired");
    } else if (formData.username.length < 3) {
      newErrors.username = t("settings.usernameMinLength");
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = t("settings.usernameInvalid");
    }

    if (formData.bio.length > 500) {
      newErrors.bio = t("settings.bioMaxLength");
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

      setSuccessMessage(t("settings.profileUpdated"));
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
    return (<ProfileSkeleton />)
    // return (
    //   <div className="min-h-screen bg-content1 flex items-center justify-center">
    //     <div className="text-center">
    //       <Spinner size="lg" />
    //       <p className="mt-4 text-foreground-600">Loading your profile...</p>
    //     </div>
    //   </div>
    // );
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
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 my-8 justify-between">
          <Button isIconOnly variant="light" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-grow flex items-center justify-center gap-2 ">
            <User className="w-4 h-4 text-foreground-400" />
            <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
            {/* <p className="text-foreground-600">
              Manage your account and preferences
            </p> */}
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

        <div className="flex flex-col items-center justify-center gap-4">
          {/* avatar icon*/}
          <div className="flex items-center gap-4">
            <div className="rounded-full border-2 border-yellow-500">
              <Avatar
                src={avatarPreview || undefined}
                name={formData.username || formData.full_name || user.email}
                size="lg"
                className="w-20 h-20"
              />
            </div>
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
                  // variant="bordered"
                  startContent={
                    isUploading ? (
                      <Spinner size="sm" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )
                  }
                  disabled={isUploading}
                  className="h-10 px-5 min-w-[120px] rounded-full bg-gradient-to-r from-gray-100 to-[#EB7020]/20 text-foreground shadow-sm hover:to-[#EB7020]/30 hover:shadow-md cursor-pointer"

                >
                  {isUploading ? t("settings.uploading") : t("settings.change")}
                </Button>
              </label>
              {errors.avatar && (
                <p className="text-danger text-sm mt-1">{errors.avatar}</p>
              )}
              <p className="text-foreground-600 text-sm mt-1">
                {t("settings.maxFileSize")}
              </p>
            </div>
          </div>
          {/* input */}
          <div className="flex flex-col w-full gap-4">
            {/* Username */}
            <Input
              label={t("settings.username")}
              placeholder={t("settings.usernamePlaceholder")}
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              isInvalid={!!errors.username}
              errorMessage={errors.username}
              startContent={<User className="w-4 h-4 text-foreground-400" />}
              isRequired
            // classNames={{
            //   inputWrapper: "rounded-[20px] border-1 border-foreground/10 shadow-sm pt-6 pb-2",
            //   input: "pt-0",
            // }}
            />

            {/* Full Name */}
            <Input
              label={t("settings.fullName")}
              placeholder={t("settings.fullNamePlaceholder")}
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              startContent={<User className="w-4 h-4 text-foreground-400" />}
            />

            {/* Email (Read-only) */}
            <Input
              label={t("settings.email")}
              value={user.email || ""}
              isReadOnly
              startContent={<Mail className="w-4 h-4 text-foreground-400" />}
              description={t("settings.emailDescription")}
            />

            {/* Bio */}
            <Textarea
              label={t("settings.bio")}
              placeholder={t("settings.bioPlaceholder")}
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              maxRows={4}
              isInvalid={!!errors.bio}
              errorMessage={errors.bio}
              description={`${formData.bio.length}/500 characters`}
            />

            {/* Location */}
            <Input
              label={t("settings.location")}
              placeholder={t("settings.locationPlaceholder")}
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              startContent={
                <MapPin className="w-4 h-4 text-foreground-400" />
              }
            />

            {/* Birth Date */}
            <Input
              label={t("settings.birthDate")}
              type="date"
              value={formData.birth_date}
              onChange={(e) =>
                handleInputChange("birth_date", e.target.value)
              }
              startContent={
                <Calendar className="w-4 h-4 text-foreground-400" />
              }
              description={t("settings.birthDateDescription")}
            />
          </div>

          {/* input */}

          <div className="flex flex-col w-full justify-center gap-4">
            <div className="flex items-center justify-center gap-2">
              <Info />
              <h3 className="font-semibold">{t("settings.accountInformation")}</h3>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p>{t("settings.subscriptionPlan")}</p>
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
                    ? t("settings.annualPremium")
                    : subscription?.subscription_tier === "monthly"
                      ? t("settings.monthlyPremium")
                      : subscription?.subscription_tier === "premium"
                        ? t("settings.trialPremium")
                        : t("settings.freePlan")}
                </Chip>
              </div>
              <Button
                variant="light"
                onPress={async () => {
                }}
                className="h-10 px-5 min-w-[120px] rounded-full bg-gradient-to-r from-gray-100 to-[#EB7020]/20 text-foreground shadow-sm hover:to-[#EB7020]/30 hover:shadow-md"
              >
                {t("settings.upgrade")}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <p>{t("settings.memberSince")}</p>
                <span className="text-[#666666] text-sm">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : t("settings.unknown")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <p>{t("settings.userId")}</p>
                <span className="text-[#666666] text-sm">{user.id}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <p>{t("settings.profileStatus")}</p>
                <span className="text-[#EB7020] text-sm">{profile && t("settings.active")}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="flex items-center gap-2">{t("settings.invitationCode")}<Info className="w-4 h-4" /></p>
                <span className="text-[#EB7020] text-sm">GT3EM</span>
              </div>

              <Button
                variant="light"
                onPress={async () => {
                }}
                startContent={<Copy className="w-4 h-4" />}
                className="h-10 px-5 min-w-[120px] rounded-full bg-gradient-to-r from-gray-100 to-[#EB7020]/20 text-foreground shadow-sm hover:to-[#EB7020]/30 hover:shadow-md"
              >
                {t("settings.copy")}
              </Button>
            </div>

          </div>
          <div className="flex flex-col w-full justify-center gap-4">
            <div className="flex items-center justify-center gap-2">
              <img
                src="/png/preference.png"
                alt="preference"
                className="h-6 w-6"
              />
              <h3 className="font-semibold">{t("settings.preferences")}</h3>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p>{t("settings.theme")}</p>
                <span className="text-[#666666] text-sm">{t("settings.themeLocked")}</span>
              </div>

              <Switch
                isSelected={false}
                onValueChange={(value) =>
                  handleInputChange("show_email", value)
                }
              />

            </div>
          </div>

          {/* Danger Zone */}
          <div className="flex flex-col items-center justify-center">
              <h3 className="font-semibold text-danger flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t("settings.dangerZone")}
            </h3>
            <p className="text-sm text-foreground-600 mb-4 mt-2">
              {t("settings.deleteAccountWarning")}
            </p>
            <Button
              color="danger"
              variant="bordered"
              className="w-full mx-20 mb-8"
              onPress={onDeleteOpen}
              startContent={<Trash2 className="w-4 h-4" />}
            >
              {t("settings.deleteAccount")}
            </Button>
          </div>

          {/* Save Button - Only show when there are changes */}
          {hasChanges && (
            <div className="w-full px-32 border-1 border-solid border-t-[#cccccc] py-8 sticky bottom-0 z-10 bg-content1 shadow-lg">
              <Button
                color="primary"
                className="w-full"
                onPress={handleSave}
                isLoading={isSaving}
                startContent={
                  !isSaving ? <Save className="w-4 h-4" /> : undefined
                }
              >
                {isSaving ? t("settings.saving") : t("settings.saveChanges")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-danger">{t("settings.deleteAccountTitle")}</h3>
              </ModalHeader>
              <ModalBody>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-danger mt-0.5" />
                  <div>
                    <p className="font-medium mb-2">
                      {t("settings.deleteAccountConfirm")}
                    </p>
                    <p className="text-sm text-foreground-600">
                      {t("settings.deleteAccountDesc")}
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("settings.cancel")}
                </Button>
                <Button color="danger" onPress={handleDeleteAccount}>
                  {t("settings.deleteAccount")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
