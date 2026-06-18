"use client";

import { useMemo } from "react";
import { createCollection, useLiveQuery } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

import {
  createJointRecord,
  deleteJointRecord,
  fetchJointRecords,
  updateJointRecord,
} from "./client-api";
import {
  getJointRecordPayload,
  normalizeRecord,
  validateJointRecordPayload,
} from "../domain/calculations";
import type { JointRecord } from "../domain/types";

export function useJointRecordCollection() {
  const queryClient = useQueryClient();

  const recordsCollection = useMemo(() => {
    const updateQueues = new Map<number, Promise<unknown>>();
    const deletingRowIds = new Set<number>();

    function queueRowUpdate(rowId: number, updater: () => Promise<unknown>) {
      if (deletingRowIds.has(rowId)) {
        return Promise.resolve();
      }

      const previousUpdate = updateQueues.get(rowId) ?? Promise.resolve();
      const nextUpdate = previousUpdate
        .catch(() => undefined)
        .then(() => (deletingRowIds.has(rowId) ? undefined : updater()));

      updateQueues.set(rowId, nextUpdate);

      void nextUpdate.finally(() => {
        if (updateQueues.get(rowId) === nextUpdate) {
          updateQueues.delete(rowId);
        }
      });

      return nextUpdate;
    }

    return createCollection(
      queryCollectionOptions({
        id: "joint-records",
        queryKey: ["joint-records"],
        queryFn: fetchJointRecords,
        queryClient,
        getKey: (record) => record.id,
        onInsert: async (params) => {
          const { transaction } = params;

          for (const mutation of transaction.mutations) {
            const payload = getJointRecordPayload(mutation.modified);
            const rowError = validateJointRecordPayload(payload);

            if (rowError) {
              throw new Error(rowError);
            }

            const createdRecord = await createJointRecord(payload);
            params.collection.utils.writeUpsert(createdRecord);
          }

          return { refetch: false };
        },
        onUpdate: async (params) => {
          const { transaction } = params;

          for (const mutation of transaction.mutations) {
            const payload = getJointRecordPayload(mutation.modified);
            const rowError = validateJointRecordPayload(payload);

            if (rowError) {
              throw new Error(rowError);
            }

            await queueRowUpdate(mutation.key, () => updateJointRecord(mutation.key, payload));
          }

          return { refetch: false };
        },
        onDelete: async (params) => {
          const { transaction } = params;

          for (const mutation of transaction.mutations) {
            deletingRowIds.add(mutation.key);

            try {
              await deleteJointRecord(mutation.key);
              params.collection.utils.writeDelete(mutation.key);
            } catch (deleteError) {
              deletingRowIds.delete(mutation.key);
              throw deleteError;
            }
          }

          return { refetch: false };
        },
      })
    );
  }, [queryClient]);

  const liveRecords = useLiveQuery(recordsCollection);
  const collectionRows = useMemo(
    () => (liveRecords.data ?? []).map(normalizeRecord),
    [liveRecords.data]
  );

  return {
    collectionRows,
    recordsCollection,
    isLoading: liveRecords.isLoading,
    isError: liveRecords.isError,
    error: recordsCollection.utils.lastError,
  };
}
