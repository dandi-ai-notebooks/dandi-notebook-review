import { useState, useEffect } from 'react';
import { User } from '../api/types';
import { API_BASE_URL, createAdminHeaders } from '../api/config';

interface AdminPageProps {
  adminToken: string;
}

function AdminPage({ adminToken }: AdminPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<Omit<User, 'apiToken'> & { apiToken: string }>({
    name: '',
    email: '',
    apiToken: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: createAdminHeaders(adminToken)
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: createAdminHeaders(adminToken),
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const createdUser = await response.json();
        setUsers([...users, createdUser]);
        setNewUser({ name: '', email: '', apiToken: '' });
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleDeleteUser = async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: createAdminHeaders(adminToken)
      });

      if (response.ok) {
        setUsers(users.filter(u => u.email !== email));
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  return (
    <div className="admin-page">
      <h2>User Management</h2>

      <form onSubmit={handleCreateUser} className="new-user-form">
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="apiToken">API Token:</label>
          <input
            type="text"
            id="apiToken"
            value={newUser.apiToken}
            onChange={(e) => setNewUser({ ...newUser, apiToken: e.target.value })}
            required
          />
        </div>

        <button type="submit">Add User</button>
      </form>

      <div className="users-list">
        <h3>Users</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>API Token</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.apiToken}</td>
                <td>
                  <button
                    onClick={() => handleDeleteUser(u.email)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="no-users">No users found.</p>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
