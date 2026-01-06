"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardBody, CardHeader, Input, Button, Divider, Link as NextUILink } from "@heroui/react"
import { ArrowLeft, Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle, Send } from "lucide-react"
import Link from "next/link"
import { authOperations } from "@/lib/supabase/auth"
import { useTranslation } from "@/lib/utils/translations"

interface RestorePasswordState {
  step: 'request' | 'sent' | 'reset'
  email: string
  password: string
  confirmPassword: string
  isPasswordVisible: boolean
  isConfirmPasswordVisible: boolean
  loading: boolean
  error: string | null
  success: string | null
}

export default function RestorePasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [state, setState] = useState<RestorePasswordState>({
    step: 'request',
    email: '',
    password: '',
    confirmPassword: '',
    isPasswordVisible: false,
    isConfirmPasswordVisible: false,
    loading: false,
    error: null,
    success: null
  })

  useEffect(() => {
    // Check if user came from password reset email link
    const access_token = searchParams.get('access_token')
    const refresh_token = searchParams.get('refresh_token')
    const type = searchParams.get('type')

    if (access_token && refresh_token && type === 'recovery') {
      setState(prev => ({ ...prev, step: 'reset' }))
    }
  }, [searchParams])

  const togglePasswordVisibility = () => {
    setState(prev => ({ ...prev, isPasswordVisible: !prev.isPasswordVisible }))
  }

  const toggleConfirmPasswordVisibility = () => {
    setState(prev => ({ ...prev, isConfirmPasswordVisible: !prev.isConfirmPasswordVisible }))
  }

  const handleRequestReset = async () => {
    if (!state.email.trim()) {
      setState(prev => ({ ...prev, error: t("authEx.errorMissingCredentials") }))
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(state.email.trim())) {
      setState(prev => ({ ...prev, error: "Please enter a valid email address" }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { error } = await authOperations.resetPassword(state.email.trim())

      if (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || t("authEx.errorUnexpected")
        }))
        return
      }

      setState(prev => ({
        ...prev,
        loading: false,
        step: 'sent',
        success: "Password reset email sent successfully!"
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: t("authEx.errorUnexpected")
      }))
    }
  }

  const handlePasswordReset = async () => {
    // Validate passwords
    if (!state.password) {
      setState(prev => ({ ...prev, error: t("authEx.errorMissingCredentials") }))
      return
    }

    if (state.password.length < 8) {
      setState(prev => ({ ...prev, error: "Password must be at least 8 characters long" }))
      return
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(state.password)) {
      setState(prev => ({ 
        ...prev, 
        error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" 
      }))
      return
    }

    if (state.password !== state.confirmPassword) {
      setState(prev => ({ ...prev, error: "Passwords do not match" }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { error } = await authOperations.updatePassword(state.password)

      if (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || t("authEx.errorUnexpected")
        }))
        return
      }

      setState(prev => ({
        ...prev,
        loading: false,
        success: "Password updated successfully! Redirecting to login..."
      }))

      // Redirect to login after success
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: t("authEx.errorUnexpected")
      }))
    }
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

  const renderRequestStep = () => (
    <>
      <CardHeader className="flex flex-col gap-4 items-center pb-6">
        {/* Back Button */}
        <div className="w-full flex justify-start mb-2">
          <Button
            as={Link}
            href="/login"
            variant="ghost"
            startContent={<ArrowLeft className="w-4 h-4" />}
            className="text-foreground-600 hover:text-foreground"
            size="sm"
          >
            {t("authReset.backToLogin")}
          </Button>
        </div>

        {/* Logo */}
        <img
          src="/logo.svg"
          alt="Logo"
          className="h-10 w-auto mb-2"
        />

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-title text-primary mb-2">{t("authReset.resetPassword")}</h1>
          <p className="text-foreground-600">{t("authReset.resetPasswordDesc")}</p>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Error Message */}
        {state.error && (
          <Card className="bg-danger/10 border-danger/20">
            <CardBody className="p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
              <p className="text-sm text-danger">{state.error}</p>
            </CardBody>
          </Card>
        )}

        {/* Email Input */}
        <Input
          label={t("authRegister.emailAddressLabel")}
          placeholder={t("authRegister.emailPlaceholder")}
          type="email"
          value={state.email}
          onValueChange={(value) => setState(prev => ({ ...prev, email: value, error: null }))}
          variant="bordered"
          isDisabled={state.loading}
          startContent={<Mail className="w-4 h-4 text-foreground-400" />}
          classNames={{
            inputWrapper: "border-foreground/10 hover:border-foreground/20 focus-within:border-primary",
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !state.loading) {
              handleRequestReset()
            }
          }}
        />

        {/* Reset Button */}
        <Button
          color="primary"
          size="lg"
          className="w-full font-semibold"
          onPress={handleRequestReset}
          isLoading={state.loading}
          isDisabled={!state.email.trim()}
          startContent={!state.loading && <Send className="w-4 h-4" />}
        >
          {state.loading ? t("authReset.sendingResetLink") : t("authReset.sendResetLink")}
        </Button>

        {/* Login Link */}
        <div className="text-center">
          <span className="text-sm text-foreground-600">{t("authReset.rememberPassword")} </span>
          <NextUILink as={Link} href="/login" size="sm" className="text-primary font-medium">
            {t("authRegister.signIn")}
          </NextUILink>
        </div>
      </CardBody>
    </>
  )

  const renderSentStep = () => (
    <>
      <CardHeader className="flex flex-col gap-4 items-center pb-6">
        {/* Logo */}
        <img
          src="/logo.svg"
          alt="Logo"
          className="h-10 w-auto mb-2"
        />

        {/* Success Icon */}
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-2">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-title text-primary mb-2">{t("authReset.checkYourEmail")}</h1>
          <p className="text-foreground-600">{t("authReset.weSentResetLinkTo")}</p>
          <p className="text-primary font-semibold">{state.email}</p>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Success Message */}
        {state.success && (
          <Card className="bg-success/10 border-success/20">
            <CardBody className="p-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <p className="text-sm text-success">{state.success}</p>
            </CardBody>
          </Card>
        )}

        {/* Instructions */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-foreground-600">
              Click the link in your email to reset your password.
            </p>
            <p className="text-foreground-500 text-sm">
              If you don't see the email, check your spam folder.
            </p>
          </div>

          {/* Resend Button */}
          <Button
            variant="bordered"
            color="primary"
            onPress={() => setState(prev => ({ ...prev, step: 'request', success: null }))}
          >
            {t("authReset.resendEmail")}
          </Button>
        </div>

        <Divider />

        {/* Login Link */}
        <div className="text-center">
          <NextUILink as={Link} href="/login" size="sm" className="text-primary font-medium">
            {t("authReset.backToLogin")}
          </NextUILink>
        </div>
      </CardBody>
    </>
  )

  const renderResetStep = () => (
    <>
      <CardHeader className="flex flex-col gap-4 items-center pb-6">
        {/* Logo */}
        <img
          src="/logo.svg"
          alt="Logo"
          className="h-10 w-auto mb-2"
        />

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-title text-primary mb-2">{t("authReset.setNewPassword")}</h1>
          <p className="text-foreground-600">{t("authReset.setNewPasswordDesc")}</p>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
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

        {/* Password Input */}
        <div className="space-y-2">
          <Input
            label={t("authReset.newPasswordLabel")}
            placeholder={t("authRegister.passwordCreatePlaceholder")}
            value={state.password}
            onValueChange={(value) => setState(prev => ({ ...prev, password: value, error: null }))}
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
          label={t("authReset.confirmNewPasswordLabel")}
          placeholder={t("authRegister.confirmPasswordPlaceholder")}
          value={state.confirmPassword}
          onValueChange={(value) => setState(prev => ({ ...prev, confirmPassword: value, error: null }))}
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
          onKeyPress={(e) => {
            if (e.key === "Enter" && !state.loading) {
              handlePasswordReset()
            }
          }}
        />

        {/* Update Password Button */}
        <Button
          color="primary"
          size="lg"
          className="w-full font-semibold"
          onPress={handlePasswordReset}
          isLoading={state.loading}
          isDisabled={!state.password || !state.confirmPassword || state.password !== state.confirmPassword}
        >
          {state.loading ? t("authReset.updatingPassword") : t("authReset.updatePassword")}
        </Button>
      </CardBody>
    </>
  )

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
          {state.step === 'request' && renderRequestStep()}
          {state.step === 'sent' && renderSentStep()}
          {state.step === 'reset' && renderResetStep()}
        </Card>
      </div>
    </div>
  )
}