"use client";

import { FC, useState } from "react";
import { Card, CardBody, Tabs, Tab, Chip, Spinner } from "@heroui/react";
import { FileText, User, TrendingUp, Award } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface CharacterReportsViewerProps {
  reports: {
    basic?: string;
    personal?: string;
    luck?: string;
    achievement?: string;
  } | null;
  characterName?: string;
  processingStatus?: boolean | null; // 🎯 改为 boolean（is_report_ready）
}

const CharacterReportsViewer: FC<CharacterReportsViewerProps> = ({
  reports,
  characterName,
  processingStatus,
}) => {
  const [selectedReport, setSelectedReport] = useState<string>("basic");

  // 如果还在处理中（is_report_ready = false）
  if (processingStatus === false) {
    return (
      <Card className="bg-content2/80 backdrop-blur-sm border border-white/10 shadow-xl">
        <CardBody className="p-8 text-center">
          <Spinner size="lg" color="primary" className="mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            报告生成中...
          </h3>
          <p className="text-foreground-600 text-sm">
            正在为{characterName}生成深度解读报告，请稍候...
          </p>
        </CardBody>
      </Card>
    );
  }

  // 如果没有报告
  if (!reports || Object.keys(reports).length === 0) {
    return (
      <Card className="bg-content2/80 backdrop-blur-sm border border-white/10 shadow-xl">
        <CardBody className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-foreground-400" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            暂无报告
          </h3>
          <p className="text-foreground-600 text-sm">
            该角色还没有生成解读报告
          </p>
        </CardBody>
      </Card>
    );
  }

  const reportTabs = [
    {
      key: "basic",
      title: "核心要素档案",
      icon: <FileText className="w-4 h-4" />,
      content: reports.basic,
    },
    {
      key: "personal",
      title: "性格深度剖析",
      icon: <User className="w-4 h-4" />,
      content: reports.personal,
    },
    {
      key: "luck",
      title: "多元个性棱镜",
      icon: <TrendingUp className="w-4 h-4" />,
      content: reports.luck,
    },
    {
      key: "achievement",
      title: "人生成就考据",
      icon: <Award className="w-4 h-4" />,
      content: reports.achievement,
    },
  ].filter((tab) => tab.content); // 只显示有内容的标签

  return (
    <Card className="bg-content2/80 backdrop-blur-sm border border-white/10 shadow-xl">
      <CardBody className="p-0">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full" />
            深度解读报告
          </h3>
          <p className="text-sm text-foreground-600 mt-2">
            基于命理学的角色分析报告
          </p>
        </div>

        <Tabs
          selectedKey={selectedReport}
          onSelectionChange={(key) => setSelectedReport(key as string)}
          aria-label="报告类型"
          color="primary"
          variant="underlined"
          className="px-6 pt-4"
          classNames={{
            tabList: "gap-6 w-full",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-primary",
          }}
        >
          {reportTabs.map((tab) => (
            <Tab
              key={tab.key}
              title={
                <div className="flex items-center gap-2">
                  {tab.icon}
                  <span>{tab.title}</span>
                </div>
              }
            >
              <div className="py-6 px-6">
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <ReactMarkdown>{tab.content || ""}</ReactMarkdown>
                </div>
              </div>
            </Tab>
          ))}
        </Tabs>
      </CardBody>
    </Card>
  );
};

export default CharacterReportsViewer;
