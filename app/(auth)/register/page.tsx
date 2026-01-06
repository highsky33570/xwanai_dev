"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardBody, CardHeader, Input, Button, Divider, Link as NextUILink, Checkbox } from "@heroui/react"
import { ArrowLeft, Eye, EyeOff, User, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { authOperations } from "@/lib/supabase/auth"
import { useTranslation } from "@/lib/utils/translations"
import { invitationAPI } from "@/lib/api/client"
import { logger } from "@/lib/utils/logger"

interface RegisterState {
  username: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  isPasswordVisible: boolean
  isConfirmPasswordVisible: boolean
  loading: boolean
  error: string | null
  success: string | null
  invitationCode: string
  alreadyLoggedIn: boolean
  currentUsername: string | null
}

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [state, setState] = useState<RegisterState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    isPasswordVisible: false,
    isConfirmPasswordVisible: false,
    loading: false,
    error: null,
    success: null,
    invitationCode: "",
    alreadyLoggedIn: false,
    currentUsername: null,
  })

  // 🎁 读取URL中的邀请码参数
  useEffect(() => {
    const inviteParam = searchParams.get("invite")
    if (inviteParam) {
      setState((prev) => ({ ...prev, invitationCode: inviteParam }))
    }
  }, [searchParams])

  // 🔒 检查用户是否已登录
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const currentUser = await authOperations.getCurrentUser()
        if (currentUser) {
          // 如果有邀请码，显示提示让用户先登出
          if (state.invitationCode) {
            setState((prev) => ({ 
              ...prev, 
              alreadyLoggedIn: true,
              currentUsername: currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'User'
            }))
          } else {
            // 没有邀请码，直接重定向到首页
            router.push("/")
          }
        }
      } catch (error) {
        // 静默处理错误，允许访问注册页面
        logger.warn({ module: "register", operation: "auth-check" }, "Failed to check auth status", error)
      }
    }
    checkAuthStatus()
  }, [router, state.invitationCode])

  const togglePasswordVisibility = () => {
    setState((prev) => ({ ...prev, isPasswordVisible: !prev.isPasswordVisible }))
  }

  const toggleConfirmPasswordVisibility = () => {
    setState((prev) => ({ ...prev, isConfirmPasswordVisible: !prev.isConfirmPasswordVisible }))
  }

  const validateForm = (): string | null => {
    // Username validation
    if (!state.username.trim()) {
      return "Username is required"
    }
    if (state.username.trim().length < 3) {
      return "Username must be at least 3 characters long"
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(state.username.trim())) {
      return "Username can only contain letters, numbers, hyphens, and underscores"
    }

    // Email validation
    if (!state.email.trim()) {
      return "Email is required"
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(state.email.trim())) {
      return "Please enter a valid email address"
    }

    // Password validation
    if (!state.password) {
      return "Password is required"
    }
    if (state.password.length < 8) {
      return "Password must be at least 8 characters long"
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(state.password)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }

    // Confirm password validation
    if (state.password !== state.confirmPassword) {
      return "Passwords do not match"
    }

    // Terms acceptance
    if (!state.acceptTerms) {
      return "You must accept the Terms of Service and Privacy Policy"
    }

    return null
  }

  const handleSignOut = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }))
      await authOperations.signOut()
      // 重新加载页面以清除状态
      window.location.reload()
    } catch (error) {
      logger.error({ module: "register", operation: "signout" }, "Failed to sign out", error)
      setState((prev) => ({ 
        ...prev, 
        loading: false,
        error: "Failed to sign out. Please try again."
      }))
    }
  }

  const handleRegister = async () => {
    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setState((prev) => ({ ...prev, error: validationError }))
      return
    }

    // 🔒 额外安全检查: 确保没有现有登录状态（双重保险）
    const existingUser = await authOperations.getCurrentUser()
    if (existingUser && !state.invitationCode) {
      setState((prev) => ({ 
        ...prev, 
        error: "请先退出当前账户再注册新账户"
      }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null, success: null }))

    try {
      const { user, error } = await authOperations.signUp(state.email.trim(), state.password, state.username.trim())

      if (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Registration failed. Please try again.",
        }))
        return
      }

      if (user) {
        // 🎁 如果有邀请码，应用它
        if (state.invitationCode) {
          try {
            // 🎯 传递 userId 参数，避免 session 冲突（旧用户登录状态可能仍存在）
            await invitationAPI.applyInvitationCode(state.invitationCode, user.id)
          } catch (inviteError) {
            logger.warn({ module: "register", operation: "apply-invite" }, "Failed to apply invitation code", inviteError)
            // 不中断注册流程，仅记录错误
          }
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          success: "Account created successfully! You can now sign in.",
        }))

        // Redirect to login after a brief delay
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "An unexpected error occurred. Please try again.",
      }))
    }
  }

  const handleSSORegister = (provider: string) => {
    setState((prev) => ({
      ...prev,
      error: `${provider} registration is not implemented yet. Please use email registration.`,
    }))
  }

  const getPasswordStrength = () => {
    const password = state.password
    if (!password) return { strength: 0, label: "", color: "default" }

    let strength = 0
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
      password.length >= 12,
    ]

    strength = checks.filter(Boolean).length

    if (strength <= 2) return { strength, label: "Weak", color: "danger" }
    if (strength <= 4) return { strength, label: "Medium", color: "warning" }
    return { strength, label: "Strong", color: "success" }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        // backgroundImage: 'url(/background_top.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-md">
        <Card className="w-full backdrop-blur-sm bg-content1/95">
          <CardHeader className="flex flex-col gap-4 items-center pb-6">
            {/* Back Button */}
            <div className="w-full flex justify-start mb-2">
              <Button
                as={Link}
                href="/"
                variant="ghost"
                startContent={<ArrowLeft className="w-4 h-4" />}
                className="text-foreground-600 hover:text-foreground"
                size="sm"
              >
              </Button>
            </div>

            {/* Logo */}
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-10 w-auto mb-5"
            />

            {/* Title */}
            <div className="text-center">
              <h1 className="text-3xl font-title text-primary mb-2">{t("authRegister.title")}</h1>
              <p className="text-foreground-600">{t("authRegister.subtitle")}</p>
            </div>
          </CardHeader>

          <CardBody className="space-y-6">
            {/* Already Logged In Warning (with Invitation Code) */}
            {state.alreadyLoggedIn && state.invitationCode ? (
              <div className="space-y-4">
                <Card className="bg-warning/10 border-warning/20">
                  <CardBody className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-warning">
                          {t("authRegister.alreadyLoggedInTitle")}
                        </p>
                        <p className="text-sm text-foreground-600">
                          {t("authRegister.alreadyLoggedInMessage").replace("{username}", state.currentUsername || "User")}
                        </p>
                        <p className="text-sm text-foreground-600">
                          {t("authRegister.signOutToRegister")}
                        </p>
                      </div>
                    </div>
                    <Divider />
                    <div className="flex gap-3">
                      <Button
                        color="warning"
                        variant="flat"
                        onPress={handleSignOut}
                        isLoading={state.loading}
                        className="flex-1"
                      >
                        {t("authRegister.signOutButton")}
                      </Button>
                      <Button
                        as={Link}
                        href="/"
                        variant="light"
                        className="flex-1"
                      >
                        {t("authRegister.backToHome")}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            ) : (
              <>
                {/* Error/Success Messages */}
                {state.error && (
                  <Card className="bg-danger/10 border-danger/20">
                    <CardBody className="p-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
                      <p className="text-sm text-danger">{state.error}</p>
                    </CardBody>
                  </Card>
                )}

                {state.success && (
                  <Card className="bg-success/10 border-success/20">
                    <CardBody className="p-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <p className="text-sm text-success">{state.success}</p>
                    </CardBody>
                  </Card>
                )}

                {/* Registration Form */}
                <div className="space-y-4">
              {/* Username Input */}
              <Input
                label={t("authRegister.usernameLabel")}
                placeholder={t("authRegister.usernamePlaceholder")}
                value={state.username}
                onValueChange={(value) => setState((prev) => ({ ...prev, username: value, error: null }))}
                variant="bordered"
                isDisabled={state.loading}
                startContent={<User className="w-4 h-4 text-foreground-400" />}
                classNames={{
                  inputWrapper: "border-foreground/10 hover:border-foreground/20 focus-within:border-primary",
                }}
                description={t("authRegister.usernameDescription")}
              />

              {/* Email Input */}
              <Input
                label={t("authRegister.emailAddressLabel")}
                placeholder={t("authRegister.emailPlaceholder")}
                type="email"
                value={state.email}
                onValueChange={(value) => setState((prev) => ({ ...prev, email: value, error: null }))}
                variant="bordered"
                isDisabled={state.loading}
                startContent={<Mail className="w-4 h-4 text-foreground-400" />}
                classNames={{
                  inputWrapper: "border-foreground/10 hover:border-foreground/20 focus-within:border-primary",
                }}
              />

              {/* Password Input */}
              <div className="space-y-2">
                <Input
                  label={t("authRegister.passwordLabel")}
                  placeholder={t("authRegister.passwordCreatePlaceholder")}
                  value={state.password}
                  onValueChange={(value) => setState((prev) => ({ ...prev, password: value, error: null }))}
                  variant="bordered"
                  type={state.isPasswordVisible ? "text" : "password"}
                  isDisabled={state.loading}
                  startContent={<Lock className="w-4 h-4 text-foreground-400" />}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={togglePasswordVisibility}
                      disabled={state.loading}
                    >
                      {state.isPasswordVisible ? (
                        <EyeOff className="w-4 h-4 text-foreground-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-foreground-400" />
                      )}
                    </button>
                  }
                  classNames={{
                    inputWrapper: "border-foreground/10 hover:border-foreground/20 focus-within:border-primary",
                  }}
                />

                {/* Password Strength Indicator */}
                {state.password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground-500">{t("authRegister.passwordStrength")}</span>
                      <span className={`text-xs text-${passwordStrength.color}`}>{passwordStrength.label}</span>
                    </div>
                    <div className="w-full bg-foreground/10 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full bg-${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <Input
                label={t("authRegister.confirmPasswordLabel")}
                placeholder={t("authRegister.confirmPasswordPlaceholder")}
                value={state.confirmPassword}
                onValueChange={(value) => setState((prev) => ({ ...prev, confirmPassword: value, error: null }))}
                variant="bordered"
                type={state.isConfirmPasswordVisible ? "text" : "password"}
                isDisabled={state.loading}
                startContent={<Lock className="w-4 h-4 text-foreground-400" />}
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    disabled={state.loading}
                  >
                    {state.isConfirmPasswordVisible ? (
                      <EyeOff className="w-4 h-4 text-foreground-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-foreground-400" />
                    )}
                  </button>
                }
                classNames={{
                  inputWrapper: "border-foreground/10 hover:border-foreground/20 focus-within:border-primary",
                }}
                color={state.confirmPassword && state.password !== state.confirmPassword ? "danger" : "default"}
                errorMessage={
                  state.confirmPassword && state.password !== state.confirmPassword
                    ? "Passwords do not match"
                    : undefined
                }
              />

              {/* Terms and Conditions */}
              <Checkbox
                isSelected={state.acceptTerms}
                onValueChange={(checked) => setState((prev) => ({ ...prev, acceptTerms: checked, error: null }))}
                isDisabled={state.loading}
                size="sm"
              >
                <span className="text-sm text-foreground-600">
                  {t("authRegister.termsPrefix")} {" "}
                  <NextUILink href="#" size="sm" className="text-primary">
                    {t("authRegister.terms")}
                  </NextUILink>{" "}
                  {t("authRegister.and")} {" "}
                  <NextUILink href="#" size="sm" className="text-primary">
                    {t("authRegister.privacy")}
                  </NextUILink>
                </span>
              </Checkbox>
            </div>

            {/* Register Button */}
            <Button
              color="primary"
              size="lg"
              className="w-full font-semibold"
              onPress={handleRegister}
              isLoading={state.loading}
              isDisabled={!state.username.trim() || !state.email.trim() || !state.password || !state.acceptTerms}
            >
              {state.loading ? t("authRegister.creatingAccount") : t("authRegister.createAccount")}
            </Button>

            {/* Login Link */}
            <div className="text-center">
              <span className="text-sm text-foreground-600">{t("authRegister.alreadyHaveAccount")} </span>
              <NextUILink as={Link} href="/login" size="sm" className="text-primary font-medium">
                {t("authRegister.signIn")}
              </NextUILink>
            </div>

            <Divider />

            {/* SSO Registration Options */}
            <div className="space-y-3">
              <p className="text-center text-sm text-foreground-500">{t("authRegister.orRegisterWith")}</p>

              {/* Google SSO */}
              <Button
                variant="bordered"
                size="lg"
                className="w-full border-foreground/10 hover:border-foreground/20"
                isDisabled={state.loading}
                startContent={
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                }
                onPress={() => handleSSORegister("Google")}
              >
                {t("authEx.continueWithGoogle")}
              </Button>

              {/* Social Media Row */}
              <div className="flex gap-3">
                <Button
                  variant="bordered"
                  size="lg"
                  className="flex-1 border-foreground/10 hover:border-foreground/20"
                  isDisabled={state.loading}
                  startContent={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  }
                  onPress={() => handleSSORegister("Twitter")}
                >
                  {t("authRegister.twitter")}
                </Button>

                <Button
                  variant="bordered"
                  size="lg"
                  className="flex-1 border-foreground/10 hover:border-foreground/20"
                  isDisabled={state.loading}
                  startContent={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  }
                  onPress={() => handleSSORegister("Instagram")}
                >
                  {t("authRegister.instagram")}
                </Button>
              </div>
            </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
