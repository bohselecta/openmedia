import type { GenerationReceipt } from "@/lib/receipts/receiptTypes";
import { create } from "zustand";
import { storageReceipts } from "@/lib/storage/storage";

function migrateHydratedReceipt(r: GenerationReceipt): GenerationReceipt {
  const manifestId = r.manifestId ?? r.modelId;
  const ledgerStatus = r.ledgerStatus ?? "succeeded";
  const redactionVersion = r.redactionVersion ?? "1";
  const est =
    r.estimatedCost === undefined ? null
    : (r.estimatedCost as number | null);
  const act =
    r.actualCost === undefined ? null
    : (r.actualCost as number | null);
  return {
    ...r,
    manifestId,
    modelId: r.modelId,
    ledgerStatus,
    redactionVersion,
    referenceSelections: r.referenceSelections ?? [],
    estimatedCost: est,
    actualCost: act,
    providerReportedCostUsd:
      r.providerReportedCostUsd !== undefined ? r.providerReportedCostUsd : act,
  };
}

type ReceiptState = {
  receipts: GenerationReceipt[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  upsertReceipt: (r: GenerationReceipt) => void;
  removeReceiptById: (id: string) => void;
};

export const useReceiptStore = create<ReceiptState>((set, get) => ({
  receipts: [],
  hydrated: false,
  hydrate: async () => {
    const raw =
      (await storageReceipts.getItem<GenerationReceipt[]>("receipts")) ?? [];
    const receipts = raw.map((r) =>
      migrateHydratedReceipt(r as GenerationReceipt),
    );
    set({
      receipts,
      hydrated: true,
    });
  },
  persist: async () => {
    await storageReceipts.setItem("receipts", get().receipts);
  },
  upsertReceipt: (r) => {
    set((s) => ({
      receipts: [...s.receipts.filter((x) => x.id !== r.id), r],
    }));
    void get().persist();
  },
  removeReceiptById: (id) => {
    set((s) => ({
      receipts: s.receipts.filter((x) => x.id !== id),
    }));
    void get().persist();
  },
}));
