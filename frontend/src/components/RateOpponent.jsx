import React, { useState } from "react";
import axiosInstance from "../member/axiosInstance";

function RateOpponent({ matchId, opponentId, onRatingSubmitted }) {
  const [rating, setRating] = useState(10); // 기본값은 10점

  // 버튼 클릭 시 해당 점수를 선택하도록 설정
  const handleRating = (value) => {
    setRating(value);
  };

  const submitRating = async () => {
    try {
      await axiosInstance.post(
        "http://localhost:7777/api/rating",
        {
          matchId,
          ratedUserId: opponentId,
          rating,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
          },
        }
      );
      alert("평가가 성공적으로 제출되었습니다.");
      onRatingSubmitted(); // 평가 후 후속 처리 (예시: 이전 페이지로 이동 등)
    } catch (error) {
      console.error("평가 제출 오류:", error);
      alert("평가 제출 중 오류가 발생했습니다.");
    }
  };

  return (
    <div>
      <h2>듀오 상대 평가</h2>
      <div>
        <p>평가 점수를 선택해 주세요 (0 ~ 10):</p>
        {/* 0부터 10까지의 버튼을 렌더링 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 50px)",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          {[...Array(11).keys()].map((value) => (
            <button
              key={value}
              onClick={() => handleRating(value)}
              style={{
                backgroundColor: rating === value ? "blue" : "gray",
                color: "white",
                border: "none",
                padding: "10px",
                cursor: "pointer",
              }}
            >
              {value}
            </button>
          ))}
        </div>
        <p>선택한 점수: {rating}</p>
      </div>
      <button onClick={submitRating}>제출</button>
    </div>
  );
}

export default RateOpponent;
