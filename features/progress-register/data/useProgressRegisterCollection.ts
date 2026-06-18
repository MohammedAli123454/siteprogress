"use client";

import { useMemo } from "react";
import { createCollection, useLiveQuery } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

import { fetchProgressRegisterRows } from "./client-api";

export function useProgressRegisterCollection() {
  const queryClient = useQueryClient();

  const progressRowsCollection = useMemo(
    () =>
      createCollection(
        queryCollectionOptions({
          id: "progress-register-rows",
          queryKey: ["progress-register-rows"],
          queryFn: fetchProgressRegisterRows,
          queryClient,
          getKey: (row) => row.jointRecordId,
        })
      ),
    [queryClient]
  );

  const liveRows = useLiveQuery(progressRowsCollection);

  return {
    rows: liveRows.data ?? [],
    progressRowsCollection,
    isLoading: liveRows.isLoading,
    isError: liveRows.isError,
    error: progressRowsCollection.utils.lastError,
  };
}
