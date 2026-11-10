import { useState, type ReactNode } from 'react'

type IconName =
  | 'arrow-up-right'
  | 'briefcase'
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

type Resume = {
  id: number
  name: string
  role: string
  updatedAt: string
  style: ResumeStyle
}

const resumes: Resume[] = [
  {
    id: 1,
    name: 'Seu nome',
    role: 'Product Designer',
    updatedAt: 'Atualizado hoje',
    style: 'editorial',
  },
  {
    id: 2,
    name: 'Seu nome',
    role: 'Product Manager',
    updatedAt: 'Atualizado ontem',
    style: 'classic',
  },
  {
    id: 3,
    name: 'Seu nome',
    role: 'UX Researcher',
    updatedAt: 'Atualizado em 12 jun',
    style: 'modern',
  },
]

const templates: { name: string; category: string; style: ResumeStyle }[] = [
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

function Logo() {
  return (
    <a
      aria-label="ResumeBuilder — início"
      className="flex items-center gap-3"
      href="#overview"
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

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const links: { label: string; href: string; icon: IconName; active?: boolean }[] =
    [
      { label: 'Visão geral', href: '#overview', icon: 'grid', active: true },
      { label: 'Meus currículos', href: '#resumes', icon: 'file' },
      { label: 'Modelos', href: '#templates', icon: 'briefcase' },
    ]

  return (
    <nav aria-label="Navegação principal" className="space-y-1.5">
      {links.map((link) => (
        <a
          aria-current={link.active ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
            link.active
              ? 'bg-[#2F4B7C]/[0.08] text-[#2F4B7C]'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
          href={link.href}
          key={link.label}
          onClick={onNavigate}
        >
          <Icon name={link.icon} size={18} />
          {link.label}
        </a>
      ))}
    </nav>
  )
}

function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white px-5 lg:hidden">
        <Logo />
        <button
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
        >
          <Icon name="menu" size={20} />
        </button>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-slate-200/80 bg-white px-5 py-6 lg:flex">
        <Logo />
        <p className="mb-3 mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
          Workspace
        </p>
        <Navigation />
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
          >
            Explorar modelos <Icon name="arrow-up-right" size={13} />
          </a>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-[68px] z-40 border-b border-slate-200 bg-white px-5 py-4 shadow-lg lg:hidden">
          <Navigation onNavigate={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}

function Profile() {
  return (
    <button
      aria-label="Perfil do usuário"
      className="flex items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white"
      type="button"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-[#E8EDF5] text-xs font-semibold text-[#2F4B7C]">
        RB
      </span>
      <span className="hidden sm:block">
        <span className="block text-xs font-semibold text-slate-800">
          Meu perfil
        </span>
        <span className="mt-0.5 block text-[11px] text-slate-500">Plano gratuito</span>
      </span>
      <Icon className="hidden text-slate-400 sm:block" name="chevron-down" size={15} />
    </button>
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

function ResumeCard({ resume }: { resume: Resume }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200/80 bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="relative">
        <ResumeThumbnail style={resume.style} />
        <button
          aria-label={`Mais opções para ${resume.role}`}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white/95 text-slate-500 opacity-100 shadow-sm transition-colors hover:text-slate-800 sm:opacity-0 sm:group-hover:opacity-100"
          type="button"
        >
          <Icon name="more" size={17} />
        </button>
      </div>
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold text-slate-800">
            {resume.role}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{resume.name}</p>
          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
            <Icon name="clock" size={12} />
            {resume.updatedAt}
          </p>
        </div>
        <span
          aria-label="Abrir currículo"
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors group-hover:bg-slate-50 group-hover:text-[#2F4B7C]"
        >
          <Icon name="arrow-up-right" size={16} />
        </span>
      </div>
    </article>
  )
}

function TemplateCard({
  name,
  category,
  style,
}: {
  name: string
  category: string
  style: ResumeStyle
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200/80 bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <ResumeThumbnail style={style} />
      <div className="flex items-center justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-semibold text-slate-800">{name}</h3>
          <p className="mt-1 text-[10px] text-slate-500">{category} · Compatível com ATS</p>
        </div>
        <span
          aria-label="Ver modelo"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400"
        >
          <Icon name="arrow-up-right" size={15} />
        </span>
      </div>
    </article>
  )
}

function SectionHeading({
  title,
  description,
  href,
  action,
}: {
  title: string
  description: string
  href: string
  action: string
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-[#111827]">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <a
        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#2F4B7C] hover:underline"
        href={href}
      >
        {action} <Icon name="arrow-up-right" size={14} />
      </a>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <Sidebar />

      <div className="lg:ml-[248px]">
        <header className="hidden h-[68px] items-center justify-between border-b border-slate-200/70 px-8 lg:flex xl:px-10">
          <div className="relative w-full max-w-[320px]">
            <Icon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              name="search"
              size={16}
            />
            <input
              aria-label="Buscar"
              className="h-9 w-full rounded-lg border border-slate-200/80 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#2F4B7C]/40"
              placeholder="Buscar currículos ou modelos"
              type="search"
            />
          </div>
          <Profile />
        </header>

        <main
          className="mx-auto max-w-[1280px] px-5 pb-12 pt-7 sm:px-7 lg:px-8 lg:pt-8 xl:px-10"
          id="overview"
        >
          <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Segunda-feira, 9 de novembro
              </p>
              <h1 className="mt-2 text-[25px] font-semibold tracking-[-0.04em] text-[#111827] sm:text-[28px]">
                Olá! <span aria-hidden="true">☀️</span>
              </h1>
              <p className="mt-1.5 text-[13px] text-slate-500">
                Organize sua carreira e prepare seu próximo passo.
              </p>
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#2F4B7C] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#263F69] sm:self-auto"
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
              value="03"
            />
            <StatCard
              detail="Prontos para personalizar"
              icon="grid"
              label="Modelos disponíveis"
              value="12"
            />
            <StatCard
              detail="Product Designer"
              icon="clock"
              label="Última atualização"
              value="Hoje"
            />
          </section>

          <section className="mt-9" id="resumes">
            <SectionHeading
              action="Ver todos"
              description="Acesse e organize seus documentos profissionais."
              href="#resumes"
              title="Meus currículos"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
              ))}
            </div>
          </section>

          <section className="mt-9" id="templates">
            <SectionHeading
              action="Explorar galeria"
              description="Layouts claros, profissionais e compatíveis com ATS."
              href="#templates"
              title="Explore modelos"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {templates.map((template) => (
                <TemplateCard key={template.name} {...template} />
              ))}
            </div>
          </section>

          <footer className="mt-10 border-t border-slate-200/70 pt-5 text-center text-[10px] text-slate-400">
            ResumeBuilder · Seu próximo capítulo começa aqui.
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App
