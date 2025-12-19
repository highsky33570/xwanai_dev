export default function FooterLeft() {
  return (
    <div className="mt-auto space-y-3 pb-8">
      <p className="text-sm text-black leading-relaxed">隶属于上海鹰角网络公司旗下的音乐厂牌提供音乐制作、音乐人经纪、音乐发行致力为当代听众带来音乐叙事逻重新解读</p>
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 rounded bg-gray-300 text-white text-xs">CONTACT</span>
        <button className="text-xs text-black/80" onClick={() => { window.location.href = "mailto:gjmb@hyper.com" }}>GJMB@HYPER.COM</button>
      </div>
    </div>
  );
}