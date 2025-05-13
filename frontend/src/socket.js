// src/socket.js
import { io } from "socket.io-client";

// 백엔드의 Socket.IO 서버 URL을 입력합니다.
const socket = io("http://localhost:7777", {
  transports: ["websocket"], // 연결 방식: websocket 우선
  reconnection: true, // 자동 재연결 사용
  reconnectionAttempts: Infinity, // 재연결 시도 횟수 무제한
  reconnectionDelay: 1000, // 재연결 딜레이 (1초)
});

// 연결 성공 시 콘솔에 socket id 출력
socket.on("connect", () => {
  console.log("Socket.IO 연결 성공, socket id:", socket.id);
});

// 에러 또는 연결 종료 시 로그 출력 (옵션)
socket.on("connect_error", (error) => {
  console.error("Socket.IO 연결 에러:", error);
});

socket.on("disconnect", () => {
  console.log("Socket.IO 연결 종료");
});

export default socket;
