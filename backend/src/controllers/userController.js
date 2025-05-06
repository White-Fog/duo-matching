const pool = require("../models/db");
const riotAPI = require("../middlewares/riotAPI");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// JWT 토큰을 생성해서 반환하는 함수
const generateToken = (user, secret, expiresIn) => {
  return jwt.sign(user, secret, { expiresIn });
};

// 회원가입 처리 메서드 (수정된 버전)
// - 사용자 아이디(nickname)는 자유로운 문자열로 입력 (웹사이트 아이디)
// - 라이엇 계정(account_ID)는 "이름#태그라인" 형식이어야 하며, 이를 분리하여 Riot API에서 puuid를 가져옴
exports.createUser = async (req, res) => {
  const { nickname, account_ID, password } = req.body;

  if (!nickname || !account_ID || !password) {
    return res.status(400).json({
      message: "사용자 아이디, 라이엇 계정, 비밀번호를 모두 입력하시오.",
    });
  }

  // 라이엇 계정(account_ID)은 "이름#태그라인" 형식이어야 함
  const [riotName, riotTag] = account_ID.split("#");
  if (!riotName || !riotTag) {
    return res
      .status(400)
      .json({ message: "라이엇 계정은 '이름#태그라인' 형식이어야 합니다." });
  }

  // Riot API 호출: 라이엇 계정 정보에서 puuid 가져오기
  let uu_ID;
  try {
    const summonerData = await riotAPI.getSummonerUidByName(riotName, riotTag);
    if (!summonerData || !summonerData.puuid) {
      return res
        .status(400)
        .json({ message: "입력하신 라이엇 계정 정보가 올바르지 않습니다." });
    }
    uu_ID = summonerData.puuid;
  } catch (error) {
    console.error("Riot API 호출 오류: ", error);
    return res
      .status(500)
      .json({ message: "Riot API 호출 중 오류가 발생했습니다." });
  }

  const userData = [nickname, account_ID, password, uu_ID];
  const sql = `INSERT INTO members (nickname, account_ID, password, uu_ID) VALUES (?, ?, ?, ?)`;

  try {
    const [result] = await pool.query(sql, userData);
    console.log("result: ", result);
    if (result.affectedRows > 0) {
      res.json({
        result: "success",
        message: `등록 성공. 회원 번호는 ${result.insertId}번입니다.`,
      });
    } else {
      res.json({ result: "fail", message: "회원 정보 등록 실패" });
    }
  } catch (error) {
    console.error("DB 에러: ", error);
    res
      .status(500)
      .json({ result: "fail", message: "DB 에러 발생: " + error.message });
  }
};

// 라이엇 계정 중복 여부 - account_ID 유니크 제약 조건 적용 (기존 그대로)
exports.duplicatedAccount_ID = async (req, res) => {
  const { account_ID } = req.body;
  if (!account_ID) {
    return res.status(400).json({ message: "라이엇 계정을 입력하세요" });
  }
  try {
    const sql = `select id from members where account_ID=?`;
    const [result] = await pool.query(sql, [account_ID]);
    if (result.length === 0) {
      res.json({ result: "ok", message: `${account_ID}은 사용 가능합니다.` });
    } else {
      res.json({
        result: "no",
        message: `${account_ID}은 이미 사용 중입니다.`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 사용자 아이디 중복 여부 (수정된 버전)
// 사용자 아이디(nickname)는 자유로운 문자열로 입력받으므로 단순 DB 중복 검사만 수행
exports.duplicatedNickName = async (req, res) => {
  const { nickname } = req.body;
  if (!nickname) {
    return res.status(400).json({ message: "사용자 아이디를 입력하세요" });
  }
  try {
    const sql = `select id from members where nickname=?`;
    const [result] = await pool.query(sql, [nickname]);
    if (result.length === 0) {
      res.json({ result: "ok", message: `${nickname}은 사용 가능합니다.` });
    } else {
      res.json({ result: "no", message: `${nickname}은 이미 사용 중입니다.` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 이하의 함수들(회원 조회, 수정, 삭제, 인증 등)은 기존 코드와 동일하게 유지
exports.listUser = async (req, res) => {
  const sql = `SELECT id, nickname, account_ID, indate, refreshtoken FROM members ORDER BY id DESC`;
  try {
    const [result] = await pool.query(sql);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const sql = `SELECT * FROM members WHERE id=?`;
    const { id } = req.params;
    const [result] = await pool.query(sql, [id]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).json({ message: "회원 번호가 필요하다" });
    const sql = "delete from members where id = ?";
    const [result] = await pool.query(sql, [id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ result: "not found", message: "찾을 수 없다." });
    } else {
      res.json({ result: "success", message: "삭제 완료" });
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ result: "internal server error", message: "삭제 요청 에러" });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { nickname, account_ID, password } = req.body;
  try {
    const data = [nickname, account_ID, password, id];
    const sql = `update members set nickname=?, account_ID=?, password=? where id=?`;
    const [result] = await pool.query(sql, data);
    if (result.affectedRows === 0) {
      return res.json({ result: "fail", message: "회원 정보 수정 실패" });
    }
    try {
      const tokenSql = `UPDATE members SET refreshtoken = NULL WHERE id = ?`;
      await pool.query(tokenSql, [id]);
      res.json({
        result: "success",
        message: `${id}번 회원의 정보를 수정하였으며 토큰을 제거하였습니다.`,
      });
    } catch (tokenError) {
      res.json({
        result: "success",
        message: `${id}번 회원의 정보를 수정하였으나 토큰 제거 중 오류가 발생하였습니다.`,
      });
    }
  } catch (error) {
    res.status(500).json({
      result: "internal server error",
      message: "회원 정보 수정 요청 에러",
    });
  }
};

exports.authenticUserInfo = (req, res) => {
  res.json(req.user);
};

exports.test = (req, res) => {
  res.json({
    message: "테스트 중 검증된 사용자가 입력했다. 회원명: " + req.user.nickname,
  });
};

// refreshToken 검증 후 새 accessToken 발급
exports.refreshVerify = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "refresh token이 없어요" });
  jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid Refresh Token" });
    }
    const sql = `select id,nickname,account_ID from members where refreshToken=?`;
    const [result] = await pool.query(sql, [refreshToken]);
    if (result.length === 0) {
      return res.status(403).json({ message: "인증받지 않은 회원입니다" });
    }
    const user = result[0];
    const newAccessToken = generateToken(
      user,
      process.env.ACCESS_SECRET,
      "15m"
    );
    res.json({ accessToken: newAccessToken });
  });
};

// 로그인
exports.login = async (req, res) => {
  const { nickname, password } = req.body; // account_ID 대신 nickname 사용
  try {
    const sql = `SELECT id, nickname, account_ID FROM members WHERE nickname=? AND password=?`;
    const [result] = await pool.query(sql, [nickname, password]);
    if (result.length === 0) {
      return res.status(401).json({
        result: "fail",
        message: "아이디 또는 비밀번호가 잘못되었습니다.",
      });
    }
    const user = result[0];
    const accessToken = generateToken(user, process.env.ACCESS_SECRET, "15m");
    const refreshToken = generateToken(user, process.env.REFRESH_SECRET, "1d");
    const sql2 = "update members set refreshtoken =? where id=?";
    await pool.query(sql2, [refreshToken, user.id]);
    res.json({
      result: "success",
      data: user,
      message: "로그인 성공!!",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "DB Error", message: error.message });
  }
};

// 로그아웃
exports.logout = async (req, res) => {
  const { account_ID } = req.body;
  try {
    const sql = `update members set refreshToken = null where account_ID=?`;
    const [result] = await pool.query(sql, [account_ID]);
    if (result.affectedRows > 0) {
      res.json({ result: "success", message: "로그아웃 처리되었습니다." });
    } else {
      res.status(400).json({ message: "유효하지 않은 사용자입니다." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "DB Error - 로그아웃 중 에러 발생" });
  }
};
