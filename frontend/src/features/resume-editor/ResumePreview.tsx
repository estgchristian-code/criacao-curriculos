import type { CSSProperties } from 'react'
import {
  formatDateRange,
  sectionIsEmpty,
  type ResumeDocument,
  type ResumeItem,
  type ResumeTheme,
} from '../../lib/resume-document'

export const A4_PAGE_WIDTH = 794 // A4 width at 96 dpi, used as the container-query base.

/**
 * Converts a pixel value designed for a 794px-wide A4 page into container query
 * units. The preview then scales smoothly with its panel without measuring the
 * DOM or re-rendering on resize.
 */
function unit(px: number): string {
  return `${((px / A4_PAGE_WIDTH) * 100).toFixed(3)}cqw`
}

/**
 * Ajuste fino da tipografia da folha A4. As fontes crescem 12% em relação ao
 * desenho original de 794px, mantendo a hierarquia entre nome, títulos,
 * subtítulos e corpo do currículo.
 */
const FONT_SCALE = 1.12

/**
 * Espaçamentos ligados ao texto (margens entre blocos, lacunas e paddings de
 * destaques) acompanham o aumento tipográfico em escala menor, evitando que o
 * conteúdo fique apertado sem alterar as margens estruturais da página.
 */
const SPACING_SCALE = 1.08

function textSize(px: number): string {
  return unit(px * FONT_SCALE)
}

function textSpace(px: number): string {
  return unit(px * SPACING_SCALE)
}

function displayUrl(value: string | null): string {
  return value?.replace(/^https?:\/\//i, '').replace(/\/$/, '') ?? ''
}

function contactList(document: ResumeDocument): string[] {
  const { header } = document

  return [
    header.email,
    header.phone,
    header.location,
    displayUrl(header.website),
    displayUrl(header.linkedin),
  ].filter((value): value is string => Boolean(value && value.trim()))
}

function sectionHeadingStyle(theme: ResumeTheme): CSSProperties {
  const base: CSSProperties = {
    fontSize: textSize(13),
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: theme.headingColor,
    lineHeight: 1.2,
  }

  switch (theme.headingStyle) {
    case 'rule':
      return {
        ...base,
        borderBottom: `${unit(1)} solid ${theme.accentColor}`,
        paddingBottom: textSpace(4),
        marginBottom: textSpace(8),
      }
    case 'bar':
      return {
        ...base,
        borderLeft: `${unit(3)} solid ${theme.accentColor}`,
        paddingLeft: textSpace(8),
        marginBottom: textSpace(8),
      }
    case 'boxed':
      return {
        ...base,
        backgroundColor: `${theme.accentColor}1A`,
        borderRadius: unit(3),
        padding: `${textSpace(4)} ${textSpace(8)}`,
        marginBottom: textSpace(8),
      }
    case 'plain':
    default:
      return { ...base, marginBottom: textSpace(8) }
  }
}

function ItemBlock({
  item,
  theme,
}: {
  item: ResumeItem
  theme: ResumeTheme
}) {
  const dates = formatDateRange(item.startDate, item.endDate)
  const hasTitle = item.title.trim().length > 0
  const hasOrganization = item.organization.trim().length > 0
  const secondary = [hasTitle ? item.organization : '', item.location]
    .filter((value) => value.trim().length > 0)
    .join(' · ')
  const heading = hasTitle ? item.title : item.organization

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: textSpace(12),
        }}
      >
        <p
          style={{
            color: theme.headingColor,
            fontSize: textSize(12),
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {heading || ' '}
        </p>
        {dates && (
          <span
            style={{
              color: '#6B7280',
              flexShrink: 0,
              fontSize: textSize(10),
              whiteSpace: 'nowrap',
            }}
          >
            {dates}
          </span>
        )}
      </div>
      {(hasOrganization || item.location.trim()) && (
        <p
          style={{
            color: theme.accentColor,
            fontSize: textSize(10.5),
            fontWeight: 500,
            marginTop: textSpace(1),
          }}
        >
          {secondary}
        </p>
      )}
      {item.description.trim() && (
        <p
          style={{
            fontSize: textSize(11),
            lineHeight: theme.lineHeight,
            marginTop: textSpace(3),
            textAlign: theme.bodyAlign,
            whiteSpace: 'pre-line',
          }}
        >
          {item.description}
        </p>
      )}
    </div>
  )
}

function SectionBlock({
  document,
  sectionId,
}: {
  document: ResumeDocument
  sectionId: string
}) {
  const section = document.sections.find((item) => item.id === sectionId)
  if (!section) return null

  const { theme } = document
  const hasText = section.text.trim().length > 0
  const hasTags = section.tags.length > 0
  const isLanguages = section.type === 'languages'
  // Idiomas exibem apenas as tags de proficiência; a observação não entra no A4.
  const textAsNote =
    hasText && !isLanguages && (section.type === 'skills' || hasTags)
  const textAsBody = hasText && !textAsNote && !isLanguages
  const noteLabel =
    section.type === 'skills' ? 'Observações das habilidades' : 'Observações'
  const bodyStyle: CSSProperties = {
    fontSize: textSize(11),
    lineHeight: theme.lineHeight,
    textAlign: theme.bodyAlign,
    whiteSpace: 'pre-line',
  }

  return (
    <section style={{ marginBottom: unit(theme.sectionSpacing) }}>
      <h2 style={sectionHeadingStyle(theme)}>{section.title || ' '}</h2>

      {textAsBody && <p style={bodyStyle}>{section.text}</p>}

      {hasTags && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: textSpace(5),
            marginTop: textAsBody ? textSpace(6) : 0,
          }}
        >
          {section.tags.map((tag) => (
            <span
              key={tag}
              style={{
                backgroundColor: `${theme.accentColor}12`,
                border: `${unit(0.75)} solid ${theme.accentColor}40`,
                borderRadius: unit(3),
                color: theme.textColor,
                fontSize: textSize(10),
                lineHeight: 1.3,
                padding: `${textSpace(2.5)} ${textSpace(7)}`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {textAsNote && (
        <div
          style={{
            backgroundColor: `${theme.accentColor}0A`,
            borderLeft: `${unit(2)} solid ${theme.accentColor}66`,
            borderRadius: unit(3),
            marginTop: textSpace(6),
            padding: `${textSpace(5)} ${textSpace(8)}`,
          }}
        >
          <p
            style={{
              color: theme.accentColor,
              fontSize: textSize(9),
              fontWeight: 700,
              letterSpacing: '0.08em',
              lineHeight: 1.3,
              marginBottom: textSpace(2),
              textTransform: 'uppercase',
            }}
          >
            {noteLabel}
          </p>
          <p style={{ ...bodyStyle, textAlign: 'left' }}>{section.text}</p>
        </div>
      )}

      {section.items.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: textSpace(theme.itemLayout === 'compact' ? 8 : 12),
            marginTop: hasText || hasTags ? textSpace(6) : 0,
          }}
        >
          {section.items.map((item) => (
            <ItemBlock item={item} key={item.id} theme={theme} />
          ))}
        </div>
      )}
    </section>
  )
}

function DocumentHeader({ document }: { document: ResumeDocument }) {
  const { header, theme } = document
  const contacts = contactList(document)
  const nameStyle: CSSProperties = {
    color: theme.headingColor,
    fontSize: textSize(28),
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    textAlign: theme.nameAlign,
  }
  const headlineStyle: CSSProperties = {
    color: theme.accentColor,
    fontSize: textSize(14),
    fontWeight: 500,
    marginTop: textSpace(4),
    textAlign: theme.nameAlign,
  }
  const contactStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${textSpace(3)} ${textSpace(12)}`,
    // Informações de contato têm leitura própria: ~13,4px reais na folha de 794px.
    fontSize: textSize(12),
    lineHeight: 1.4,
  }

  if (theme.headerStyle === 'banner') {
    return (
      <header
        style={{
          backgroundColor: theme.accentColor,
          color: '#FFFFFF',
          marginBottom: textSpace(20),
          marginLeft: unit(-theme.pagePadding),
          marginRight: unit(-theme.pagePadding),
          marginTop: unit(-theme.pagePadding),
          padding: `${textSpace(24)} ${unit(theme.pagePadding)}`,
        }}
      >
        <h1
          style={{
            color: '#FFFFFF',
            fontSize: textSize(30),
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            textAlign: theme.nameAlign,
          }}
        >
          {header.name}
        </h1>
        <p
          style={{
            fontSize: textSize(14),
            marginTop: textSpace(4),
            opacity: 0.9,
            textAlign: theme.nameAlign,
          }}
        >
          {header.headline}
        </p>
        {contacts.length > 0 && (
          <div
            style={{
              ...contactStyle,
              color: '#FFFFFF',
              justifyContent:
                theme.nameAlign === 'center' ? 'center' : 'flex-start',
              marginTop: textSpace(10),
              opacity: 0.95,
            }}
          >
            {contacts.map((contact, index) => (
              <span key={`${contact}-${index}`}>{contact}</span>
            ))}
          </div>
        )}
      </header>
    )
  }

  if (theme.headerStyle === 'split') {
    return (
      <header
        style={{
          alignItems: 'flex-end',
          borderBottom: `${unit(1.5)} solid ${theme.accentColor}`,
          display: 'flex',
          gap: textSpace(16),
          justifyContent: 'space-between',
          marginBottom: textSpace(20),
          paddingBottom: textSpace(12),
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...nameStyle, textAlign: theme.nameAlign }}>{header.name}</h1>
          <p style={{ ...headlineStyle, textAlign: theme.nameAlign }}>{header.headline}</p>
        </div>
        {contacts.length > 0 && (
          <div
            style={{
              ...contactStyle,
              color: '#475569',
              flexDirection: 'column',
              flexShrink: 0,
              gap: textSpace(3),
              textAlign: 'right',
            }}
          >
            {contacts.map((contact, index) => (
              <span key={`${contact}-${index}`}>{contact}</span>
            ))}
          </div>
        )}
      </header>
    )
  }

  return (
    <header style={{ marginBottom: textSpace(20) }}>
      <h1 style={nameStyle}>{header.name}</h1>
      <p style={headlineStyle}>{header.headline}</p>
      {contacts.length > 0 && (
        <div
          style={{
            ...contactStyle,
            color: '#475569',
            justifyContent:
              theme.nameAlign === 'center' ? 'center' : 'flex-start',
            marginTop: textSpace(8),
          }}
        >
          {contacts.map((contact, index) => (
            <span key={`${contact}-${index}`}>
              {theme.showIcons && index > 0 && (
                <span style={{ color: theme.accentColor, marginRight: textSpace(6) }}>
                  •
                </span>
              )}
              {contact}
            </span>
          ))}
        </div>
      )}
    </header>
  )
}

export function ResumePreview({
  document,
  className = '',
  pageWidth,
}: {
  document: ResumeDocument
  className?: string
  pageWidth?: number
}) {
  const { theme } = document
  const visibleSections = document.sections.filter(
    (section) => section.visible && !sectionIsEmpty(section),
  )
  const hasContacts = contactList(document).length > 0
  const isEmpty = visibleSections.length === 0 && !hasContacts

  return (
    <div
      className={className}
      style={{
        containerType: 'inline-size',
        width: pageWidth ? `${pageWidth}px` : undefined,
      }}
    >
      <article
        aria-label="Pré-visualização do currículo em formato A4"
        className="mx-auto w-full bg-white ring-1 ring-slate-200/80"
        style={{
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.10)',
          boxSizing: 'border-box',
          color: theme.textColor,
          fontFamily: theme.fontFamily,
          fontSize: textSize(11 * (theme.fontScale / 100)),
          lineHeight: theme.lineHeight,
          minHeight: `${((297 / 210) * 100).toFixed(3)}cqw`,
          overflow: 'hidden',
          padding: unit(theme.pagePadding),
        }}
      >
        <DocumentHeader document={document} />

        {isEmpty ? (
          <div
            style={{
              alignItems: 'center',
              border: `${unit(1)} dashed #CBD5E1`,
              borderRadius: unit(4),
              color: '#94A3B8',
              display: 'flex',
              fontSize: textSize(11),
              justifyContent: 'center',
              marginTop: unit(theme.pagePadding),
              padding: `${unit(30)} ${unit(16)}`,
              textAlign: 'center',
            }}
          >
            Preencha seus dados e adicione conteúdo às seções para ver o
            currículo aqui.
          </div>
        ) : (
          visibleSections.map((section) => (
            <SectionBlock
              document={document}
              key={section.id}
              sectionId={section.id}
            />
          ))
        )}
      </article>
    </div>
  )
}
