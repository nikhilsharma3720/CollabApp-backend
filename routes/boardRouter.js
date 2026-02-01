const express = require("express");
const boardRouter = express.Router();
const {
  createBoard,
  addNote,
  fetchBoards,
  deleteNote,
  deleteBoard,
  fetchAllBoards,
  getBoardsByTeam,
  getBoardsByJoinCode,
} = require("../controllers/boardController");
const authMiddleware = require("../middlewares/authMiddleware");
boardRouter.post("/boards", authMiddleware, createBoard);
boardRouter.post("/boards/:boardId/notes", authMiddleware, addNote);
boardRouter.get("/boards/:boardId", authMiddleware, fetchBoards);
boardRouter.delete(
  "/boards/:boardId/notes/:noteId",
  authMiddleware,
  deleteNote,
);
boardRouter.delete("/boards/:boardId", authMiddleware, deleteBoard);
boardRouter.get("/boards", authMiddleware, fetchAllBoards);
boardRouter.get(
  "/boards/fetchByTeamId/:teamId",
  authMiddleware,
  getBoardsByTeam,
);
boardRouter.post("/boards/:getTeamId", authMiddleware, getBoardsByJoinCode);

module.exports = boardRouter;
