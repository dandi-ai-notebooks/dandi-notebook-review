import { useState, useEffect } from 'react';
import { User, Review } from '../api/types';
import { API_BASE_URL, createAdminHeaders } from '../api/config';

const downloadBlob = (data: string, fileName: string, mimeType: string) => {
  const blob = new Blob([data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

interface AdminPageProps {
  adminToken: string;
}

function AdminPage({ adminToken }: AdminPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<{ id: string; email: string } | null>(null);
  const [showReviews, setShowReviews] = useState(false);
  const [newUser, setNewUser] = useState<Omit<User, 'apiToken'> & { apiToken: string }>({
    name: '',
    email: '',
    apiToken: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, reviewsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/users`, {
            headers: createAdminHeaders(adminToken)
          }),
          fetch(`${API_BASE_URL}/admin/reviews`, {
            headers: createAdminHeaders(adminToken)
          })
        ]);

        if (usersResponse.ok) {
          const userData = await usersResponse.json();
          setUsers(userData);
        }

        if (reviewsResponse.ok) {
          const reviewData = await reviewsResponse.json();
          setReviews(reviewData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [adminToken]);

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

  const handleUpdateReviewerEmail = async () => {
    if (!editingReview) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/reviews`, {
        method: 'PUT',
        headers: createAdminHeaders(adminToken),
        body: JSON.stringify({
          id: editingReview.id,
          reviewer_email: editingReview.email
        })
      });

      if (response.ok) {
        const updatedReview = await response.json();
        setReviews(reviews.map(review =>
          review._id === updatedReview._id ? updatedReview : review
        ));
        setEditingReview(null);
      }
    } catch (error) {
      console.error('Failed to update reviewer:', error);
    }
  };

  return (
    <div className="admin-page" style={{ height: 'calc(100vh - 120px)', overflowY: 'auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>User Management</h2>
        <button
          onClick={async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/admin/export`, {
                headers: createAdminHeaders(adminToken)
              });
              if (response.ok) {
                const data = await response.json();
                downloadBlob(
                  JSON.stringify(data, null, 2),
                  `database-export-${new Date().toISOString().split('T')[0]}.json`,
                  'application/json'
                );
              } else {
                console.error('Failed to export database:', await response.text());
              }
            } catch (error) {
              console.error('Failed to export database:', error);
            }
          }}
          className="export-button"
        >
          Export Database
        </button>
      </div>

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

      {/* Users Section */}
      <div className="users-list" style={{ marginBottom: '40px' }}>
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

      {/* Reviews Section */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <h2>Reviews</h2>
          <button onClick={() => setShowReviews(!showReviews)}>
            {showReviews ? 'Collapse' : 'Expand'}
          </button>
        </div>
        <div className="reviews-list" style={{ display: showReviews ? 'block' : 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Notebook URI</th>
                <th>Reviewer Email</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Edited</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td>{review.notebook_uri}</td>
                  <td>
                    {editingReview?.id === review._id ? (
                      <input
                        type="email"
                        value={editingReview.email}
                        onChange={(e) => setEditingReview({ ...editingReview, email: e.target.value })}
                        style={{ width: '200px' }}
                      />
                    ) : (
                      review.reviewer_email
                    )}
                  </td>
                  <td>{review.review.status}</td>
                  <td>{new Date(review.timestamp_created).toLocaleDateString()}</td>
                  <td>{new Date(review.timestamp_edited).toLocaleDateString()}</td>
                  <td>
                    {editingReview?.id === review._id ? (
                      <div>
                        <button
                          onClick={handleUpdateReviewerEmail}
                          style={{ marginRight: '5px' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingReview(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingReview({ id: review._id, email: review.reviewer_email })}
                      >
                        Edit Reviewer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reviews.length === 0 && (
            <p className="no-reviews">No reviews found.</p>
          )}
        </div>
      </div>

    </div>
  );
}

export default AdminPage;
