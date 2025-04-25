import { useState, useEffect, FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { User, NotebookReview } from "../api/types";
import { API_BASE_URL, createHeaders } from "../api/config";
import questionsData from "../data/questions.json";
import "./ReviewFormPage.css";
import HorizontalSplitter from "../components/HorizontalSplitter";

interface LoginComponentProps {
  onLogin: (token: string) => Promise<void>;
}

function LoginComponent({ onLogin }: LoginComponentProps) {
  const [apiToken, setApiToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onLogin(apiToken);
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid API token. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="not-logged-in login-page">
      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}
      >
        <h2>Login required to access this page</h2>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="apiToken"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            API Token:
          </label>
          <input
            type="text"
            id="apiToken"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Enter your API token"
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
          />
        </div>
        {error && (
          <div
            className="error-message"
            style={{ color: "red", marginBottom: "1rem" }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "var(--primary-color)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

interface ReviewFormPageProps {
  user: User | undefined;
  onLogin: (token: string) => Promise<void>;
  width: number;
  height: number;
}

function ReviewFormPage({ user, onLogin, width, height }: ReviewFormPageProps) {
  const [searchParams] = useSearchParams();
  const urlParam = searchParams.get("url");
  const uri = urlParam ?
    (urlParam.startsWith('http://') || urlParam.startsWith('https://') ?
      urlParam :
      (() => {
        try {
          const decoded = atob(urlParam);
          if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
            throw new Error('Decoded URL must start with http:// or https://');
          }
          return decoded;
        } catch (error) {
          console.error('Error decoding URL:', error);
          return null;
        }
      })()
    ) : null;
  const navigate = useNavigate();
  const [review, setReview] = useState<NotebookReview | null>(null);
  const [originalReview, setOriginalReview] = useState<NotebookReview | null>(null);
  const [loading, setLoading] = useState(true);

  // Add keyboard shortcut (Ctrl+Shift+H) to display the actual URL in the console
  // This is useful for debugging and verification when working with base64 encoded URLs,
  // allowing developers to see the decoded URL that's being used
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "H") {
        console.log("Current notebook URL:", uri);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [uri]);

  const hasChanges = () => {
    if (!review || !originalReview) return false;
    return JSON.stringify(review.review.responses) !== JSON.stringify(originalReview.review.responses) ||
           review.review.status !== originalReview.review.status;
  };

  useEffect(() => {
    if (!user) return;
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
            const reviewData = currentReview;
            setReview(reviewData);
            setOriginalReview(JSON.parse(JSON.stringify(reviewData)));
          }
        }
      } catch (error) {
        console.error("Failed to fetch review:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [uri, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!review) return;
    if (!user) return;

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

  if (!user) {
    return <LoginComponent onLogin={onLogin} />;
  }

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
                method: "POST",
                headers: createHeaders(user.email, user.apiToken),
                body: JSON.stringify({
                  notebook_uri: uri,
                  review: {
                    status: "pending",
                    responses: [],
                  },
                }),
              });

              if (response.ok) {
                const newReview = await response.json();
                setReview(newReview);
              }
            } catch (error) {
              console.error("Failed to create review:", error);
            }
          }}
          className="create-review-button"
        >
          Create New Review
        </button>
        <button
          onClick={() => navigate("/dandi-notebook-review/s")}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>
    );
  }

  const nbfiddleNotebookUrl = `https://nbfiddle.app?url=${review.notebook_uri}&renderonly=1&fullwidth=1`;
  // const nbfiddleNotebookUrl = `http://localhost:5174?url=${review.notebook_uri}&renderonly=1&fullwidth=1`;

  return (
    <HorizontalSplitter
      width={width}
      height={height}
      initialSplitterPosition={Math.min(width * 2 / 5, 500)}
    >
      <ReviewPanel
        onSubmit={handleSubmit}
        review={review}
        setReview={setReview}
        user={user}
        width={0}
        height={0}
        hasChanges={hasChanges}
      />

      <div className="notebook-panel">
        <iframe
          src={nbfiddleNotebookUrl}
          title="Notebook Preview"
          width="100%"
          height="100%"
        />
      </div>
    </HorizontalSplitter>
  );
}

const ReviewPanel = ({
  onSubmit,
  review,
  setReview,
  user,
  width,
  height,
  hasChanges
}: {
  onSubmit: (e: FormEvent) => void;
  review: NotebookReview;
  setReview: React.Dispatch<React.SetStateAction<NotebookReview | null>>;
  user: User;
  width: number;
  height: number;
  hasChanges: () => boolean;
}) => {
  const navigate = useNavigate();
  return (
    <div style={{position: "relative", width, height, overflowY: "auto"}} className={hasChanges() ? "modified" : ""}>
      <div style={{ padding: "1rem" }}>
        <h2>Review Dandiset Notebook</h2>
        {review.review.status === "completed" && (
          <p className="readonly-message">
            To edit this review, set status to pending at the bottom of the form.
          </p>
        )}
        <p className="review-instructions">
          To review this notebook:
          <br />
          <br />
          1. Examine the notebook content in the panel on the right.
          <br />
          2. Answer each review question below. Optionally provide rationale for
          your choices and feel free to reference cell numbers.
          <br />
          3. Click "Finalize Review" when complete.
          <br />
        </p>
        <form onSubmit={onSubmit}>
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
                                rationale: "",
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
                        &nbsp;&nbsp;{!question.about_reviewer && `[${option.value}] `}{option.label}
                      </label>
                    ))}
                  </div>
                  <div className="rationale-field">
                    <textarea
                      className="rationale-textarea"
                      placeholder="Optional rationale for your response"
                      value={response?.rationale || ""}
                      disabled={review.review.status === "completed"}
                      style={{ minHeight: "25px" }}
                      ref={(elem) => {
                        if (elem) {
                          elem.style.height = 'auto';
                          elem.style.height = elem.scrollHeight + 'px';
                        }
                      }}
                      onInput={(e) => {
                        e.currentTarget.style.height = 'auto';
                        e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                      }}
                      onChange={(e) => {
                        const newResponses = [...review.review.responses];
                        const existingIndex = newResponses.findIndex(
                          (r) => r.question_id === question.id
                        );
                        if (existingIndex >= 0) {
                          newResponses[existingIndex] = {
                            ...newResponses[existingIndex],
                            rationale: e.target.value,
                          };
                        } else if (response?.response) {
                          newResponses.push({
                            question_id: question.id,
                            response: response.response,
                            rationale: e.target.value,
                          });
                        }
                        setReview({
                          ...review,
                          review: {
                            ...review.review,
                            responses: newResponses,
                          },
                        });

                        // Adjust height after value change
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
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
                      `${API_BASE_URL}/reviews?id=${encodeURIComponent(
                        updatedReview.notebook_uri
                      )}`,
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
            <button type="submit" disabled={review.review.status === "completed" || !hasChanges()}>
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => navigate("/dandi-notebook-review/reviews")}
            >
              {hasChanges() ? "Cancel Changes" : "Cancel"}
            </button>
          </div>
        </form>
        <hr />
        <br />
        <br />
        <br />
        <br />
      </div>
    </div>
  );
};

export default ReviewFormPage;
