import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ApiError,
  getResume,
  saveResume,
  type ApiResume,
} from '../../lib/api'
import {
  createItem,
  createSection,
  documentForSave,
  isDefaultSectionTitle,
  normalizeDocument,
  sectionBehavior,
  sectionDefaultLayout,
  sectionLabels,
  sectionTypes,
  templateOptions,
  templateThemes,
  validateDocument,
  type ResumeDocument,
  type ResumeItem,
  type ResumeSection,
  type ResumeSectionType,
  type ResumeStyle,
} from '../../lib/resume-document'
import { A4_PAGE_WIDTH, ResumePreview } from './ResumePreview'
import { SearchCombobox } from './SearchCombobox'
import {
  brazilianCities,
  cefrLevels,
  filterSuggestions,
  formatLanguageTag,
  languageSuggestions,
  proficiencyLevels,
  skillSuggestionGroups,
  type SuggestionGroup,
} from './editor-suggestions'

type EditorIconName =
  | 'up'
  | 'down'
  | 'trash'
  | 'eye'
  | 'eye-off'
  | 'plus'
  | 'close'
  | 'check'

const editorIconPaths: Record<EditorIconName, ReactNode> = {
  up: <path d="m6 14 6-6 6 6" />,
  down: <path d="m6 10 6 6 6-6" />,
  trash: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path d="m3 3 18 18" />
      <path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.8" />
      <path d="M6.2 6.3A17.4 17.4 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.3-.9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m18 6-12 12M6 6l12 12" />,
  check: <path d="m5 13 4 4L19 7" />,
}

function EditorIcon({
  name,
  size = 16,
  className = '',
}: {
  name: EditorIconName
  size?: number
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      width={size}
    >
      {editorIconPaths[name]}
    </svg>
  )
}

const inputClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#2F4B7C]/50'

const textareaClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#2F4B7C]/50'

const iconButtonClass =
  'flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

function Field({
  label,
  hint,
  className = '',
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-[11px] font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-slate-400">{hint}</span>}
    </label>
  )
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-slate-600">{label}</p>
      {children}
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  )
}

function TagEditor({
  tags,
  onChange,
  suggestionGroups,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestionGroups?: readonly SuggestionGroup[]
}) {
  const [draft, setDraft] = useState('')

  function addTags(values: string[]) {
    const next = Array.from(new Set([...tags, ...values])).slice(0, 80)
    if (next.length === tags.length) return

    onChange(next)
  }

  function commitDraft() {
    const values = draft
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)

    if (values.length === 0) return

    addTags(values)
    setDraft('')
  }

  const suggestions = suggestionGroups
    ? suggestionGroups
        .map((group) => ({
          label: group.label,
          options: filterSuggestions(
            group.options,
            draft,
            draft.trim() ? 6 : 4,
          ).filter((option) => !tags.includes(option)),
        }))
        .filter((group) => group.options.length > 0)
    : []

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 py-1 pl-2.5 pr-1 text-[11px] text-slate-700"
              key={tag}
            >
              {tag}
              <button
                aria-label={`Remover ${tag}`}
                className="flex size-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                onClick={() => onChange(tags.filter((item) => item !== tag))}
                type="button"
              >
                <EditorIcon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={inputClass}
          maxLength={60}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitDraft()
            }
          }}
          placeholder="Digite e pressione Enter (ou separe por vírgulas)"
          value={draft}
        />
        <button
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={draft.trim().length === 0 || tags.length >= 80}
          onClick={commitDraft}
          type="button"
        >
          <EditorIcon name="plus" size={14} />
          Adicionar
        </button>
      </div>
      {suggestions.length > 0 && tags.length < 80 && (
        <div className="space-y-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Sugestões
          </p>
          {suggestions.map((group) => (
            <div
              className="flex flex-wrap items-center gap-1.5"
              key={group.label}
            >
              <span className="text-[10px] font-medium text-slate-400">
                {group.label}
              </span>
              {group.options.map((option) => (
                <button
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600 transition-colors hover:border-[#2F4B7C]/40 hover:bg-[#2F4B7C]/5 hover:text-[#2F4B7C]"
                  key={option}
                  onClick={() => {
                    addTags([option])
                    setDraft('')
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  type="button"
                >
                  + {option}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-slate-400">
        {tags.length}/80 itens. Use Enter para adicionar rapidamente. As
        sugestões são opcionais.
      </p>
    </div>
  )
}

function LanguageEditor({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [language, setLanguage] = useState('')
  const [level, setLevel] = useState('')
  const [cefr, setCefr] = useState('')

  function addLanguage() {
    const tag = formatLanguageTag(language, level, cefr)
    if (!tag) return

    onChange(Array.from(new Set([...tags, tag])).slice(0, 80))
    setLanguage('')
    setLevel('')
    setCefr('')
  }

  return (
    <div className="space-y-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 py-1 pl-2.5 pr-1 text-[11px] text-slate-700"
              key={tag}
            >
              {tag}
              <button
                aria-label={`Remover ${tag}`}
                className="flex size-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                onClick={() => onChange(tags.filter((item) => item !== tag))}
                type="button"
              >
                <EditorIcon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          className="sm:col-span-2"
          hint="Digite para buscar ou informe um idioma personalizado."
          label="Idioma"
        >
          <SearchCombobox
            ariaLabel="Idioma"
            inputClassName={inputClass}
            maxLength={36}
            onChange={setLanguage}
            options={languageSuggestions}
            placeholder="Ex.: Inglês"
            value={language}
          />
        </Field>
        <Field hint="Opcional." label="Proficiência">
          <select
            className={inputClass}
            onChange={(event) => setLevel(event.target.value)}
            value={level}
          >
            <option value="">Sem nível</option>
            {proficiencyLevels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field hint="Opcional. Pode ser combinado com a proficiência." label="Nível CEFR">
          <select
            className={inputClass}
            onChange={(event) => setCefr(event.target.value)}
            value={cefr}
          >
            <option value="">Não informar</option>
            {cefrLevels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <button
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#2F4B7C]/30 bg-[#2F4B7C]/5 px-3 text-xs font-semibold text-[#2F4B7C] transition-colors hover:bg-[#2F4B7C]/10 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!language.trim() || tags.length >= 80}
        onClick={addLanguage}
        type="button"
      >
        <EditorIcon name="plus" size={14} />
        Adicionar idioma
      </button>
      <p className="text-[10px] text-slate-400">
        {tags.length}/80 idiomas. Proficiência e CEFR são opcionais e podem ser
        combinados.
      </p>
    </div>
  )
}

function readErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.errors) {
      const first = Object.values(error.errors).flat()[0]
      if (first) return first
    }
    return error.message || fallback
  }

  return error instanceof Error && error.message ? error.message : fallback
}

function moveEntry<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (index < 0 || target < 0 || target >= list.length) return list

  const next = [...list]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  return next
}

export type ResumeEditorProps = {
  resumeId: number
  documentPersistence: boolean | null
  onClose: () => void
  onSaved: (resume: ApiResume) => void
  onUnauthorized: () => void
}

export function ResumeEditor({
  resumeId,
  documentPersistence,
  onClose,
  onSaved,
  onUnauthorized,
}: ResumeEditorProps) {
  const [doc, setDoc] = useState<ResumeDocument | null>(null)
  const [snapshot, setSnapshot] = useState('')
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const callbacks = useRef({ onSaved, onUnauthorized })

  useEffect(() => {
    callbacks.current = { onSaved, onUnauthorized }
  }, [onSaved, onUnauthorized])

  const dirty = doc !== null && JSON.stringify(doc) !== snapshot

  useEffect(() => {
    let cancelled = false

    getResume(resumeId)
      .then((resume) => {
        if (cancelled) return

        const normalized = normalizeDocument(
          resume.document,
          resume.style,
          resume.name,
          resume.role,
        )

        setDoc(normalized)
        setSnapshot(JSON.stringify(normalized))
        setSelectedSectionId(normalized.sections[0]?.id ?? null)
        setLoadState('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return

        if (error instanceof ApiError && error.status === 401) {
          callbacks.current.onUnauthorized()
          return
        }

        setLoadState('error')
        setLoadError(
          readErrorMessage(error, 'Não foi possível carregar o currículo.'),
        )
      })

    return () => {
      cancelled = true
    }
  }, [resumeId, reloadKey])

  useEffect(() => {
    const previousOverflow = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'

    return () => {
      window.document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    if (!dirty) return

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  function handleClose() {
    if (saving) return
    if (dirty && !window.confirm('Há alterações não salvas. Deseja sair mesmo assim?')) {
      return
    }
    onClose()
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handleClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  function updateHeader(patch: Partial<ResumeDocument['header']>) {
    setDoc((current) =>
      current ? { ...current, header: { ...current.header, ...patch } } : current,
    )
  }

  function handleTemplateChange(style: ResumeStyle) {
    setDoc((current) =>
      current
        ? { ...current, template: style, theme: { ...templateThemes[style] } }
        : current,
    )
  }

  function addSection(type: ResumeSectionType) {
    if (!doc) return

    if (doc.sections.length >= 30) {
      setSaveError('O currículo aceita no máximo 30 seções.')
      return
    }

    const hasSectionOfType = doc.sections.some(
      (section) => section.type === type && type !== 'custom',
    )
    if (hasSectionOfType) {
      setSaveError(
        `Já existe uma seção de ${sectionLabels[type]}. Edite a existente ou crie uma seção personalizada.`,
      )
      return
    }

    const usedIds = new Set(doc.sections.map((section) => section.id))
    const section = createSection(type, usedIds)

    setDoc({ ...doc, sections: [...doc.sections, section] })
    setSelectedSectionId(section.id)
    setAddMenuOpen(false)
    setMobileView('edit')
  }

  function updateSection(sectionId: string, patch: Partial<ResumeSection>) {
    if (!doc) return

    setDoc({
      ...doc,
      sections: doc.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    })
  }

  function removeSection(sectionId: string) {
    if (!doc) return

    if (doc.sections.length <= 1) {
      setSaveError('O currículo precisa manter pelo menos uma seção.')
      return
    }

    const sections = doc.sections.filter((section) => section.id !== sectionId)
    setDoc({ ...doc, sections })

    if (selectedSectionId === sectionId) {
      setSelectedSectionId(sections[0]?.id ?? null)
    }
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    if (!doc) return

    const index = doc.sections.findIndex((section) => section.id === sectionId)
    setDoc({ ...doc, sections: moveEntry(doc.sections, index, direction) })
  }

  function changeSectionType(section: ResumeSection, type: ResumeSectionType) {
    if (!doc) return
    if (type === section.type) return

    if (
      type !== 'custom' &&
      doc.sections.some(
        (item) => item.id !== section.id && item.type === type,
      )
    ) {
      setSaveError(
        `Já existe uma seção de ${sectionLabels[type]}. Edite a existente ou crie uma seção personalizada.`,
      )
      return
    }

    const previousBehavior = sectionBehavior[section.type]
    const nextBehavior = sectionBehavior[type]
    const dropsText = nextBehavior === 'items'
    const dropsTags = nextBehavior === 'text' || nextBehavior === 'items'
    const dropsItems = nextBehavior === 'text' || nextBehavior === 'tags'
    const dropsContent =
      previousBehavior !== nextBehavior &&
      ((dropsText && section.text.trim().length > 0) ||
        (dropsTags && section.tags.length > 0) ||
        (dropsItems && section.items.length > 0))

    if (
      dropsContent &&
      !window.confirm(
        'Alterar o tipo de seção remove o conteúdo que não pertence ao novo tipo. Deseja continuar?',
      )
    ) {
      return
    }

    const patch: Partial<ResumeSection> = { type }

    if (isDefaultSectionTitle(section.type, section.title)) {
      patch.title = sectionLabels[type]
    }

    if (section.layout === sectionDefaultLayout[section.type]) {
      patch.layout = sectionDefaultLayout[type]
    }

    if (previousBehavior !== nextBehavior) {
      if (dropsText) patch.text = ''
      if (dropsTags) patch.tags = []
      if (dropsItems) patch.items = []
    }

    updateSection(section.id, patch)
  }

  function addItem(section: ResumeSection) {
    if (section.items.length >= 40) {
      setSaveError('Cada seção aceita no máximo 40 itens.')
      return
    }

    updateSection(section.id, { items: [...section.items, createItem()] })
  }

  function updateItem(
    sectionId: string,
    itemId: string,
    patch: Partial<ResumeItem>,
  ) {
    if (!doc) return

    const section = doc.sections.find((item) => item.id === sectionId)
    if (!section) return

    updateSection(sectionId, {
      items: section.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    })
  }

  function removeItem(sectionId: string, itemId: string) {
    if (!doc) return

    const section = doc.sections.find((item) => item.id === sectionId)
    if (!section) return

    updateSection(sectionId, {
      items: section.items.filter((item) => item.id !== itemId),
    })
  }

  function moveItem(sectionId: string, itemId: string, direction: -1 | 1) {
    if (!doc) return

    const section = doc.sections.find((item) => item.id === sectionId)
    if (!section) return

    const index = section.items.findIndex((item) => item.id === itemId)
    updateSection(sectionId, { items: moveEntry(section.items, index, direction) })
  }

  async function handleSave() {
    if (!doc || saving) return

    if (documentPersistence === false) {
      setSaveError(
        'A gravação do conteúdo está indisponível neste ambiente porque a coluna "document" ainda não existe no banco.',
      )
      return
    }

    const payload = documentForSave(doc)
    const problems = validateDocument(payload)

    if (problems.length > 0) {
      setSaveError(problems[0])
      return
    }

    const documentAtSave = JSON.stringify(doc)
    const savedSnapshot = JSON.stringify(payload)

    setSaving(true)
    setSaveError(null)
    setNotice(null)

    try {
      const saved = await saveResume(resumeId, {
        name: payload.header.name,
        role: payload.header.headline,
        style: payload.template,
        document: payload,
      })

      setSnapshot(savedSnapshot)
      // Preserve edits made while the request was in flight instead of
      // overwriting them with the snapshot sent to the API.
      setDoc((current) =>
        JSON.stringify(current) === documentAtSave ? payload : current,
      )
      setNotice('Currículo salvo com sucesso.')
      callbacks.current.onSaved(saved)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        callbacks.current.onUnauthorized()
        return
      }

      setSaveError(readErrorMessage(error, 'Não foi possível salvar o currículo.'))
    } finally {
      setSaving(false)
    }
  }

  const selectedSection =
    doc?.sections.find((section) => section.id === selectedSectionId) ??
    doc?.sections[0] ??
    null

  const duplicateSectionTypes = new Set(
    doc?.sections
      .filter((section) => section.type !== 'custom')
      .map((section) => section.type)
      .filter(
        (type, index, all) => all.indexOf(type) !== index,
      ) ?? [],
  )

  const templateName =
    templateOptions.find((option) => option.style === doc?.template)?.name ??
    'Modelo'

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#F9FAFB] text-[#111827]">
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            aria-label="Voltar para a lista de currículos"
            className={iconButtonClass}
            onClick={handleClose}
            type="button"
          >
            <EditorIcon name="close" size={17} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {doc?.header.name || 'Editar currículo'}
            </p>
            <p
              className={`truncate text-[11px] ${
                dirty ? 'text-amber-600' : 'text-slate-500'
              }`}
            >
              {dirty ? 'Alterações não salvas' : notice ?? 'Conteúdo salvo'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <select
            aria-label="Modelo do currículo"
            className="h-10 max-w-[150px] rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-[#2F4B7C]/50"
            onChange={(event) =>
              handleTemplateChange(event.target.value as ResumeStyle)
            }
            value={doc?.template ?? 'classic'}
          >
            {templateOptions.map((option) => (
              <option key={option.style} value={option.style}>
                {option.name}
              </option>
            ))}
          </select>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2F4B7C] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#263F69] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
            disabled={
              saving || !doc || !dirty || documentPersistence === false
            }
            onClick={() => void handleSave()}
            type="button"
          >
            <EditorIcon name="check" size={15} />
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </header>

      {documentPersistence === false && (
        <div
          className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] leading-relaxed text-amber-900 sm:px-6"
          role="alert"
        >
          <strong>Gravação temporariamente indisponível.</strong> A migration{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5">
            add_document_to_resumes_table
          </code>{' '}
          ainda não foi aplicada neste ambiente. Você pode editar e visualizar o
          currículo, mas o conteúdo não pode ser salvo enquanto a coluna{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5">document</code> não
          existir no banco.
        </div>
      )}

      {saveError && (
        <div
          className="flex items-start justify-between gap-3 border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-[11px] leading-relaxed text-rose-800 sm:px-6"
          role="alert"
        >
          <span>{saveError}</span>
          <button
            className="shrink-0 font-semibold underline"
            onClick={() => setSaveError(null)}
            type="button"
          >
            Fechar
          </button>
        </div>
      )}

      {notice && !dirty && (
        <div
          className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] text-emerald-800 sm:px-6"
          role="status"
        >
          {notice}
        </div>
      )}

      {loadState === 'loading' && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate-500" role="status">
            Carregando currículo…
          </p>
        </div>
      )}

      {loadState === 'error' && (
        <div className="flex flex-1 items-center justify-center px-5">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              Não foi possível abrir o currículo
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {loadError}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={handleClose}
                type="button"
              >
                Voltar
              </button>
              <button
                className="h-10 rounded-lg bg-[#2F4B7C] px-4 text-xs font-semibold text-white hover:bg-[#263F69]"
                onClick={() => {
                  setLoadState('loading')
                  setLoadError(null)
                  setReloadKey((key) => key + 1)
                }}
                type="button"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {loadState === 'ready' && doc && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] px-3 pb-10 pt-4 sm:px-6">
            <div className="mb-4 flex rounded-xl border border-slate-200 bg-white p-1 lg:hidden">
              <button
                className={`h-9 flex-1 rounded-lg text-xs font-semibold transition-colors ${
                  mobileView === 'edit'
                    ? 'bg-[#2F4B7C] text-white'
                    : 'text-slate-600'
                }`}
                onClick={() => setMobileView('edit')}
                type="button"
              >
                Editar
              </button>
              <button
                className={`h-9 flex-1 rounded-lg text-xs font-semibold transition-colors ${
                  mobileView === 'preview'
                    ? 'bg-[#2F4B7C] text-white'
                    : 'text-slate-600'
                }`}
                onClick={() => setMobileView('preview')}
                type="button"
              >
                Pré-visualizar
              </button>
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(380px,540px)] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div
                className={`space-y-5 ${
                  mobileView === 'preview' ? 'hidden lg:block' : ''
                }`}
              >
                <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Dados pessoais e contato
                    </h2>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Esses dados compõem o cabeçalho do currículo e atualizam o
                      nome e o cargo da sua lista.
                    </p>
                  </div>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field className="sm:col-span-2" label="Nome completo">
                      <input
                        className={inputClass}
                        maxLength={120}
                        onChange={(event) =>
                          updateHeader({ name: event.target.value })
                        }
                        placeholder="Como você quer ser apresentado"
                        value={doc.header.name}
                      />
                    </Field>
                    <Field
                      className="sm:col-span-2"
                      label="Cargo ou objetivo profissional"
                    >
                      <input
                        className={inputClass}
                        maxLength={160}
                        onChange={(event) =>
                          updateHeader({ headline: event.target.value })
                        }
                        placeholder="Ex.: Analista de sistemas sênior"
                        value={doc.header.headline}
                      />
                    </Field>
                    <Field label="E-mail">
                      <input
                        className={inputClass}
                        maxLength={160}
                        onChange={(event) =>
                          updateHeader({ email: event.target.value })
                        }
                        placeholder="voce@email.com"
                        type="email"
                        value={doc.header.email ?? ''}
                      />
                    </Field>
                    <Field label="Telefone">
                      <input
                        className={inputClass}
                        maxLength={60}
                        onChange={(event) =>
                          updateHeader({ phone: event.target.value })
                        }
                        placeholder="(41) 99999-9999"
                        value={doc.header.phone ?? ''}
                      />
                    </Field>
                    <Field
                      hint="Digite para buscar uma cidade brasileira ou informe um valor livre."
                      label="Localização"
                    >
                      <SearchCombobox
                        ariaLabel="Localização"
                        inputClassName={inputClass}
                        maxLength={120}
                        onChange={(location) => updateHeader({ location })}
                        options={brazilianCities}
                        placeholder="Curitiba, PR"
                        value={doc.header.location ?? ''}
                      />
                    </Field>
                    <Field label="LinkedIn">
                      <input
                        className={inputClass}
                        maxLength={160}
                        onChange={(event) =>
                          updateHeader({ linkedin: event.target.value })
                        }
                        placeholder="linkedin.com/in/seu-perfil"
                        value={doc.header.linkedin ?? ''}
                      />
                    </Field>
                    <Field
                      className="sm:col-span-2"
                      hint="Se você não informar o esquema, https:// será adicionado ao salvar."
                      label="Site ou portfólio"
                    >
                      <input
                        className={inputClass}
                        maxLength={160}
                        onChange={(event) =>
                          updateHeader({ website: event.target.value })
                        }
                        placeholder="https://seu-site.com"
                        value={doc.header.website ?? ''}
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        Seções do currículo
                      </h2>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Reordene, oculte, edite ou exclua seções. A ordem aqui é
                        a ordem da pré-visualização; seções vazias ou ocultas não
                        aparecem no A4.
                      </p>
                    </div>
                    <button
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#2F4B7C]/30 bg-[#2F4B7C]/5 px-3 text-xs font-semibold text-[#2F4B7C] transition-colors hover:bg-[#2F4B7C]/10"
                      onClick={() => setAddMenuOpen((open) => !open)}
                      type="button"
                    >
                      <EditorIcon name="plus" size={14} />
                      Adicionar seção
                    </button>
                  </div>

                  {addMenuOpen && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Escolha o tipo
                      </p>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {sectionTypes.map((type) => {
                          const alreadyAdded =
                            type !== 'custom' &&
                            doc.sections.some(
                              (section) => section.type === type,
                            )

                          return (
                            <button
                              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-[11px] font-medium transition-colors ${
                                alreadyAdded
                                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-[#2F4B7C]/40 hover:bg-[#2F4B7C]/5'
                              }`}
                              disabled={alreadyAdded}
                              key={type}
                              onClick={() => addSection(type)}
                              type="button"
                              title={
                                alreadyAdded
                                  ? `${sectionLabels[type]} já foi adicionada`
                                  : undefined
                              }
                            >
                              {sectionLabels[type]}
                              {alreadyAdded ? (
                                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <EditorIcon name="check" size={12} />
                                  Adicionada
                                </span>
                              ) : (
                                <EditorIcon
                                  className="text-slate-400"
                                  name="plus"
                                  size={13}
                                />
                              )}
                            </button>
                          )
                        })}
                      </div>
                      <p className="mt-2 text-[10px] text-slate-400">
                        Seções padrão podem ser adicionadas uma única vez. Use
                        &quot;Seção personalizada&quot; para criar variações.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    {doc.sections.map((section, index) => {
                      const isSelected = section.id === selectedSection?.id
                      const displayTitle =
                        section.title?.trim() || sectionLabels[section.type]
                      const typeLabel = sectionLabels[section.type]
                      const showType = typeLabel !== displayTitle
                      const duplicateType = duplicateSectionTypes.has(
                        section.type,
                      )

                      return (
                        <div
                          className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${
                            isSelected
                              ? 'border-[#2F4B7C]/40 bg-[#2F4B7C]/5'
                              : 'border-slate-200 bg-white'
                          }`}
                          key={section.id}
                        >
                          <button
                            className="min-w-0 flex-1 text-left"
                            onClick={() => setSelectedSectionId(section.id)}
                            type="button"
                          >
                            <span
                              className={`block truncate text-xs font-semibold ${
                                section.visible
                                  ? 'text-slate-800'
                                  : 'text-slate-400 line-through'
                              }`}
                            >
                              {displayTitle}
                            </span>
                            {(showType || duplicateType || !section.visible) && (
                              <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                                {showType && (
                                  <span className="truncate">{typeLabel}</span>
                                )}
                                {duplicateType && (
                                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                                    Tipo duplicado
                                  </span>
                                )}
                                {!section.visible && <span>Oculta</span>}
                              </span>
                            )}
                          </button>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              aria-label={`Mover ${section.title} para cima`}
                              className={iconButtonClass}
                              disabled={index === 0}
                              onClick={() => moveSection(section.id, -1)}
                              type="button"
                            >
                              <EditorIcon name="up" size={14} />
                            </button>
                            <button
                              aria-label={`Mover ${section.title} para baixo`}
                              className={iconButtonClass}
                              disabled={index === doc.sections.length - 1}
                              onClick={() => moveSection(section.id, 1)}
                              type="button"
                            >
                              <EditorIcon name="down" size={14} />
                            </button>
                            <button
                              aria-label={
                                section.visible
                                  ? `Ocultar ${section.title}`
                                  : `Exibir ${section.title}`
                              }
                              className={iconButtonClass}
                              onClick={() =>
                                updateSection(section.id, {
                                  visible: !section.visible,
                                })
                              }
                              type="button"
                            >
                              <EditorIcon
                                name={section.visible ? 'eye' : 'eye-off'}
                                size={14}
                              />
                            </button>
                            <button
                              aria-label={`Excluir ${section.title}`}
                              className={`${iconButtonClass} hover:border-rose-200 hover:text-rose-600`}
                              disabled={doc.sections.length <= 1}
                              onClick={() => removeSection(section.id)}
                              type="button"
                            >
                              <EditorIcon name="trash" size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <p className="mt-3 text-[10px] text-slate-400">
                    {doc.sections.length}/30 seções. Seções ocultas continuam
                    salvas, mas não aparecem no currículo.
                  </p>
                </section>

                {selectedSection && (
                  <section
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
                    key={selectedSection.id}
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          Conteúdo da seção
                        </h2>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Edite o título, o tipo e o conteúdo desta seção.
                        </p>
                      </div>
                      <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                        <input
                          checked={selectedSection.visible}
                          className="size-4 rounded border-slate-300 accent-[#2F4B7C]"
                          onChange={(event) =>
                            updateSection(selectedSection.id, {
                              visible: event.target.checked,
                            })
                          }
                          type="checkbox"
                        />
                        Visível no currículo
                      </label>
                    </div>

                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <Field label="Título da seção">
                        <input
                          className={inputClass}
                          maxLength={120}
                          onChange={(event) =>
                            updateSection(selectedSection.id, {
                              title: event.target.value,
                            })
                          }
                          value={selectedSection.title}
                        />
                      </Field>
                      <Field label="Tipo de conteúdo">
                        <select
                          className={inputClass}
                          onChange={(event) =>
                            changeSectionType(
                              selectedSection,
                              event.target.value as ResumeSectionType,
                            )
                          }
                          value={selectedSection.type}
                        >
                          {sectionTypes.map((type) => {
                            const usedByOther =
                              type !== 'custom' &&
                              doc.sections.some(
                                (section) =>
                                  section.id !== selectedSection.id &&
                                  section.type === type,
                              )

                            return (
                              <option
                                disabled={usedByOther}
                                key={type}
                                value={type}
                              >
                                {sectionLabels[type]}
                                {usedByOther ? ' (já adicionada)' : ''}
                              </option>
                            )
                          })}
                        </select>
                      </Field>
                    </div>

                    <div className="mt-4">
                      {sectionBehavior[selectedSection.type] === 'text' && (
                        <Field
                          hint="Aceita quebras de linha. Máximo de 6.000 caracteres."
                          label="Texto da seção"
                        >
                          <textarea
                            className={textareaClass}
                            maxLength={6000}
                            onChange={(event) =>
                              updateSection(selectedSection.id, {
                                text: event.target.value,
                              })
                            }
                            placeholder="Descreva esta seção do seu currículo."
                            rows={6}
                            value={selectedSection.text}
                          />
                        </Field>
                      )}

                      {sectionBehavior[selectedSection.type] === 'tags' && (
                        <div className="space-y-3">
                          {selectedSection.type === 'languages' ? (
                            <LanguageEditor
                              key={selectedSection.id}
                              onChange={(tags) =>
                                updateSection(selectedSection.id, { tags })
                              }
                              tags={selectedSection.tags}
                            />
                          ) : (
                            <FieldGroup
                              hint="Busque competências técnicas e comportamentais ou adicione as suas."
                              label="Habilidades"
                            >
                              <TagEditor
                                key={selectedSection.id}
                                onChange={(tags) =>
                                  updateSection(selectedSection.id, { tags })
                                }
                                suggestionGroups={skillSuggestionGroups}
                                tags={selectedSection.tags}
                              />
                            </FieldGroup>
                          )}
                          {selectedSection.type === 'skills' && (
                            <Field
                              hint="Aparece logo abaixo das habilidades na pré-visualização A4."
                              label="Observação das habilidades"
                            >
                              <textarea
                                className={textareaClass}
                                maxLength={6000}
                                onChange={(event) =>
                                  updateSection(selectedSection.id, {
                                    text: event.target.value,
                                  })
                                }
                                placeholder="Ex.: liderança de squads, projetos relevantes, certificações..."
                                rows={3}
                                value={selectedSection.text}
                              />
                            </Field>
                          )}
                        </div>
                      )}

                      {sectionBehavior[selectedSection.type] === 'items' && (
                        <div className="space-y-3">
                          {selectedSection.items.map((item, index) => (
                            <div
                              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4"
                              key={item.id}
                            >
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Item {index + 1}
                                </p>
                                <div className="flex items-center gap-1">
                                  <button
                                    aria-label={`Mover item ${index + 1} para cima`}
                                    className={iconButtonClass}
                                    disabled={index === 0}
                                    onClick={() =>
                                      moveItem(selectedSection.id, item.id, -1)
                                    }
                                    type="button"
                                  >
                                    <EditorIcon name="up" size={14} />
                                  </button>
                                  <button
                                    aria-label={`Mover item ${index + 1} para baixo`}
                                    className={iconButtonClass}
                                    disabled={
                                      index === selectedSection.items.length - 1
                                    }
                                    onClick={() =>
                                      moveItem(selectedSection.id, item.id, 1)
                                    }
                                    type="button"
                                  >
                                    <EditorIcon name="down" size={14} />
                                  </button>
                                  <button
                                    aria-label={`Excluir item ${index + 1}`}
                                    className={`${iconButtonClass} hover:border-rose-200 hover:text-rose-600`}
                                    onClick={() =>
                                      removeItem(selectedSection.id, item.id)
                                    }
                                    type="button"
                                  >
                                    <EditorIcon name="trash" size={14} />
                                  </button>
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Título">
                                  <input
                                    className={inputClass}
                                    maxLength={160}
                                    onChange={(event) =>
                                      updateItem(selectedSection.id, item.id, {
                                        title: event.target.value,
                                      })
                                    }
                                    placeholder="Cargo, curso ou projeto"
                                    value={item.title}
                                  />
                                </Field>
                                <Field label="Empresa ou instituição">
                                  <input
                                    className={inputClass}
                                    maxLength={160}
                                    onChange={(event) =>
                                      updateItem(selectedSection.id, item.id, {
                                        organization: event.target.value,
                                      })
                                    }
                                    placeholder="Nome da organização"
                                    value={item.organization}
                                  />
                                </Field>
                                <Field
                                  hint="Cidade, UF ou Remoto. Digite para buscar."
                                  label="Local"
                                >
                                  <SearchCombobox
                                    ariaLabel="Local do item"
                                    inputClassName={inputClass}
                                    maxLength={120}
                                    onChange={(location) =>
                                      updateItem(selectedSection.id, item.id, {
                                        location,
                                      })
                                    }
                                    options={brazilianCities}
                                    placeholder="Cidade, UF ou Remoto"
                                    value={item.location}
                                  />
                                </Field>
                                <div className="grid grid-cols-2 gap-3">
                                  <Field label="Início">
                                    <input
                                      className={inputClass}
                                      onChange={(event) =>
                                        updateItem(selectedSection.id, item.id, {
                                          startDate:
                                            event.target.value || null,
                                        })
                                      }
                                      type="month"
                                      value={item.startDate ?? ''}
                                    />
                                  </Field>
                                  <Field label="Fim">
                                    <input
                                      className={inputClass}
                                      onChange={(event) =>
                                        updateItem(selectedSection.id, item.id, {
                                          endDate: event.target.value || null,
                                        })
                                      }
                                      type="month"
                                      value={item.endDate ?? ''}
                                    />
                                  </Field>
                                </div>
                                <Field
                                  className="sm:col-span-2"
                                  hint="Deixe a data de fim vazia para indicar que ainda continua."
                                  label="Descrição"
                                >
                                  <textarea
                                    className={textareaClass}
                                    maxLength={4000}
                                    onChange={(event) =>
                                      updateItem(selectedSection.id, item.id, {
                                        description: event.target.value,
                                      })
                                    }
                                    placeholder="Atividades, resultados e tecnologias utilizadas."
                                    rows={3}
                                    value={item.description}
                                  />
                                </Field>
                              </div>
                            </div>
                          ))}

                          <button
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:border-[#2F4B7C]/40 hover:text-[#2F4B7C] disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={selectedSection.items.length >= 40}
                            onClick={() => addItem(selectedSection)}
                            type="button"
                          >
                            <EditorIcon name="plus" size={14} />
                            Adicionar item
                          </button>
                          <p className="text-[10px] text-slate-400">
                            {selectedSection.items.length}/40 itens nesta seção.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

              <aside
                className={`min-w-0 ${
                  mobileView === 'edit' ? 'hidden lg:block' : ''
                }`}
              >
                <div className="lg:sticky lg:top-4">
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Pré-visualização A4
                    </p>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      {templateName}
                    </span>
                  </div>
                  <p className="mb-2 px-1 text-[10px] leading-relaxed text-slate-500 lg:hidden">
                    Deslize para os lados para navegar pela folha.
                  </p>
                  <div className="max-w-full overflow-auto rounded-xl border border-slate-200 bg-slate-100/70 p-3 [scrollbar-gutter:stable] lg:p-2 lg:max-h-[calc(100vh-10rem)] xl:p-4">
                    <ResumePreview
                      className="mx-auto"
                      document={doc}
                      pageWidth={A4_PAGE_WIDTH}
                    />
                  </div>
                  <p className="mt-2 px-1 text-center text-[10px] leading-relaxed text-slate-400">
                    A pré-visualização acompanha suas edições em tempo real. O
                    arquivo final pode variar conforme o navegador.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
