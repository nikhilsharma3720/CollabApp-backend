const Team = require("../models/teamModel");
const Board = require("../models/boardModel"); // make sure you import Board
const mongoose = require("mongoose");

const generateJoinCode = require("../utils/generateCode");

async function createTeam(req, res) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Team name is required" });
    }

    const userId = req.user.id;

    // generate unique join code
    let joinCode;
    let exists = true;

    while (exists) {
      joinCode = generateJoinCode();
      exists = await Team.findOne({ joinCode });
    }

    const team = await Team.create({
      name,
      joinCode,
      members: [userId], // creator joins automatically
      createdBy: userId,
    });

    res.status(201).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create team" });
  }
}

async function joinTeam(req, res) {
  try {
    const { joinCode } = req.body;
    if (!joinCode) {
      return res.status(400).json({ message: "Join code is required" });
    }

    const userId = req.user.id;

    const team = await Team.findOne({ joinCode });
    if (!team) {
      return res.status(404).json({ message: "Invalid join code" });
    }

    // If user is already a member
    if (team.members.includes(userId)) {
      // Fetch all boards for this team
      const boards = await Board.find({ teamId: team._id });
      return res.status(200).json({ team, boards });
    }

    // Otherwise, add user to team
    team.members.push(userId);
    await team.save();

    // Fetch boards after joining (there may already be boards)
    const boards = await Board.find({ teamId: team._id });

    res.status(200).json({ team, boards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to join team" });
  }
}

const getMyTeams = async (req, res) => {
  try {
    // Get the ID directly from the authenticated user object
    const userId = req.user.id;

    const teams = await Team.find({
      members: userId, // Since 'createdBy' is also in 'members', this is enough
    }).select("name joinCode");

    res.status(200).json(teams);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch teams" });
  }
};

module.exports = { createTeam, joinTeam, getMyTeams };
