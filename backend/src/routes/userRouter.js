const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
// server.js에서
// /api/users ===>userRouter와 연결
//모든 회원 조회
router.get("/", userController.listUser);
//특정 회원 조회
router.get("/:id", userController.getUser);
//회원 등록 요청
router.post("/", userController.createUser);
//회원 등록 또는 수정 시 아이디(이메일) 중복 체크
// /api/users/duplex/:email
router.post(`/duplexid`, userController.duplicatedAccount_ID);

router.post(`/duplexname`, userController.duplicatedNickName);
//회원 삭제 요청
router.delete("/:id", userController.deleteUser);
//회원 수정 요청
router.put("/:id", userController.updateUser);
module.exports = router;
