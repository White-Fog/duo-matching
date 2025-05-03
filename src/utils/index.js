require("dotenv").config();
const {
  getSummonerUidByName,
  getRecentMatchByUid,
  getMatchInfoByMatchID,
  getUserInfoByUid,
} = require("../middlewares/riotAPI");

async function fetchMatchData(gameName, tagLine) {
  try {
    console.log(`🔍 ${gameName}#${tagLine}의 PUUID를 가져옵니다...`);
    const summonerData = await getSummonerUidByName(gameName, tagLine);

    if (!summonerData) {
      console.log("🚨 소환사 정보를 찾을 수 없습니다.");
      return;
    }

    const puuid = summonerData.puuid;
    console.log(`✅ PUUID: ${puuid}`);

    console.log("🔍 최근 5개 랭크 게임 매치 ID 가져오는 중...");
    const matchIds = await getRecentMatchByUid(puuid);

    if (!matchIds || matchIds.length === 0) {
      console.log("🚨 최근 경기 기록이 없습니다.");
      return;
    }

    console.log(`✅ 최근 매치 ID: ${matchIds}`);

    console.log("🔍 최근 5경기 정보 가져오는 중...");
    for (let i = 0; i < 5; i++) {
      matchInfo = await getMatchInfoByMatchID(matchIds[i]);

      if (!matchInfo) {
        console.log("🚨 매칭 정보를 가져올 수 없습니다.");
        return;
      }

      console.log("🎮 매칭 정보:");
      for (let j = 0; j < 10; j++) {
        if (matchInfo["info"]["participants"][j]["puuid"] == puuid)
          console.log(
            `포지션: ${matchInfo["info"]["participants"][j]["teamPosition"]}`,
            `킬: ${matchInfo["info"]["participants"][j]["kills"]}`,
            `어시: ${matchInfo["info"]["participants"][j]["assists"]}`,
            `데스: ${matchInfo["info"]["participants"][j]["deaths"]}`,
            `중립몹 처치: ${matchInfo["info"]["participants"][j]["neutralMinionsKilled"]}`
          );
      }
    }
    console.log("🔍 유저의 정보 가져오는 중...");
    const userInfo = await getUserInfoByUid(puuid);
    if (!userInfo) {
      console.log("🚨 유저 정보를 가져올 수 없습니다.");
      return;
    }

    console.log("🎮 유저 정보:");

    console.log(`티어: ${userInfo[0]["tier"]}`, `랭크: ${userInfo[0]["rank"]}`);
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  }
}

// ✅ 테스트 실행 (소환사 이름과 태그 입력)
fetchMatchData("사랑보육원 원장", "KR1");
