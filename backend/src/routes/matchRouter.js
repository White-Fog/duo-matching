// /routes/matchRouter.js
const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const MatchMaking = require("../services/MatchMaking"); // 매치메이킹 결정 모듈 (생성자에 io를 받도록 수정됨)
const OPScoreCalculator = require("../services/OPScore"); // OP 스코어 계산 모듈
const matchManager = require("../services/matchManager"); // 응답(수락/거절) 관리 모듈

// module.exports를 함수 형태로 변경하여, 외부에서 Socket.io 인스턴스를 주입할 수 있게 함.
module.exports = (io) => {
  const router = express.Router();
  // Socket.io 인스턴스를 주입한 MatchMaking 모듈 생성
  const matchmaking = new MatchMaking(io);

  // 백그라운드 매치메이킹 프로세스 시작
  matchmaking.startMatchMaking();

  /*
   * 현재 티어와 세부 티어를 기반으로 허용되는 목표 랭크(티어+세부 티어) 옵션들을 반환하는 함수.
   * 입력 currentRank 예시: "실버 3", "골드 2", "다이아몬드 2", "다이아몬드 1", "챌린저"
   * 티어 순서: "아이언" → "브론즈" → "실버" → "골드" → "플래티넘" → "에메랄드" → "다이아몬드" → "마스터" → "그랜드마스터" → "챌린저"
   * 단, 마스터, 그랜드마스터, 챌린저는 듀오 매치메이킹이 불가능하고,
   * 다이아몬드의 경우 하위: "다이아몬드 2" → (목표: "다이아몬드 1", "마스터 1"), "다이아몬드 1" → (목표: "마스터 1")
   * 그리고 일반 티어에서는 다음 규칙에 따라 허용:
   * - 현재 세부 티어가 3 또는 4인 경우: 동일 티어 내에서 바로 위 2세부 티어 (예, "실버 3" → ["실버 2", "실버 1"])
   * - 현재 세부 티어가 2인 경우: 해당 티어의 1과, 다음 티어의 4 (예, "골드 2" → ["골드 1", "플래티넘 4"])
   * - 현재 세부 티어가 1인 경우: 다음 티어의 4만 (예, "아이언 1" → ["브론즈 4"])
   */
  function getAllowedTargetRanks(uuid) {
    const tierOrder = [
      "IRON",
      "BRONZE",
      "SILVER",
      "GOLD",
      "PLATINUM",
      "EMERALD",
      "DIAMOND",
      "MASTER",
      "GRANDMASTER",
      "CHALLENGER",
    ];

    // 만약 currentRank에 세부 티어 정보가 없다면 (예: "챌린저"),
    // 듀오 매치메이킹 불가로 처리.
    if (!currentRank.includes(" ")) {
      return [];
    }

    const [currentTier, divisionStr] = currentRank.split(" ");
    const currentDivision = parseInt(divisionStr, 10);

    // 마스터 이상이면 매칭 불가
    if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(currentTier)) {
      return [];
    }

    // 다이아몬드 처리
    if (currentTier === "DIAMOND") {
      if (currentDivision === 2) {
        return ["DIAMOND 1", "MASTER 1"];
      }
      if (currentDivision === 1) {
        return ["MASTER 1"];
      }
    }

    const currentIndex = tierOrder.indexOf(currentTier);
    let allowedOptions = [];

    if (currentDivision >= 3) {
      allowedOptions.push(`${currentTier} ${currentDivision - 1}`);
      if (currentDivision - 2 >= 1) {
        allowedOptions.push(`${currentTier} ${currentDivision - 2}`);
      }
    } else if (currentDivision === 2) {
      allowedOptions.push(`${currentTier} 1`);
      if (currentIndex + 1 < tierOrder.length) {
        allowedOptions.push(`${tierOrder[currentIndex + 1]} 4`);
      }
    } else if (currentDivision === 1) {
      if (currentIndex + 1 < tierOrder.length) {
        allowedOptions.push(`${tierOrder[currentIndex + 1]} 4`);
      }
    }

    return allowedOptions;
  }

  /*
    [매치메이킹 요청]
    사용자가 POST /api/matchmaking/request로 자신의 정보를 전달하면,
    - 현재 티어를 기준으로 허용된 목표 랭크 옵션 내에서만 선택할 수 있게 검증합니다.
    - 검증 후, OP 스코어 계산 및 사용자 데이터를 구성하여 대기열에 등록합니다.
  */
  router.post("/request", async (req, res) => {
    // 클라이언트로부터 전달받은 값
    const { nickname, uuid, targetRank, selectPosition } = req.body;
    const userFromToken = {
      username: req.body.nickname,
      uuid: req.body.uuid,
    };

    // 목표 랭크 검증
    const currentRank = getRecentMatchByUid(uuid)[0]["tier"];
    const allowedTargets = getAllowedTargetRanks(currentRank);
    if (!allowedTargets.length) {
      return res.status(400).json({
        error: "현재 랭크로는 듀오 매치메이킹이 불가능합니다.",
      });
    }
    if (!allowedTargets.includes(targetRank)) {
      return res.status(400).json({
        error:
          "선택한 목표 랭크가 현재 랭크 기준 상위 2 티어 규칙에 맞지 않습니다.",
        allowed: allowedTargets,
      });
    }
    // OPScore 계산
    let opScore = 0;
    const matchIds = await getRecentMatchByUid(puuid);
    if (!matchIds || matchIds.length === 0) {
      return res.status(400).json({
        error: "최근 5경기를 찾을 수 없습니다.",
      });
    }
    let games = [];
    for (const matchId of matchIds) {
      const matchInfo = await getMatchInfoByMatchID(matchId);
      if (!matchInfo || !matchInfo.info || !matchInfo.info.participants)
        continue;

      const participant = matchInfo.info.participants.find(
        (participants) => participants.puuid === puuid
      );
      if (!participant) continue;

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
    }
    if (games && games.length > 0) {
      const opScoreCalc = new OPScoreCalculator(games);
      opScore = opScoreCalc.calculateOPScore();
    } else {
      opScore = Math.floor(Math.random() * 100) + 1;
    }

    // 사용자의 데이터를 구성하여 대기열에 등록.
    const userData = {
      username: userFromToken.username,
      tagLine: "",
      CurrentRank: userFromToken.currentRank,
      targetRank,
      selectPosition,
      enqueueTime: Date.now(),
      OPScore: opScore,
    };

    try {
      await matchmaking.addUserToQueue(userData);
      res.status(200).json({
        message: "사용자가 대기열에 추가되었습니다. 매칭 진행 중입니다.",
      });
    } catch (error) {
      res.status(500).json({
        error: "매치메이킹 요청 중 오류 발생",
        detail: error.message,
      });
    }
  });

  /*
    [매치 응답]
    후보 매칭이 도출된 후, 사용자는 POST /api/matchmaking/respond로 자신의 응답(수락/거절)을 전송합니다.
    응답 결과에 따라 최종 매칭 확정 시 상대 정보를 반환하거나, 매칭 실패 시 대기열에 재등록합니다.
  */
  router.post("/respond", async (req, res) => {
    const { matchId, accepted, username } = req.body;

    try {
      const responseResult = matchManager.recordResponse(
        matchId,
        username,
        accepted
      );
      if (responseResult.error) {
        return res.status(400).json({ error: responseResult.error });
      }

      if (responseResult.finalized) {
        const match = responseResult.match;
        if (responseResult.successful) {
          const opponent =
            match.user1.data.username === username
              ? match.user2.data
              : match.user1.data;
          matchManager.removeMatch(matchId);
          return res.status(200).json({
            message: "매칭이 확정되었습니다.",
            opponent,
          });
        } else {
          matchManager.removeMatch(matchId);
          await matchmaking.addUserToQueue(match.user1.data);
          await matchmaking.addUserToQueue(match.user2.data);
          return res.status(200).json({
            message:
              "매칭이 실패하였습니다. 두 사용자를 다시 대기열에 재등록하였습니다.",
          });
        }
      } else {
        return res.status(200).json({
          message: "상대방의 응답을 기다리는 중입니다.",
        });
      }
    } catch (error) {
      console.error("매칭 응답 처리 오류:", error.message);
      res.status(500).json({
        error: "매칭 응답 처리 중 오류 발생",
        detail: error.message,
      });
    }
  });

  return router;
};
