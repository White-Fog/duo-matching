const db = require("../models/db"); // 앞서 작성한 MySQL 풀(pool) 모듈

/**
 * 평가 제출 컨트롤러
 * 클라이언트에서 보내는 평가 데이터(매치 ID, 상대방 ID, 평가 점수)를 받아 DB에 저장
 */
exports.submitRating = async (req, res) => {
  const { matchId, ratedUserId, rating } = req.body;
  const raterUserId = req.user.id; // 인증 미들웨어를 통해 추가된 사용자 정보

  // 평가 점수가 0~10 범위인지 검증
  if (rating < 0 || rating > 10) {
    return res
      .status(400)
      .json({ error: "평가 점수는 0과 10 사이여야 합니다." });
  }

  try {
    await db.submitRating(matchId, raterUserId, ratedUserId, rating);
    res.status(201).json({ message: "평가가 성공적으로 제출되었습니다." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * 특정 사용자의 평가 정보를 조회하는 컨트롤러
 * 해당 사용자가 받은 평가의 평균 점수와 평가 건수를 반환합니다.
 */
exports.getUserRating = async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.getUserRating(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "평가 정보 조회 중 문제가 발생했습니다." });
  }
};
