import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OutlineEditor from "../components/OutlineEditor";
import api from "../services/api";

const ProjectBuilderPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState<"docx" | "pptx">("docx");
  const [mainTopic, setMainTopic] = useState("");
  const [outline, setOutline] = useState<string[]>(["Introduction", "Key Insights", "Conclusion"]);
  const [slides, setSlides] = useState<string[]>(["Title Slide", "Overview", "Insights"]);
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = documentType === "docx" ? outline : slides;
  const setItems = documentType === "docx" ? setOutline : setSlides;
  const placeholder = documentType === "docx" ? "Section" : "Slide";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload =
        documentType === "docx"
          ? { title, document_type: "docx", main_topic: mainTopic, outline }
          : { title, document_type: "pptx", main_topic: mainTopic, slides };
      const { data } = await api.post("/api/projects", payload);
      navigate(`/projects/${data.id}`);
    } catch (err) {
      console.error(err);
      setError("Unable to create project. Please review the form.");
    } finally {
      setLoading(false);
    }
  };

  const requestTemplate = async () => {
    if (!mainTopic.trim()) {
      setError("Enter a main topic before requesting an AI outline.");
      return;
    }
    setTemplateLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/api/documents/template", {
        document_type: documentType,
        main_topic: mainTopic,
      });
      if (documentType === "docx") {
        setOutline(data.outline || []);
      } else {
        setSlides(data.slides || []);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to generate an AI outline right now.");
    } finally {
      setTemplateLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card">
        <h2>Create a new project</h2>
        <div className="field">
          <label>Project title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="EV Market Outlook" />
        </div>
        <div className="field">
          <label>Main topic / prompt</label>
          <textarea
            value={mainTopic}
            onChange={(e) => setMainTopic(e.target.value)}
            placeholder="Describe the scope of the document"
            required
          />
        </div>
        <div className="field">
          <label>Document type</label>
          <select
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value as "docx" | "pptx")}
          >
            <option value="docx">Microsoft Word (.docx)</option>
            <option value="pptx">Microsoft PowerPoint (.pptx)</option>
          </select>
        </div>
        <button
          className="button secondary"
          type="button"
          onClick={requestTemplate}
          disabled={templateLoading}
        >
          {templateLoading ? "Generating outline..." : "AI-suggest outline"}
        </button>
      </div>

      <OutlineEditor
        items={items}
        onChange={setItems}
        placeholder={placeholder}
        label={`${placeholder} structure`}
      />

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <div style={{ display: "flex", gap: 12 }}>
        <button className="button primary" disabled={loading}>
          {loading ? "Creating..." : "Create project"}
        </button>
        <button className="button secondary" type="button" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProjectBuilderPage;

