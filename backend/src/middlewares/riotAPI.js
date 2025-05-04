require("dotenv").config();
const axios = require("axios");
import { RIOT_API_KEY } from "../../.env"; //API 키 불러오기
//get puuid
async function getSummonerUidByName(gameName, tagLine) {
  try {
    const response = await axios.get(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY }, //API 키 불러오기
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching summoner data:", error);
    return null;
  }
}

//get recent 5 match

async function getRecentMatchByUid(puuid) {
  try {
    const response = await axios.get(
      `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&start=0&count=5`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching summoner data:", error);
    return null;
  }
}

//get match info
async function getMatchInfoByMatchID(matchId) {
  try {
    const response = await axios.get(
      `https://asia.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching summoner data:", error);
    return null;
  }
}

//get user rank info
async function getUserInfoByUid(puuid) {
  try {
    const response = await axios.get(
      `https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching summoner data:", error);
    return null;
  }
}
module.exports = {
  getSummonerUidByName,
  getRecentMatchByUid,
  getMatchInfoByMatchID,
  getUserInfoByUid,
};
