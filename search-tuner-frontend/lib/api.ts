const API_BASE_URL = process.env.BACKEND_URL || "http://localhost:8080"

export async function fetchFromBackend(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
  
  return response
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetchFromBackend(endpoint, options)
    
    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      }
    }
    
    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
