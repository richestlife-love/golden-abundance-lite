// frontend/src/queries/tasks.ts
import { queryOptions } from "@tanstack/react-query";
import * as api from "../api/tasks";
import { qk } from "./keys";

export const taskQueryOptions = (uuid: string) =>
  queryOptions({
    queryKey: qk.task(uuid),
    queryFn: ({ signal }) => api.getTask(uuid, { signal }),
    staleTime: 60_000,
  });
