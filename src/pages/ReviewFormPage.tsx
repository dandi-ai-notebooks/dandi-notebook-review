import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { User, NotebookReview } from "../api/types";
import { API_BASE_URL, createHeaders } from "../api/config";
import questionsData from "../data/questions.json";
import "./ReviewFormPage.css";

interface ReviewFormPageProps {
  user: User;
}

function ReviewFormPage({ user }: ReviewFormPageProps) {
  const [searchParams] = useSearchParams();
  const uri = searchParams.get("url");
  const navigate = useNavigate();
  const [review, setReview] = useState<NotebookReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
          headers: createHeaders(user.email, user.apiToken),
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
          headers: createHeaders(user.email, user.apiToken),
          body: JSON.stringify(review),
        }
      );

      if (response.ok) {
        navigate("/dandi-notebook-review/reviews");
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
                headers: createHeaders(user.email, user.apiToken),
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
          onClick={() => navigate('/dandi-notebook-review/s')}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>
    );
  }

  const nbfiddleNotebookUrl = `https://nbfiddle.app?url=${review.notebook_uri}&renderonly=1`;
  // const nbfiddleNotebookUrl = `http://localhost:5174?url=${review.notebook_uri}&renderonly=1`;

  return (
    <div className="review-form-page">
      <div className="review-panel">
        <h2>Review Dandiset Notebook</h2>
        <p className="review-instructions">
          To review this notebook:<br /><br />
          1. Examine the notebook content in the panel on the right.<br />
          2. Answer each review question below. Optionally provide rationale for your choices and feel free to reference cell numbers.<br />
          3. Click "Finalize Review" when complete.<br />
        </p>
        <form onSubmit={handleSubmit}>

          <div className="form-group questions-list">
            {questionsData.questions.map((question) => {
              const response = review.review.responses.find(
                (r) => r.question_id === question.id
              );
              return (
                <div key={question.id} className="question-item">
                  <h3>{question.text}</h3>
                  <div className="radio-group">
                    {question.options.map((option) => (
                      <label key={option.value} className="radio-label">
                        <input
                          type="radio"
                          name={question.id}
                          value={option.value}
                          checked={response?.response === String(option.value)}
                          disabled={review.review.status === "completed"}
                          onChange={() => {
                            const newResponses = [...review.review.responses];
                            const existingIndex = newResponses.findIndex(
                              (r) => r.question_id === question.id
                            );
                            if (existingIndex >= 0) {
                              newResponses[existingIndex] = {
                                ...newResponses[existingIndex],
                                question_id: question.id,
                                response: String(option.value),
                              };
                            } else {
                              newResponses.push({
                                question_id: question.id,
                                response: String(option.value),
                                rationale: '',
                              });
                            }
                            setReview({
                              ...review,
                              review: {
                                ...review.review,
                                responses: newResponses,
                              },
                            });
                          }}
                        />
                        &nbsp;&nbsp;[{option.value}] {option.label}
                      </label>
                    ))}
                  </div>
                  <div className="rationale-field">
                    <textarea
                      className="rationale-textarea"
                      placeholder="Optional: Rationale for your response"
                      value={response?.rationale || ''}
                      disabled={review.review.status === "completed"}
                      onChange={(e) => {
                        const newResponses = [...review.review.responses];
                        const existingIndex = newResponses.findIndex(
                          (r) => r.question_id === question.id
                        );
                        if (existingIndex >= 0) {
                          newResponses[existingIndex] = {
                            ...newResponses[existingIndex],
                            rationale: e.target.value
                          };
                        } else if (response?.response) {
                          newResponses.push({
                            question_id: question.id,
                            response: response.response,
                            rationale: e.target.value
                          });
                        }
                        setReview({
                          ...review,
                          review: {
                            ...review.review,
                            responses: newResponses,
                          },
                        });
                      }}
                    />
                    <button
                      type="button"
                      className="clear-button"
                      disabled={review.review.status === "completed"}
                      onClick={() => {
                        const newResponses = review.review.responses.filter(
                          (r) => r.question_id !== question.id
                        );
                        setReview({
                          ...review,
                          review: {
                            ...review.review,
                            responses: newResponses,
                          },
                        });
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="status-section">
            <p>Status: {review.review.status}</p>
            {review.review.status === "pending" ? (
              <button
                type="button"
                onClick={async () => {
                  const updatedReview: NotebookReview = {
                    ...review,
                    review: {
                      ...review.review,
                      status: "completed" as const,
                    },
                  };
                  setReview(updatedReview);

                  try {
                    const response = await fetch(
                      `${API_BASE_URL}/reviews?id=${encodeURIComponent(updatedReview.notebook_uri)}`,
                      {
                        method: "PUT",
                        headers: createHeaders(user.email, user.apiToken),
                        body: JSON.stringify(updatedReview),
                      }
                    );

                    if (response.ok) {
                      navigate("/dandi-notebook-review/reviews");
                    }
                  } catch (error) {
                    console.error("Failed to update review:", error);
                  }
                }}
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
            <button type="submit" disabled={review.review.status === "completed"}>Save Changes</button>
            <button type="button" onClick={() => navigate("/dandi-notebook-review/reviews")}>
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
