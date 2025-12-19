"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Card,
  CardBody,
  Tabs,
  Tab,
  Input,
  Select,
  SelectItem,
  Checkbox,
} from "@heroui/react";
import { Sparkles, User, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/utils/translations";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker-custom.css";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useUsageStatsQuery } from "@/hooks/use-data-queries";
import { Store } from "@/store";
import SubscriptionModal from "@/components/subscription/subscription-modal";

interface PersonalFormData {
  name: string;
  birthday: string;
  birthtime?: string;
  gender: "male" | "female";
  saveToLibrary: boolean;
}

interface ModeSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onModeSelect: (mode: string) => void;
  onPersonalSubmit?: (data: PersonalFormData) => void;
  defaultTab?: string; // 可选的默认选中标签页
}

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

// ⏰ 优化的时间选择器组件 - 使用 react-datepicker 的时间选择
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
  // 将 "HH:MM" 转换为 Date 对象
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

export default function ModeSelectionModal({
  isOpen,
  onOpenChange,
  onModeSelect,
  onPersonalSubmit,
  defaultTab,
}: ModeSelectionModalProps) {
  const { t } = useTranslation();
  const userId = Store.user.userId;
  const { data: stats } = useUsageStatsQuery(userId); // 🎯 获取配额信息（使用 React Query）

  // 🎯 初始化时就使用 defaultTab（如果提供）
  const [activeTab, setActiveTab] = useState<string>(() => {
    return defaultTab || "modes";
  });

  // 🎯 当对话框打开或 defaultTab 改变时，更新活动标签页
  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    } else if (isOpen && !defaultTab) {
      setActiveTab("modes");
    }
  }, [defaultTab, isOpen]);

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionCreationStep, setSessionCreationStep] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false); // 🎯 控制升级对话框

  useEffect(() => {
    if (isOpen) {
      setIsCreatingSession(false);
      setSessionCreationStep("");
      // 🎯 不要在这里重置 activeTab，它由上面的 useEffect 根据 defaultTab 控制
      // setActiveTab("modes");  // ❌ 移除这行，避免覆盖 defaultTab 的设置
      setName("");
      setBirthDate("");
      setBirthTime("");
      setGender("male");
      setSaveToLibrary(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const modes = [
    {
      key: "create_character_real_custom",
      title: t("modes.realCustomTitle"),
      subtitle: t("modes.realCustomSubtitle"),
      description: t("modes.realCustomDesc"),
      iconPath: "/types/real_custom.svg",
    },
    {
      key: "create_character_real_guess",
      title: t("modes.realGuessTitle"),
      subtitle: t("modes.realGuessSubtitle"),
      description: t("modes.realGuessDesc"),
      iconPath: "/types/real_guess.svg",
    },
    {
      key: "create_character_virtual_custom",
      title: t("modes.virtualCustomTitle"),
      subtitle: t("modes.virtualCustomSubtitle"),
      description: t("modes.virtualCustomDesc"),
      iconPath: "/types/virtual_custom.svg",
    },
    {
      key: "create_character_virtual_search_or_guess",
      title: t("modes.virtualGuessTitle"),
      subtitle: t("modes.virtualGuessSubtitle"),
      description: t("modes.virtualGuessDesc"),
      iconPath: "/types/virtual_guess.svg",
    },
  ];

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && birthDate.trim().length > 0;

  const handleModeSelectWrapper = async (mode: string) => {
    setIsCreatingSession(true);
    setSessionCreationStep(t("modes.initializingAI"));

    try {
      await onModeSelect(mode);
      setIsCreatingSession(false);
      onOpenChange(false);
    } catch (error) {
      console.error("[Modal] Failed:", error);
      setIsCreatingSession(false);
      setSessionCreationStep("");
    }
  };

  const handlePersonalStart = async () => {
    if (!onPersonalSubmit) return;
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      setIsCreatingSession(true);
      setSessionCreationStep(t("modes.analyzingInfo"));

      await onPersonalSubmit({
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
    <>
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="5xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-black/70 backdrop-blur-lg",
        base: "bg-content1/95 backdrop-blur-xl border border-foreground/10",
        closeButton: isCreatingSession ? "hidden" : "z-50",
      }}
      isDismissable={!isCreatingSession}
      hideCloseButton={isCreatingSession}
    >
      <ModalContent className="overflow-hidden">
        {(onClose) => (
          <>
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Session Creation Loading Overlay */}
            {isCreatingSession && (
              <div className="absolute inset-0 z-50 bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-xl flex items-center justify-center">
                <div className="text-center space-y-8 p-8 max-w-md mx-auto">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-20 h-20 border-4 border-primary/20 rounded-full animate-spin">
                      <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1"></div>
                    </div>
                    <div
                      className="absolute w-14 h-14 border-3 border-secondary/30 rounded-full animate-spin"
                      style={{
                        animationDirection: "reverse",
                        animationDuration: "2s",
                      }}
                    >
                      <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-secondary rounded-full transform -translate-x-1/2 -translate-y-0.5"></div>
                    </div>
                    <div className="w-4 h-4 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse shadow-lg shadow-primary/50"></div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {sessionCreationStep || t("modes.creatingSession")}
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3 text-foreground-600">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse shadow-sm"></div>
                          <span className="text-sm font-medium">
                            {t("modes.initializingAI")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-3 text-foreground-600">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary/70 to-secondary/70 animate-pulse delay-300 shadow-sm"></div>
                          <span className="text-sm font-medium">
                            {t("modes.creatingSession")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-3 text-foreground-600">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary/50 to-secondary/50 animate-pulse delay-500 shadow-sm"></div>
                          <span className="text-sm font-medium">
                            {t("modes.sessionComplete")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-foreground-500 font-light">
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

            {/* Header */}
            <ModalHeader className="flex flex-col gap-2 text-center relative">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "url(/background_top.svg)",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold text-primary drop-shadow-lg [text-shadow:0_0_30px_theme(colors.primary/0.5)]">
                  {t("modes.chooseMode")}
                </h2>
                <p className="text-sm text-foreground-500 mt-2">
                  {t("modes.modeSubtitle")}
                </p>
                
                {/* 🎯 配额显示 - 只显示角色库容量 */}
                {stats && (
                  <div className="mt-3 flex gap-2">
                    
                    {/* 角色库容量 - 所有用户都显示（免费5个，付费15个，有邀请奖励可能更多）*/}
                    {(() => {
                      const count = stats.character_count || 0;
                      const limit = stats.limits?.character_max || 5;  // 🎯 从数据库获取限制（包含邀请奖励）
                      
                      // 🔧 如果是无限制（-1），不显示此卡片
                      if (limit === -1) return null;
                      
                      const isNearLimit = count >= limit - 1;
                      const isAtLimit = count >= limit;
                      
                      return (
                        <div 
                          className={`
                            flex-1 px-3 py-1.5 rounded-lg shadow-md transition-all duration-300
                            ${isAtLimit 
                              ? 'bg-gradient-to-br from-danger-50 to-danger-100 border-2 border-danger-400 animate-pulse' 
                              : isNearLimit
                                ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-400'
                                : 'bg-gradient-to-br from-primary-50/80 to-primary-100/60 border border-primary-300'
                            }
                          `}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <User className={`w-3.5 h-3.5 ${isAtLimit ? 'text-danger-600' : 'text-primary-600'}`} />
                            <span className={`text-xs font-semibold ${isAtLimit ? 'text-danger-700' : 'text-primary-700'}`}>
                              {t("modes.characterLibraryCapacity")}
                            </span>
                          </div>
                          <div className={`text-2xl font-bold ${isAtLimit ? 'text-danger-600' : 'text-primary-700'}`}>
                            {count} / {limit}
                          </div>
                          <p className={`text-xs mt-0.5 ${isAtLimit ? 'text-danger-600 font-medium' : 'text-primary-600'}`}>
                            {isAtLimit ? t("modes.libraryFull") : isNearLimit ? t("modes.nearLimit") : t("modes.totalLimit")}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </ModalHeader>

            {/* Body */}
            <ModalBody className="overflow-visible">
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(String(key))}
                aria-label="Mode selection tabs"
                className="w-full h-full flex flex-col [&_*]:!transition-none [&_*]:!duration-0"
                classNames={{
                  tabList: "flex-shrink-0 mb-4",
                  tabContent: "flex-1 !transition-none !duration-0",
                  panel:
                    "h-full max-h-[calc(85vh-200px)] overflow-y-auto !transition-none !duration-0 pr-2 pb-6",
                }}
                motionProps={{
                  variants: {},
                  transition: { duration: 0 },
                  animate: false,
                  initial: false,
                }}
              >
                <Tab key="modes" title={t("modes.modesTab")}>
                  <div className="space-y-4 h-full overflow-y-auto">
                    <p className="text-center text-foreground-600 text-sm">
                      {t("modes.selectType")}
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {modes.map((mode) => (
                        <Card
                          key={mode.key}
                          isPressable
                          onPress={() => handleModeSelectWrapper(mode.key)}
                          className="group relative bg-content2 border border-foreground/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300 rounded-2xl h-[280px]"
                        >
                          <CardBody className="p-4 flex flex-col items-center text-center gap-2 overflow-hidden h-full">
                            <div className="relative w-16 h-16 flex items-center justify-center mt-4 mb-2">
                              <Image
                                src={mode.iconPath}
                                alt={mode.title}
                                width={64}
                                height={64}
                                className="drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>

                            <div className="flex flex-col gap-3 h-full justify-between">
                              <div className="font-bold text-lg text-primary group-hover:text-primary transition-colors duration-200">
                                {mode.title}
                              </div>
                              <div className="text-xs text-foreground-500 leading-relaxed flex-1 flex items-center">
                                {mode.description}
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                    
                    {/* 🎯 升级提示横幅 - 放置在模式卡片下方 */}
                    {stats && !stats.is_premium && (
                      (() => {
                        const characterCount = stats.character_count || 0;
                        const characterLimit = stats.limits?.character_max || 5;
                        const isCharacterAtLimit = characterCount >= characterLimit;
                        
                        if (!isCharacterAtLimit) return null;
                        
                        return (
                          <div className="mt-4 p-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl shadow-xl animate-pulse-slow">
                            <div className="flex items-center gap-3 text-white">
                              <div className="p-2 bg-white/20 rounded-lg">
                                <Sparkles className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg">{t("modes.upgradeToUnlock")}</h3>
                                <p className="text-sm text-white/90 mt-0.5">
                                  {t("modes.libraryFullDesc")}
                                  {t("modes.upgradeForUnlimited")}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                className="bg-white text-primary-600 font-bold hover:bg-white/90 shadow-lg"
                                onPress={() => setShowUpgradeModal(true)}
                              >
                                {t("modes.upgradeNow")}
                              </Button>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </Tab>
                <Tab key="personal" title={t("modes.personalTab")}>
                  <div className="space-y-4 py-2 pb-4">
                    {/* 装饰性顶部卡片 */}
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
                              请填写您的基本信息
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
                            <SelectItem key="male" value="male">
                              {t("modes.male")}
                            </SelectItem>
                            <SelectItem key="female" value="female">
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

                      {/* Birth Information Section - 使用新的选择器 */}
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
                              选择您的出生日期和时间
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
                                将此档案保存到我的资料库以供将来使用
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
                                准备开始您的命理之旅
                              </h4>
                              <p className="text-xs text-foreground-500 leading-relaxed">
                                我们将根据您的出生信息，生成专属的八字命盘，并提供详细的命理分析报告。
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
                </Tab>
              </Tabs>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
    
    {/* 🎯 订阅会员对话框 */}
    <SubscriptionModal 
      isOpen={showUpgradeModal} 
      onOpenChange={setShowUpgradeModal}
    />
  </>
  );
}
