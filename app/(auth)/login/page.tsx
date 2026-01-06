"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardBody, Input, Button, Link, Divider, CardHeader } from "@heroui/react"
import { Eye, EyeOff, Mail, Lock, Github, ArrowLeft } from "lucide-react"
import { authOperations } from "@/lib/supabase/auth"
import { useTranslation } from "@/lib/utils/translations"
import { logger } from "@/lib/utils/logger"
import { invitationAPI } from "@/lib/api/client"
import { useAppGlobal } from "@/lib/context/GlobalContext"

interface LoginState {
  email: string
  password: string
  isVisible: boolean
  isLoading: boolean
  error: string | null
}

export default function LoginPage() {
  const router = useRouter()
  const { t } = useTranslation();
  const { user } = useAppGlobal();
  const [state, setState] = useState<LoginState>({
    email: "",
    password: "",
    isVisible: false,
    isLoading: false,
    error: null,
  })

  // 🔒 检查用户是否已登录，如果是则重定向到首页
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (user) {
          router.push("/")
        }
      } catch (error) {
        // 静默处理错误，允许访问登录页面
        logger.warn({ module: "login", operation: "auth-check" }, "Failed to check auth status", error)
      }
    }
    checkAuthStatus()
  }, [router])

  const handleInputChange = (field: keyof LoginState, value: string | boolean) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
      error: null, // Clear error when user starts typing
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!state.email.trim() || !state.password) {
      setState((prev) => ({ ...prev, error: t("authEx.errorMissingCredentials") }))
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const { user, error } = await authOperations.signIn(state.email.trim(), state.password)

      if (error) {
        logger.error({ module: "login", operation: "handleSubmit", error }, "Login failed")
        setState((prev) => ({
          ...prev,
          error: error.message || t("authEx.errorSignInFailed"),
          isLoading: false,
        }))
        return
      }

      if (user) {
        // 🎁 异步处理首次登录奖励（不阻塞登录流程）
        invitationAPI.processFirstLoginReward()
          .catch((error) => {
            // 静默失败，不影响登录体验
            logger.warn({ module: "login", operation: "first-login-reward" }, "Failed to process first login reward", error)
          })

        router.push("/")
      }
    } catch (error) {
      logger.error({ module: "login", operation: "handleSubmit", error }, "Unexpected login error")
      setState((prev) => ({
        ...prev,
        error: t("authEx.errorUnexpected"),
        isLoading: false,
      }))
    }
  }

  const toggleVisibility = () => {
    setState((prev) => ({ ...prev, isVisible: !prev.isVisible }))
  }

  return (
    <div
      className="h-screen w-full flex items-center justify-center p-4"
      style={{
        // backgroundImage: 'url(/background_top.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat'
      }}
    >

      <Card className="w-full max-w-md backdrop-blur-sm bg-content1/95 border border-foreground/5">
        <CardHeader>
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
              {t("authRegister.backToHome")}
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            {/* Logo */}
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-10 w-auto mx-auto mb-2"
            />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold border-foreground">{t("authLogin.welcomeBack")}</h1>
              <p className="border-foreground/60">{t("authLogin.signInToYourAccount")}</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <Input
              type="email"
              label={t("authEx.emailLabel")}
              placeholder={t("authEx.emailPlaceholder")}
              value={state.email}
              onValueChange={(value) => handleInputChange("email", value)}
              startContent={<Mail className="w-4 h-4 border-foreground/40" />}
              classNames={{
                // input: "text-black",
                // label: "text-white/60",
                // inputWrapper: "bg-content2 border-white/10 hover:border-white/20 focus-within:border-primary",
              }}
              isRequired
            />

            {/* Password Input */}
            <Input
              type={state.isVisible ? "text" : "password"}
              label={t("authEx.passwordLabel")}
              placeholder={t("authEx.passwordPlaceholder")}
              value={state.password}
              onValueChange={(value) => handleInputChange("password", value)}
              startContent={<Lock className="w-4 h-4 border-foreground/10" />}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility}
                  aria-label={t("aria.togglePasswordVisibility")}
                >
                  {state.isVisible ? (
                    <EyeOff className="w-4 h-4 border-foreground/10" />
                  ) : (
                    <Eye className="w-4 h-4 border-foreground/10" />
                  )}
                </button>
              }
              classNames={{
                // input: "text-white",
                // label: "text-white/60",
                // inputWrapper: "bg-content2 border-white/10 hover:border-white/20 focus-within:border-primary",
              }}
              isRequired
            />

            {/* Error Message */}
            {state.error && (
              <div className="text-danger text-sm text-center bg-danger/10 p-3 rounded-lg border border-danger/20">
                {state.error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              color="primary"
              size="lg"
              className="w-full font-semibold"
              isLoading={state.isLoading}
              disabled={state.isLoading}
            >
              {state.isLoading ? t("authLogin.signingIn") : t("authLogin.signIn")}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <Divider className="bg-white/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-content1 px-3 text-white/40 text-sm">{t("authLogin.or")}</span>
            </div>
          </div>

          {/* Social Login */}
          <Button
            variant="bordered"
            size="lg"
            className="w-full border-foreground/10 hover:border-foreground/20"
            startContent={<Github className="w-4 h-4" />}
          >
            {t("authLogin.continueWithGitHub")}
          </Button>

          {/* Footer Links */}
          <div className="text-center space-y-2">
            <Link href="/restore-password" className="text-primary text-sm hover:underline">
              {t("authLogin.forgotYourPassword")}
            </Link>
            <div className="text-white/60 text-sm">
              {t("authLogin.dontHaveAccount")} {" "}
              <Link href="/register" className="text-primary hover:underline">
                {t("authLogin.signUp")}
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
