const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID;

const jsonHeaders = {
  "Content-Type": "application/json",
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const extraHeaders = DEV_USER_ID ? { "X-User-Id": DEV_USER_ID } : {};
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...jsonHeaders,
      ...(options.headers ?? {}),
      ...extraHeaders,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getMe: () => request<import("../types").ApiUser>("/me"),
  getStages: () => request<import("../types").ApiStage[]>("/stages"),
  getJobs: () => request<import("../types").ApiJob[]>("/jobs"),
  getMetrics: () => request<import("../types").ApiMetrics>("/metrics"),
  createJob: (payload: Record<string, unknown>) =>
    request<import("../types").ApiJob>("/jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateJob: (jobId: number, payload: Record<string, unknown>) =>
    request<import("../types").ApiJob>(`/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
};

export const apiConfig = {
  apiUrl: API_URL,
};
