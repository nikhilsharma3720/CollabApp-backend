const express = require("express");
const teamRouter = express.Router();
const {
  createTeam,
  joinTeam,
  getMyTeams,
} = require("../controllers/teamController");
const authMiddleware = require("../middlewares/authMiddleware");
teamRouter.post("/createTeam", authMiddleware, createTeam);
teamRouter.post("/joinTeam", authMiddleware, joinTeam);
teamRouter.get("/getMyTeams/:userId", authMiddleware, getMyTeams);

module.exports = teamRouter;
