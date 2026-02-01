const Team = require('../models/teamModel')

async function verifyTeamAccess(teamId, userId) {
  const team = await Team.findOne({
    _id: teamId,
    members: userId,
  });

  return !!team;
}

module.exports = verifyTeamAccess;
