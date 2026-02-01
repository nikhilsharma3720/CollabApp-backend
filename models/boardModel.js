const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    content: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Board name
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    }, // Link to team
    notes: [noteSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // important
    // Embedded notes
  },
  { timestamps: true },
);

module.exports = mongoose.model("Board", boardSchema);
