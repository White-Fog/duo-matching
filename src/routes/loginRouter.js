const express = require("express");
const userController = require("../controllers/userController");
const verifyMiddleware = require("../middlewares/authMiddlewares");
const loginRouter = express.Router();
console.log(userController);

loginRouter.post("/login", userController.login);
loginRouter.post("/refresh", userController.refreshVerify);
loginRouter.post("/logout", userController.logout);
loginRouter.get(
  "/user",
  verifyMiddleware.verifyAccessToken,
  userController.authenticUserInfo
);
//인증이 필요한 서비스에는 verifyAccessToken 함수를 매개변수로 넣자

loginRouter.post(
  "/test",
  verifyMiddleware.verifyAccessToken,
  userController.test
);
/*
loginRouter.post(
  "/cart",
  verifyMiddleware.verifyAccessToken,
  userController.cardAdd
); //인증된 사용자만 이용할 수 있는 서비스일 경우
*/
loginRouter.delete(
  "/delete/:id",
  verifyMiddleware.verifyAccessToken,
  userController.deleteUser
);
loginRouter.put(
  "/update/:id",
  verifyMiddleware.verifyAccessToken,
  userController.updateUser
);
module.exports = loginRouter;
