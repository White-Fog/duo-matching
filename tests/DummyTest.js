const express = require("express");
const bodyParser = require("body-parser");
const MatchMaking = require("../src/routes/MatchMaking");
const riotAPI = require("../src/middlewares/riotAPI"); // Riot API 모듈 가져오기

const app = express();
app.use(bodyParser.json()); // JSON 데이터 파싱 설정

const matchmaking = new MatchMaking(); // 매치메이킹 인스턴스 생성

// 한글로 티어 번역
const tierTranslation = {
  IRON: "아이언",
  BRONZE: "브론즈",
  SILVER: "실버",
  GOLD: "골드",
  PLATINUM: "플래티넘",
  DIAMOND: "다이아몬드",
  MASTER: "마스터",
  GRANDMASTER: "그랜드마스터",
  CHALLENGER: "챌린저",
};

// 목표 티어 계산 함수
function calculateTargetTiers(currentTier, currentRank) {
  const rankOrder = ["IV", "III", "II", "I"];
  const nextRankIndex = rankOrder.indexOf(currentRank) - 1;
  const higherTierKey =
    Object.keys(tierTranslation)[
      Object.keys(tierTranslation).indexOf(currentTier) + 1
    ];

  let targetOptions = [];
  if (nextRankIndex >= 0) {
    targetOptions.push(
      `${tierTranslation[currentTier]} ${rankOrder[nextRankIndex]}`
    );
  }
  if (higherTierKey) {
    targetOptions.push(`${tierTranslation[higherTierKey]} IV`);
  }
  return targetOptions;
}

// 사용자 본인의 정보를 입력받고 대기열에 추가하는 엔드포인트
app.post("/add-self", async (req, res) => {
  console.log("요청 데이터 확인 (add-self):", req.body); // 요청 데이터 출력
  const { username, tagLine, targetRank, selectPosition } = req.body;

  try {
    const summonerData = await riotAPI.getSummonerUidByName(username, tagLine);
    if (!summonerData || !summonerData.puuid) {
      return res.status(400).json({
        error:
          "소환사 정보를 가져올 수 없습니다. 이름과 태그라인을 확인하세요.",
      });
    }

    const rankData = await riotAPI.getUserInfoByUid(summonerData.puuid);
    const soloQueueRank = rankData.find(
      (entry) => entry.queueType === "RANKED_SOLO_5x5"
    );
    let currentTier = "정보 없음";
    let currentRank = "정보 없음";

    if (soloQueueRank && soloQueueRank.tier && soloQueueRank.rank) {
      currentTier = soloQueueRank.tier;
      currentRank = soloQueueRank.rank;
    } else {
      return res.status(400).json({
        error: "현재 티어 정보를 가져올 수 없습니다. 소환사를 확인하세요.",
      });
    }

    const translatedTier = tierTranslation[currentTier];
    const targetOptions = calculateTargetTiers(currentTier, currentRank);

    // 목표 티어 유효성 검증
    if (!targetOptions.includes(targetRank)) {
      return res.status(400).json({
        error: `목표 티어가 올바르지 않습니다. 설정 가능한 티어: ${targetOptions.join(
          ", "
        )}`,
      });
    }

    const user = {
      username,
      tagLine,
      CurrentRank: `${translatedTier} ${currentRank}`,
      targetRank, // 소문자로 통일
      selectPosition, // 소문자로 통일
      enqueueTime: Date.now(),
      OPScore: Math.floor(Math.random() * 100) + 1, // 랜덤 OP 점수 생성
    };

    console.log("대기열에 추가할 사용자 데이터 (add-self):", user); // 대기열에 추가될 데이터 출력
    matchmaking.addUserToQueue(user);
    console.log(`${username}가 매치메이킹 대기열에 추가되었습니다!`);
    return res.status(200).json({
      message: `${username}가 매치메이킹 대기열에 성공적으로 추가되었습니다.`,
      currentTier: `${translatedTier} ${currentRank}`,
      targetOptions,
    });
  } catch (error) {
    console.error("사용자 추가 중 오류 발생 (add-self):", error.message);
    return res
      .status(500)
      .json({ error: "사용자 정보를 추가하는 도중 문제가 발생했습니다." });
  }
});

// 다른 사용자의 정보를 입력받고 대기열에 추가하는 엔드포인트
app.post("/add-user", async (req, res) => {
  console.log("요청 데이터 확인 (add-user):", req.body); // 요청 데이터 출력

  const { username, tagLine, targetRank, selectPosition } = req.body; // 소문자로 통일

  // 요청 데이터 디버깅
  console.log("targetRank 값:", targetRank);
  console.log("selectPosition 값:", selectPosition);

  // 필수 값 검증
  if (!targetRank || !selectPosition) {
    console.error(
      "필수 값 누락: targetRank 또는 selectPosition이 정의되지 않음."
    );
    return res.status(400).json({
      error: "targetRank와 selectPosition 값을 확인하세요.",
    });
  }

  try {
    const user = {
      username,
      tagLine,
      CurrentRank: req.body.CurrentRank || "알 수 없음",
      targetRank, // 소문자로 통일
      selectPosition, // 소문자로 통일
      enqueueTime: Date.now(),
      OPScore: Math.floor(Math.random() * 100) + 1,
    };

    console.log("대기열에 추가할 사용자 데이터 (add-user):", user); // 대기열 추가 전 데이터 출력
    matchmaking.addUserToQueue(user); // 대기열에 추가
    console.log(`${username}가 큐에 성공적으로 추가되었습니다!`);

    return res.status(200).json({
      message: `새로운 사용자 ${username}가 대기열에 성공적으로 추가되었습니다.`,
    });
  } catch (error) {
    console.error("사용자 추가 중 오류 발생 (add-user):", error.message);
    return res.status(500).json({
      error: "사용자 정보를 추가하는 도중 문제가 발생했습니다.",
    });
  }
});

// 매치메이킹 상태 확인 엔드포인트
app.get("/matchmaking-status", (req, res) => {
  console.log("현재 대기열 상태:", matchmaking.queue); // 대기열 상태 출력
  return res.status(200).json({ queueLength: matchmaking.queue.length });
});

// 서버 실행
app.listen(3000, () => {
  console.log("매치메이킹 서버가 3000번 포트에서 실행 중입니다!");
  console.log("매치메이킹을 시작합니다...");
  matchmaking.startMatchMaking();
});
