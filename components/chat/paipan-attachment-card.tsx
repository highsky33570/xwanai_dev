import { FC } from "react";
import { Card, CardBody, Button, Avatar, Chip } from "@heroui/react";
import { X, User } from "lucide-react";
import { useTranslation } from "@/lib/utils/translations";

interface PaipanAttachmentCardProps {
  id: string;
  name: string;
  gender?: string;
  birthday?: string;
  onRemove: (id: string) => void;
}

const PaipanAttachmentCard: FC<PaipanAttachmentCardProps> = ({
  id,
  name,
  gender,
  birthday,
  onRemove,
}) => {
  const { t } = useTranslation();

  return (
    <Card className="bg-content2/80 border border-primary/30 backdrop-blur-sm hover:border-primary/50 transition-all">
      <CardBody className="p-3 flex flex-row items-center gap-3">
        <Avatar
          name={name}
          size="sm"
          className="flex-shrink-0 bg-primary/20 ring-2 ring-primary/30"
          fallback={<User className="w-4 h-4 text-primary" />}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">{name}</p>
          <div className="flex items-center gap-2 text-xs text-foreground-500">
            {gender && <span>{gender}</span>}
            {birthday && <span>{birthday}</span>}
          </div>
        </div>
        <Chip
          size="sm"
          color="primary"
          variant="flat"
          className="flex-shrink-0"
        >
          {t("chatEx.paipanData")}
        </Chip>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={() => onRemove(id)}
          className="flex-shrink-0 hover:bg-danger/20 hover:text-danger"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardBody>
    </Card>
  );
};

export default PaipanAttachmentCard;
