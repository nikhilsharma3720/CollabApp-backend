const Team = require("../models/teamModel");

async function sendUserData(req, res) {
  try {
    const userId = req.user.id;

    // Find all teams where this user is a member and return only the _id
    const teams = await Team.find({ members: userId }).select("_id");

    // If you only want a single team, you can pick the first one:
    const teamId = teams.length ? teams[0]._id : null;

    res.json({
      id: req.user.id,
      email: req.user.email,
      teamId, // only one team ID (or null if user has no team)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
}

module.exports = sendUserData;
