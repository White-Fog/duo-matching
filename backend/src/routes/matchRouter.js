// /routes/matchRouter.js
const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const MatchMaking = require("../services/MatchMaking"); // 매치메이킹 결정 모듈 (생성자에 io를 받도록 수정됨)
const OPScoreCalculator = require("../services/OPScore"); // OP 스코어 계산 모듈
const matchManager = require("../services/matchManager"); // 응답(수락/거절) 관리 모듈
const riotAPI = require("../middlewares/riotAPI");
const db = require("../models/db"); // DB 모듈

module.exports = (io) => {
  const router = express.Router();
  const matchmaking = new MatchMaking(io);
  matchmaking.startMatchMaking();

  /**
   * 현재 티어와 세부 티어 정보를 토대로 허용된 목표 랭크 옵션을 반환하는 함수
   * 예: "GOLD 2" → ["GOLD 1", "PLATINUM 4"]
   */
  function getAllowedTargetRanks(currentRank) {
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

    if (typeof currentRank !== "string" || !currentRank.includes(" ")) {
      return [];
    }

    const [currentTier, divisionStr] = currentRank.split(" ");
    const currentDivision = parseInt(divisionStr, 10);

    // MASTER, GRANDMASTER, CHALLENGER는 매칭 불가
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

  /**
   * [매치메이킹 요청]
   * 클라이언트는 POST /api/matchmaking/request로 아래 정보를 전달합니다.
   *  - token: 로그인 시 발급된 토큰 (DB 조회용)
   *  - targetRank: 사용자가 선택한 목표 랭크 (예: "GOLD 1")
   *  - selectPosition: 선택한 포지션
   *  - nickname: 웹상에 표시할 닉네임
   *
   * DB에 저장된 Riot ID는 "SummonerName#Tag" 형식으로 저장되어 있다 가정합니다.
   */
  router.post("/request", async (req, res) => {
    try {
      const { token, targetRank, selectPosition, nickname } = req.body;

      // 1. DB에서 토큰으로 Riot ID 조회 (컬럼명: account_ID)
      const queryResult = await db.query(
        "SELECT account_ID FROM members WHERE refreshToken = ?",
        [token]
      );
      console.log("DB queryResult =", queryResult);
      if (!queryResult || queryResult.length === 0) {
        return res
          .status(400)
          .json({ error: "사용자 정보를 찾을 수 없습니다." });
      }

      // DB에 저장된 Riot ID 전체 (예: "SummonerName#Tag")
      const fullRiotId = queryResult[0].account_ID;
      console.log("fullRiotId =", fullRiotId);
      if (!fullRiotId) {
        return res.status(400).json({ error: "Riot 계정 ID 정보가 없습니다." });
      }

      // 2. 분리: Riot ID를 '#'를 기준으로 분할하여 gameName과 tagLine 추출
      const [gameName, tagLine] = fullRiotId.split("#");
      if (!gameName || !tagLine) {
        return res
          .status(400)
          .json({ error: "Riot ID 형식이 올바르지 않습니다." });
      }

      // URL 인코딩을 적용하여 요청
      const encodedGameName = encodeURIComponent(gameName);
      const encodedTagLine = encodeURIComponent(tagLine);

      // 3. Riot API 호출: 소환사 정보 조회하여 puuid 확보
      const summonerData = await riotAPI.getSummonerUidByName(
        encodedGameName,
        encodedTagLine
      );
      if (!summonerData || !summonerData.puuid) {
        return res
          .status(400)
          .json({ error: "소환사 정보를 찾을 수 없습니다." });
      }
      const puuid = summonerData.puuid;

      // 4. puuid를 이용해 랭크 정보 조회하여 currentRank 생성
      const rankData = await riotAPI.getUserInfoByUid(puuid);
      if (!rankData || rankData.length === 0) {
        return res.status(400).json({ error: "랭크 정보를 찾을 수 없습니다." });
      }
      const soloEntry =
        rankData.find((entry) => entry.queueType === "RANKED_SOLO_5x5") ||
        rankData[0];
      const currentRank = `${soloEntry.tier} ${soloEntry.rank}`;

      // 5. 허용된 목표 랭크 옵션 계산 및 검증
      const allowedTargets = getAllowedTargetRanks(currentRank);
      if (!allowedTargets.length) {
        return res
          .status(400)
          .json({ error: "현재 랭크로는 듀오 매치메이킹이 불가능합니다." });
      }
      if (!allowedTargets.includes(targetRank)) {
        return res.status(400).json({
          error:
            "선택한 목표 랭크가 현재 랭크 기준 상위 2 티어 규칙에 맞지 않습니다.",
          allowed: allowedTargets,
        });
      }

      // 6. OPScore 계산: puuid 기반 최근 5경기 정보 조회
      const matchIds = await riotAPI.getRecentMatchByUid(puuid);
      if (!matchIds || matchIds.length === 0) {
        return res
          .status(400)
          .json({ error: "최근 5경기를 찾을 수 없습니다." });
      }
      let games = [];
      for (const matchId of matchIds) {
        const matchInfo = await riotAPI.getMatchInfoByMatchID(matchId);
        if (!matchInfo || !matchInfo.info || !matchInfo.info.participants)
          continue;
        const participant = matchInfo.info.participants.find(
          (p) => p.puuid === puuid
        );
        if (!participant) continue;
        games.push({
          kda: participant.challenges.kda,
          totalMinionsKilled: participant.totalMinionsKilled,
          neutralMinionsKilled: participant.neutralMinionsKilled,
          goldEarned: participant.goldEarned,
          visionScore: participant.visionScore,
          win: participant.win,
          playedtime: participant.timePlayed,
        });
      }
      let opScore = 0;
      if (games.length > 0) {
        const opScoreCalc = new OPScoreCalculator(games);
        opScore = opScoreCalc.calculateOPScore();
      } else {
        opScore = Math.floor(Math.random() * 100) + 1;
      }

      // 7. 사용자 데이터를 구성하여 대기열에 등록
      const userData = {
        username: nickname,
        tagLine: "",
        CurrentRank: currentRank,
        targetRank,
        selectPosition,
        enqueueTime: Date.now(),
        OPScore: opScore,
        account_ID: fullRiotId,
      };

      await matchmaking.addUserToQueue(userData);
      return res.status(200).json({
        message: "사용자가 대기열에 추가되었습니다. 매칭 진행 중입니다.",
      });
    } catch (error) {
      return res.status(500).json({
        error: "매치메이킹 요청 중 오류 발생",
        detail: error.message,
      });
    }
  });

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
        return res
          .status(200)
          .json({ message: "상대방의 응답을 기다리는 중입니다." });
      }
    } catch (error) {
      console.error("매칭 응답 처리 오류:", error.message);
      return res.status(500).json({
        error: "매칭 응답 처리 중 오류 발생",
        detail: error.message,
      });
    }
  });

  return router;
};
