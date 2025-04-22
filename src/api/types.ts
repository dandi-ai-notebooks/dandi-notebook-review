export interface User {
  name: string;
  email: string;
  apiToken: string;
}

export interface AdminState {
  token: string;
}

export interface NotebookReview {
  notebook_uri: string;
  reviewer_email: string;
  review: {
    status: 'pending' | 'completed';
    responses: {
      question_id: string;
      response: string | number | boolean | Record<string, unknown>;
    }[];
  };
  timestamp_created: string;
  timestamp_edited: string;
}
