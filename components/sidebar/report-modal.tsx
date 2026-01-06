import { FC } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
} from "@heroui/react";
import { X, FileText, Brain, Sparkles, Gem } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  reportContent: string;
  reportKey: string;
}

const reportIcons: Record<string, any> = {
  basic: FileText,
  personal: Brain,
  luck: Sparkles,
  achievement: Gem,
};

const reportColors: Record<string, string> = {
  basic: "text-blue-500",
  personal: "text-purple-500",
  luck: "text-amber-500",
  achievement: "text-emerald-500",
};

const ReportModal: FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  reportContent,
  reportKey,
}) => {
  const IconComponent = reportIcons[reportKey] || FileText;
  const iconColor = reportColors[reportKey] || "text-primary";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/80 backdrop-blur-sm",
        base: "bg-content1 border border-foreground/10",
        header: "border-b border-foreground/10 bg-content2/50",
        body: "py-6",
        footer: "border-t border-foreground/10 bg-content2/50",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3 px-6 py-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ${iconColor}`}
              >
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">
                  {reportTitle}
                </h2>
                <p className="text-sm text-foreground-500">深度解读报告</p>
              </div>
              <Button
                isIconOnly
                variant="light"
                onPress={onClose}
                className="text-foreground-500 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </ModalHeader>

            <ModalBody className="px-8 py-6">
              {/* 精美的报告内容展示 */}
              <div
                className="prose prose-lg dark:prose-invert max-w-none
                [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-primary [&>h1]:mb-6 [&>h1]:pb-3 [&>h1]:border-b [&>h1]:border-primary/30
                [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-primary [&>h2]:mt-8 [&>h2]:mb-4
                [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-6 [&>h3]:mb-3
                [&>p]:text-base [&>p]:leading-relaxed [&>p]:text-foreground-700 [&>p]:my-4
                [&>ul]:my-4 [&>ul]:space-y-2
                [&>ul>li]:text-foreground-700 [&>ul>li]:leading-relaxed
                [&>ol]:my-4 [&>ol]:space-y-2
                [&>ol>li]:text-foreground-700 [&>ol>li]:leading-relaxed
                [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-foreground-600
                [&>strong]:text-primary [&>strong]:font-semibold
                [&>em]:text-secondary [&>em]:not-italic
                [&_code]:bg-content2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-primary
              "
              >
                <div className="bg-gradient-to-br from-content2/50 to-content1/50 rounded-2xl p-6 border border-foreground/10">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {reportContent}
                  </ReactMarkdown>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4">
              <div className="flex items-center justify-between w-full">
                <p className="text-sm text-foreground-500">
                  ✨ 由 AI 深度分析生成
                </p>
                <Button
                  color="primary"
                  variant="shadow"
                  onPress={onClose}
                  className="px-6"
                >
                  关闭
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ReportModal;
