"use client";

import * as React from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import type { SkillSlug } from "@/lib/skills";
import { listSkills } from "@/lib/skills";
import {
  demoSchema,
  ROLE_OPTIONS,
  type DemoFormValues,
} from "@/lib/demo-schema";

type Props = {
  defaultSkills?: SkillSlug[];
  source?: string;
  onSuccess?: () => void;
  variant?: "modal" | "inline";
};

const SKILL_OPTIONS: {
  slug: "kyc" | "finance" | "hr" | "erp" | "other";
  label: string;
}[] = [
  ...listSkills().map((s) => ({
    slug: s.slug as "kyc" | "finance" | "hr" | "erp",
    label: s.shortName,
  })),
  { slug: "other", label: "Other" },
];

export function DemoForm({
  defaultSkills = [],
  source = "unknown",
  onSuccess,
  variant = "modal",
}: Props) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DemoFormValues>({
    resolver: zodResolver(demoSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      role: undefined,
      roleOther: "",
      companySize: undefined,
      skills: (defaultSkills.length
        ? defaultSkills
        : []) as DemoFormValues["skills"],
      notes: "",
    },
  });

  const roleValue = useWatch({ control, name: "role" });

  async function onSubmit(values: DemoFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, source }),
      });
      if (!res.ok) throw new Error("request failed");
      setSubmitted(true);
      toast({
        title: "Request received",
        description:
          "We'll be in touch within 1 business day.",
        variant: "success",
      });
      onSuccess?.();
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again or email hello@bacumen.ai.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-3 py-6">
        <div className="text-mono text-ink-cta">Thanks — request received</div>
        <h3 className="text-h2 text-ink">We'll be in touch within 1 business day.</h3>
        <p className="text-body-s text-muted">
          A member of our team will reach out to schedule your 20-minute
          demo. In the meantime, if it's urgent, email{" "}
          <a className="text-ink-cta hover:underline" href="mailto:hello@bacumen.ai">
            hello@bacumen.ai
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        "flex flex-col gap-4",
        variant === "inline" && "max-w-[680px]"
      )}
      noValidate
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name" error={errors.name?.message}>
          <Input autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Work email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
          />
        </Field>
      </div>

      <Field label="Company" error={errors.company?.message}>
        <Input autoComplete="organization" {...register("company")} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Role" error={errors.role?.message}>
          <select
            className="flex h-11 w-full rounded-xl border border-divider bg-white px-3 text-body-s text-ink focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
            {...register("role")}
            defaultValue=""
          >
            <option value="" disabled>
              Select a role
            </option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Company size" error={errors.companySize?.message}>
          <select
            className="flex h-11 w-full rounded-xl border border-divider bg-white px-3 text-body-s text-ink focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
            {...register("companySize")}
            defaultValue=""
          >
            <option value="" disabled>
              Select a size
            </option>
            {["<100", "100–500", "500–2000", "2000+"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {roleValue === "Other" && (
        <Field
          label="What's your role?"
          error={errors.roleOther?.message}
        >
          <Input
            autoComplete="organization-title"
            placeholder="e.g. Director of Procurement Transformation"
            {...register("roleOther")}
          />
        </Field>
      )}

      <Field label="Skill(s) of interest" error={errors.skills?.message}>
        <Controller
          control={control}
          name="skills"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((opt) => {
                const active = field.value?.includes(opt.slug);
                return (
                  <button
                    type="button"
                    key={opt.slug}
                    onClick={() => {
                      const set = new Set(field.value ?? []);
                      if (set.has(opt.slug)) set.delete(opt.slug);
                      else set.add(opt.slug);
                      field.onChange(Array.from(set));
                    }}
                    className={cn(
                      "h-9 px-3 rounded-full border font-sans text-[14px] leading-[20px]",
                      "transition-[background-color,border-color,color] duration-300 ease",
                      active
                        ? "bg-ink-cta text-ink-inverse border-ink-cta hover:bg-[rgb(40,40,48)]"
                        : "bg-pure-white text-ink border-ink/15 hover:border-ink"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        />
      </Field>

      <Field label="Notes" hint="optional">
        <Textarea rows={3} {...register("notes")} />
      </Field>

      <div className="flex items-center justify-between pt-2">
        <p className="text-body-s text-muted max-w-[44ch]">
          Worth a shot — 20 minutes on your real cases.
        </p>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Request a demo"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {hint && !error && (
          <span className="text-body-s text-muted">{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <span className="text-body-s text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
