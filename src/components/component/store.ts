import { create } from "zustand";
type Log = {
  date: string;
  level: string;
  message: string;
};

type LogStore = {
  logs: Log[];
  addLog: (log: Log) => void;
};

export const useLogStore = create<LogStore>((set) => ({
  logs: [],
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
}));
