"use client";

import { useTranslation } from "@/lib/utils/translations";

export default function FooterLeft() {
  const { t } = useTranslation();
  
  return (
    <div className="mt-auto space-y-3 pb-8">
      <p className="text-sm text-black leading-relaxed">{t("common.footerDescription")}</p>
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 rounded bg-gray-300 text-white text-xs">{t("common.contact")}</span>
        <button className="text-xs text-black/80" onClick={() => { window.location.href = "mailto:gjmb@hyper.com" }}>GJMB@HYPER.COM</button>
      </div>
    </div>
  );
}