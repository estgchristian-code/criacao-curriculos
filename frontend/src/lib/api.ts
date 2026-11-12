import type { ResumeDocument, ResumeStyle } from './resume-document'

const apiOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  readonly status: number
  readonly errors?: Record<string, string[]>

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

const connectionErrorMessage =
  'Não foi possível conectar à API. Verifique se o servidor Laravel está em execução.'

async function readErrorMessage(response: Response): Promise<string | undefined> {
  const payload: unknown = await response.json().catch(() => undefined)

  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message
  }

  return undefined
}

async function requestCsrfCookie(): Promise<void> {
  let response: Response

  try {
    response = await fetch(`${apiOrigin}/sanctum/csrf-cookie`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
  } catch {
    throw new ApiError(connectionErrorMessage, 0)
  }

  if (!response.ok) {
    // O endpoint usa a sessão do backend. Se o driver de sessão estiver
    // indisponível (por exemplo, MySQL parado), o Laravel responde 500 e a
    // causa real precisa chegar ao usuário em vez de virar um erro genérico.
    const detail = await readErrorMessage(response)

    throw new ApiError(
      detail
        ? `Não foi possível inicializar a proteção CSRF do Sanctum. ${detail}`
        : `Não foi possível inicializar a proteção CSRF do Sanctum (HTTP ${response.status}).`,
      response.status,
    )
  }
}

let csrfInitialization: Promise<void> | null = null

export function initializeCsrf(): Promise<void> {
  // Evita disparar várias requisições simultâneas de cookie CSRF quando mais
  // de uma operação que altera estado começa antes do cookie estar disponível.
  csrfInitialization ??= requestCsrfCookie().finally(() => {
    csrfInitialization = null
  })

  return csrfInitialization
}

function getXsrfToken(): string | undefined {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith('XSRF-TOKEN='))

  return cookie
    ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length))
    : undefined
}

export async function apiRequest<T>(
  path: `/${string}`,
  init: RequestInit = {},
): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  headers.set('X-Requested-With', 'XMLHttpRequest')

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (!getXsrfToken()) {
      await initializeCsrf()
    }

    const xsrfToken = getXsrfToken()

    if (!xsrfToken) {
      throw new Error(
        'Inicialize a proteção CSRF do Sanctum antes de enviar alterações.',
      )
    }

    headers.set('X-XSRF-TOKEN', xsrfToken)
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const sendRequest = async (): Promise<Response> => {
    try {
      return await fetch(`${apiOrigin}/api/v1${path}`, {
        ...init,
        method,
        headers,
        credentials: 'include',
      })
    } catch {
      throw new ApiError(connectionErrorMessage, 0)
    }
  }

  const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method)
  let response = await sendRequest()

  // A stale CSRF cookie can survive an expired session. Refresh it once and
  // retry, so the request receives the real authentication error instead of 419.
  if (response.status === 419 && !isSafeMethod) {
    await initializeCsrf()
    const refreshedToken = getXsrfToken()

    if (refreshedToken) {
      headers.set('X-XSRF-TOKEN', refreshedToken)
      response = await sendRequest()
    }
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => undefined)
    const errors =
      typeof payload === 'object' &&
      payload !== null &&
      'errors' in payload &&
      typeof payload.errors === 'object' &&
      payload.errors !== null
        ? (payload.errors as Record<string, string[]>)
        : undefined
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? errors
          ? Object.values(errors).flat().join(' ')
          : payload.message
        : `A API respondeu com o status ${response.status}.`

    throw new ApiError(message, response.status, errors)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export type ApiUser = {
  id: number
  name: string
  email: string
}

type AuthResponse = ResourceResponse<ApiUser>

export type ApiResume = {
  id: number
  name: string
  role: string
  style: ResumeStyle
  updated_at: string
}

export type ApiResumeDetail = ApiResume & {
  document: ResumeDocument | null
}

export type ApiHealth = {
  status: string
  document_persistence?: boolean
}

export type SaveResumeInput = {
  name: string
  role: string
  style: ResumeStyle
  document: ResumeDocument
}

type ResourceResponse<T> = { data: T }

type PaginatedResponse<T> = {
  data: T[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function getHealth(): Promise<ApiHealth> {
  return apiRequest<ApiHealth>('/health')
}

export function getCurrentUser(): Promise<ApiUser> {
  return apiRequest<ResourceResponse<ApiUser>>('/user').then((response) => response.data)
}

export async function register(input: {
  name: string
  email: string
  password: string
  password_confirmation: string
}): Promise<ApiUser> {
  const response = await apiRequest<AuthResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.data
}

export async function login(input: {
  email: string
  password: string
}): Promise<ApiUser> {
  const response = await apiRequest<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.data
}

export function logout(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/logout', { method: 'POST' })
}

/**
 * The API paginates the resume listing. Walk every page so the current UI,
 * which renders a single client-side list, keeps showing all resumes.
 */
export async function listResumes(): Promise<ApiResume[]> {
  const resumes: ApiResume[] = []
  const maxPages = 50
  let page = 1
  let lastPage = 1

  do {
    const response = await apiRequest<PaginatedResponse<ApiResume>>(
      `/resumes?per_page=100&page=${page}`,
    )

    resumes.push(...response.data)
    lastPage = Math.min(response.meta?.last_page ?? page, maxPages)
    page += 1
  } while (page <= lastPage)

  return resumes
}

export async function createResume(
  input: Pick<ApiResume, 'name' | 'role' | 'style'>,
): Promise<ApiResume> {
  const response = await apiRequest<ResourceResponse<ApiResume>>('/resumes', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.data
}

/** Loads the complete resume, including its structured document. */
export function getResume(id: number): Promise<ApiResumeDetail> {
  return apiRequest<ResourceResponse<ApiResumeDetail>>(`/resumes/${id}`).then(
    (response) => response.data,
  )
}

/**
 * Saves the editor state with PATCH. `document` is always sent as a complete
 * snapshot, which is the update semantics supported by the API.
 */
export function saveResume(
  id: number,
  input: SaveResumeInput,
): Promise<ApiResumeDetail> {
  return apiRequest<ResourceResponse<ApiResumeDetail>>(`/resumes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  }).then((response) => response.data)
}

export async function updateResume(
  id: number,
  input: Pick<ApiResume, 'name' | 'role' | 'style'>,
): Promise<ApiResume> {
  const response = await apiRequest<ResourceResponse<ApiResume>>(`/resumes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return response.data
}

export function deleteResume(id: number): Promise<void> {
  return apiRequest<void>(`/resumes/${id}`, { method: 'DELETE' })
}
