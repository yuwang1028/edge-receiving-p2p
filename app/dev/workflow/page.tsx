import { notFound } from "next/navigation";
import { listSkills } from "@/lib/skills";
import { SkillWorkflowSection } from "@/components/skill-workflow-section";

export const metadata = { title: "Dev · workflow QA", robots: { index: false } };

export default function DevWorkflowPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const skills = listSkills();
  return (
    <div>
      {skills.map((skill) => (
        <div key={skill.slug}>
          <div className="px-6 lg:px-10 max-w-[1200px] mx-auto pt-32 pb-4">
            <div className="text-mono text-muted">QA · {skill.slug}</div>
            <h1 className="text-h1 text-ink">{skill.name}</h1>
          </div>
          <SkillWorkflowSection skill={skill} />
        </div>
      ))}
    </div>
  );
}
