// frontend/src/api/tasks.ts
import type { components } from "./schema";
import { apiFetch } from "./client";

type Task = components["schemas"]["Task"];
type SubmitBody =
  | components["schemas"]["InterestFormBody"]
  | components["schemas"]["TicketFormBody"];
type TaskSubmissionResponse = components["schemas"]["TaskSubmissionResponse"];

interface FetchOpts {
  signal?: AbortSignal;
}

export const getTask = (id: string, opts: FetchOpts = {}): Promise<Task> =>
  apiFetch<Task>(`/tasks/${id}`, { signal: opts.signal });

export const submitTask = (id: string, body: SubmitBody): Promise<TaskSubmissionResponse> =>
  apiFetch<TaskSubmissionResponse>(`/tasks/${id}/submit`, {
    method: "POST",
    body: JSON.stringify(body),
  });
