import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../member/axiosInstance";
import "./RateOpponent.css";

function RateOpponent({ matchId, opponentId, onRatingSubmitted }) {
  const [rating, setRating] = useState(10);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleRating = (value) => {
    setRating(value);
  };

  const submitRating = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
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
      // 성공 시 페이지 내에 메시지 표시
      setSuccessMessage("평가 제출 완료!");
      // 옵션: onRatingSubmitted() 호출해 후속 처리를 할 수도 있음
      // onRatingSubmitted();
      // 3초 후 자동으로 홈으로 이동
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error(
        "평가 제출 오류:",
        error.response ? error.response.data : error.message
      );
      setErrorMessage("평가 제출 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rate-opponent-container">
      <h2>듀오 상대 평가</h2>
      <p>평가 점수를 선택해 주세요 (0 ~ 10):</p>
      <div className="rating-buttons">
        {[...Array(11).keys()].map((value) => (
          <button
            key={value}
            onClick={() => handleRating(value)}
            disabled={loading}
            className={rating === value ? "selected" : ""}
          >
            {value}
          </button>
        ))}
      </div>
      <p>선택한 점수: {rating}</p>
      <button
        className="submit-rating-btn"
        onClick={submitRating}
        disabled={loading}
      >
        {loading ? "제출 중..." : "제출"}
      </button>

      {loading && (
        <div className="overlay-spinner">
          <div className="spinner"></div>
        </div>
      )}

      {successMessage && (
        <div className="message success">{successMessage}</div>
      )}
      {errorMessage && <div className="message error">{errorMessage}</div>}
    </div>
  );
}

export default RateOpponent;
