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

// 데이터베이스 연결 테스트 코드 추가
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    if (!connection) {
      throw new Error("Failed to get a database connection.");
    }
    console.log("데이터베이스 연결 성공!");
    connection.release(); // Release the connection back to the pool
    return true;
  } catch (error) {
    console.error("데이터베이스 연결 실패:", error.message);
    return false;
  }
};

// 서버 시작 시 연결 테스트
testConnection();

module.exports = pool;
