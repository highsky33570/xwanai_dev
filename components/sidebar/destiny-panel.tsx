"use client";

import { FC, useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { Sparkles, Calendar } from "lucide-react";
import DestinyTimeline from "@/components/chat/destiny-timeline";
import type { BirthInfo } from "@/hooks/use-destiny-data";

interface DestinyPanelProps {
  character: any;
  onClose: () => void;
}

const DestinyPanel: FC<DestinyPanelProps> = ({ character, onClose }) => {
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);

  useEffect(() => {
    if (character) {
      try {
        const birthTime = character.birth_time;
        const gender = character.gender || "male";

        if (birthTime) {
          // ⚠️ 重要：直接解析字符串，避免时区转换问题
          // 假设 birthTime 格式为 "YYYY-MM-DD HH:mm:ss" 或 ISO 格式
          let year, month, day, hour, minute;

          if (typeof birthTime === "string") {
            // 尝试从字符串中提取日期时间（避免时区转换）
            const match = birthTime.match(
              /(\d{4})-(\d{1,2})-(\d{1,2})[\sT](\d{1,2}):(\d{1,2})/
            );
            if (match) {
              year = parseInt(match[1]);
              month = parseInt(match[2]);
              day = parseInt(match[3]);
              hour = parseInt(match[4]);
              minute = parseInt(match[5]);
            } else {
              // 回退到 Date 对象（可能有时区问题）
              const date = new Date(birthTime);
              year = date.getFullYear();
              month = date.getMonth() + 1;
              day = date.getDate();
              hour = date.getHours();
              minute = date.getMinutes();
            }
          } else {
            const date = new Date(birthTime);
            year = date.getFullYear();
            month = date.getMonth() + 1;
            day = date.getDate();
            hour = date.getHours();
            minute = date.getMinutes();
          }

          const birthData: BirthInfo = {
            year,
            month,
            day,
            hour,
            minute,
            gender: gender === "female" ? "female" : "male",
          };

          setBirthInfo(birthData);
        }
      } catch (error) {
        console.error("Failed to parse birth info:", error);
      }
    }
  }, [character]);

  if (!birthInfo) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: "bg-black/70 backdrop-blur-lg",
          base: "bg-content1/95 backdrop-blur-xl border border-foreground/10",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-warning" />
              <h2 className="text-lg font-semibold">命运时间线</h2>
            </div>
          </ModalHeader>
          <ModalBody className="p-6">
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
              <Calendar className="w-12 h-12 text-foreground-400" />
              <p className="text-foreground-600">缺少出生信息</p>
              <p className="text-sm text-foreground-400">
                该角色没有出生时间数据
              </p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-black/70 backdrop-blur-lg",
        base: "bg-content1/95 backdrop-blur-xl border border-foreground/10 h-[85vh]",
      }}
    >
      <ModalContent className="h-full flex flex-col">
        <ModalHeader className="flex-shrink-0 border-b border-foreground/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-warning/20 to-primary/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">命运时间线</h2>
              <p className="text-xs text-foreground-500">
                {character.name || "未命名角色"} · 百年运势一览
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="p-0 overflow-hidden flex-1">
          <DestinyTimeline
            key={`${birthInfo.year}-${birthInfo.month}-${birthInfo.day}`}
            birthInfo={birthInfo}
            variant="flat"
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default DestinyPanel;
