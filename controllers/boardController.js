const Board = require("../models/boardModel");
const mongoose = require("mongoose");

const verifyTeamAccess = require("../utils/verifyTeamAccess");
const Team = require("../models/teamModel");

async function createBoard(req, res) {
  try {
    const { title, teamId } = req.body;
    if (!title || !teamId) {
      return res.status(400).json({ message: "Title and teamId are required" });
    }

    const userId = req.user.id; // set by auth middleware

    // 🔒 Verify the user belongs to this team
    const hasAccess = await verifyTeamAccess(teamId, userId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // 1️⃣ Create and save board in MongoDB with createdBy
    const newBoard = new Board({
      title,
      teamId,
      notes: [],
      createdBy: userId, // ✅ track who created this board
    });

    await newBoard.save();

    // 2️⃣ Populate user info (name & email) for frontend
    const populatedBoard = await newBoard.populate("createdBy", "name email");

    // 3️⃣ 🔥 Emit ONLY to this team with creator info
    req.io.to(`team:${teamId}`).emit("board-created", populatedBoard);

    // 4️⃣ Respond to the creator
    res.status(201).json(populatedBoard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create board" });
  }
}

async function addNote(req, res) {
  try {
    const { boardId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    // Create Note Object
    const newNote = {
      _id: new mongoose.Types.ObjectId(),
      content,
      userId,
      createdAt: new Date(),
    };

    board.notes.push(newNote);
    await board.save();

    // Get User Details for the notification
    const noteUser = await User.findById(userId).select("name email");

    // 🚀 EMIT TO THE TEAM ROOM (with "team:" prefix)
    req.io.to(`team:${board.teamId}`).emit("note-added", {
      boardId,
      note: {
        ...newNote,
        user: noteUser,
      },
    });

    res.status(201).json({ note: { ...newNote, user: noteUser } });
  } catch (err) {
    res.status(500).json({ message: "Failed to add note" });
  }
}

async function deleteNote(req, res) {
  try {
    const { boardId, noteId } = req.params;
    const userId = req.user.id;

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const originalLength = board.notes.length;
    board.notes = board.notes.filter((note) => note._id.toString() !== noteId);

    if (board.notes.length === originalLength) {
      return res.status(404).json({ message: "Note not found" });
    }

    await board.save();

    // ✅ 1. Get full user info (just like you did in addNote)
    const deleterUser = await User.findById(userId).select("name email");

    // ✅ 2. Emit with the full user object
    req.io.to(`team:${board.teamId}`).emit("note-deleted", {
      boardId,
      noteId,
      deletedBy: {
        name: deleterUser.name,
        email: deleterUser.email,
      },
    });

    res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Delete Note Error:", err);
    res.status(500).json({ message: "Failed to delete note" });
  }
}
const User = require("../models/userModal"); // make sure this is imported

async function deleteBoard(req, res) {
  try {
    const { boardId } = req.params;

    // 1️⃣ Find the board and populate original creator info
    const board = await Board.findById(boardId).populate(
      "createdBy",
      "name email",
    );
    if (!board) return res.status(404).json({ message: "Board not found" });

    const teamId = board.teamId;

    // 2️⃣ Verify user belongs to this team
    const hasAccess = await verifyTeamAccess(teamId, req.user.id);
    if (!hasAccess) return res.status(403).json({ message: "Access denied" });

    // 3️⃣ Delete the board
    await Board.findByIdAndDelete(boardId);

    // 4️⃣ Get full deletedBy info from users collection
    const deletedByUser = await User.findById(req.user.id).select("name email");

    // 5️⃣ Emit deletion event to the team
    req.io.to(`team:${teamId}`).emit("board-deleted", {
      boardId: board._id,
      title: board.title,
      createdBy: board.createdBy, // populated from step 1
      deletedBy: deletedByUser, // full name + email from users collection
    });

    // 6️⃣ Respond to requester
    res.status(200).json({
      message: "Board deleted successfully",
      boardId: board._id,
    });
  } catch (err) {
    console.error("Delete board error:", err);
    res.status(500).json({ message: "Failed to delete board" });
  }
}

async function fetchBoards(req, res) {
  try {
    const { boardId } = req.params;
    console.log("boardId", boardId);

    const board = await Board.find({ userId: boardId });
    if (!board) return res.status(404).json({ message: "Board not found" });

    res.status(201).json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add note" });
  }
}
async function fetchAllBoards(req, res) {
  try {
    const board = await Board.find();
    if (!board) return res.status(404).json({ message: "Board not found" });

    res.status(201).json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to Find Boards!" });
  }
}
async function getBoardsByTeam(req, res) {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    console.log("teamId:", teamId);

    // Verify user belongs to team
    const hasAccess = await verifyTeamAccess(teamId, userId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Fetch boards for the team
    const boards = await Board.find({
      teamId: new mongoose.Types.ObjectId(teamId),
    });

    // Fetch the team's joinCode
    const team = await Team.findById(teamId).select("joinCode");

    res.status(200).json({
      joinCode: team ? team.joinCode : null,
      boards,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch boards" });
  }
}
async function getBoardsByJoinCode(req, res) {
  try {
    const { joinCode } = req.body; // read from payload
    const userId = req.user.id;

    if (!joinCode) {
      return res.status(400).json({ message: "joinCode is required" });
    }

    // Find the team by joinCode
    const team = await Team.findOne({ joinCode }).select(
      "_id joinCode members",
    );
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Verify the user is a member of this team
    const hasAccess = team.members.includes(userId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Fetch boards for this team
    const boards = await Board.find({ teamId: team._id });

    res.status(200).json({
      teamId: team._id,
      joinCode: team.joinCode,
      boards,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch boards" });
  }
}

module.exports = {
  createBoard,
  addNote,
  fetchBoards,
  deleteNote,
  deleteBoard,
  fetchAllBoards,
  getBoardsByTeam,
  getBoardsByJoinCode,
};
