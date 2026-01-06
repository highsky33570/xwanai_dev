"use client"

import { useState, useRef, useEffect } from "react"
import { Input, Button, Card, CardBody } from "@heroui/react"
import { Search, Filter, ChevronDown } from "lucide-react"
import { useDebounce } from "use-debounce"

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  onFilterChange?: (filters: string[]) => void
}

export default function SearchBar({ placeholder = "Search characters...", onSearch, onFilterChange }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filterOptions = [
    { id: "recent", label: "Recently Updated" },
    { id: "popular", label: "Most Popular" },
    { id: "mine", label: "My Characters" },
    { id: "celebrity", label: "Celebrity" },
    { id: "ocs", label: "Original Characters" },
    { id: "agent", label: "Agent-Ready" },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    onSearch?.(debouncedSearchQuery)
  }, [debouncedSearchQuery, onSearch])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const toggleFilter = (filterId: string) => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter((f) => f !== filterId)
      : [...selectedFilters, filterId]

    setSelectedFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex gap-2 w-full">
        {/* Search Input */}
        <Input
          value={searchQuery}
          onValueChange={handleSearchChange}
          placeholder={placeholder}
          startContent={<Search className="w-4 h-4 text-foreground-400" />}
          className="flex-1"
          classNames={{
            input: "text-sm",
            inputWrapper:
              "bg-content2 border-1 border-foreground/10 hover:border-foreground/20 focus-within:border-primary",
          }}
        />

        {/* Filter Dropdown Button */}
        <Button
          isIconOnly
          variant="bordered"
          className="border-foreground/10 hover:border-foreground/20 bg-content2"
          onPress={toggleDropdown}
        >
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4" />
            <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </div>
        </Button>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <Card className="absolute right-0 top-full mt-2 w-64 z-50 bg-content1 border-1 border-foreground/10">
          <CardBody className="p-2">
            <div className="space-y-1">
              <div className="px-3 py-2 text-sm font-medium text-foreground-600">Filter by:</div>
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleFilter(option.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedFilters.includes(option.id)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-content2 text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}

              {selectedFilters.length > 0 && (
                <>
                  <div className="border-t border-foreground/10 my-2" />
                  <button
                    onClick={() => {
                      setSelectedFilters([])
                      onFilterChange?.([])
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-danger hover:bg-danger/10 transition-colors"
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
