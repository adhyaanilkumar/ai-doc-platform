import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Project } from "../types";

const fetchProjects = async (): Promise<Project[]> => {
  const { data } = await api.get<Project[]>("/api/projects");
  return data;
};

const DashboardPage = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const handleDelete = async (projectId: number) => {
    if (!window.confirm("Delete this project? This action cannot be undone.")) return;
    await api.delete(`/api/projects/${projectId}`);
    refetch();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1>Projects</h1>
          <p style={{ color: "#475569" }}>Draft, refine, and export AI-assisted documents.</p>
        </div>
        <Link to="/projects/new" className="button primary">
          + New project
        </Link>
      </div>

      {isLoading && <p>Loading projects...</p>}

      {data && data.length === 0 && <p>No projects yet. Create your first one!</p>}

      <div className="section-grid">
        {data?.map((project) => (
          <div className="card" key={project.id}>
            <p className="badge">{project.document_type === "docx" ? "Word" : "PowerPoint"}</p>
            <h3>{project.title}</h3>
            <p style={{ color: "#475569" }}>{project.main_topic}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <Link to={`/projects/${project.id}`} className="button primary">
                Open
              </Link>
              <button className="button secondary" onClick={() => handleDelete(project.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;

