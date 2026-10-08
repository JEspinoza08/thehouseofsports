import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
}

export default function CustomSelect({
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  className = "",
  searchable = true,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase().trim()),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div
      ref={containerRef}
      className={`relative min-w-0 ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((current) => !current);
        }}
        className={`flex w-full items-center justify-between rounded-xl border bg-white p-4 text-left transition ${
          isOpen
            ? "border-[#e3262e] ring-2 ring-[#e3262e]/10"
            : "border-neutral-200"
        } ${
          disabled
            ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
            : "cursor-pointer text-neutral-950 hover:border-neutral-400"
        }`}
      >
        <span
          className={`min-w-0 truncate ${
            selectedOption ? "text-neutral-950" : "text-neutral-500"
          }`}
        >
          {selectedOption?.label ?? placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`ml-3 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl">
          {searchable && (
            <div className="border-b border-neutral-100 p-3">
              <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3">
                <Search size={16} className="shrink-0 text-neutral-400" />

                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Buscar ${placeholder.toLowerCase()}...`}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                />
              </div>
            </div>
          )}

          <div className="custom-select-scroll max-h-64 overflow-y-auto overscroll-contain p-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                      isSelected
                        ? "bg-[#e3262e]/10 text-[#e3262e]"
                        : "text-neutral-800 hover:bg-neutral-100"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>

                    {isSelected && <Check size={17} className="shrink-0" />}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-6 text-center text-sm text-neutral-500">
                No se encontraron resultados
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}