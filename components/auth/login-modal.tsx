"use client"

import { Modal, ModalContent, ModalHeader, ModalBody, Button, Input, Divider } from "@heroui/react"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "@/lib/utils/translations"
import { authOperations } from "@/lib/supabase/auth"

interface LoginModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSignUpClick?: () => void
  onForgotPasswordClick?: () => void
}

export default function LoginModal({ isOpen, onOpenChange, onSignUpClick, onForgotPasswordClick }: LoginModalProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t("authEx.errorMissingCredentials"))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { user, error: authError } = await authOperations.signIn(email.trim(), password)

      if (authError) {
        setError(authError.message || t("authEx.errorSignInFailed"))
        return
      }

      if (user) {
        // Clear form
        setEmail("")
        setPassword("")
        setError(null)
        // Close modal
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Login error:", error)
      setError(t("authEx.errorUnexpected"))
    } finally {
      setLoading(false)
    }
  }

  const handleSSOLogin = (provider: string) => {
    setError(`${provider} login is not implemented yet`)
    // TODO: Implement SSO login with Supabase
  }

  const handleModalClose = () => {
    // Clear form when modal closes
    setEmail("")
    setPassword("")
    setError(null)
    setIsPasswordVisible(false)
    onOpenChange(false)
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={handleModalClose} placement="center" size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 items-center pb-2">
              {/* Logo */}
              <img
                src="/logo.svg"
                alt="Logo"
                className="h-10 w-auto mb-5"
              />

              {/* Welcome Text */}
              <h2 className="text-3xl text-primary font-title">{t("authEx.welcomeBack")}</h2>
              <p className="text-sm text-foreground/25">{t("authEx.tagline")}</p>
            </ModalHeader>

            <ModalBody className="py-6">
              <div className="space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
                    <p className="text-danger text-sm">{error}</p>
                  </div>
                )}

                {/* Username/Email Input */}
                <Input
                  label={t("authEx.emailLabel")}
                  // placeholder={t("authEx.emailPlaceholder")}
                  type="email"
                  value={email}
                  onValueChange={setEmail}
                  variant="bordered"
                  isDisabled={loading}
                  classNames={{
                    inputWrapper: "border-foreground/10 hover:border-foreground/20 focus-within:border-primary",
                  }}
                />

                {/* Password Input */}
                <Input
                  label={t("authEx.passwordLabel")}
                  // placeholder={t("authEx.passwordPlaceholder")}
                  value={password}
                  onValueChange={setPassword}
                  variant="bordered"
                  type={isPasswordVisible ? "text" : "password"}
                  isDisabled={loading}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={togglePasswordVisibility}
                      disabled={loading}
                    >
                      {isPasswordVisible ? (
                        <EyeOff className="w-4 h-4 text-foreground-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-foreground-400" />
                      )}
                    </button>
                  }
                  classNames={{
                    inputWrapper: "border-foreground/10 hover:border-foreground/20 focus-within:border-primary",
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !loading) {
                      handleLogin()
                    }
                  }}
                />

                {/* Login Button */}
                <Button
                  color="primary"
                  size="lg"
                  className="w-full font-semibold"
                  endContent={<ArrowLeft className="w-4 h-4" />}
                  onPress={handleLogin}
                  isLoading={loading}
                  isDisabled={!email.trim() || !password.trim()}
                >
                  {loading ? t("authEx.signingIn") : t("authEx.userLogin")}
                </Button>

                {/* Account Links */}
                <div className="flex justify-between items-center text-sm pt-2">
                  <button
                    onClick={onSignUpClick}
                    className="text-foreground/60 hover:text-primary transition-colors"
                    disabled={loading}
                  >
                    {t("authEx.noAccount")} <span className="text-primary">{t("authEx.signUp")}</span>
                  </button>
                  <button
                    onClick={onForgotPasswordClick}
                    className="text-foreground/60 hover:text-primary transition-colors"
                    disabled={loading}
                  >
                    {t("authEx.forgotPassword")}
                  </button>
                </div>

                <Divider className="my-6" />

                {/* SSO Buttons */}
                <div className="space-y-3">
                  {/* Google SSO */}
                  <Button
                    variant="bordered"
                    size="lg"
                    className="w-full border-foreground/10 hover:border-foreground/20"
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
                    onPress={() => handleSSOLogin("Google")}
                    isDisabled={loading}
                  >
                    {t("authEx.continueWithGoogle")}
                  </Button>

                  {/* Twitter SSO */}
                  <Button
                    variant="bordered"
                    size="lg"
                    className="w-full border-foreground/10 hover:border-foreground/20"
                    startContent={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    }
                    onPress={() => handleSSOLogin("Twitter")}
                    isDisabled={loading}
                  >
                    {t("authEx.continueWithTwitter")}
                  </Button>

                  {/* TikTok and Instagram SSO Row */}
                  <div className="flex gap-3">
                    <Button
                      variant="bordered"
                      size="lg"
                      className="flex-1 border-foreground/10 hover:border-foreground/20"
                      startContent={
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                        </svg>
                      }
                      onPress={() => handleSSOLogin("TikTok")}
                      isDisabled={loading}
                    >
                      {t("authEx.tiktok")}
                    </Button>

                    <Button
                      variant="bordered"
                      size="lg"
                      className="flex-1 border-foreground/10 hover:border-foreground/20"
                      startContent={
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      }
                      onPress={() => handleSSOLogin("Instagram")}
                      isDisabled={loading}
                    >
                      {t("authEx.instagram")}
                    </Button>
                  </div>
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
