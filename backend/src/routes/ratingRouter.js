const express = require("express");
const ratingRouter = express.Router();
const ratingController = require("../controllers/ratingController");
const verifyMiddleware = require("../middlewares/authMiddlewares");

// 평가 제출 엔드포인트 (로그인된 사용자만 접근)
ratingRouter.post(
  "/",
  verifyMiddleware.verifyAccessToken,
  ratingController.submitRating
);

// 특정 사용자의 평가 정보 조회 엔드포인트
ratingRouter.get(
  "/:userId",
  verifyMiddleware.verifyAccessToken,
  ratingController.getUserRating
);

module.exports = ratingRouter;
