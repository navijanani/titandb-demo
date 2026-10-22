import { useState, type FC, type FormEvent } from "react";
import { IconUser, IconLock } from "@tabler/icons-react";
import { useAuth } from "../auth/AuthContext";
import { updateProfileApi } from "../auth/authApi";
import type { ProfileUpdateRequest } from "../types/auth";

export const ProfilePage: FC = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileError, setProfileError] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileMsg("");
    setProfileLoading(true);
    try {
      const body: ProfileUpdateRequest = {};
      if (name !== user?.display_name) body.display_name = name;
      if (email !== user?.email) body.email = email;
      if (Object.keys(body).length > 0) {
        const updated = await updateProfileApi(body);
        setUser(updated);
      }
      setProfileMsg("Profile updated");
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="studio-content">
      <div className="content-header">
        <div className="content-header-title">
          <div className="content-header-label">ACCOUNT</div>
          <h1 className="content-header-name">Profile & Settings</h1>
        </div>
      </div>

      <div className="content-body">
      <div className="profile-layout">
        <div className="section">
          <div className="section-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconUser size={20} strokeWidth={2} style={{ color: "var(--color-primary)" }} />
              <h3>Account Information</h3>
            </div>
          </div>
          <form onSubmit={handleProfileUpdate} className="profile-form">
            {profileError && <div className="msg error">{profileError}</div>}
            {profileMsg && <div className="msg success">{profileMsg}</div>}
            <div className="form-group">
              <label htmlFor="profile-name">Display name</label>
              <input id="profile-name" type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="profile-email">Email</label>
              <input id="profile-email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={profileLoading}>
                {profileLoading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>

        <div className="section">
          <div className="section-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconLock size={20} strokeWidth={2} style={{ color: "var(--color-primary)" }} />
              <h3>Password</h3>
            </div>
          </div>
          <p className="empty-text">Demo mode has no accounts or passwords, so there is nothing to change here. Sign-in is part of the full TitanDB application.</p>
        </div>

        <div className="section">
          <div className="section-header">
            <h3>Account Details</h3>
          </div>
          <table className="meta-table">
            <tbody>
              <tr><td>User ID</td><td>{user.id}</td></tr>
              <tr><td>Email</td><td>{user.email}</td></tr>
              <tr><td>Display name</td><td>{user.display_name || "—"}</td></tr>
              <tr><td>Active</td><td>{user.is_active ? "Yes" : "No"}</td></tr>
              <tr><td>Created</td><td>{new Date(user.created_at).toLocaleDateString()}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};
