import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { filterSuggestions } from './editor-suggestions'

type SearchComboboxProps = {
  ariaLabel: string
  className?: string
  inputClassName: string
  maxLength?: number
  onChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
  value: string
}

/**
 * Free-text input with a searchable suggestion list. Selecting an option is
 * optional: whatever the user types is kept as-is, so custom cities and other
 * values continue to work exactly like a regular text field.
 */
export function SearchCombobox({
  ariaLabel,
  className = '',
  inputClassName,
  maxLength,
  onChange,
  options,
  placeholder,
  value,
}: SearchComboboxProps) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const filtered = filterSuggestions(options, value)
  const showList = open && filtered.length > 0
  const activeOption = activeIndex >= 0 ? filtered[activeIndex] : undefined

  function selectOption(option: string) {
    onChange(option)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) setOpen(true)
      setActiveIndex((index) =>
        filtered.length === 0 ? -1 : Math.min(index + 1, filtered.length - 1),
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) setOpen(true)
      setActiveIndex((index) =>
        index < 0 ? filtered.length - 1 : Math.max(0, index - 1),
      )
      return
    }

    if (event.key === 'Enter' && open && activeOption) {
      event.preventDefault()
      selectOption(activeOption)
      return
    }

    if (event.key === 'Escape') {
      setOpen(false)
      return
    }

    if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <input
        aria-activedescendant={
          showList && activeOption ? `${listId}-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showList}
        aria-label={ariaLabel}
        autoComplete="off"
        className={inputClassName}
        maxLength={maxLength}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
          setActiveIndex(0)
        }}
        onFocus={() => {
          setOpen(true)
          setActiveIndex(-1)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        type="text"
        value={value}
      />
      {showList && (
        <ul
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          id={listId}
          role="listbox"
        >
          {filtered.map((option, index) => (
            <li key={option}>
              <button
                aria-selected={index === activeIndex}
                className={`flex w-full items-center px-3 py-2 text-left text-xs ${
                  index === activeIndex
                    ? 'bg-[#2F4B7C]/10 font-medium text-[#2F4B7C]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
                id={`${listId}-${index}`}
                onClick={() => selectOption(option)}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
                type="button"
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
