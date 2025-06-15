// services/api.ts

// ==========================================================================================
// PENTING UNTUK INTEGRASI BACKEND:
// API_BASE_URL menentukan alamat dasar (base URL) untuk semua panggilan API ke backend.
// Saat ini diatur ke '/api', yang berarti backend diharapkan berada di path '/api' 
// relatif terhadap domain tempat aplikasi frontend ini di-host.
//
// CONTOH:
// - Jika frontend berjalan di http://localhost:3000, API akan dipanggil ke http://localhost:3000/api/...
// - Jika backend Anda (misalnya PHP) berjalan di server/port yang berbeda,
//   Anda HARUS mengubah nilai ini ke URL absolut backend Anda.
//   Misalnya: 'http://localhost/nama_folder_backend_anda/api'
//   Atau jika menggunakan port berbeda: 'http://localhost:8000/api'
// Sesuaikan dengan setup backend Anda.
// ==========================================================================================
export const API_BASE_URL = '/api'; // Placeholder for your backend API base URL

// Define a type for bodies that will be JSON.stringify'd
type Jsonifiable = Record<string, any> | Array<any>;

// Updated FetchOptions
interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: Jsonifiable | FormData | string | Blob | ArrayBuffer | URLSearchParams | ReadableStream<Uint8Array> | null;
  isFormData?: boolean;
  timeout?: number; // Added timeout in milliseconds
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>; // For validation errors
}

const DEFAULT_TIMEOUT = 15000; // 15 seconds

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const controller = new AbortController();
  const signal = controller.signal;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const effectiveTimeout = options.timeout ?? DEFAULT_TIMEOUT;

  // Header setup
  const headersInit: Record<string, string> = {};
  if (!options.isFormData && !(options.body instanceof FormData)) {
    headersInit['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('ewakoRoyalToken');
  if (token) {
    headersInit['Authorization'] = `Bearer ${token}`;
  }
  if (options.headers) {
    if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => { headersInit[key] = value; });
    } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => { headersInit[key] = value; });
    } else {
        for (const [key, value] of Object.entries(options.headers)) {
            if (value !== undefined) { headersInit[key] = value as string; }
        }
    }
  }

  // Config setup, initially excluding body
  const { body: requestBody, ...restOptions } = options;
  const config: RequestInit = {
    ...restOptions,
    headers: new Headers(headersInit),
    signal, // Add AbortController's signal
  };

  // Body setup
  if (requestBody !== undefined && requestBody !== null) {
    if (options.isFormData && requestBody instanceof FormData) {
      config.body = requestBody;
      (config.headers as Headers).delete('Content-Type'); // Let browser set Content-Type for FormData
    } else if (!options.isFormData && typeof requestBody === 'object' &&
               !(requestBody instanceof Blob) && !(requestBody instanceof ArrayBuffer) &&
               !(requestBody instanceof FormData) && !(requestBody instanceof URLSearchParams) &&
               !(requestBody instanceof ReadableStream)) {
      config.body = JSON.stringify(requestBody);
    } else {
      config.body = requestBody as BodyInit;
    }
  }

  let response: Response;
  try {
    const fetchPromise = fetch(`${API_BASE_URL}${endpoint}`, config);
    
    const timeoutPromise = new Promise<Response>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject({ message: `Permintaan melebihi batas waktu ${effectiveTimeout / 1000} detik.` } as ApiErrorResponse);
      }, effectiveTimeout);
    });

    response = await Promise.race([
        fetchPromise.finally(() => clearTimeout(timeoutId)), // Clear timeout if fetch completes or errors
        timeoutPromise
    ]);

  } catch (error: any) {
    clearTimeout(timeoutId); // Ensure timeout is cleared on any error from Promise.race
    if (error && typeof error === 'object' && 'message' in error) {
        throw error as ApiErrorResponse;
    }
    // Convert generic errors (like AbortError if not caught as ApiErrorResponse style)
    throw { message: (error as Error)?.message || 'Permintaan gagal atau melebihi batas waktu.' } as ApiErrorResponse;
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse = { message: `Permintaan gagal dengan status ${response.status}` };
    try {
      const parsedError = await response.json();
      errorData = { ...errorData, ...parsedError };
    } catch (e) {
      const textError = await response.text().catch(() => null);
      errorData.message = textError || response.statusText || errorData.message;
    }
    throw errorData;
  }

  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType) { // No Content
    return null as unknown as T;
  }
  if (contentType && contentType.includes("application/json")) {
    try {
        return await response.json() as Promise<T>;
    } catch (jsonError: any) {
        console.error("API JSON Parse Error:", jsonError);
        throw { message: "Respons JSON tidak valid dari server." } as ApiErrorResponse;
    }
  }
  return response.text() as unknown as T;
}

export default fetchApi;