import { z } from "zod";

export const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "aol.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "live.com",
  "msn.com",
];

export const ROLE_OPTIONS = [
  "CEO / Founder",
  "COO",
  "CIO / CTO",
  "CFO",
  "Chief AI / Data Officer",
  "Head of Engineering",
  "Head of Operations",
  "Head of Finance",
  "Head of Compliance / Risk",
  "Head of People / HR",
  "Head of Procurement",
  "Product / Strategy",
  "Consultant / Advisor",
  "Other",
] as const;

export const demoSchema = z
  .object({
    name: z.string().min(2, "Your full name, please."),
    email: z
      .string()
      .email("Enter a valid email address.")
      .refine(
        (v) => {
          const domain = v.split("@")[1]?.toLowerCase() ?? "";
          return !FREE_EMAIL_DOMAINS.includes(domain);
        },
        { message: "Please use your work email address." }
      ),
    company: z.string().min(2, "Company name is required."),
    role: z.enum(ROLE_OPTIONS, {
      errorMap: () => ({ message: "Select a role." }),
    }),
    roleOther: z.string().max(80).optional(),
    companySize: z.enum(["<100", "100–500", "500–2000", "2000+"], {
      errorMap: () => ({ message: "Select a size." }),
    }),
    skills: z
      .array(z.enum(["kyc", "finance", "hr", "erp", "other"]))
      .min(1, "Pick at least one Skill."),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (d) => d.role !== "Other" || (d.roleOther?.trim().length ?? 0) >= 2,
    {
      path: ["roleOther"],
      message: "Tell us your role.",
    }
  );

export type DemoFormValues = z.infer<typeof demoSchema>;
