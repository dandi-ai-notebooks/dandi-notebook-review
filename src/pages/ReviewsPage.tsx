import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, NotebookReview } from '../api/types';
import { API_BASE_URL, createHeaders } from '../api/config';

interface ReviewsPageProps {
  user: User;
}

function ReviewsPage({ user }: ReviewsPageProps) {
  const [reviews, setReviews] = useState<NotebookReview[]>([]);
  const [newNotebookUri, setNewNotebookUri] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
          headers: createHeaders(user.email, user.apiToken)
        });
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }
    };
    fetchReviews();
  }, [user]);

  const handleDeleteReview = async (notebookUri: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/reviews?id=${encodeURIComponent(notebookUri)}`, {
        method: 'DELETE',
        headers: createHeaders(user.email, user.apiToken)
      });

      if (response.ok) {
        setReviews(reviews.filter(review => review.notebook_uri !== notebookUri));
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: createHeaders(user.email, user.apiToken),
        body: JSON.stringify({
          notebook_uri: newNotebookUri,
          review: {
            status: 'pending',
            responses: []
          }
        })
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews([...reviews, newReview]);
        setNewNotebookUri('');
        navigate(`/dandi-notebook-review/review?uri=${encodeURIComponent(newReview.notebook_uri)}`);
      }
    } catch (error) {
      console.error('Failed to create review:', error);
    }
  };

  return (
    <div className="reviews-page">
      <h2>Notebook Reviews</h2>

      <form onSubmit={handleCreateReview} className="new-review-form">
        <input
          type="text"
          value={newNotebookUri}
          onChange={(e) => setNewNotebookUri(e.target.value)}
          placeholder="Enter notebook URI (GitHub URL)"
          required
        />
        <button type="submit">Create New Review</button>
      </form>

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review.notebook_uri} className="review-item">
            <div className="review-item-content">
              <Link to={`/dandi-notebook-review/review?uri=${encodeURIComponent(review.notebook_uri)}`}>
                <h3>{review.notebook_uri}</h3>
                <div className="review-details">
                  <span className={`status status-${review.review.status}`}>
                    {review.review.status}
                  </span>
                  <span className="date">
                    Last edited: {new Date(review.timestamp_edited).toLocaleDateString()}
                  </span>
                </div>
              </Link>
              <button
                onClick={() => handleDeleteReview(review.notebook_uri)}
                className="delete-button"
                aria-label="Delete review"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="no-reviews">No reviews yet. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}

export default ReviewsPage;
