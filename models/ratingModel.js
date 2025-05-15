// models/ratingModel.js
import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  dari_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  untuk_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mabar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mabar",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  komentar: {
    type: String,
    maxlength: 500,
  },
}, { timestamps: true });

export default mongoose.model("Rating", ratingSchema);
