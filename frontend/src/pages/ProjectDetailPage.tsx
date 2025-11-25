import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SectionCard from "../components/SectionCard";
import api from "../services/api";
import { Project, Section, Refinement } from "../types";

const fetchProject = async (projectId: string): Promise<Project> => {
  const { data } = await api.get<Project>(`/api/projects/${projectId}`);
  return data;
};

const fetchSections = async (projectId: string): Promise<Section[]> => {
  const { data } = await api.get<Section[]>(`/api/projects/${projectId}/sections`);
  return data;
};

const fetchRefinements = async (projectId: string): Promise<Refinement[]> => {
  const { data } = await api.get<Refinement[]>(`/api/refinement/${projectId}`);
  return data;
};

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [refiningSectionId, setRefiningSectionId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  if (!projectId) {
    return <p>Project not found.</p>;
  }

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });

  const sectionsQuery = useQuery({
    queryKey: ["sections", projectId],
    queryFn: () => fetchSections(projectId),
  });

  const refinementQuery = useQuery({
    queryKey: ["refinements", projectId],
    queryFn: () => fetchRefinements(projectId),
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post("/api/documents/generate", { project_id: Number(projectId) });
      await sectionsQuery.refetch();
    } catch (err) {
      console.error(err);
      alert("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async (sectionId: number, prompt: string) => {
    setRefiningSectionId(sectionId);
    try {
      await api.post("/api/refinement", { section_id: sectionId, prompt });
      await Promise.all([sectionsQuery.refetch(), refinementQuery.refetch()]);
    } catch (err) {
      console.error(err);
      alert("Refinement failed. Please try again.");
    } finally {
      setRefiningSectionId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/api/documents/${projectId}/export`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const extension = projectQuery.data?.document_type === "docx" ? "docx" : "pptx";
      link.href = url;
      link.setAttribute("download", `${projectQuery.data?.title || "document"}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const handleFeedback = async (refinementId: number, feedback: "like" | "dislike") => {
    const comment = window.prompt("Add an optional comment about this revision:") || undefined;
    await api.post("/api/refinement/feedback", {
      refinement_id: refinementId,
      feedback,
      comment,
    });
    refinementQuery.refetch();
  };

  if (projectQuery.isLoading || sectionsQuery.isLoading) {
    return <p>Loading project...</p>;
  }

  const project = projectQuery.data;
  const sections = sectionsQuery.data || [];

  if (!project) {
    return <p>Project not found.</p>;
  }

  return (
    <div>
      <button className="button secondary" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="card">
        <p className="badge">{project.document_type === "docx" ? "Word" : "PowerPoint"}</p>
        <h1>{project.title}</h1>
        <p style={{ color: "#475569" }}>{project.main_topic}</p>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button className="button primary" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating..." : "Generate content"}
          </button>
          <button className="button secondary" onClick={handleExport} disabled={exporting || sections.length === 0}>
            {exporting ? "Preparing file..." : "Export"}
          </button>
        </div>
      </div>

      <div className="sections-list">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            refiningSectionId={refiningSectionId}
            onRefine={handleRefine}
          />
        ))}
      </div>

      <div className="card">
        <h2>Refinement history</h2>
        {refinementQuery.isLoading && <p>Loading history...</p>}
        {refinementQuery.data?.length === 0 && <p>No refinements yet.</p>}
        {refinementQuery.data?.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <p style={{ fontWeight: 600 }}>Section #{item.section_id}</p>
            <p style={{ fontSize: 14, color: "#475569" }}>{item.prompt}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="button secondary" onClick={() => handleFeedback(item.id, "like")}>
                👍 Like
              </button>
              <button className="button secondary" onClick={() => handleFeedback(item.id, "dislike")}>
                👎 Dislike
              </button>
            </div>
            {item.user_feedback && (
              <p style={{ marginTop: 8, fontSize: 14 }}>
                Feedback recorded: {item.user_feedback} {item.user_comment ? `— ${item.user_comment}` : ""}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectDetailPage;

