require("dotenv").config();
const {
  getSummonerUidByName,
  getRecentMatchByUid,
  getMatchInfoByMatchID,
} = require("../middlewares/riotAPI");
const OPScoreCalculator = require("../services/OPScore"); // OPScoreCalculator 클래스가 있는 파일을 불러옴

async function fetchAndCalculateOPScore(gameName, tagLine) {
  try {
    console.log(`🔍 ${gameName}#${tagLine}의 최근 5경기 OP Score 계산 시작...`);

    // 🔹 1. 소환사 UID 가져오기
    const summonerData = await getSummonerUidByName(gameName, tagLine);
    if (!summonerData) throw new Error("소환사 정보를 찾을 수 없습니다.");
    const puuid = summonerData.puuid;
    console.log(`✅ 소환사 UID: ${puuid}`);

    // 🔹 2. 최근 5경기 가져오기
    const matchIds = await getRecentMatchByUid(puuid);
    if (!matchIds || matchIds.length === 0)
      throw new Error("최근 5경기를 찾을 수 없습니다.");
    console.log(`✅ 최근 5경기 ID: ${matchIds.join(", ")}`);
    let games = [];
    for (const matchId of matchIds) {
      const matchInfo = await getMatchInfoByMatchID(matchId);
      if (!matchInfo || !matchInfo.info || !matchInfo.info.participants)
        continue;

      // 🔎 소환사의 경기 정보 찾기
      const participant = matchInfo.info.participants.find(
        (participants) => participants.puuid === puuid
      );
      if (!participant) continue;

      // 🏆 필요한 데이터만 추출
      const gameData = {
        kda: participant.challenges.kda,
        totalMinionsKilled: participant.totalMinionsKilled,
        neutralMinionsKilled: participant.neutralMinionsKilled,
        goldEarned: participant.goldEarned,
        visionScore: participant.visionScore,
        win: participant.win,
        playedtime: participant.timePlayed,
      };

      games.push(gameData);
      console.log(gameData);
    }

    if (games.length === 0) throw new Error("경기 데이터가 없습니다.");

    // 🔹 4. OP Score 계산
    const calculator = new OPScoreCalculator(games);
    const opScore = calculator.calculateOPScore();
    console.log("📊 OP Score 결과:");
    console.log(
      `🏆 최종 OP Score: ${Math.round(Math.round(opScore * 10) / 10)}\n`,
      `🏆 원본 OP Score: ${opScore}\n`,
      `평균 kda: ${calculator.calculateKDA()}\n`,
      `평균 kda 조정치: ${
        Math.log(calculator.calculateKDA() + 1) / Math.log(3)
      }\n`,
      `평균 cs: ${calculator.calculateCS()}\n`,
      `평균 cs 조정치: ${
        1 / (1 + Math.exp(-0.3 * calculator.calculateCS()))
      }\n`,
      `평균 gold: ${calculator.calculateGold()}\n`,
      `평균 gold 조정치: ${calculator.calculateGold() / 300}\n`,
      `평균 vs: ${calculator.calculateVisionScore()}\n`,
      `평균 vs 조정치: ${
        1 / (1 + Math.exp(1 - 2 * calculator.calculateVisionScore()))
      }\n`,
      `평균 Win: ${calculator.calculateWinRate()}\n`
    );
    console.log();
  } catch (error) {
    console.error("❌ OP Score 계산 중 오류 발생:", error.message);
  }
}
const gameName = "bluelemonade"; // 테스트할 소환사 이름
const tagLine = "lemon"; // 태그라인 (한국 서버)
fetchAndCalculateOPScore(gameName, tagLine);
