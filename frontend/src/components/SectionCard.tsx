import { useState } from "react";
import { Section } from "../types";

interface SectionCardProps {
  section: Section;
  onRefine: (sectionId: number, prompt: string) => Promise<void>;
  refiningSectionId: number | null;
}

const SectionCard = ({ section, onRefine, refiningSectionId }: SectionCardProps) => {
  const [prompt, setPrompt] = useState("");

  const handleRefine = async () => {
    if (!prompt.trim()) return;
    await onRefine(section.id, prompt);
    setPrompt("");
  };

  return (
    <div className="card section-card">
      <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p className="badge">{section.section_type === "section" ? "Word Section" : "Slide"}</p>
          <h3>{section.title}</h3>
        </div>
      </div>

      <textarea value={section.content ?? ""} readOnly placeholder="No content generated yet." />

      <div className="field">
        <label>Refinement prompt for this section</label>
        <textarea
          value={prompt}
          placeholder='e.g., "Make this more concise"'
          onChange={(event) => setPrompt(event.target.value)}
        />
      </div>

      <button
        className="button primary"
        onClick={handleRefine}
        disabled={!prompt.trim() || refiningSectionId === section.id}
      >
        {refiningSectionId === section.id ? "Refining..." : "Send refinement"}
      </button>
    </div>
  );
};

export default SectionCard;

