// /controllers/ratingController.js
const db = require("../models/db"); // 미리 작성한 MySQL 풀 모듈

/**
 * 평가 제출 컨트롤러
 * 클라이언트에서 보내는 평가 데이터(매치 ID, 평가 대상 사용자 ID, 평가 점수)를 받아 DB에 저장합니다.
 */
exports.submitRating = async (req, res) => {
  const { matchId, ratedUserId, rating } = req.body;

  // 인증 미들웨어에 의해 req.user가 채워져 있어야 합니다.
  // req.user.id를 평가 제출자(평가자)로 사용합니다.
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "인증되지 않은 사용자입니다." });
  }
  const raterUserId = req.user.id;

  // 평가 점수가 0~10 범위인지 검증 (숫자가 아닐 경우도 처리할 수 있음)
  if (typeof rating !== "number" || rating < 0 || rating > 10) {
    return res
      .status(400)
      .json({ error: "평가 점수는 0과 10 사이의 숫자여야 합니다." });
  }

  try {
    // db.submitRating은 matchId, 평가 제출자, 평가 대상자, 평가 점수를 DB에 저장하는 함수입니다.
    await db.submitRating(matchId, raterUserId, ratedUserId, rating);
    res.status(201).json({ message: "평가가 성공적으로 제출되었습니다." });
  } catch (error) {
    console.error("평가 제출 중 오류:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * 특정 사용자의 평가 정보를 조회하는 컨트롤러
 * 평가 받은 해당 사용자의 평균 평점과 평가 건수를 반환합니다.
 */
exports.getUserRating = async (req, res) => {
  const { userId } = req.params; // URL 파라미터에서 userId 받음
  try {
    const result = await db.getUserRating(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error("평가 정보 조회 중 오류:", error);
    res.status(500).json({ error: "평가 정보 조회 중 문제가 발생했습니다." });
  }
};
