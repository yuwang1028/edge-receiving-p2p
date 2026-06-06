"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DemoForm } from "@/components/demo-form";
import { useDemoModal } from "@/components/demo-modal-provider";

export function RequestDemoModal() {
  const { isOpen, close, prefilledSkills, source } = useDemoModal();

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <div className="text-mono text-ink-cta mb-1">
            See Bacumen on your own cases
          </div>
          <DialogTitle>Request a demo</DialogTitle>
          <DialogDescription>
            A 20-minute working session against your real data. No slideware.
          </DialogDescription>
        </DialogHeader>
        <DemoForm
          defaultSkills={prefilledSkills}
          source={source}
          onSuccess={() => {
            // Keep modal open on success to show the confirmation state,
            // close after a short delay.
            setTimeout(close, 2400);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
