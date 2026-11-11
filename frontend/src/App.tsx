import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  ApiError,
  createResume,
  deleteResume,
  getCurrentUser,
  listResumes,
  login,
  logout,
  register,
  updateResume,
  type ApiResume,
  type ApiUser,
} from './lib/api'

type IconName =
  | 'arrow-up-right'
  | 'briefcase'
  | 'close'
  | 'chevron-down'
  | 'clock'
  | 'file'
  | 'grid'
  | 'menu'
  | 'more'
  | 'plus'
  | 'search'
  | 'sparkles'

const iconPaths: Record<IconName, ReactNode> = {
  'arrow-up-right': (
    <>
      <path d="M7 17 17 7M7 7h10v10" />
    </>
  ),
  close: <path d="m18 6-12 12M6 6l12 12" />,
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
    </>
  ),
  'chevron-down': <path d="m7 10 5 5 5-5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
      <path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" />
    </>
  ),
}

function Icon({
  name,
  size = 18,
  className = '',
}: {
  name: IconName
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
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      width={size}
    >
      {iconPaths[name]}
    </svg>
  )
}

type ResumeStyle = 'editorial' | 'classic' | 'modern' | 'minimal'

type Resume = ApiResume

type Template = { name: string; category: string; style: ResumeStyle }

const templates: Template[] = [
  { name: 'Clássico', category: 'Tradicional', style: 'classic' },
  { name: 'Editorial', category: 'Criativo', style: 'editorial' },
  { name: 'Contemporâneo', category: 'Moderno', style: 'modern' },
  { name: 'Essencial', category: 'Minimalista', style: 'minimal' },
]

const accentColors: Record<ResumeStyle, string> = {
  editorial: '#2F4B7C',
  classic: '#475569',
  modern: '#55736A',
  minimal: '#A67C52',
}

type Dialog =
  | { type: 'create'; template?: Template; resume?: Resume }
  | { type: 'resume'; resume: Resume }
  | { type: 'template'; template: Template }
  | { type: 'all-resumes' }
  | { type: 'account' }
  | { type: 'delete'; resume: Resume }

function formatUpdatedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'

  return `Atualizado em ${new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)}`
}

function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 401) {
    return 'Sua sessão expirou ou não está autenticada. Entre novamente para continuar.'
  }

  return error instanceof Error ? error.message : fallback
}

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <a
      aria-label="ResumeBuilder — início"
      className="flex items-center gap-3"
      href="#overview"
      onClick={onClick}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-[#2F4B7C] text-white shadow-sm">
        <Icon name="file" size={19} />
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.04em] text-[#111827]">
        Resume<span className="text-[#2F4B7C]">Builder</span>
      </span>
    </a>
  )
}

function Navigation({
  activeSection,
  onNavigate,
}: {
  activeSection: string
  onNavigate?: (section: string) => void
}) {
  const links: { label: string; href: string; icon: IconName }[] = [
    { label: 'Visão geral', href: '#overview', icon: 'grid' },
    { label: 'Meus currículos', href: '#resumes', icon: 'file' },
    { label: 'Modelos', href: '#templates', icon: 'briefcase' },
  ]

  return (
    <nav aria-label="Navegação principal" className="space-y-1.5">
      {links.map((link) => (
        <a
          aria-current={activeSection === link.href.slice(1) ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
            activeSection === link.href.slice(1)
              ? 'bg-[#2F4B7C]/[0.08] text-[#2F4B7C]'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
          href={link.href}
          key={link.label}
          onClick={() => onNavigate?.(link.href.slice(1))}
        >
          <Icon name={link.icon} size={18} />
          {link.label}
        </a>
      ))}
    </nav>
  )
}

function Sidebar({
  activeSection,
  onNavigate,
  mobileProfile,
}: {
  activeSection: string
  onNavigate: (section: string) => void
  mobileProfile: ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = (section: string) => {
    onNavigate(section)
    setMobileOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white px-5 lg:hidden">
        <Logo onClick={() => navigate('overview')} />
        <div className="flex items-center gap-2">
          {mobileProfile}
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            type="button"
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-slate-200/80 bg-white px-5 py-6 lg:flex">
        <Logo onClick={() => onNavigate('overview')} />
        <p className="mb-3 mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
          Workspace
        </p>
        <Navigation activeSection={activeSection} onNavigate={navigate} />
        <div className="mt-auto rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white text-[#2F4B7C] shadow-sm ring-1 ring-slate-200/70">
            <Icon name="sparkles" size={16} />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-800">
            Um bom currículo abre portas
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Escolha um modelo claro, objetivo e pronto para sistemas ATS.
          </p>
          <a
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2F4B7C] hover:underline"
            href="#templates"
            onClick={() => navigate('templates')}
          >
            Explorar modelos <Icon name="arrow-up-right" size={13} />
          </a>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-[68px] z-40 border-b border-slate-200 bg-white px-5 py-4 shadow-lg lg:hidden">
          <Navigation activeSection={activeSection} onNavigate={navigate} />
        </div>
      )}
    </>
  )
}

function Profile({
  user,
  onOpenAccount,
  onLogin,
  onRegister,
  onLogout,
  logoutPending,
}: {
  user: ApiUser | null
  onOpenAccount: () => void
  onLogin: () => void
  onRegister: () => void
  onLogout: () => void
  logoutPending: boolean
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  return (
    <div
      className="relative"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
      ref={menuRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Perfil do usuário"
        className="flex items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-[#E8EDF5] text-xs font-semibold text-[#2F4B7C]">
          {user?.name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toLocaleUpperCase('pt-BR'))
            .join('') || '—'}
        </span>
        <span className="hidden sm:block">
          <span className="block text-xs font-semibold text-slate-800">
            {user?.name ?? 'Minha conta'}
          </span>
          <span className="mt-0.5 block text-[11px] text-slate-500">
            {user ? 'Sessão ativa' : 'Sessão não conectada'}
          </span>
        </span>
        <Icon className="hidden text-slate-400 sm:block" name="chevron-down" size={15} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
          role="menu"
        >
          <p className="px-3 py-2 text-[11px] text-slate-500">
            {user ? user.email : 'Nenhuma sessão autenticada'}
          </p>
          <button
            className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setOpen(false)
              onOpenAccount()
            }}
            role="menuitem"
            type="button"
          >
            {user ? 'Dados da conta' : 'Status da sessão'}
          </button>
          {user ? (
            <button
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              disabled={logoutPending}
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
              role="menuitem"
              type="button"
            >
              {logoutPending ? 'Saindo…' : 'Sair da conta'}
            </button>
          ) : (
            <>
              <button
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setOpen(false)
                  onLogin()
                }}
                role="menuitem"
                type="button"
              >
                Entrar
              </button>
              <button
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setOpen(false)
                  onRegister()
                }}
                role="menuitem"
                type="button"
              >
                Criar conta
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: IconName
  label: string
  value: string
  detail: string
}) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
          <Icon name={icon} size={16} />
        </span>
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight text-[#111827]">
        {value}
      </p>
      <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
    </article>
  )
}

function ResumeThumbnail({ style }: { style: ResumeStyle }) {
  const accent = accentColors[style]

  return (
    <div
      aria-label={`Prévia de currículo no estilo ${style}`}
      className={`flex h-[164px] items-end justify-center overflow-hidden px-5 pt-4 sm:h-[174px] ${
        style === 'editorial'
          ? 'bg-[#F0F3F8]'
          : style === 'modern'
            ? 'bg-[#F0F3F2]'
            : style === 'minimal'
              ? 'bg-[#F6F2EE]'
              : 'bg-[#F1F2F4]'
      }`}
      role="img"
    >
      <div className="flex h-[145px] w-[67%] max-w-[190px] overflow-hidden rounded-t-[3px] bg-white shadow-[0_3px_12px_rgba(15,23,42,0.10)]">
        {style === 'editorial' && (
          <div className="w-[30%] shrink-0 bg-[#2F4B7C] px-2.5 pt-3">
            <div className="mx-auto size-7 rounded-full bg-white/25" />
            <div className="mt-3 h-1 w-full rounded bg-white/75" />
            <div className="mt-1.5 h-1 w-4/5 rounded bg-white/40" />
            <div className="mt-4 h-1 w-3/4 rounded bg-white/70" />
            <div className="mt-1.5 h-1 w-full rounded bg-white/35" />
            <div className="mt-1.5 h-1 w-4/5 rounded bg-white/35" />
          </div>
        )}
        <div className="min-w-0 flex-1 px-3.5 pt-3.5">
          <div
            className={`h-[3px] w-8 rounded-full ${style === 'minimal' ? 'mb-2' : 'mb-1.5'}`}
            style={{ backgroundColor: accent }}
          />
          <div className="h-[5px] w-[72%] rounded-[2px] bg-slate-700/80" />
          <div className="mt-1.5 h-[3px] w-[54%] rounded bg-slate-400/70" />
          <div className="mt-2.5 flex gap-1">
            <div className="h-[2px] w-1/3 rounded bg-slate-300" />
            <div className="h-[2px] w-1/3 rounded bg-slate-200" />
          </div>
          <div
            className="mb-1.5 mt-3 h-[3px] w-[38%] rounded"
            style={{ backgroundColor: `${accent}B3` }}
          />
          <div className="space-y-1.5">
            <div className="h-[2px] w-full rounded bg-slate-200" />
            <div className="h-[2px] w-[91%] rounded bg-slate-200" />
            <div className="h-[2px] w-[96%] rounded bg-slate-200" />
          </div>
          <div
            className="mb-1.5 mt-3 h-[3px] w-[42%] rounded"
            style={{ backgroundColor: `${accent}B3` }}
          />
          <div className="space-y-1.5">
            <div className="h-[2px] w-[95%] rounded bg-slate-200" />
            <div className="h-[2px] w-[82%] rounded bg-slate-200" />
            <div className="h-[2px] w-[89%] rounded bg-slate-200" />
          </div>
          <div className="mt-3 flex gap-1">
            <div className="h-2 w-7 rounded-sm bg-slate-100" />
            <div className="h-2 w-8 rounded-sm bg-slate-100" />
            <div className="h-2 w-6 rounded-sm bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ResumeCard({
  resume,
  onOpen,
  onEdit,
  onDelete,
}: {
  resume: Resume
  onOpen: (resume: Resume) => void
  onEdit: (resume: Resume) => void
  onDelete: (resume: Resume) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [menuOpen])

  const runAction = (action: (resume: Resume) => void) => {
    setMenuOpen(false)
    action(resume)
  }

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200/80 bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="relative">
        <ResumeThumbnail style={resume.style} />
        <div
          className="absolute right-3 top-3"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setMenuOpen(false)
          }}
          ref={menuRef}
        >
          <button
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Mais opções para ${resume.role}`}
            className="flex size-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white/95 text-slate-500 opacity-100 shadow-sm transition-colors hover:text-slate-800 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            <Icon name="more" size={17} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
              role="menu"
            >
              <button
                className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                onClick={() => runAction(onOpen)}
                role="menuitem"
                type="button"
              >
                Visualizar
              </button>
              <button
                className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                onClick={() => runAction(onEdit)}
                role="menuitem"
                type="button"
              >
                Editar
              </button>
              <button
                className="w-full rounded-lg px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"
                onClick={() => runAction(onDelete)}
                role="menuitem"
                type="button"
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold text-slate-800">
            {resume.role}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{resume.name}</p>
          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
            <Icon name="clock" size={12} />
            {formatUpdatedAt(resume.updated_at)}
          </p>
        </div>
        <button
          aria-label={`Abrir currículo ${resume.role}`}
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-[#2F4B7C] focus:bg-slate-50 focus:text-[#2F4B7C]"
          onClick={() => onOpen(resume)}
          type="button"
        >
          <Icon name="arrow-up-right" size={16} />
        </button>
      </div>
    </article>
  )
}

function TemplateCard({
  template,
  onOpen,
}: {
  template: Template
  onOpen: (template: Template) => void
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200/80 bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <ResumeThumbnail style={template.style} />
      <div className="flex items-center justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-semibold text-slate-800">{template.name}</h3>
          <p className="mt-1 text-[10px] text-slate-500">{template.category} · Compatível com ATS</p>
        </div>
        <button
          aria-label={`Ver modelo ${template.name}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-[#2F4B7C] focus:bg-slate-50 focus:text-[#2F4B7C]"
          onClick={() => onOpen(template)}
          type="button"
        >
          <Icon name="arrow-up-right" size={15} />
        </button>
      </div>
    </article>
  )
}

function SectionHeading({
  title,
  description,
  href,
  action,
  onAction,
  onNavigate,
}: {
  title: string
  description: string
  href: string
  action: string
  onAction?: () => void
  onNavigate?: () => void
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-[#111827]">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      {onAction ? (
        <button
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#2F4B7C] hover:underline"
          onClick={onAction}
          type="button"
        >
          {action} <Icon name="arrow-up-right" size={14} />
        </button>
      ) : (
        <a
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#2F4B7C] hover:underline"
          href={href}
          onClick={onNavigate}
        >
          {action} <Icon name="arrow-up-right" size={14} />
        </a>
      )}
    </div>
  )
}

function SearchInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative w-full max-w-[320px]">
      <Icon
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        name="search"
        size={16}
      />
      <input
        aria-label="Buscar"
        className="h-9 w-full rounded-lg border border-slate-200/80 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#2F4B7C]/40"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar currículos ou modelos"
        type="search"
        value={value}
      />
    </div>
  )
}

function DialogFrame({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <section
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="my-auto max-h-[min(90vh,760px)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-900" id="dialog-title">
            {title}
          </h2>
          <button
            aria-label="Fechar"
            className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={17} />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  )
}

function CreateResumeForm({
  resume,
  template,
  onSaved,
  onUnauthorized,
}: {
  resume?: Resume
  template?: Template
  onSaved: (resume: Resume) => void
  onUnauthorized: () => void
}) {
  const [name, setName] = useState(resume?.name ?? '')
  const [role, setRole] = useState(resume?.role ?? '')
  const [selectedTemplate, setSelectedTemplate] = useState(
    resume?.style ?? template?.style ?? templates[0].style,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const input = { name, role, style: selectedTemplate }
      const saved = resume
        ? await updateResume(resume.id, input)
        : await createResume(input)
      onSaved(saved)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onUnauthorized()
        return
      }
      setError(getRequestErrorMessage(requestError, 'Não foi possível salvar o currículo.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-xs leading-relaxed text-slate-500">
        {resume
          ? 'Edite os dados do currículo. As alterações serão enviadas à sua conta autenticada.'
          : 'Preencha os dados para criar um currículo na sua conta autenticada.'}
      </p>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-slate-700">Seu nome</span>
        <input
          autoFocus
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#2F4B7C]/50"
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
          placeholder="Como deseja aparecer no currículo"
          required
          value={name}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-slate-700">Cargo ou objetivo profissional</span>
        <input
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#2F4B7C]/50"
          maxLength={120}
          onChange={(event) => setRole(event.target.value)}
          placeholder="Ex.: Product Designer"
          required
          value={role}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-slate-700">Modelo</span>
        <select
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#2F4B7C]/50"
          onChange={(event) => {
            const selected = templates.find((item) => item.style === event.target.value)
            if (selected) setSelectedTemplate(selected.style)
          }}
          value={selectedTemplate}
        >
          {templates.map((item) => (
            <option key={item.style} value={item.style}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end pt-1">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2F4B7C] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#263F69] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          <Icon name="file" size={15} />
          {saving ? 'Salvando…' : resume ? 'Atualizar currículo' : 'Criar currículo'}
        </button>
      </div>
    </form>
  )
}

function ResumeDetails({ resume }: { resume: Resume }) {
  return (
    <div className="space-y-4">
      <ResumeThumbnail style={resume.style} />
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{resume.role}</h3>
        <p className="mt-1 text-xs text-slate-500">{resume.name}</p>
          <p className="mt-2 text-[11px] text-slate-400">{formatUpdatedAt(resume.updated_at)}</p>
      </div>
      <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
          Esta visualização usa os dados persistidos deste currículo. Experiências, formação e
          outras seções detalhadas ainda não fazem parte do modelo de dados.
      </p>
    </div>
  )
}

function TemplateDetails({
  template,
  onUse,
}: {
  template: Template
  onUse: () => void
}) {
  return (
    <div className="space-y-4">
      <ResumeThumbnail style={template.style} />
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
        <p className="mt-1 text-xs text-slate-500">{template.category} · Compatível com ATS</p>
      </div>
      <p className="text-xs leading-relaxed text-slate-600">
        A prévia é ilustrativa. O modelo escolhido é salvo no currículo junto com os seus dados.
      </p>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2F4B7C] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#263F69]"
        onClick={onUse}
        type="button"
      >
        <Icon name="plus" size={16} />
        Começar com este modelo
      </button>
    </div>
  )
}

function AllResumesList({
  items,
  onOpen,
  emptyMessage,
}: {
  items: Resume[]
  onOpen: (resume: Resume) => void
  emptyMessage: string
}) {
  return (
    <div className="space-y-2">
      <p className="mb-3 text-xs text-slate-500">
        Lista completa dos currículos retornados pela sua conta.
      </p>
      {items.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        items.map((resume) => (
          <button
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-[#2F4B7C]/30 hover:bg-slate-50"
            key={resume.id}
            onClick={() => onOpen(resume)}
            type="button"
          >
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-slate-800">{resume.role}</span>
              <span className="mt-1 block text-[11px] text-slate-500">
                {resume.name} · {formatUpdatedAt(resume.updated_at)}
              </span>
            </span>
            <Icon className="shrink-0 text-slate-400" name="arrow-up-right" size={16} />
          </button>
        ))
      )}
    </div>
  )
}

function AuthScreen({
  mode,
  initialError,
  onModeChange,
  onAuthenticated,
}: {
  mode: 'login' | 'register'
  initialError: string | null
  onModeChange: (mode: 'login' | 'register') => void
  onAuthenticated: (user: ApiUser) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string | null>(initialError)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const user =
        mode === 'register'
          ? await register({
              name: name.trim(),
              email: email.trim(),
              password,
              password_confirmation: passwordConfirmation,
            })
          : await login({ email: email.trim(), password })
      await onAuthenticated(user)
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Não foi possível autenticar.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#2F4B7C] text-white shadow-sm">
            <Icon name="file" size={20} />
          </span>
          <span className="text-lg font-semibold tracking-[-0.04em] text-[#111827]">
            Resume<span className="text-[#2F4B7C]">Builder</span>
          </span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {mode === 'login'
            ? 'Acesse seus currículos salvos.'
            : 'Cadastre-se para criar e gerenciar seus currículos.'}
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700">Nome</span>
              <input
                autoComplete="name"
                autoFocus
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#2F4B7C]/50"
                maxLength={255}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
          )}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-700">E-mail</span>
            <input
              autoComplete="email"
              autoFocus={mode === 'login'}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#2F4B7C]/50"
              maxLength={255}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-700">Senha</span>
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#2F4B7C]/50"
              maxLength={255}
              minLength={mode === 'register' ? 8 : undefined}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {mode === 'register' && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700">Confirme a senha</span>
              <input
                autoComplete="new-password"
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#2F4B7C]/50"
                maxLength={255}
                minLength={8}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
                type="password"
                value={passwordConfirmation}
              />
            </label>
          )}
          {error && (
            <p
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800"
              role="alert"
            >
              {error}
            </p>
          )}
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#2F4B7C] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#263F69] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting
              ? 'Aguarde…'
              : mode === 'login'
                ? 'Entrar'
                : 'Criar conta'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          {mode === 'login' ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'}{' '}
          <button
            className="font-semibold text-[#2F4B7C] hover:underline"
            onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
            type="button"
          >
            {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
          </button>
        </p>
      </section>
    </main>
  )
}

function App() {
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<ApiUser | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authError, setAuthError] = useState<string | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'unauthenticated' | 'error'>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [today] = useState(() => new Date())
  const [activeSection, setActiveSection] = useState(() => {
    const section = window.location.hash.slice(1)
    return ['overview', 'resumes', 'templates'].includes(section) ? section : 'overview'
  })

  function handleSessionExpired() {
    setUser(null)
    setResumes([])
    setLoadState('unauthenticated')
    setLoadError(null)
    setAuthMode('login')
    setAuthError('Sua sessão expirou. Entre novamente para continuar.')
    setDialog(null)
  }

  async function loadAccount() {
    let currentUser: ApiUser

    try {
      currentUser = await getCurrentUser()
    } catch (requestError) {
      setUser(null)
      setResumes([])
      if (requestError instanceof ApiError && requestError.status === 401) {
        setLoadState('unauthenticated')
        setLoadError(null)
      } else {
        setLoadState('error')
        setLoadError(
          getRequestErrorMessage(requestError, 'Não foi possível verificar sua sessão.'),
        )
      }
      return
    }

    setUser(currentUser)

    try {
      const currentResumes = await listResumes()
      setResumes(currentResumes)
      setLoadState('ready')
      setLoadError(null)
    } catch (requestError) {
      setResumes([])

      if (requestError instanceof ApiError && requestError.status === 401) {
        handleSessionExpired()
        return
      }

      setLoadState('error')
      setLoadError(getRequestErrorMessage(requestError, 'Não foi possível carregar os currículos.'))
    }
  }

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) return loadAccount()
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function syncActiveSection() {
      const section = window.location.hash.slice(1)
      if (['overview', 'resumes', 'templates'].includes(section)) {
        setActiveSection(section)
      }
    }

    window.addEventListener('hashchange', syncActiveSection)
    return () => window.removeEventListener('hashchange', syncActiveSection)
  }, [])

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('pt-BR')
  const visibleResumes = resumes.filter((resume) =>
    `${resume.name} ${resume.role}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
  )
  const visibleTemplates = templates.filter((template) =>
    `${template.name} ${template.category}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
  )

  async function handleAuthenticated(authenticatedUser: ApiUser) {
    setUser(authenticatedUser)
    setLoadState('loading')
    setLoadError(null)
    setAuthError(null)
    try {
      const currentResumes = await listResumes()
      setResumes(currentResumes)
      setLoadState('ready')
      setStatusMessage(`Bem-vindo, ${authenticatedUser.name.split(' ')[0]}!`)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        setUser(null)
        setResumes([])
        setLoadState('unauthenticated')
        setAuthError(getRequestErrorMessage(requestError, 'Sua sessão expirou.'))
        return
      }

      setLoadState('error')
      setLoadError(getRequestErrorMessage(requestError, 'Não foi possível carregar os currículos.'))
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    setAuthError(null)
    try {
      await logout()
      setUser(null)
      setResumes([])
      setLoadState('unauthenticated')
      setLoadError(null)
      setAuthMode('login')
      setStatusMessage(null)
      setDialog(null)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        setUser(null)
        setResumes([])
        setLoadState('unauthenticated')
        setAuthMode('login')
        setAuthError('Sua sessão já havia expirado. Entre novamente para continuar.')
      } else {
        setAuthError(getRequestErrorMessage(requestError, 'Não foi possível sair da conta.'))
      }
    } finally {
      setLoggingOut(false)
    }
  }

  function handleSaved(resume: Resume) {
    setResumes((current) => {
      const exists = current.some((item) => item.id === resume.id)
      const updated = exists
        ? current.map((item) => (item.id === resume.id ? resume : item))
        : [resume, ...current]
      return updated.sort(
        (first, second) =>
          new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime(),
      )
    })
    setDialog(null)
    setStatusMessage(`Currículo "${resume.role}" salvo com sucesso.`)
  }

  async function handleDelete() {
    if (dialog?.type !== 'delete') return

    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteResume(dialog.resume.id)
      setResumes((current) => current.filter((resume) => resume.id !== dialog.resume.id))
      setStatusMessage(`Currículo "${dialog.resume.role}" excluído com sucesso.`)
      setDialog(null)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        handleSessionExpired()
        return
      }
      setDeleteError(getRequestErrorMessage(requestError, 'Não foi possível excluir o currículo.'))
    } finally {
      setDeleting(false)
    }
  }

  const lastUpdated = resumes[0]
  const lastUpdatedLabel = (() => {
    if (!lastUpdated) return '—'
    const updatedAt = new Date(lastUpdated.updated_at)
    if (Number.isNaN(updatedAt.getTime())) return '—'
    const daysAgo = Math.floor(
      (new Date(today).setHours(0, 0, 0, 0) - new Date(updatedAt).setHours(0, 0, 0, 0)) /
        (24 * 60 * 60 * 1000),
    )
    if (daysAgo === 0) return 'Hoje'
    if (daysAgo === 1) return 'Ontem'
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(updatedAt)
  })()

  if (loadState === 'loading' && user === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-5">
        <p className="text-sm text-slate-500" role="status">
          Verificando sua sessão…
        </p>
      </main>
    )
  }

  if (!user) {
    return (
      <AuthScreen
        key={`${authMode}-${authError ?? loadError ?? ''}`}
        initialError={
          authError ??
          (loadState === 'error'
            ? `Não foi possível verificar sua sessão. ${loadError ?? ''}`
            : null)
        }
        mode={authMode}
        onAuthenticated={handleAuthenticated}
        onModeChange={(mode) => {
          setAuthError(null)
          setAuthMode(mode)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <Sidebar
        activeSection={activeSection}
        mobileProfile={
          <Profile
            logoutPending={loggingOut}
            onLogin={() => {
              setAuthError(null)
              setAuthMode('login')
            }}
            onLogout={() => void handleLogout()}
            onOpenAccount={() => setDialog({ type: 'account' })}
            onRegister={() => {
              setAuthError(null)
              setAuthMode('register')
            }}
            user={user}
          />
        }
        onNavigate={setActiveSection}
      />

      <div className="px-5 pt-4 lg:hidden">
        <SearchInput onChange={setSearchQuery} value={searchQuery} />
      </div>
      <div className="lg:ml-[248px]">
        <header className="hidden h-[68px] items-center justify-between border-b border-slate-200/70 px-8 lg:flex xl:px-10">
          <SearchInput onChange={setSearchQuery} value={searchQuery} />
          <Profile
            user={user}
            onOpenAccount={() => setDialog({ type: 'account' })}
            onLogin={() => {
              setAuthError(null)
              setAuthMode('login')
            }}
            onRegister={() => {
              setAuthError(null)
              setAuthMode('register')
            }}
            onLogout={() => void handleLogout()}
            logoutPending={loggingOut}
          />
        </header>

        <main
          className="mx-auto max-w-[1280px] px-5 pb-12 pt-7 sm:px-7 lg:px-8 lg:pt-8 xl:px-10"
          id="overview"
        >
          <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(today)}
              </p>
              <h1 className="mt-2 text-[25px] font-semibold tracking-[-0.04em] text-[#111827] sm:text-[28px]">
                Olá{user ? `, ${user.name.split(' ')[0]}` : ''}! <span aria-hidden="true">☀️</span>
              </h1>
              <p className="mt-1.5 text-[13px] text-slate-500">
                Organize sua carreira e prepare seu próximo passo.
              </p>
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#2F4B7C] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#263F69] sm:self-auto"
              onClick={() => setDialog({ type: 'create' })}
              type="button"
            >
              <Icon name="plus" size={17} />
              Criar currículo
            </button>
          </div>

          <section aria-label="Resumo da sua conta" className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <StatCard
              detail="Seus documentos profissionais"
              icon="file"
              label="Total de currículos"
              value={loadState === 'ready' ? String(resumes.length).padStart(2, '0') : '—'}
            />
            <StatCard
              detail="Pré-visualizações disponíveis"
              icon="grid"
              label="Modelos na galeria"
              value={String(templates.length).padStart(2, '0')}
            />
            <StatCard
              detail={lastUpdated?.role ?? 'Nenhum currículo carregado'}
              icon="clock"
              label="Última atualização"
              value={lastUpdatedLabel}
            />
          </section>

          {statusMessage && (
            <p
              className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800"
              role="status"
            >
              {statusMessage}
              <button
                aria-label="Dispensar mensagem"
                className="ml-3 font-semibold underline"
                onClick={() => setStatusMessage(null)}
                type="button"
              >
                Fechar
              </button>
            </p>
          )}
          {authError && (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800" role="alert">
              {authError}
            </p>
          )}

          <section className="mt-9" id="resumes">
            <SectionHeading
              action="Ver todos"
              description="Acesse e organize seus documentos profissionais."
              href="#resumes"
              onAction={() => setDialog({ type: 'all-resumes' })}
              title="Meus currículos"
            />
            {loadState === 'error' && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800" role="alert">
                <p>{loadError}</p>
                <button
                  className="mt-2 font-semibold underline"
                  onClick={() => {
                    setLoadState('loading')
                    setLoadError(null)
                    void loadAccount()
                  }}
                  type="button"
                >
                  Tentar novamente
                </button>
              </div>
            )}
            {loadState === 'loading' && (
              <p className="mb-4 text-xs text-slate-500" role="status">
                Carregando dados da conta…
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleResumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  onDelete={(selected) => {
                    setDeleteError(null)
                    setDialog({ type: 'delete', resume: selected })
                  }}
                  onEdit={(selected) => setDialog({ type: 'create', resume: selected })}
                  onOpen={(selected) => setDialog({ type: 'resume', resume: selected })}
                  resume={resume}
                />
              ))}
            </div>
            {loadState === 'ready' && visibleResumes.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-xs text-slate-500">
                {searchQuery
                  ? `Nenhum currículo encontrado para “${searchQuery}”.`
                  : 'Sua conta ainda não tem currículos.'}
              </p>
            )}
          </section>

          <section className="mt-9" id="templates">
            <SectionHeading
              action="Explorar galeria"
              description="Layouts claros, profissionais e compatíveis com ATS."
              href="#templates"
              onNavigate={() => setActiveSection('templates')}
              title="Explore modelos"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {visibleTemplates.map((template) => (
                <TemplateCard
                  key={template.name}
                  onOpen={(selected) => setDialog({ type: 'template', template: selected })}
                  template={template}
                />
              ))}
            </div>
            {visibleTemplates.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-xs text-slate-500">
                Nenhum modelo encontrado para “{searchQuery}”.
              </p>
            )}
          </section>

          <footer className="mt-10 border-t border-slate-200/70 pt-5 text-center text-[10px] text-slate-400">
            ResumeBuilder · Seu próximo capítulo começa aqui.
          </footer>
        </main>
      </div>
      {dialog && (
        <DialogFrame
          onClose={() => setDialog(null)}
          title={
            dialog.type === 'create'
              ? dialog.resume
                ? 'Editar currículo'
                : 'Criar currículo'
              : dialog.type === 'resume'
                ? dialog.resume.role
                : dialog.type === 'template'
                  ? 'Visualizar modelo'
                  : dialog.type === 'all-resumes'
                    ? 'Todos os currículos'
                    : dialog.type === 'account'
                      ? 'Dados da conta'
                      : dialog.type === 'delete'
                        ? 'Excluir currículo'
                        : 'Dados da conta'
          }
        >
          {dialog.type === 'create' && (
            <CreateResumeForm
              key={dialog.resume?.id ?? dialog.template?.style ?? 'new'}
              onSaved={handleSaved}
              onUnauthorized={handleSessionExpired}
              resume={dialog.resume}
              template={dialog.template}
            />
          )}
          {dialog.type === 'resume' && <ResumeDetails resume={dialog.resume} />}
          {dialog.type === 'template' && (
            <TemplateDetails
              onUse={() => setDialog({ type: 'create', template: dialog.template })}
              template={dialog.template}
            />
          )}
          {dialog.type === 'all-resumes' && (
            <AllResumesList
              items={loadState === 'ready' ? resumes : []}
              emptyMessage={
                loadState === 'unauthenticated'
                  ? 'Faça login para consultar os currículos da sua conta.'
                  : loadState === 'loading'
                    ? 'Carregando currículos…'
                    : loadState === 'error'
                      ? loadError ?? 'Não foi possível carregar os currículos.'
                      : 'Sua conta ainda não tem currículos.'
              }
              onOpen={(resume) => setDialog({ type: 'resume', resume })}
            />
          )}
          {dialog.type === 'account' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-600">{user.email}</p>
            </div>
          )}
          {dialog.type === 'delete' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">
                Confirma a exclusão de <strong>{dialog.resume.role}</strong>? Esta ação remove o currículo da sua conta.
              </p>
              {deleteError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800" role="alert">
                  {deleteError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setDialog(null)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="h-10 rounded-lg bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  type="button"
                >
                  {deleting ? 'Excluindo…' : 'Confirmar exclusão'}
                </button>
              </div>
            </div>
          )}
        </DialogFrame>
      )}
    </div>
  )
}

export default App
