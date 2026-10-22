import { useState, type FC, type FormEvent } from "react";
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from "../../types/workspace";
import { ICON_MAP } from "../../utils/workspaceIcons";

type Props = {
  onClose: () => void;
  onCreate: (data: { name: string; description: string; icon: string; color: string }) => Promise<void>;
  initial?: { name: string; description: string; icon: string; color: string; id?: number };
};

export const WorkspaceCreateModal: FC<Props> = ({ onClose, onCreate, initial }) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "folder");
  const [color, setColor] = useState(initial?.color ?? "#6366f1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onCreate({ name: name.trim(), description, icon, color });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initial ? "Edit Workspace" : "Create Workspace"}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="msg error">{error}</div>}

          <div className="form-group">
            <label>Icon</label>
            <div className="icon-picker">
              {WORKSPACE_ICONS.map((ic) => {
                const IconComponent = ICON_MAP[ic];
                return (
                  <button
                    key={ic}
                    type="button"
                    className={`icon-option ${icon === ic ? "selected" : ""}`}
                    onClick={() => setIcon(ic)}
                  >
                    <IconComponent size={20} strokeWidth={2} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {WORKSPACE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-option ${color === c ? "selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ws-name">Name</label>
            <input
              id="ws-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Workspace"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="ws-desc">Description</label>
            <textarea
              id="ws-desc"
              className="form-input form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? "Saving…" : initial ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
