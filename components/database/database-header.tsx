"use client"

export default function DatabaseHeader() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      {/* Centered Logo */}
      <img src="/logo.svg" alt="Logo" className="h-12 mb-12 mt-12" />

      {/* Text Content */}
      <div className="space-y-2">
        <div className="font-title font-semibold text-4xl text-foreground">Personal Character</div>
        <div className="font-title text-3xl text-foreground">Database</div>
        <div className="font-sans font-light text-lg text-foreground-400 mt-4">
          Manage and organize your character collection
        </div>
      </div>
    </div>
  )
}
