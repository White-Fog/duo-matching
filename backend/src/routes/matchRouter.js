// /routes/matchRouter.js
const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const MatchMaking = require("../services/MatchMaking"); // 매치메이킹 결정 모듈 (생성자에 io를 받도록 수정됨)
const OPScoreCalculator = require("../services/OPScore"); // OP 스코어 계산 모듈
const matchManager = require("../services/matchManager"); // 인메모리 매치 관리 모듈
const riotAPI = require("../middlewares/riotAPI");
const pool = require("../models/db"); // DB 모듈

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
   * DB에 저장된 Riot ID는 "SummonerName#Tag" 형식으로 저장되어 있다고 가정합니다.
   */
  router.post("/request", async (req, res) => {
    try {
      const { userid, username, userAccountId, targetRank, selectPosition } =
        req.body;

      // DB에서 토큰으로 Riot ID 조회 (컬럼명: id)
      const [queryResult] = await pool.query(
        `SELECT uu_ID FROM members WHERE id = ?`,
        [userid]
      );
      if (!queryResult || queryResult.length === 0) {
        return res
          .status(400)
          .json({ error: "사용자 정보를 찾을 수 없습니다." });
      }
      const uu_id = queryResult[0].uu_ID;

      // puuid를 이용해 랭크 정보 조회하여 currentRank 생성
      const userInfo = await riotAPI.getUserInfoByUid(uu_id);
      if (!userInfo || userInfo.length === 0) {
        return res.status(400).json({ error: "유저 정보를 찾을 수 없습니다." });
      }
      const currentRank = `${userInfo[0].tier}`;

      // OPScore 계산: puuid 기반 최근 5경기 정보 조회
      const matchIds = await riotAPI.getRecentMatchByUid(uu_id);
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
          (p) => p.uu_id === uu_id
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

      // 사용자 데이터를 구성하여 대기열에 등록
      const userData = {
        username,
        CurrentRank: currentRank,
        puuid: uu_id,
        targetRank,
        selectPosition,
        enqueueTime: Date.now(),
        OPScore: opScore,
        account_ID: userAccountId,
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

  /**
   * [매치 응답]
   * 클라이언트는 POST /api/matchmaking/respond에 matchId, accepted, username을 전달합니다.
   * matchManager의 in-memory 매치 정보를 기반으로 응답을 처리하고,
   * 최종 확정 시 Socket.IO 이벤트를 통해 matchId와 상대 정보를 전달합니다.
   */
  router.post("/respond", async (req, res) => {
    const { matchId, accepted, account_ID } = req.body;
    if (!matchId) {
      return res
        .status(400)
        .json({ error: "매치 응답을 위해 matchId가 필요합니다." });
    }
    try {
      const responseResult = matchManager.recordResponse(
        matchId,
        accepted,
        account_ID
      );
      if (responseResult.error) {
        // 만약 에러 메시지가 "매치를 찾을 수 없습니다."라면,
        // 이는 이미 최종 처리(매칭 확정)가 완료되었다고 간주하여 정상 응답을 반환
        if (responseResult.error === "매치를 찾을 수 없습니다.") {
          return res.status(200).json({
            message: "매칭이 확정되었습니다.",
            // 여기에 추가 정보가 있다면 포함할 수 있음. 예를 들면,
            // matchId 또는 opponent 정보 (이미 Socket.IO로 전송되었으므로 생략 가능)
          });
        }
        // 그 외의 경우 일반 오류로 처리
        return res.status(400).json({ error: responseResult.error });
      }
      
      if (responseResult.finalized) {
        const match = responseResult.match;
        if (responseResult.successful) {
          const opponentObject = {
            user1: match.user1.data,
            user2: match.user2.data,
          };
            

          // Socket.IO 이벤트 발행: matchId와 상대 정보를 클라이언트에 전달
          io.emit("matchSuccess", {
            matchId: match.id,
            opponent: opponentObject
          });
          // 매칭 성공 후 in-memory에서 해당 매치 정보를 제거
          return res.status(200).json({
            message: "매칭이 확정되었습니다.",
            matchId: match.id,
            opponent: opponentObject,
          });
        } else {
          matchManager.removeMatch(matchId);
          return res.status(200).json({
            message:
              "매칭에 실패하였습니다. 두 사용자를 다시 대기열에 재등록하였습니다.",
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

  /**
   * [매치 취소]
   * 클라이언트는 POST /api/matchmaking/cancel에 userAccountId를 전달하여
   * 대기열에서 해당 사용자를 제거합니다.
   */
  router.post("/cancel", async (req, res) => {
    try {
      const { userAccountId } = req.body;
      if (!userAccountId) {
        return res
          .status(400)
          .json({ error: "취소할 사용자의 userAccountId가 필요합니다." });
      }
      const success = matchmaking.cancelUserFromQueue(userAccountId);
      if (success) {
        return res
          .status(200)
          .json({ message: `${userAccountId}의 매치메이킹이 취소되었습니다.` });
      } else {
        return res
          .status(400)
          .json({ error: "해당 사용자가 대기열에 존재하지 않습니다." });
      }
    } catch (error) {
      console.error("매치메이킹 취소 중 오류:", error.message);
      return res.status(500).json({
        error: "매치메이킹 취소 중 오류 발생",
        detail: error.message,
      });
    }
  });
  router.get('/success', async (req, res) => {
  try {
    const { matchId, userId} = req.query;

    if (!matchId) {
      return res.status(404).json({ message: '매칭 정보 없음' });
    }
    const match = matchManager.infoMatch(matchId);
    if (!match) {
      return res.status(404).json({ message: '매칭 정보 없음' });
    }
    if (!userId) {
      return res.status(404).json({ message: 'userId가 필요합니다' });
    }
    // (2) 상대방 정보 추출
    const opponent =
      match.user1.data.account_ID === userId
        ? match.user2.data
        : match.user1.data;

    // 매치 생성 시각을 기준으로 매칭 시간(matchTime)을 계산(초 단위)
    const matchTime = Math.floor((Date.now() - match.createdAt) / 1000);

    res.json({
      username: opponent.username,
      targetRank: opponent.targetRank,
      selectPosition: opponent.selectPosition,
      OPScore: opponent.OPScore,
    });
    // 주의: 최종 조회 후 매치 객체를 제거하면 이후 조회가 안 됨
    //matchManager.removeMatch(matchId);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});


  return router;
};
