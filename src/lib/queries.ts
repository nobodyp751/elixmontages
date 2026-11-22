import { queryOptions } from "@tanstack/react-query";
import { getEditor, listEditors } from "./public.functions";

export const editorsQuery = () =>
  queryOptions({ queryKey: ["editors"], queryFn: () => listEditors(), staleTime: 60_000 });

export const editorQuery = (id: string) =>
  queryOptions({ queryKey: ["editor", id], queryFn: () => getEditor({ data: { id } }), staleTime: 60_000 });
