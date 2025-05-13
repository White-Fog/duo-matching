import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import axios from "axios";
import socket from "../../socket"; // Socket.IO 클라이언트 연결 모듈

const MatchDecisionModal = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [countdown, setCountdown] = useState(15); // 제한 시간(초)

  useEffect(() => {
    // 서버에서 매치 성공 이벤트 수신
    socket.on("matchSuccess", (data) => {
      console.log("매치 성공 이벤트 수신:", data);
      // data에 matchId와 opponent 정보가 있다고 가정함
      setMatchData(data);
      setShowModal(true);
      setCountdown(15);
    });

    return () => {
      socket.off("matchSuccess");
    };
  }, []);

  useEffect(() => {
    if (!showModal) return;
    if (countdown === 0) {
      handleDecline();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, showModal]);

  // 수락 버튼 클릭 시, POST 요청에 matchId 포함
  // 수락 버튼 클릭 핸들러 예시
  const handleAccept = async () => {
    // safety check
    if (!matchData || !matchData.matchId) {
      console.error("matchData 또는 matchId가 없습니다.");
      return;
    }
    console.log("handleAccept 호출, matchData.matchId:", matchData.matchId);
    try {
      const response = await axios.post(
        "http://localhost:7777/api/matchmaking/respond",
        {
          matchId: matchData.matchId,
          accepted: true,
          username: "YOUR_USERNAME", // 실제 로그인 사용자명 반영
        }
      );
      console.log("수락 응답:", response.data);
      navigate("/match/success");
    } catch (error) {
      console.error(
        "매치 수락 중 오류:",
        error.response ? error.response.data : error.message
      );
    } finally {
      setShowModal(false);
      setMatchData(null);
    }
  };

  // 거절 버튼 클릭 핸들러 예시
  const handleDecline = async () => {
    if (!matchData || !matchData.matchId) {
      console.error("matchData 또는 matchId가 없습니다.");
      return;
    }
    console.log("handleDecline 호출, matchData.matchId:", matchData.matchId);
    try {
      const response = await axios.post(
        "http://localhost:7777/api/matchmaking/respond",
        {
          matchId: matchData.matchId,
          accepted: false,
          username: "YOUR_USERNAME",
        }
      );
      console.log("거절 응답:", response.data);
    } catch (error) {
      console.error(
        "매치 거절 중 오류:",
        error.response ? error.response.data : error.message
      );
    } finally {
      setShowModal(false);
      setMatchData(null);
    }
  };

  return (
    <Modal
      show={showModal}
      onHide={() => {
        setShowModal(false);
        setMatchData(null);
      }}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>매치가 성공되었습니다!</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {matchData && matchData.opponent ? (
          <div>
            <p>매칭된 상대방 정보:</p>
            <p>사용자1: {matchData.opponent.user1?.username || "정보 없음"}</p>
            <p>사용자2: {matchData.opponent.user2?.username || "정보 없음"}</p>
          </div>
        ) : (
          <p>상대방 정보를 불러오는 중입니다...</p>
        )}
        <p>남은 응답 시간: {countdown}초</p>
        <p>매칭을 수락하시겠습니까?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleDecline}>
          거절하기
        </Button>
        <Button variant="primary" onClick={handleAccept}>
          수락하기
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MatchDecisionModal;
