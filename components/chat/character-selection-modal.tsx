import { FC, useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Avatar,
  Checkbox,
  Input,
  Spinner,
  Chip,
} from "@heroui/react";
import { Search, User, Sparkles, Filter } from "lucide-react";
import { databaseOperations } from "@/lib/supabase/database";
import { authOperations } from "@/lib/supabase/auth";
import { useTranslation } from "@/lib/utils/translations";
import { logger } from "@/lib/utils/logger";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";

interface CharacterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (characters: Array<{ id: string; name: string }>) => void;
  multiSelect?: boolean;
}

const CharacterSelectionModal: FC<CharacterSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  multiSelect = true,
}) => {
  const { t } = useTranslation();
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "ready" | "generating"
  >("all");

  useEffect(() => {
    if (isOpen) {
      loadCharacters();
      setSelectedIds([]);
      setSearchQuery("");
    }
  }, [isOpen]);

  const loadCharacters = async () => {
    setLoading(true);
    try {
      logger.info(
        { module: "chat", operation: "loadCharacters" },
        "Loading user characters for paipan attachment"
      );

      const user = await authOperations.getCurrentUser();
      if (!user) {
        logger.warn(
          { module: "chat", operation: "loadCharacters" },
          "No user found"
        );
        return;
      }

      const { data, error } = await databaseOperations.getUserCharacters(
        user.id
      );

      if (error) {
        logger.error(
          { module: "chat", operation: "loadCharacters", error },
          "Failed to load characters"
        );
        return;
      }

      setCharacters(data || []);
      logger.success(
        {
          module: "chat",
          operation: "loadCharacters",
          data: { count: data?.length || 0 },
        },
        "Characters loaded successfully"
      );
    } catch (error) {
      logger.error(
        { module: "chat", operation: "loadCharacters", error },
        "Unexpected error loading characters"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    if (multiSelect) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleConfirm = () => {
    const selectedCharacters = characters
      .filter((char) => selectedIds.includes(char.id))
      .map((char) => ({
        id: char.id,
        name: char.name,
      }));

    logger.info(
      {
        module: "chat",
        operation: "selectCharacters",
        data: { count: selectedCharacters.length, ids: selectedIds },
      },
      "Characters selected for paipan attachment"
    );

    onSelect(selectedCharacters);
    setSelectedIds([]);
    onClose();
  };

  // 过滤角色
  const filteredCharacters = characters
    .filter((char) => {
      // 搜索过滤
      const matchesSearch = char.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // 状态过滤
      if (filterStatus === "ready") {
        return matchesSearch && char.is_report_ready === true;
      } else if (filterStatus === "generating") {
        return matchesSearch && char.is_report_ready !== true;
      }

      return matchesSearch;
    })
    .sort((a, b) => {
      // 按创建时间倒序排序
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  // 格式化生日显示
  const formatBirthday = (
    birthTime: string | null,
    birthdayUtc8: string | null
  ) => {
    if (birthTime) {
      return `生于 ${birthTime.split("T")[0]}`;
    }
    if (birthdayUtc8) {
      return `生于 ${birthdayUtc8}`;
    }
    return t("chatEx.paipanData");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" backdrop="blur">
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex flex-col gap-2 border-b border-foreground/10 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-base font-semibold">
                    {t("chatEx.selectCharacterPaipan")}
                  </span>
                </div>
                <span className="text-xs text-foreground-500">
                  {multiSelect
                    ? t("chatEx.selectMultipleHint")
                    : t("chatEx.selectSingleHint")}
                </span>
              </div>
            </ModalHeader>
            <ModalBody className="py-3 px-4">
              {/* 搜索和筛选 */}
              <div className="flex gap-2">
                <Input
                  placeholder={t("chatEx.searchCharacters")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startContent={
                    <Search className="w-4 h-4 text-foreground-400" />
                  }
                  size="sm"
                  classNames={{
                    base: "flex-1",
                    input: "bg-transparent text-sm",
                    inputWrapper:
                      "bg-content2/50 border border-foreground/10 hover:border-primary/40 focus-within:border-primary/60 transition-colors",
                  }}
                />

                {/* 筛选按钮 */}
                <div className="flex gap-1 bg-content2/50 border border-foreground/10 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={filterStatus === "all" ? "solid" : "light"}
                    color={filterStatus === "all" ? "primary" : "default"}
                    onPress={() => setFilterStatus("all")}
                    className="min-w-[50px] h-8 text-xs font-medium"
                  >
                    全部
                  </Button>
                  <Button
                    size="sm"
                    variant={filterStatus === "ready" ? "solid" : "light"}
                    color={filterStatus === "ready" ? "success" : "default"}
                    onPress={() => setFilterStatus("ready")}
                    className="min-w-[50px] h-8 text-xs font-medium"
                  >
                    可用
                  </Button>
                  <Button
                    size="sm"
                    variant={filterStatus === "generating" ? "solid" : "light"}
                    color={
                      filterStatus === "generating" ? "warning" : "default"
                    }
                    onPress={() => setFilterStatus("generating")}
                    className="min-w-[60px] h-8 text-xs font-medium"
                  >
                    生成中
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Spinner size="lg" color="primary" />
                </div>
              ) : filteredCharacters.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-content2 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-foreground-400" />
                  </div>
                  <p className="text-sm text-foreground-500 font-medium mb-1">
                    {characters.length === 0
                      ? t("chatEx.noCharactersFound")
                      : t("chatEx.noMatchingCharacters")}
                  </p>
                  <p className="text-xs text-foreground-400">
                    {characters.length === 0
                      ? "请先创建角色"
                      : "尝试其他关键词或筛选条件"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                  {filteredCharacters.map((char) => {
                    const isSelected = selectedIds.includes(char.id);
                    const isReady = char.is_report_ready === true;
                    return (
                      <Card
                        key={char.id}
                        isPressable
                        onPress={() => handleSelect(char.id)}
                        className={`group transition-all duration-200 ${
                          isSelected
                            ? "border-2 border-primary bg-primary/5"
                            : "border border-foreground/10 hover:border-primary/30 hover:bg-content2/50"
                        }`}
                      >
                        <CardBody className="p-2.5">
                          <div className="flex flex-row items-center gap-2.5">
                            <Checkbox
                              isSelected={isSelected}
                              color="primary"
                              size="sm"
                              onValueChange={() => handleSelect(char.id)}
                            />

                            <div className="relative">
                              <Avatar
                                src={getAvatarPublicUrl(
                                  char.avatar_id,
                                  char.auth_id
                                )}
                                name={char.name}
                                size="sm"
                                className={`w-10 h-10 ring-2 transition-all ${
                                  isSelected
                                    ? "ring-primary/50"
                                    : "ring-primary/20 group-hover:ring-primary/40"
                                }`}
                                fallback={
                                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-primary/70" />
                                  </div>
                                }
                              />
                              <div
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-content1 ${
                                  isReady
                                    ? "bg-success"
                                    : "bg-warning animate-pulse"
                                }`}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-sm font-bold truncate transition-colors ${
                                  isSelected
                                    ? "text-primary"
                                    : "text-foreground group-hover:text-primary"
                                }`}
                              >
                                {char.name}
                              </h4>
                              <p className="text-xs text-foreground/60">
                                {formatBirthday(
                                  char.birth_time,
                                  char.birthday_utc8
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {!isReady && (
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color="warning"
                                  className="h-5 text-xs px-1.5"
                                >
                                  生成中
                                </Chip>
                              )}
                              {char.star_sign && (
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  className="h-5 bg-primary/10 text-primary text-xs px-1.5"
                                >
                                  {char.star_sign}
                                </Chip>
                              )}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ModalBody>
            <ModalFooter className="border-t border-foreground/10 pt-4">
              <Button
                variant="light"
                onPress={onModalClose}
                className="font-medium"
              >
                {t("database.cancel")}
              </Button>
              <Button
                color="primary"
                onPress={handleConfirm}
                isDisabled={selectedIds.length === 0}
                className="font-semibold"
                startContent={<Sparkles className="w-4 h-4" />}
              >
                {t("chatEx.confirmSelect")} ({selectedIds.length})
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CharacterSelectionModal;
