/**
 * Client-side model for the resume `document` contract validated by
 * `App\Http\Requests\ResumeRequest`. Every field below exists in the backend
 * rules, so the editor never invents an unsupported structure.
 */

export type ResumeStyle = 'editorial' | 'classic' | 'modern' | 'minimal'

export type ResumeSectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'courses'
  | 'projects'
  | 'certifications'
  | 'awards'
  | 'volunteer'
  | 'publications'
  | 'references'
  | 'custom'

export type ResumeHeadingStyle = 'rule' | 'bar' | 'plain' | 'boxed'
export type ResumeHeaderStyle = 'minimal' | 'split' | 'banner'
export type ResumeBodyAlign = 'left' | 'justify'
export type ResumeNameAlign = 'left' | 'center'
export type ResumeItemLayout = 'stacked' | 'compact'

export type ResumeTheme = {
  fontFamily: string
  fontScale: number
  accentColor: string
  textColor: string
  headingColor: string
  lineHeight: number
  sectionSpacing: number
  pagePadding: number
  headingStyle: ResumeHeadingStyle
  headerStyle: ResumeHeaderStyle
  bodyAlign: ResumeBodyAlign
  nameAlign: ResumeNameAlign
  itemLayout: ResumeItemLayout
  showIcons: boolean
}

export type ResumeHeader = {
  name: string
  headline: string
  email: string | null
  phone: string | null
  location: string | null
  website: string | null
  linkedin: string | null
}

export type ResumeItem = {
  id: string
  title: string
  organization: string
  location: string
  startDate: string | null
  endDate: string | null
  description: string
}

export type ResumeSection = {
  id: string
  type: ResumeSectionType
  title: string
  visible: boolean
  text: string
  layout: string
  tags: string[]
  items: ResumeItem[]
}

export type ResumeDocument = {
  version: 1
  template: ResumeStyle
  theme: ResumeTheme
  header: ResumeHeader
  sections: ResumeSection[]
}

export const resumeStyles: readonly ResumeStyle[] = [
  'classic',
  'editorial',
  'modern',
  'minimal',
]

export const templateOptions: ReadonlyArray<{
  style: ResumeStyle
  name: string
  category: string
}> = [
  { style: 'classic', name: 'Clássico', category: 'Tradicional' },
  { style: 'editorial', name: 'Editorial', category: 'Criativo' },
  { style: 'modern', name: 'Contemporâneo', category: 'Moderno' },
  { style: 'minimal', name: 'Essencial', category: 'Minimalista' },
]

export const sectionTypes: readonly ResumeSectionType[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'languages',
  'courses',
  'projects',
  'certifications',
  'awards',
  'volunteer',
  'publications',
  'references',
  'custom',
]

export const sectionLabels: Record<ResumeSectionType, string> = {
  summary: 'Resumo profissional',
  experience: 'Experiência profissional',
  education: 'Formação acadêmica',
  skills: 'Habilidades',
  languages: 'Idiomas',
  courses: 'Cursos',
  projects: 'Projetos',
  certifications: 'Certificações',
  awards: 'Prêmios e reconhecimentos',
  volunteer: 'Trabalho voluntário',
  publications: 'Publicações',
  references: 'Referências',
  custom: 'Seção personalizada',
}

const legacySectionLabels: Partial<Record<ResumeSectionType, readonly string[]>> = {
  courses: ['Cursos, certificações e projetos'],
}

function canonicalSectionTitle(
  type: ResumeSectionType,
  title: string,
): string {
  const trimmed = title.trim()

  if (!trimmed) return sectionLabels[type]

  const labels = [sectionLabels[type], ...(legacySectionLabels[type] ?? [])]
  const match = labels.find(
    (label) =>
      label.toLocaleLowerCase('pt-BR') === trimmed.toLocaleLowerCase('pt-BR'),
  )

  return match ?? trimmed
}

export function isDefaultSectionTitle(
  type: ResumeSectionType,
  title: string,
): boolean {
  const trimmed = title.trim()

  if (!trimmed) return true

  const labels = [sectionLabels[type], ...(legacySectionLabels[type] ?? [])]

  return labels.some(
    (label) =>
      label.toLocaleLowerCase('pt-BR') === trimmed.toLocaleLowerCase('pt-BR'),
  )
}

type SectionBehavior = 'text' | 'tags' | 'items'

export const sectionBehavior: Record<ResumeSectionType, SectionBehavior> = {
  summary: 'text',
  experience: 'items',
  education: 'items',
  skills: 'tags',
  languages: 'tags',
  courses: 'items',
  projects: 'items',
  certifications: 'items',
  awards: 'items',
  volunteer: 'items',
  publications: 'items',
  references: 'items',
  custom: 'text',
}

export const sectionDefaultLayout: Record<ResumeSectionType, string> = {
  summary: 'default',
  experience: 'timeline',
  education: 'timeline',
  skills: 'chips',
  languages: 'chips',
  courses: 'timeline',
  projects: 'timeline',
  certifications: 'timeline',
  awards: 'timeline',
  volunteer: 'timeline',
  publications: 'timeline',
  references: 'stacked',
  custom: 'default',
}

export const templateThemes: Record<ResumeStyle, ResumeTheme> = {
  editorial: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontScale: 100,
    accentColor: '#2F4B7C',
    textColor: '#1F2937',
    headingColor: '#111827',
    lineHeight: 1.5,
    sectionSpacing: 18,
    pagePadding: 48,
    headingStyle: 'bar',
    headerStyle: 'split',
    bodyAlign: 'left',
    nameAlign: 'left',
    itemLayout: 'stacked',
    showIcons: true,
  },
  classic: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontScale: 100,
    accentColor: '#475569',
    textColor: '#1F2937',
    headingColor: '#0F172A',
    lineHeight: 1.45,
    sectionSpacing: 16,
    pagePadding: 52,
    headingStyle: 'rule',
    headerStyle: 'minimal',
    bodyAlign: 'justify',
    nameAlign: 'center',
    itemLayout: 'stacked',
    showIcons: false,
  },
  modern: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontScale: 100,
    accentColor: '#55736A',
    textColor: '#1F2937',
    headingColor: '#0F172A',
    lineHeight: 1.55,
    sectionSpacing: 20,
    pagePadding: 44,
    headingStyle: 'boxed',
    headerStyle: 'banner',
    bodyAlign: 'left',
    nameAlign: 'left',
    itemLayout: 'compact',
    showIcons: true,
  },
  minimal: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontScale: 100,
    accentColor: '#A67C52',
    textColor: '#334155',
    headingColor: '#111827',
    lineHeight: 1.6,
    sectionSpacing: 24,
    pagePadding: 60,
    headingStyle: 'plain',
    headerStyle: 'minimal',
    bodyAlign: 'left',
    nameAlign: 'left',
    itemLayout: 'stacked',
    showIcons: false,
  },
}

const defaultAccentByStyle: Record<ResumeStyle, string> = {
  editorial: '#2F4B7C',
  classic: '#475569',
  modern: '#55736A',
  minimal: '#A67C52',
}

/** Accent color shown in the resume list thumbnails. */
export function accentForStyle(style: ResumeStyle): string {
  return defaultAccentByStyle[style]
}

let fallbackSequence = 0

export function createId(prefix: string): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : `${Date.now().toString(36)}${(fallbackSequence += 1).toString(36)}`

  return `${prefix}-${suffix}`.slice(0, 64)
}

export function createItem(): ResumeItem {
  return {
    id: createId('item'),
    title: '',
    organization: '',
    location: '',
    startDate: null,
    endDate: null,
    description: '',
  }
}

export function createSection(
  type: ResumeSectionType,
  usedIds: ReadonlySet<string>,
): ResumeSection {
  return {
    id: usedIds.has(type) ? createId(type) : type,
    type,
    title: sectionLabels[type],
    visible: true,
    text: '',
    layout: sectionDefaultLayout[type],
    tags: [],
    items: [],
  }
}

export function createDefaultSections(): ResumeSection[] {
  const used = new Set<string>()
  const sections = (
    [
      'summary',
      'experience',
      'education',
      'skills',
      'languages',
      'courses',
    ] as ResumeSectionType[]
  ).map((type) => {
    const section = createSection(type, used)
    used.add(section.id)
    return section
  })

  return sections
}

export function createEmptyDocument(
  style: ResumeStyle,
  name: string,
  role: string,
): ResumeDocument {
  return {
    version: 1,
    template: style,
    theme: { ...templateThemes[style] },
    header: {
      name,
      headline: role,
      email: null,
      phone: null,
      location: null,
      website: null,
      linkedin: null,
    },
    sections: createDefaultSections(),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function readOptional(value: unknown): string | null {
  const text = readString(value)?.trim()
  return text ? text : null
}

function readNumber(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(maximum, Math.max(minimum, number))
}

function readEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

function readColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value.toUpperCase()
    : fallback
}

function readDate(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}(-(0[1-9]|1[0-2]))?$/.test(value)
    ? value
    : null
}

function normalizeTheme(value: unknown, style: ResumeStyle): ResumeTheme {
  const source = isRecord(value) ? value : {}
  const fallback = templateThemes[style]

  return {
    fontFamily:
      readString(source.fontFamily)?.trim().slice(0, 60) || fallback.fontFamily,
    fontScale: Math.round(readNumber(source.fontScale, fallback.fontScale, 80, 130)),
    accentColor: readColor(source.accentColor, fallback.accentColor),
    textColor: readColor(source.textColor, fallback.textColor),
    headingColor: readColor(source.headingColor, fallback.headingColor),
    lineHeight: readNumber(source.lineHeight, fallback.lineHeight, 1.1, 2),
    sectionSpacing: Math.round(
      readNumber(source.sectionSpacing, fallback.sectionSpacing, 0, 64),
    ),
    pagePadding: Math.round(
      readNumber(source.pagePadding, fallback.pagePadding, 24, 96),
    ),
    headingStyle: readEnum(
      source.headingStyle,
      ['rule', 'bar', 'plain', 'boxed'] as const,
      fallback.headingStyle,
    ),
    headerStyle: readEnum(
      source.headerStyle,
      ['minimal', 'split', 'banner'] as const,
      fallback.headerStyle,
    ),
    bodyAlign: readEnum(
      source.bodyAlign,
      ['left', 'justify'] as const,
      fallback.bodyAlign,
    ),
    nameAlign: readEnum(
      source.nameAlign,
      ['left', 'center'] as const,
      fallback.nameAlign,
    ),
    itemLayout: readEnum(
      source.itemLayout,
      ['stacked', 'compact'] as const,
      fallback.itemLayout,
    ),
    showIcons: typeof source.showIcons === 'boolean' ? source.showIcons : fallback.showIcons,
  }
}

function themeMatches(first: ResumeTheme, second: ResumeTheme): boolean {
  return (Object.keys(second) as Array<keyof ResumeTheme>).every(
    (key) => first[key] === second[key],
  )
}

/**
 * The canonical `style` decides the design. When the stored theme is clearly a
 * copy of another template (for example after changing only the style in the
 * data dialog), the defaults of the current style replace it. Custom themes
 * that do not match any template are preserved.
 */
function themeForStyle(value: unknown, style: ResumeStyle): ResumeTheme {
  const theme = normalizeTheme(value, style)

  if (themeMatches(theme, templateThemes[style])) return theme

  const belongsToAnotherTemplate = resumeStyles.some(
    (candidate) =>
      candidate !== style && themeMatches(theme, templateThemes[candidate]),
  )

  return belongsToAnotherTemplate ? { ...templateThemes[style] } : theme
}

function normalizeItem(
  value: unknown,
  usedIds: Set<string>,
): ResumeItem | null {
  if (!isRecord(value)) return null

  const rawId = readString(value.id)?.trim().slice(0, 64)
  const id = rawId && !usedIds.has(rawId) ? rawId : createId('item')
  usedIds.add(id)

  return {
    id,
    title: readString(value.title)?.slice(0, 160) ?? '',
    organization: readString(value.organization)?.slice(0, 160) ?? '',
    location: readString(value.location)?.slice(0, 120) ?? '',
    startDate: readDate(value.startDate),
    endDate: readDate(value.endDate),
    description: readString(value.description)?.slice(0, 4000) ?? '',
  }
}

function normalizeSection(
  value: unknown,
  usedSectionIds: Set<string>,
  usedItemIds: Set<string>,
): ResumeSection | null {
  if (!isRecord(value)) return null

  const type = readEnum(value.type, sectionTypes, 'custom')
  const rawId = readString(value.id)?.trim().slice(0, 64)
  const id = rawId && !usedSectionIds.has(rawId) ? rawId : createId(type)
  usedSectionIds.add(id)

  const tags = Array.isArray(value.tags)
    ? Array.from(
        new Set(
          value.tags
            .map((tag) => readString(tag)?.trim().slice(0, 60) ?? '')
            .filter((tag) => tag.length > 0),
        ),
      ).slice(0, 80)
    : []

  const items = Array.isArray(value.items)
    ? value.items
        .map((item) => normalizeItem(item, usedItemIds))
        .filter((item): item is ResumeItem => item !== null)
        .slice(0, 40)
    : []

  const title = canonicalSectionTitle(
    type,
    readString(value.title)?.trim().slice(0, 120) ?? '',
  )

  return {
    id,
    type,
    title,
    visible: typeof value.visible === 'boolean' ? value.visible : true,
    text: readString(value.text)?.slice(0, 6000) ?? '',
    layout:
      typeof value.layout === 'string' &&
      /^[a-z][a-z0-9-]{0,31}$/.test(value.layout)
        ? value.layout
        : sectionDefaultLayout[type],
    tags,
    items,
  }
}

/**
 * Turns any stored payload into a document the editor can safely manipulate.
 * Missing or inconsistent fields fall back to the chosen template defaults,
 * and `template` is aligned with the canonical `style` of the resume.
 */
export function normalizeDocument(
  value: unknown,
  style: ResumeStyle,
  fallbackName: string,
  fallbackRole: string,
): ResumeDocument {
  const source = isRecord(value) ? value : {}
  const headerSource = isRecord(source.header) ? source.header : {}
  const usedSectionIds = new Set<string>()
  const usedItemIds = new Set<string>()

  const sections = Array.isArray(source.sections)
    ? source.sections
        .map((section) => normalizeSection(section, usedSectionIds, usedItemIds))
        .filter((section): section is ResumeSection => section !== null)
        .slice(0, 30)
    : []

  return {
    version: 1,
    template: style,
    theme: themeForStyle(source.theme, style),
    header: {
      name: readString(headerSource.name)?.trim().slice(0, 120) || fallbackName,
      headline:
        readString(headerSource.headline)?.trim().slice(0, 160) || fallbackRole,
      email: readOptional(headerSource.email)?.slice(0, 160) ?? null,
      phone: readOptional(headerSource.phone)?.slice(0, 60) ?? null,
      location: readOptional(headerSource.location)?.slice(0, 120) ?? null,
      website: readOptional(headerSource.website)?.slice(0, 160) ?? null,
      linkedin: readOptional(headerSource.linkedin)?.slice(0, 160) ?? null,
    },
    sections: sections.length > 0 ? sections : createDefaultSections(),
  }
}

function withHttpsScheme(value: string | null): string | null {
  if (value === null) return null
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

/**
 * Builds the exact payload accepted by the backend: empty optional contacts
 * become `null` (empty strings fail `url`/`email` styling), empty dates become
 * `null` (they fail the date regex), and URLs without a scheme are completed.
 */
export function documentForSave(document: ResumeDocument): ResumeDocument {
  return {
    ...document,
    header: {
      name: document.header.name.trim(),
      headline: document.header.headline.trim(),
      email: document.header.email?.trim() || null,
      phone: document.header.phone?.trim() || null,
      location: document.header.location?.trim() || null,
      website: withHttpsScheme(document.header.website?.trim() || null),
      linkedin: withHttpsScheme(document.header.linkedin?.trim() || null),
    },
    sections: document.sections.map((section) => ({
      ...section,
      title: canonicalSectionTitle(section.type, section.title.trim()),
      tags: section.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0),
      items: section.items.map((item) => ({
        ...item,
        title: item.title.trim(),
        organization: item.organization.trim(),
        location: item.location.trim(),
        startDate: item.startDate || null,
        endDate: item.endDate || null,
      })),
    })),
  }
}

/**
 * Mirrors the backend chronology check: a year-only value means the first month
 * for a start date and the last month for an end date.
 */
function comparableDate(
  value: string | null,
  defaultMonth: '01' | '12',
): string | null {
  if (!value) return null

  const match = /^(\d{4})(?:-(0[1-9]|1[0-2]))?$/.exec(value)
  if (!match) return null

  return `${match[1]}-${match[2] ?? defaultMonth}`
}

/**
 * Local pre-check with the same constraints that the API enforces, so the user
 * gets immediate feedback before a round trip.
 */
export function validateDocument(document: ResumeDocument): string[] {
  const errors: string[] = []

  if (!document.header.name.trim()) {
    errors.push('Informe o nome que deve aparecer no currículo.')
  }
  if (!document.header.headline.trim()) {
    errors.push('Informe o cargo ou objetivo profissional.')
  }

  for (const url of [document.header.website, document.header.linkedin]) {
    if (url && !/^https?:\/\/\S+$/i.test(url.trim())) {
      errors.push(
        `A URL "${url.trim()}" precisa começar com http:// ou https://.`,
      )
    }
  }

  for (const section of document.sections) {
    if (!section.title.trim()) {
      errors.push('Toda seção precisa de um título.')
      continue
    }

    for (const item of section.items) {
      const start = comparableDate(item.startDate, '01')
      const end = comparableDate(item.endDate, '12')

      if (start && end && start > end) {
        errors.push(
          `Em "${section.title}", a data final de "${item.title || 'um item'}" é anterior à data inicial.`,
        )
      }
    }
  }

  return errors
}

const monthNames = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

export function formatMonth(value: string | null): string {
  if (!value) return ''

  const match = /^(\d{4})(?:-(\d{2}))?$/.exec(value)
  if (!match) return value

  const [, year, month] = match
  if (!month) return year

  return `${monthNames[Number(month) - 1] ?? month}/${year}`
}

export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
): string {
  const start = formatMonth(startDate)
  const end = formatMonth(endDate)

  if (!start && !end) return ''
  if (!start) return `Até ${end}`
  if (!end) return `${start} — Atual`

  return `${start} — ${end}`
}

export function sectionIsEmpty(section: ResumeSection): boolean {
  return (
    section.text.trim().length === 0 &&
    section.tags.length === 0 &&
    section.items.length === 0
  )
}
