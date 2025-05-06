require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "+09:00",
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  multipleStatements: false,
  typeCast: function (field, next) {
    if (
      field.type === "DATE" ||
      field.type === "DATETIME" ||
      field.type === "TIMESTAMP"
    ) {
      return field.string(); // 항상 문자열로 반환
    }
    return next();
  },
});

// 데이터베이스 연결 테스트 코드
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    if (!connection) {
      throw new Error("Failed to get a database connection.");
    }
    console.log("데이터베이스 연결 성공!");
    connection.release();
    return true;
  } catch (error) {
    console.error("데이터베이스 연결 실패:", error.message);
    return false;
  }
};

testConnection();

/*
  --- 사용자 평가 기능 추가 ---
  듀오가 종료된 후 사용자가 상대방을 평가할 때,
  피드백(comment)는 제거하고 0~10 점수만 저장하도록 합니다.
  
  1. submitRating(matchId, raterUserId, ratedUserId, rating)
     - match_id : 매치의 ID (매치 기록 테이블과 연관)
     - raterUserId : 평가한 사용자의 ID
     - ratedUserId : 평가 받은 사용자의 ID
     - rating : 평가 점수 (0 ~ 10)
     
  2. getUserRating(userId)
     - 특정 사용자가 받은 평가의 평균 점수와 평가 건수를 조회합니다.
*/

// 평가 제출 함수 (중복 평가 검사 포함)
pool.submitRating = async (matchId, raterUserId, ratedUserId, rating) => {
  // 중복 평가 여부 확인: 같은 매치에 대해 동일한 평가자가 같은 상대를 여러 번 평가하지 못하게 함
  const checkSql = `
    SELECT id FROM user_ratings
    WHERE match_id = ? AND rater_user_id = ? AND rated_user_id = ?
  `;
  const [existingRows] = await pool.execute(checkSql, [
    matchId,
    raterUserId,
    ratedUserId,
  ]);
  if (existingRows.length > 0) {
    throw new Error("중복 평가입니다. 이미 평가를 제출하였습니다.");
  }

  // 평가 데이터 삽입 (피드백 없이 점수만 저장)
  const insertSql = `
    INSERT INTO user_ratings (match_id, rater_user_id, rated_user_id, rating)
    VALUES (?, ?, ?, ?)
  `;

  try {
    const [result] = await pool.execute(insertSql, [
      matchId,
      raterUserId,
      ratedUserId,
      rating,
    ]);
    console.log("평가가 성공적으로 제출되었습니다.");
    return result;
  } catch (error) {
    console.error("평가 제출 오류:", error.message);
    throw error;
  }
};

// 평가 조회 함수 (특정 사용자의 평균 평점 및 평가 건수 조회)
pool.getUserRating = async (userId) => {
  const sql = `
    SELECT AVG(rating) AS avgRating, COUNT(*) AS count
    FROM user_ratings
    WHERE rated_user_id = ?
  `;
  try {
    const [rows] = await pool.execute(sql, [userId]);
    return rows[0]; // 결과: { avgRating: 값, count: 건수 }
  } catch (error) {
    console.error("평가 정보 조회 오류:", error.message);
    throw error;
  }
};

module.exports = pool;
