"use client";

import { useState, useMemo } from "react";
import { Card, CardBody, Button, Divider } from "@heroui/react";
import { Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";
import { useTranslation } from "@/lib/utils/translations";

type BaziPayload = {
  card_id: string;
  data: {
    name: string;
    gender: "male" | "female" | "lgbtq";
    birthplace: string;
    mbti: string;
    birthday_utc8: string;
  };
};

interface AICardProps {
  name: string;
  response: any;
}

export default function AICard({ name, response }: AICardProps) {
  const [status, setStatus] = useState<"idle" | "creating" | "created">("idle");
  const { t } = useTranslation();

  const parsed: BaziPayload | null = useMemo(() => {
    if (!response) return null;
    try {
      if (typeof response.result === "string") {
        return JSON.parse(response.result);
      }
      return response as BaziPayload;
    } catch {
      return null;
    }
  }, [response]);

  if (name !== "get_bazi_components" || !parsed) return null;

  const { data } = parsed;

  const handleCreate = async () => {
    if (status === "creating" || status === "created") return;
    setStatus("creating");
    try {
      await apiClient.createCharacter({
        name: data.name,
        gender: data.gender,
        birthday_utc8: data.birthday_utc8,
        longitude: 139.0,
        birthplace: data.birthplace,
        mbti: data.mbti,
        mode: "character",
        avatar_id: null,
        description: null,
        data_type: "virtual_virtual",
        visibility: "public",
        tags: [],
      });

      toast({
        title: `🎉 ${t("aiCard.creationSuccess")}`,
        description: t("aiCard.creationSuccessDesc"),
        variant: "success" as any,
      });
      setStatus("created");
    } catch (e) {
      console.error("Create character failed", e);
      toast({
        title: `❌ ${t("aiCard.creationFailed")}`,
        description:
          e instanceof Error ? e.message : t("aiCard.creationFailedDesc"),
        variant: "destructive" as any,
      });
      setStatus("idle");
    }
  };

  return (
    <Card className="bg-content1 border border-foreground/10 shadow-md min-w-[320px] max-w-[400px] relative">
      <CardBody className="space-y-3 p-4">
        <div className="grid grid-cols-1 gap-2">
          <div className="text-sm text-foreground-600">
            {t("aiCard.name")}:{" "}
            <span className="text-foreground font-medium">{data.name}</span>
          </div>
          <div className="text-sm text-foreground-600">
            {t("aiCard.gender")}:{" "}
            <span className="text-foreground font-medium">{data.gender}</span>
          </div>
          <div className="text-sm text-foreground-600">
            {t("aiCard.birthplace")}:{" "}
            <span className="text-foreground font-medium">
              {data.birthplace}
            </span>
          </div>
          <div className="text-sm text-foreground-600">
            MBTI:{" "}
            <span className="text-foreground font-medium">{data.mbti}</span>
          </div>
          <div className="text-sm text-foreground-600">
            {t("aiCard.birthday")}:{" "}
            <span className="text-foreground font-medium">
              {data.birthday_utc8}
            </span>
          </div>
        </div>
        <Divider className="my-1" />
        <div className="flex items-center justify-center pt-1">
          <Button
            size="sm"
            color="primary"
            className="px-4"
            isDisabled={status !== "idle"}
            isLoading={status === "creating"}
            onPress={handleCreate}
          >
            {status === "created"
              ? t("aiCard.created")
              : t("aiCard.createCharacter")}
          </Button>
        </div>
      </CardBody>

      {/* Success Overlay */}
      {status === "created" && (
        <div className="absolute inset-0 bg-success/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="bg-success rounded-full p-3 shadow-lg">
            <Check className="w-6 h-6 text-white" />
          </div>
        </div>
      )}
    </Card>
  );
}
