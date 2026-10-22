import { type FC } from "react";
import { IconSearch } from "@tabler/icons-react";

type Props = {
  search?: string;
  onCreate: () => void;
};

export const WorkspaceEmpty: FC<Props> = ({ search, onCreate }) => {
  if (search) {
    return (
      <div className="ws-empty">
        <div className="ws-empty-icon"><IconSearch size={48} strokeWidth={1.5} /></div>
        <h3>No workspaces found</h3>
        <p>No results for "<strong>{search}</strong>". Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="ws-empty">
      <div className="ws-empty-icon">📂</div>
      <h3>Create your first workspace</h3>
      <p>Workspaces are where you organize your documents, memories, and knowledge graphs.</p>
      <button className="btn-primary" onClick={onCreate}>
        + Create Workspace
      </button>
    </div>
  );
};
