"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { useTranslation } from "@/lib/utils/translations";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/use-data-queries";
import { Store } from "@/store";
import { toast } from "@/hooks/use-toast";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Input,
  Select,
  SelectItem,
  Checkbox,
} from "@heroui/react";
import { Sparkles, User, Calendar as CalendarIcon } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker-custom.css";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

// 📅 优化的日期选择器组件 - 使用 react-datepicker
function BirthdayPicker({
  value,
  onChange,
  label,
  description,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
}) {
  const selectedDate = value ? new Date(value) : null;

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      onChange(formattedDate);
    }
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <label className="text-xs font-medium text-foreground-600 mb-1.5 block">
          {label}
        </label>
        <div className="custom-datepicker-wrapper">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            locale={zhCN}
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
            yearDropdownItemNumber={120}
            scrollableYearDropdown
            maxDate={new Date()}
            placeholderText="年-月-日"
            className="w-full h-14 px-4 py-3 rounded-xl bg-content2/50 border border-foreground/20 hover:border-foreground/40 focus:border-primary focus:outline-none text-sm text-foreground transition-colors"
            calendarClassName="custom-calendar"
            wrapperClassName="w-full"
            popperClassName="custom-popper"
            showPopperArrow={false}
          />
        </div>
      </div>
      {description && (
        <p className="text-xs text-foreground-400 px-1">{description}</p>
      )}
    </div>
  );
}

function BirthTimePicker({
  value,
  onChange,
  label,
  description,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
}) {
  const getTimeAsDate = () => {
    if (!value) return null;
    const [hours, minutes] = value.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const selectedTime = getTimeAsDate();

  const handleTimeChange = (date: Date | null) => {
    if (date) {
      const formattedTime = format(date, "HH:mm");
      onChange(formattedTime);
    }
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <label className="text-xs font-medium text-foreground-600 mb-1.5 block">
          {label}
        </label>
        <div className="flex gap-2">
          <div className="custom-datepicker-wrapper flex-1">
            <DatePicker
              selected={selectedTime}
              onChange={handleTimeChange}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="时间"
              dateFormat="HH:mm"
              placeholderText="时:分（可选）"
              className="w-full h-14 px-4 py-3 rounded-xl bg-content2/50 border border-foreground/20 hover:border-foreground/40 focus:border-primary focus:outline-none text-sm text-foreground transition-colors"
              calendarClassName="custom-calendar"
              wrapperClassName="w-full"
              popperClassName="custom-popper"
              showPopperArrow={false}
            />
          </div>
          {value && (
            <Button
              size="lg"
              variant="flat"
              onPress={handleClear}
              className="px-4"
            >
              清除
            </Button>
          )}
        </div>
      </div>
      {description && (
        <p className="text-xs text-foreground-400 px-1">{description}</p>
      )}
    </div>
  );
}

interface PersonalInfoSelectionModalWrapperProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // 可选的自定义完成回调
  onSessionCreated?: (sessionId: string) => void;
  // 可选的默认选中的标签页（用于任务引导，只切换标签不自动创建）
  defaultTab?: string | null;
  // 🎯 是否来自任务引导（创建的session不计入额度）
  fromTask?: boolean;
}

export default function PersonalInfoSelectionModalWrapper({
  isOpen,
  onOpenChange,
  onSessionCreated,
  defaultTab,
  fromTask = false,
}: PersonalInfoSelectionModalWrapperProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionCreationStep, setSessionCreationStep] = useState("");
  
  // Personal form state
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const canSubmit = name.trim().length > 0 && birthDate.trim().length > 0;

  // 🎯 当对话框打开时，自动刷新使用统计数据
  useEffect(() => {
    if (isOpen) {
      const userId = Store.user.userId;
      if (userId) {
        // 🎯 使用 refetchQueries 强制重新获取，不受 staleTime 影响
        queryClient.refetchQueries({
          queryKey: queryKeys.usageStats(userId),
        });
      }
      // Reset form when modal opens
      setIsCreatingSession(false);
      setSessionCreationStep("");
      setName("");
      setBirthDate("");
      setBirthTime("");
      setGender("male");
      setSaveToLibrary(false);
      setIsSubmitting(false);
    }
  }, [isOpen, queryClient]);

  const handlePersonalSubmit = async (data: {
    name: string;
    birthday: string;
    birthtime?: string;
    gender: "male" | "female";
    saveToLibrary: boolean;
  }) => {
    try {
      // 🔧 新版个人算命流程：不创建 basic_bazi，直接创建 session
      // 1. 生成开场白（固定模板 + 动态数据）
      const { generatePersonalGreeting } = await import(
        "@/lib/utils/greeting-generator"
      );
      const greeting = generatePersonalGreeting({
        name: data.name,
        gender: data.gender,
        birthDate: data.birthday,
        birthTime: data.birthtime,
      });

      // 2. 创建会话 - 使用个人算命模式，直接传入 greeting 和用户信息
      // 🎯 重要：把用户信息也传给后端，保存到 session.state 里
      const sessionResponse = await apiClient.createSession({
        mode: "personal",
        title: `个人算命 - ${data.name}`,
        greeting: greeting, // 开场白保存到 events 表
        personal_info: {
          name: data.name,
          gender: data.gender,
          birth_date: data.birthday,
          birth_time: data.birthtime,
        }, // 🎯 用户信息保存到 session.state
        from_task: fromTask,  // 🎯 传递任务标记，避免计入配额
      });

      // 3. 保存到 Store
      Store.session.createAndSwitchSession(
        sessionResponse.data.session_id,
        "personal",
        `个人算命 - ${data.name}`,
        undefined,
        undefined // 不需要 basic_bazi_id
      );

      // 4. 刷新会话列表缓存（usageStats 已在打开对话框时刷新）
      const userId = Store.user.userId;
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.userSessions(userId),
        });
      }

      // 5. 如果有自定义回调就使用，否则默认跳转（greeting 已由后端自动保存）
      if (onSessionCreated) {
        onSessionCreated(sessionResponse.data.session_id);
      } else {
        router.push(`/chat/${sessionResponse.data.session_id}`);
      }
    } catch (error: any) {
      // 🎯 解析配额限制错误并显示给用户
      let errorMessage = t("modes.createPersonalReadingFailed");
      let errorTitle = t("modes.createFailed");
      let variant: "destructive" | "warning" = "destructive";

      // APIError 将错误数据存储在 response 字段中
      // 后端返回格式: { code: 403, message: { code: "USAGE_LIMIT_EXCEEDED", message: "...", ... } }
      const errorDetail = error?.response?.message || error?.response?.detail || error?.detail;

      if (errorDetail) {
        if (errorDetail.code === "USAGE_LIMIT_EXCEEDED") {
          errorTitle = t("modes.usageLimitReached");
          errorMessage = errorDetail.message || errorMessage;
          variant = "warning"; // 🎯 使用醒目的 warning 样式
        } else if (typeof errorDetail === "string") {
          errorMessage = errorDetail;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: variant,
        duration: 8000, // 🎯 显示8秒，让用户有充分时间阅读
      });
    }
  };

  const handlePersonalStart = async () => {
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      setIsCreatingSession(true);
      setSessionCreationStep(t("modes.analyzingInfo"));

      await handlePersonalSubmit({
        name,
        birthday: birthDate,
        birthtime: birthTime || undefined,
        gender,
        saveToLibrary,
      });

      setIsCreatingSession(false);
      setIsSubmitting(false);
      onOpenChange(false);
    } catch (error) {
      console.error("[Modal] Failed:", error);
      setIsCreatingSession(false);
      setIsSubmitting(false);
      setSessionCreationStep("");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="3xl"
      classNames={{
        backdrop: "bg-black/60",
        base: "bg-white text-black border border-gray-200 max-h-[90vh]",
        closeButton: isCreatingSession ? "hidden" : "z-50",
        body: "overflow-y-auto max-h-[calc(90vh-200px)]",
        wrapper: "items-center",
      }}
      // hideCloseButton={true}
      isDismissable={!isCreatingSession}
      hideCloseButton={isCreatingSession}
      scrollBehavior="inside"
    >
      <ModalContent className="max-h-[90vh] flex flex-col">
        {(onClose) => (
          <div className="relative flex flex-col h-full max-h-[90vh] overflow-hidden rounded-2xl p-4 sm:p-6 md:p-10">
            {/* Session Creation Loading Overlay */}
            {isCreatingSession && (
              <div className="absolute inset-0 z-50 bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-xl flex items-center justify-center">
                <div className="text-center space-y-4 sm:space-y-6 md:space-y-8 p-4 sm:p-6 md:p-8 max-w-md mx-auto">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary/20 rounded-full animate-spin">
                      <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1"></div>
                    </div>
                    <div
                      className="absolute w-12 h-12 sm:w-14 sm:h-14 border-3 border-secondary/30 rounded-full animate-spin"
                      style={{
                        animationDirection: "reverse",
                        animationDuration: "2s",
                      }}
                    >
                      <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-secondary rounded-full transform -translate-x-1/2 -translate-y-0.5"></div>
                    </div>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse shadow-lg shadow-primary/50"></div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {sessionCreationStep || t("modes.creatingSession")}
                    </h3>

                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-center gap-2 sm:gap-3 text-foreground-600">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse shadow-sm"></div>
                          <span className="text-xs sm:text-sm font-medium">
                            {t("modes.initializingAI")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 text-foreground-600">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r from-primary/70 to-secondary/70 animate-pulse delay-300 shadow-sm"></div>
                          <span className="text-xs sm:text-sm font-medium">
                            {t("modes.creatingSession")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 text-foreground-600">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r from-primary/50 to-secondary/50 animate-pulse delay-500 shadow-sm"></div>
                          <span className="text-xs sm:text-sm font-medium">
                            {t("modes.sessionComplete")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-xs sm:text-sm text-foreground-500 font-light">
                        {t("modes.preparingReading")}
                      </p>
                    </div>
                  </div>

                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-primary/30 rounded-full animate-ping delay-1000"></div>
                    <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-secondary/30 rounded-full animate-ping delay-1500"></div>
                    <div className="absolute top-1/2 left-1/6 w-0.5 h-0.5 bg-primary/40 rounded-full animate-ping delay-2000"></div>
                    <div className="absolute top-1/3 right-1/6 w-0.5 h-0.5 bg-secondary/40 rounded-full animate-ping delay-2500"></div>
                  </div>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-[url('/charactor_create_modal/background-modal.png')] bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none" />
            <ModalHeader className="relative z-10 flex-shrink-0 flex flex-col gap-1 items-center text-center px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-semibold">{t("modes.personalReadingTitle")}</div>
              <div className="text-sm sm:text-md text-gray-500">{t("modes.personalReadingSubtitle")}</div>
            </ModalHeader>
            <ModalBody className="relative z-10 flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-4 py-2 pb-4">
                {/* Form */}
                <div className="space-y-4">
                  {/* Identity Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-foreground-600">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">
                          {t("modes.personalInfoSection")}
                        </span>
                        <p className="text-xs text-foreground-400">
                          {t("modes.personalInfoSectionDesc")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 pl-6">
                      <Input
                        label={t("modes.fullName")}
                        placeholder={t("modes.enterYourName")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        variant="bordered"
                        classNames={{
                          inputWrapper:
                            "bg-content2/50 border-foreground/20 hover:border-foreground/40",
                        }}
                      />
                      <Select
                        label={t("modes.gender")}
                        placeholder={t("modes.selectGender")}
                        selectedKeys={new Set([gender])}
                        onSelectionChange={(keys) =>
                          setGender(Array.from(keys)[0] as any)
                        }
                        variant="bordered"
                        classNames={{
                          trigger:
                            "bg-content2/50 border-foreground/20 hover:border-foreground/40",
                        }}
                      >
                        <SelectItem key="male">
                          {t("modes.male")}
                        </SelectItem>
                        <SelectItem key="female">
                          {t("modes.female")}
                        </SelectItem>
                      </Select>
                    </div>
                  </div>

                  {/* 分隔线 */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-foreground/10"></div>
                    </div>
                  </div>

                  {/* Birth Information Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-foreground-600">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10">
                        <CalendarIcon className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">
                          {t("modes.birthInfoSection")}
                        </span>
                        <p className="text-xs text-foreground-400">
                          {t("modes.birthInfoSectionDesc")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 pl-6">
                      <BirthdayPicker
                        label={t("modes.birthDate")}
                        value={birthDate}
                        onChange={setBirthDate}
                        description={t("modes.birthDateDesc")}
                      />
                      <BirthTimePicker
                        label={t("modes.birthTime")}
                        value={birthTime}
                        onChange={setBirthTime}
                        description={t("modes.birthTimeDesc")}
                      />
                    </div>
                  </div>

                  {/* 分隔线 */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-foreground/10"></div>
                    </div>
                  </div>

                  {/* Save to Library Option */}
                  <div className="space-y-3">
                    <div className="bg-content2/30 rounded-xl p-4 border border-foreground/10">
                      <Checkbox
                        isSelected={saveToLibrary}
                        onValueChange={setSaveToLibrary}
                        classNames={{
                          label: "text-sm text-foreground-600",
                        }}
                      >
                        <div>
                          <span className="font-medium">
                            {t("modes.saveToLibrary")}
                          </span>
                          <p className="text-xs text-foreground-400 mt-0.5">
                            {t("modes.saveToLibraryDesc")}
                          </p>
                        </div>
                      </Checkbox>
                    </div>

                    {/* 提示信息卡片 */}
                    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-4 border border-primary/10">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-base">✨</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-sm font-medium text-foreground">
                            {t("modes.readyToStartTitle")}
                          </h4>
                          <p className="text-xs text-foreground-500 leading-relaxed">
                            {t("modes.readyToStartDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-foreground/10 pb-10">
                  <Button
                    color="primary"
                    size="lg"
                    fullWidth
                    isDisabled={!canSubmit || isSubmitting}
                    isLoading={isSubmitting}
                    onPress={handlePersonalStart}
                    startContent={
                      !isSubmitting && <Sparkles className="w-5 h-5" />
                    }
                    className="bg-gradient-to-r from-primary to-secondary text-white font-medium"
                  >
                    {isSubmitting
                      ? t("modes.preparingYourReading")
                      : t("modes.beginPersonalReading")}
                  </Button>
                </div>
              </div>
            </ModalBody>
            {/* <ModalFooter className="relative z-10">
              <Button variant="bordered" onPress={() => onOpenChange(false)}>取消</Button>
              <Button color="primary" isDisabled={!selectedKey} onPress={() => selectedKey && handleModeSelect(selectedKey)}>继续</Button>
            </ModalFooter> */}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
