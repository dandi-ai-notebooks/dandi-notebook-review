import mongoose from 'mongoose';

const NotebookReviewSchema = new mongoose.Schema({
  notebook_uri: {
    type: String,
    required: true,
    unique: true,
  },
  reviewer_email: {
    type: String,
    required: true,
  },
  review: {
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    responses: [{
      question_id: String,
      response: mongoose.Schema.Types.Mixed,
      rationale: {
        type: String,
        required: false
      }
    }],
  },
  timestamp_created: {
    type: Date,
    default: Date.now,
  },
  timestamp_edited: {
    type: Date,
    default: Date.now,
  }
});

// Update timestamp_edited on save
NotebookReviewSchema.pre('save', function(next) {
  this.timestamp_edited = new Date();
  next();
});

export default mongoose.models.NotebookReview || mongoose.model('NotebookReview', NotebookReviewSchema);
