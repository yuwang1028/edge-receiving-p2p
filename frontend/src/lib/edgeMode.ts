import * as React from "react";
import { edgeApi, type ModeInfo } from "./edgeApi";

/* Global runtime-mode store (offline · cloud-sync · vertex). The mode is a
 * device-level setting that changes every console's engine, so it lives here —
 * one source of truth the sidebar switch writes and every ModelBadge / status
 * read-out subscribes to. Backed by useSyncExternalStore so a switch re-renders
 * all consumers at once. */

export type EdgeModeState = {
  mode: string;
  modes: ModeInfo[];
  syncEnabled: boolean;
  vertexAssist: boolean;
  deviceId: string;
  provider: string;
  loaded: boolean;
  error: boolean;
};

let state: EdgeModeState = {
  mode: "offline", modes: [], syncEnabled: false, vertexAssist: false,
  deviceId: "", provider: "", loaded: false, error: false,
};
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export async function refreshEdgeMode(): Promise<void> {
  try {
    const h = await edgeApi.health();
    state = {
      mode: h.mode, modes: h.modes ?? [], syncEnabled: h.syncEnabled, vertexAssist: h.vertexAssist,
      deviceId: h.deviceId, provider: h.provider, loaded: true, error: false,
    };
  } catch {
    state = { ...state, loaded: true, error: true };
  }
  emit();
}

export async function setEdgeMode(m: string): Promise<void> {
  await edgeApi.setMode(m);
  await refreshEdgeMode();
}

let started = false;
export function useEdgeMode(): EdgeModeState {
  const s = React.useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => state,
  );
  React.useEffect(() => {
    if (!started) {
      started = true;
      void refreshEdgeMode();
    }
  }, []);
  return s;
}
