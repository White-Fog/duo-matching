const jwt = require("jsonwebtoken");
require("dotenv").config();
// authMildleware.js
//AccessToken 검증 미들웨어
exports.verifyAccessToken = (req, res, next) => {
  console.log(req.headers);

  const token = req.headers["authorization"]?.split(" ")[1];
  //Authorization: Bearer exab12token
  console.log("검증 억세스 토큰: ", token);
  if (!token)
    return res
      .status(400)
      .json({ message: "인증토큰이 필요합니다-로그인을 하세요 " });

  //검증하기
  jwt.verify(token, process.env.ACCESS_SECRET, (err, decoded) => {
    if (err) {
      console.log("미들웨어에서 토큰 검증 실패 ");
      return res.status(403).json({ message: "Invalid AccessToken" });
    }
    req.user = decoded; //토큰정보 저장

    next(); //검증 미들웨어 통과
  });
};
