// src/index.js (또는 server.js)
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();
const morgan = require("morgan");
const path = require("path");
const cors = require("cors");

// 라우터 가져오기
const indexRouter = require("./src/routes/indexRouter");
const userRouter = require("./src/routes/userRouter");
const postRouter = require("./src/routes/postRouter");
const loginRouter = require("./src/routes/loginRouter");
const matchRouterFactory = require("./src/routes/matchRouter");

const PORT = process.env.PORT || 7777;

const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(morgan("dev"));

// 라우터 연결
app.use("/", indexRouter);
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/auth", loginRouter);

// 기본 라우트 설정
app.get("/", (req, res) => {
  res.send("Socket.io와 Express 서버가 실행중입니다!");
});

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.io를 HTTP 서버에 적용 (CORS 설정 포함)
const io = socketIo(server, {
  cors: {
    origin: "*", // 모든 도메인 허용 (운영 시 적절한 도메인으로 설정)
    methods: ["GET", "POST"],
  },
});

// matchRouter에 io 인스턴스를 주입하여 초기화 후 등록
// 클라이언트가 /api/matchmaking/request, /api/matchmaking/cancel 등으로 호출할 수 있도록 함.
const matchRouter = matchRouterFactory(io);
app.use("/api/matchmaking", matchRouter);

// Socket.io 연결 이벤트 처리
io.on("connection", (socket) => {
  console.log("새 클라이언트 연결:", socket.id);
  socket.on("exampleEvent", (data) => {
    console.log("exampleEvent로 받은 데이터:", data);
    socket.emit("exampleResponse", { message: "메시지 잘 받았습니다!" });
  });
  socket.on("disconnect", () => {
    console.log("클라이언트 연결 종료:", socket.id);
  });
});

// 서버 실행 (HTTP와 Socket.io 함께 실행)
server.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
