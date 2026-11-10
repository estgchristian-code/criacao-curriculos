const apiOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  readonly status: number

  constructor(
    message: string,
    status: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function initializeCsrf(): Promise<void> {
  const response = await fetch(`${apiOrigin}/sanctum/csrf-cookie`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new ApiError(
      'Não foi possível inicializar a proteção CSRF do Sanctum.',
      response.status,
    )
  }
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
    const xsrfToken = getXsrfToken()

    if (!xsrfToken) {
      throw new Error(
        'Inicialize a proteção CSRF do Sanctum antes de enviar alterações.',
      )
    }

    headers.set('X-XSRF-TOKEN', xsrfToken)
  }

  const response = await fetch(`${apiOrigin}/api/v1${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => undefined)
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : `A API respondeu com o status ${response.status}.`

    throw new ApiError(message, response.status)
  }

  return (await response.json()) as T
}
