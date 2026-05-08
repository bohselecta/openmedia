import type { GenerationReceipt } from "@/lib/receipts/receiptTypes";
import { create } from "zustand";
import { storageReceipts } from "@/lib/storage/storage";

type ReceiptState = {
  receipts: GenerationReceipt[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  upsertReceipt: (r: GenerationReceipt) => void;
};

export const useReceiptStore = create<ReceiptState>((set, get) => ({
  receipts: [],
  hydrated: false,
  hydrate: async () => {
    const receipts =
      (await storageReceipts.getItem<GenerationReceipt[]>("receipts")) ?? [];
    set({
      receipts: receipts.map((r) => ({
        ...r,
        referenceSelections: r.referenceSelections ?? [],
      })),
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
}));
