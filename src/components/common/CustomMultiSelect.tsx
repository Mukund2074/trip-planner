import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X, CheckSquare, Square } from "lucide-react";
import { CustomSelectOption } from "./CustomSelect";

interface CustomMultiSelectProps {
  values: string[];
  onChange: (newValues: string[]) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomMultiSelect: React.FC<CustomMultiSelectProps> = ({
  values,
  onChange,
  options,
  placeholder = "Select members",
  label,
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (clickEvent: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(clickEvent.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const toggleOption = (optionValue: string) => {
    if (values.includes(optionValue)) {
      onChange(values.filter((itemValue) => itemValue !== optionValue));
    } else {
      onChange([...values, optionValue]);
    }
  };

  const handleSelectAll = () => {
    const allOptionValues = options.map((option) => option.value);
    onChange(allOptionValues);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const selectedOptions = options.filter((option) =>
    values.includes(option.value)
  );

  const areAllSelected =
    options.length > 0 && selectedOptions.length === options.length;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-bold text-slate-600">
            {label}
          </label>
          {values.length > 0 && (
            <span className="text-[10px] font-bold text-emerald-700">
              {values.length} selected
            </span>
          )}
        </div>
      )}

      {/* Select Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition cursor-pointer text-left ${
          disabled
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            : isOpen
            ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
            : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          {selectedOptions.length === 0 ? (
            <span className="text-slate-400 font-normal truncate">
              {placeholder}
            </span>
          ) : selectedOptions.length === options.length ? (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg text-xs">
              <span>All Members ({options.length})</span>
            </span>
          ) : (
            <div className="flex items-center gap-1 flex-wrap max-h-6 overflow-hidden">
              <span className="font-bold text-slate-800 truncate">
                {selectedOptions.map((option) => option.label).join(", ")}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {values.length > 0 && !disabled && (
            <button
              type="button"
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                handleClearAll();
              }}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-emerald-600" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-xl py-1.5 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 min-w-[240px]">
          {/* Action Bar (Select All / Clear) */}
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <CheckSquare className="w-3 h-3" />
              <span>Select All</span>
            </button>

            {values.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-400 hover:text-rose-600 font-medium cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="py-1">
            {options.map((optionItem) => {
              const isSelected = values.includes(optionItem.value);

              return (
                <button
                  key={optionItem.value}
                  type="button"
                  onClick={() => toggleOption(optionItem.value)}
                  className={`w-full px-3 py-2 text-xs flex items-center justify-between gap-2.5 transition cursor-pointer text-left ${
                    isSelected
                      ? "bg-emerald-50/70 text-emerald-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}

                    {optionItem.icon && (
                      <span className="shrink-0 flex items-center justify-center">
                        {optionItem.icon}
                      </span>
                    )}

                    <span className="truncate">{optionItem.label}</span>
                  </div>

                  {optionItem.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 shrink-0">
                      {optionItem.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
