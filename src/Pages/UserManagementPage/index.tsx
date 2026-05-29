import React, { useState, useEffect } from "react";
import style from "./style.module.css";
import Input from "../../Components/Input";
import Button from "../../Components/Button";
import axios from "axios";
import useSnackbar from "../../context/Snackbar/useSnackbar";

const UserManagementPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const snackbar = useSnackbar();
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
    role: "cashier"
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5500/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      setUsers(response.data);
    } catch (err: any) {
      snackbar.onResponse({ message: err.response?.data?.message || "Failed to fetch users", status: 500 });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5500/api/users/create", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      snackbar.onResponse({ message: "User created successfully!", status: 201 });
      setIsAddModalOpen(false);
      setFormData({ username: "", password: "", fullName: "", email: "", phone: "", role: "cashier" });
      fetchUsers();
    } catch (err: any) {
      snackbar.onResponse({ message: err.response?.data?.message || "Error creating user", status: 500 });
    }
  };

  const handleEditUser = async (e: any) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5500/api/users/update/${currentUser.username}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      snackbar.onResponse({ message: "User updated successfully!", status: 200 });
      setIsEditModalOpen(false);
      setCurrentUser(null);
      fetchUsers();
    } catch (err: any) {
      snackbar.onResponse({ message: err.response?.data?.message || "Error updating user", status: 500 });
    }
  };

  const handleResetPassword = async (e: any) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5500/api/users/reset-password/${currentUser.username}`, { newPassword: formData.password }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      snackbar.onResponse({ message: "Password reset successfully!", status: 200 });
      setIsPasswordModalOpen(false);
      setCurrentUser(null);
      setFormData({ ...formData, password: "" });
    } catch (err: any) {
      snackbar.onResponse({ message: err.response?.data?.message || "Error resetting password", status: 500 });
    }
  };

  const toggleStatus = async (user: any) => {
    try {
      await axios.put(`http://localhost:5500/api/users/toggle-status/${user.username}`, { isActive: !user.isActive }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      snackbar.onResponse({ message: `User ${!user.isActive ? 'enabled' : 'disabled'} successfully!`, status: 200 });
      fetchUsers();
    } catch (err: any) {
      snackbar.onResponse({ message: err.response?.data?.message || "Error toggling status", status: 500 });
    }
  };

  const deleteUser = async (user: any) => {
    if (!window.confirm(`Are you sure you want to delete ${user.username}?`)) return;
    try {
      await axios.delete(`http://localhost:5500/api/users/delete/${user.username}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      snackbar.onResponse({ message: "User deleted successfully!", status: 200 });
      fetchUsers();
    } catch (err: any) {
      snackbar.onResponse({ message: err.response?.data?.message || "Error deleting user", status: 500 });
    }
  };

  const openEditModal = (user: any) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      password: "",
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "cashier"
    });
    setIsEditModalOpen(true);
  };

  const openPasswordModal = (user: any) => {
    setCurrentUser(user);
    setFormData({ ...formData, password: "" });
    setIsPasswordModalOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase()) || 
    (user.fullName && user.fullName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={style.container}>
      <div className={style.header}>
        <h2>User Management</h2>
        <Button onClick={() => {
          setFormData({ username: "", password: "", fullName: "", email: "", phone: "", role: "cashier" });
          setIsAddModalOpen(true);
        }}>Add New User</Button>
      </div>

      <div className={style.toolbar}>
        <Input 
          type="text" 
          placeholder="Search users..." 
          value={search} 
          onChange={(e: any) => setSearch(e.target.value)} 
          className={style.searchInput}
        />
      </div>

      <div className={style.tableContainer}>
        {loading ? <p>Loading users...</p> : (
          <table className={style.table}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign: "center"}}>No users found.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.fullName || "-"}</td>
                    <td><span className={`${style.badge} ${user.role === 'admin' ? style.adminBadge : style.cashierBadge}`}>{user.role}</span></td>
                    <td>
                      <span className={`${style.badge} ${user.isActive ? style.activeBadge : style.inactiveBadge}`}>
                        {user.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</td>
                    <td className={style.actions}>
                      <button onClick={() => openEditModal(user)} className={style.actionBtn}>Edit</button>
                      <button onClick={() => openPasswordModal(user)} className={style.actionBtn}>Reset Pass</button>
                      <button onClick={() => toggleStatus(user)} className={style.actionBtn}>
                        {user.isActive ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => deleteUser(user)} className={`${style.actionBtn} ${style.deleteBtn}`}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className={style.modalOverlay}>
          <div className={style.modal}>
            <h3>Add New User</h3>
            <form onSubmit={handleAddUser}>
              <div className={style.formGroup}>
                <label>Username *</label>
                <Input name="username" value={formData.username} onChange={handleInputChange} required />
              </div>
              <div className={style.formGroup}>
                <label>Password *</label>
                <Input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              </div>
              <div className={style.formGroup}>
                <label>Full Name</label>
                <Input name="fullName" value={formData.fullName} onChange={handleInputChange} />
              </div>
              <div className={style.formGroup}>
                <label>Email</label>
                <Input type="email" name="email" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className={style.formGroup}>
                <label>Phone</label>
                <Input name="phone" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className={style.formGroup}>
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleInputChange} className={style.select}>
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={style.modalActions}>
                <Button type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className={style.modalOverlay}>
          <div className={style.modal}>
            <h3>Edit User ({currentUser?.username})</h3>
            <form onSubmit={handleEditUser}>
              <div className={style.formGroup}>
                <label>Full Name</label>
                <Input name="fullName" value={formData.fullName} onChange={handleInputChange} />
              </div>
              <div className={style.formGroup}>
                <label>Email</label>
                <Input type="email" name="email" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className={style.formGroup}>
                <label>Phone</label>
                <Input name="phone" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className={style.formGroup}>
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleInputChange} className={style.select}>
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={style.modalActions}>
                <Button type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit">Update User</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {isPasswordModalOpen && (
        <div className={style.modalOverlay}>
          <div className={style.modal}>
            <h3>Reset Password for {currentUser?.username}</h3>
            <form onSubmit={handleResetPassword}>
              <div className={style.formGroup}>
                <label>New Password *</label>
                <Input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              </div>
              <div className={style.modalActions}>
                <Button type="button" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
                <Button type="submit">Reset Password</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagementPage;
