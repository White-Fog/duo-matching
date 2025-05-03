const pool = require("../models/db");
const riotAPI = ({
  getSummonerUidByName,
  getRecentMatchByUid,
  getMatchInfoByMatchID,
  getUserInfoByUid,
} = require("../middlewares/riotAPI"));
const jwt = require("jsonwebtoken");
require("dotenv").config();
//JWT 토큰을 생성해서 반환하는 함수
const generateToken = (user, secret, expiresIn) => {
  return jwt.sign(user, secret, { expiresIn });
};

//회원가입 처리 메서드
exports.createUser = async (req, res) => {
  const { nickname, account_ID, password } = req.body;
  //유저 정보 이름, 이메일, 패스워드
  if (!nickname || !account_ID || !password) {
    return res.status(400).json({
      message:
        "리그 오브 레전드 닉네임, 라이엇계정, 비밀번호를 모두 입력하시오.",
    });
  }
  const uu_ID = await riotAPI.getSummonerUidByName(username, tagLine).puuid;
  const userData = [nickname, account_ID, password, uu_ID];

  // SQL 문 준비
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
    console.error("error: ", error);
    res
      .status(500)
      .json({ result: "fail", message: "DB 에러 발생: " + error.message });
  }
};

//이메일 중복 여부 - account_ID 유니크 제약 조건을 가짐

exports.duplicatedAccount_ID = async (req, res) => {
  const { account_ID } = req.body; //post put일 땐 params 말고 body로 받음
  if (!account_ID) {
    return res.status(400).json({ message: "라이엇 계정을 입력하세요" });
  }
  try {
    const sql = `select id from members where account_ID=?`;
    const [result] = await pool.query(sql, [account_ID]);
    // res.json(result);
    //해당 이메일이 없다면 빈 배열[]을 반환, 있다면 [{id: 회원번호}]를 반환
    if (result.length === 0) {
      //이메일 사용 가능
      res.json({ result: "ok", message: `${account_ID}은 사용 가능합니다.` });
    } else {
      //이메일 사용 중
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

//유저이름 중복 여부 - nickname 유니크 제약 조건을 가짐

exports.duplicatedNickName = async (req, res) => {
  const { nickname } = req.body; //post put일 땐 params 말고 body로 받음
  if (!nickname) {
    return res
      .status(400)
      .json({ message: "리그 오브 레전드 닉네임을 입력하세요" });
  }
  try {
    const [username, tagLine] = nickname.split("#");
    if (!username || !tagLine) {
      return res
        .status(400)
        .json({ message: "닉네임은 '이름#태그라인' 형식이어야 합니다." });
    }
    const summonerData = await riotAPI.getSummonerUidByName(username, tagLine);
    if (!summonerData || !summonerData.puuid) {
      res.json({
        result: "null",
        message: `사용자 데이터를 가져올 수 없습니다. 이름과 태그라인을 확인하세요.`,
      });
      return;
    } else {
      res.json({});
    }
    const sql = `select id from members where nickname=?`;
    const [result] = await pool.query(sql, [nickname]);
    // res.json(result);

    if (result.length === 0) {
      //possible nickname
      res.json({ result: "ok", message: `${nickname}은 사용 가능합니다.` });
    } else {
      //impossible nickname
      res.json({ result: "no", message: `${nickname}은 이미 사용 중입니다.` });
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: error.message });
  }
};

//모든 회원 조회
exports.listUser = async (req, res) => {
  const sql = `SELECT id, nickname, account_ID, indate, refreshtoken FROM members ORDER BY id DESC`;
  try {
    const [result] = await pool.query(sql);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//특정 회원 조회
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
//회원정보 삭제 : deleteUser 함수 구성
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

//회원정보 수정 : updateUser 함수 구성
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  //수정할 회원정보 ==> req.body로 추출
  const { nickname, account_ID, password } = req.body;

  try {
    const data = [nickname, account_ID, password, id];

    const sql = `update members set nickname=?, account_ID=?, password=? where id=?`;
    const [result] = await pool.query(sql, data);

    if (result.affectedRows === 0) {
      return res.json({ result: "fail", message: "회원 정보 수정 실패" });
    }
    // 회원 정보가 성공적으로 수정된 경우 리프레시 토큰 제거
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
    res
      .status(500)
      .json({ result: "internal server error", message: "삭제 요청 에러" });
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
//--------------------

//refreshToken을 검증하여 타당할 경우 새 accessToken을 발급하는 메서드
exports.refreshVerify = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "refresh token이 없어요" });

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, decoded) => {
    if (err) {
      //인증받지 못한 토큰일 경우
      return res.status(403).json({ message: "Invalid Refresh Token" });
    }
    //제대로 인증된 토큰 일 경우

    //DB에서 해당 user정보 가져오기
    const sql = `select id,nickname,account_ID from members where refreshToken=?`;
    const [result] = await pool.query(sql, [refreshToken]);
    if (result.length === 0) {
      return res.status(403).json({ message: "인증받지 않은 회원입니다" });
    }
    const user = result[0];

    //새 accessToken 발급
    const newAccessToken = generateToken(
      user,
      process.env.ACCESS_SECRET,
      "15m"
    );
    res.json({ accessToken: newAccessToken });
  });
};

//로그인
exports.login = async (req, res) => {
  const { account_ID, password } = req.body;

  try {
    const sql = `SELECT id, nickname, account_ID FROM members WHERE account_ID=? AND password=?`;
    const [result] = await pool.query(sql, [account_ID, password]);
    if (result.length === 0) {
      return res.status(401).json({
        result: "fail",
        message: "계정 또는 비밀번호가 잘못되었습니다.",
      });
    }

    const user = result[0];

    const accessToken = generateToken(user, process.env.ACCESS_SECRET, "15m"); //유효 시간 15분인 토큰
    const refreshToken = generateToken(user, process.env.REFRESH_SECRET, "1d"); // 1일일
    //members 테이블에 refreshToken(null)을 수정해줘야 한다.
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

//로그아웃
exports.logout = async (req, res) => {
  const { account_ID } = req.body;
  //refreshToken 값을 null로 수정
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
