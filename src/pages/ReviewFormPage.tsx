import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { User, NotebookReview } from "../api/types";
import { API_BASE_URL, createHeaders } from "../api/config";

interface ReviewFormPageProps {
  user: User;
}

function ReviewFormPage({ user }: ReviewFormPageProps) {
  const [searchParams] = useSearchParams();
  const uri = searchParams.get("uri");
  const navigate = useNavigate();
  const [review, setReview] = useState<NotebookReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
          headers: createHeaders(user.email),
        });
        if (response.ok) {
          const reviews = await response.json();
          const currentReview = reviews.find(
            (r: NotebookReview) => r.notebook_uri === uri
          );
          if (currentReview) {
            setReview(currentReview);
          }
        }
      } catch (error) {
        console.error("Failed to fetch review:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [uri, user.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!review) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/reviews?id=${encodeURIComponent(review.notebook_uri)}`,
        {
          method: "PUT",
          headers: createHeaders(user.email),
          body: JSON.stringify(review),
        }
      );

      if (response.ok) {
        navigate("/reviews");
      }
    } catch (error) {
      console.error("Failed to update review:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!review) {
    return (
      <div className="review-not-found">
        <h2>Review Not Found</h2>
        <p>Would you like to create a new review for this notebook?</p>
        <button
          onClick={async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/reviews`, {
                method: 'POST',
                headers: createHeaders(user.email),
                body: JSON.stringify({
                  notebook_uri: uri,
                  review: {
                    status: 'pending',
                    responses: []
                  }
                })
              });

              if (response.ok) {
                const newReview = await response.json();
                setReview(newReview);
              }
            } catch (error) {
              console.error('Failed to create review:', error);
            }
          }}
          className="create-review-button"
        >
          Create New Review
        </button>
        <button
          onClick={() => navigate('/reviews')}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>
    );
  }

  // const nbfiddleNotebookUrl = `https://nbfiddle.app?url=${review.notebook_uri}`;
  const nbfiddleNotebookUrl = `http://localhost:5174?url=${review.notebook_uri}&renderonly=1`;

  return (
    <div className="review-form-page">
      <div className="review-panel">
        <h2>Review Form</h2>
        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Responses:</label>
            {review.review.responses.map((response, index) => (
              <div key={response.question_id} className="response-item">
                <input
                  type="text"
                  value={response.question_id}
                  onChange={(e) => {
                    const newResponses = [...review.review.responses];
                    newResponses[index] = {
                      ...newResponses[index],
                      question_id: e.target.value,
                    };
                    setReview({
                      ...review,
                      review: {
                        ...review.review,
                        responses: newResponses,
                      },
                    });
                  }}
                  placeholder="Question ID"
                />
                <input
                  type="text"
                  value={String(response.response)}
                  onChange={(e) => {
                    const newResponses = [...review.review.responses];
                    newResponses[index] = {
                      ...newResponses[index],
                      response: e.target.value,
                    };
                    setReview({
                      ...review,
                      review: {
                        ...review.review,
                        responses: newResponses,
                      },
                    });
                  }}
                  placeholder="Response"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setReview({
                  ...review,
                  review: {
                    ...review.review,
                    responses: [
                      ...review.review.responses,
                      { question_id: "", response: "" },
                    ],
                  },
                })
              }
            >
              Add Response
            </button>
          </div>

          <div className="status-section">
            <p>Status: {review.review.status}</p>
            {review.review.status === "pending" ? (
              <button
                type="button"
                onClick={() =>
                  setReview({
                    ...review,
                    review: {
                      ...review.review,
                      status: "completed",
                    },
                  })
                }
              >
                Finalize Review
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setReview({
                    ...review,
                    review: {
                      ...review.review,
                      status: "pending",
                    },
                  })
                }
              >
                Set to Pending
              </button>
            )}
          </div>

          <div className="button-group">
            <button type="submit">Save Changes</button>
            <button type="button" onClick={() => navigate("/reviews")}>
              Cancel Changes
            </button>
          </div>
        </form>
      </div>

      <div className="notebook-panel">
        <iframe
          src={nbfiddleNotebookUrl}
          title="Notebook Preview"
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
}

export default ReviewFormPage;
