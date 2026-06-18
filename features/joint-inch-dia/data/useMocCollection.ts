"use client";

import { useMemo } from "react";
import { createCollection, useLiveQuery } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

import { fetchMocs, saveMoc } from "./client-api";
import type { MocOption } from "../domain/types";

export function useMocCollection() {
  const queryClient = useQueryClient();

  const mocsCollection = useMemo(
    () =>
      createCollection(
        queryCollectionOptions({
          id: "mocs",
          queryKey: ["mocs"],
          queryFn: fetchMocs,
          queryClient,
          getKey: (moc) => moc.moc,
          onInsert: async ({ transaction }) => {
            for (const mutation of transaction.mutations) {
              await saveMoc(mutation.modified as MocOption);
            }
          },
          onUpdate: async ({ transaction }) => {
            for (const mutation of transaction.mutations) {
              await saveMoc(mutation.modified as MocOption);
            }
          },
        })
      ),
    [queryClient]
  );

  const liveMocs = useLiveQuery(mocsCollection);

  return {
    mocRows: liveMocs.data ?? [],
    mocsCollection,
    isLoading: liveMocs.isLoading,
  };
}
