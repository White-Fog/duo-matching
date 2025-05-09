import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "./member/AuthContext";
import "./Home.css";
import { Dropdown, DropdownButton } from "react-bootstrap";
import axios from "axios";

const Home = ({ onShowLogin }) => {
  const { user } = useContext(AuthContext);

  // 매치메이킹 버튼 관련 상태
  const [matchingButton, setMatchingButton] = useState("/matching_button.png");
  const [rotation, setRotation] = useState(0);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [count, setCount] = useState(0);

  // 목표 티어 및 포지션 관련 상태 (드롭다운)
  const [targetTier, setTargetTier] = useState(""); // 백엔드로 전달할 목표 티어 값 (예: "bronze4")
  const [targetTierList, setTargetTierList] = useState("목표 티어 설정");
  const [position, setPosition] = useState(""); // 백엔드로 전달할 포지션 값 (예: "top")
  const [positionList, setPositionList] = useState("포지션 설정");

  // 드롭다운 열림 상태 관리
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false);
  const [positionDropdownOpen, setPositionDropdownOpen] = useState(false);

  let min = parseInt(count / 60);

  // 매칭 버튼 회전 애니메이션 효과
  useEffect(() => {
    let interval;
    if (buttonClicked) {
      interval = setInterval(() => {
        setRotation((prev) => prev + 1);
      }, 10);
    } else {
      clearInterval(interval);
      setRotation(0);
    }
    return () => clearInterval(interval);
  }, [buttonClicked]);

  // 매칭 경과 시간 카운트
  useEffect(() => {
    let interval;
    if (buttonClicked) {
      interval = setInterval(() => {
        setCount((prevCount) => prevCount + 1);
      }, 1000);
    } else {
      clearInterval(interval);
      setCount(0);
    }
    return () => clearInterval(interval);
  }, [buttonClicked]);

  // 매칭 요청 API 호출 함수
  const requestMatchMaking = async () => {
    if (!user) {
      alert("로그인 후 매칭을 시작할 수 있습니다.");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:7777/api/matchmaking/request",
        {
          targetRank: targetTier, // 목표 티어 (예: "bronze4")
          selectPosition: position, // 선택한 포지션 (예: "top")
        }
      );
      alert(response.data.message);
    } catch (error) {
      console.error(
        "매칭 요청 오류:",
        error.response ? error.response.data : error.message
      );
      alert("매칭 요청 중 오류가 발생했습니다.");
    }
  };

  // 매치메이킹 취소 API 호출 함수
  const cancelMatchMaking = async () => {
    if (!user) return;
    try {
      const response = await axios.post(
        "http://localhost:7777/api/matchmaking/cancel",
        {
          username: user.nickname,
        }
      );
      alert(response.data.message);
    } catch (error) {
      console.error(
        "매치메이킹 취소 오류:",
        error.response ? error.response.data : error.message
      );
      alert("매치메이킹 취소 중 오류가 발생했습니다.");
    }
  };

  // 매칭 버튼 클릭 핸들러 (클릭 시 요청 또는 취소)
  const matchClickHandler = () => {
    if (!targetTier || !position) {
      alert("목표 티어와 포지션을 선택해주세요.");
      return;
    }
    // 만약 이미 큐에 등록되어 있으면 취소, 그렇지 않으면 요청
    if (buttonClicked) {
      // 취소 API 호출
      cancelMatchMaking();
      setButtonClicked(false);
    } else {
      setButtonClicked(true);
      requestMatchMaking();
    }
  };

  // 티어 드롭다운 처리 함수
  const tierHandler = (eventKey) => {
    setTargetTier(eventKey);
    let tier = "";
    switch (eventKey) {
      case "bronze4":
        tier = "브론즈4";
        break;
      case "bronze3":
        tier = "브론즈3";
        break;
      case "bronze2":
        tier = "브론즈2";
        break;
      case "bronze1":
        tier = "브론즈1";
        break;
      case "silver4":
        tier = "실버4";
        break;
      case "silver3":
        tier = "실버3";
        break;
      case "silver2":
        tier = "실버2";
        break;
      case "silver1":
        tier = "실버1";
        break;
      case "gold4":
        tier = "골드4";
        break;
      case "gold3":
        tier = "골드3";
        break;
      case "gold2":
        tier = "골드2";
        break;
      case "gold1":
        tier = "골드1";
        break;
      case "Platinum4":
        tier = "플래티넘4";
        break;
      case "Platinum3":
        tier = "플래티넘3";
        break;
      case "Platinum2":
        tier = "플래티넘2";
        break;
      case "Platinum1":
        tier = "플래티넘1";
        break;
      case "emerald4":
        tier = "에메랄드4";
        break;
      case "emerald3":
        tier = "에메랄드3";
        break;
      case "emerald2":
        tier = "에메랄드2";
        break;
      case "emerald1":
        tier = "에메랄드1";
        break;
      case "diamond4":
        tier = "다이아몬드4";
        break;
      case "diamond3":
        tier = "다이아몬드3";
        break;
      case "diamond2":
        tier = "다이아몬드2";
        break;
      case "diamond1":
        tier = "다이아몬드1";
        break;
      case "master":
        tier = "마스터";
        break;
      case "grandmaster":
        tier = "그랜드마스터";
        break;
      case "challanger":
        tier = "챌린저";
        break;
      default:
        tier = eventKey;
    }
    setTargetTierList(tier);
    setTierDropdownOpen(false);
  };

  // 포지션 드롭다운 처리 함수
  const positionHandler = (eventKey) => {
    let pos = "";
    switch (eventKey) {
      case "top":
        pos = "상단(탑)";
        break;
      case "mid":
        pos = "중단(미드)";
        break;
      case "bot":
        pos = "하단(봇)";
        break;
      case "jungle":
        pos = "정글";
        break;
      case "support":
        pos = "서포터";
        break;
      default:
        pos = eventKey;
    }
    setPosition(pos);
    setPositionList(pos);
    setPositionDropdownOpen(false);
  };

  return (
    <div className="panel-container">
      <div className="panel">
        {/* Section 1: 목표 티어 드롭다운 */}
        <div className="section1">
          <div className="section-container">
            <DropdownButton
              id="dropdown-tier-button"
              title={targetTierList}
              variant="dark"
              onSelect={tierHandler}
              onToggle={(isOpen) => setTierDropdownOpen(isOpen)}
              className={`w-100 dropdown ${tierDropdownOpen ? "show" : ""}`}
              show={tierDropdownOpen}
            >
              <Dropdown.Item eventKey="bronze4">브론즈4</Dropdown.Item>
              <Dropdown.Item eventKey="bronze3">브론즈3</Dropdown.Item>
              <Dropdown.Item eventKey="bronze2">브론즈2</Dropdown.Item>
              <Dropdown.Item eventKey="bronze1">브론즈1</Dropdown.Item>
              <Dropdown.Item eventKey="silver4">실버4</Dropdown.Item>
              <Dropdown.Item eventKey="silver3">실버3</Dropdown.Item>
              <Dropdown.Item eventKey="silver2">실버2</Dropdown.Item>
              <Dropdown.Item eventKey="silver1">실버1</Dropdown.Item>
              <Dropdown.Item eventKey="gold4">골드4</Dropdown.Item>
              <Dropdown.Item eventKey="gold3">골드3</Dropdown.Item>
              <Dropdown.Item eventKey="gold2">골드2</Dropdown.Item>
              <Dropdown.Item eventKey="gold1">골드1</Dropdown.Item>
              <Dropdown.Item eventKey="Platinum4">플래티넘4</Dropdown.Item>
              <Dropdown.Item eventKey="Platinum3">플래티넘3</Dropdown.Item>
              <Dropdown.Item eventKey="Platinum2">플래티넘2</Dropdown.Item>
              <Dropdown.Item eventKey="Platinum1">플래티넘1</Dropdown.Item>
              <Dropdown.Item eventKey="emerald4">에메랄드4</Dropdown.Item>
              <Dropdown.Item eventKey="emerald3">에메랄드3</Dropdown.Item>
              <Dropdown.Item eventKey="emerald2">에메랄드2</Dropdown.Item>
              <Dropdown.Item eventKey="emerald1">에메랄드1</Dropdown.Item>
              <Dropdown.Item eventKey="diamond4">다이아몬드4</Dropdown.Item>
              <Dropdown.Item eventKey="diamond3">다이아몬드3</Dropdown.Item>
              <Dropdown.Item eventKey="diamond2">다이아몬드2</Dropdown.Item>
              <Dropdown.Item eventKey="diamond1">다이아몬드1</Dropdown.Item>
              <Dropdown.Item eventKey="master">마스터</Dropdown.Item>
              <Dropdown.Item eventKey="grandmaster">그랜드마스터</Dropdown.Item>
              <Dropdown.Item eventKey="challanger">챌린저</Dropdown.Item>
            </DropdownButton>
          </div>
        </div>

        {/* Section 2: 로그인 상태에 따라 로그인 버튼 또는 매칭 버튼 표시 */}
        <div className="section2" style={{ textAlign: "center" }}>
          {!user ? (
            <button
              className="btn btn-danger"
              onClick={() => onShowLogin(true)}
              style={{
                width: "280px",
                height: "90px",
                border: "none",
                borderRadius: "15%",
                margin: "0 auto",
              }}
            >
              <b style={{ fontSize: "2rem" }}>로그인</b>
            </button>
          ) : (
            <>
              <button
                className="matchingButton"
                onMouseDown={() =>
                  setMatchingButton("/matching_button_clicked.PNG")
                }
                onMouseUp={() => setMatchingButton("/matching_button.png")}
                onMouseLeave={() => setMatchingButton("/matching_button.png")}
                onClick={matchClickHandler}
              >
                <img
                  src={matchingButton}
                  alt="button image"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              </button>
              {buttonClicked && (
                <h3 className="count">
                  <b>
                    경과 시간 : {count < 60 ? "" : min + "분"} {count % 60}초
                  </b>
                </h3>
              )}
            </>
          )}
        </div>

        {/* Section 3: 포지션 드롭다운 */}
        <div className="section3">
          <div className="section-container">
            <DropdownButton
              id="dropdown-position-button"
              title={positionList}
              variant="dark"
              onSelect={positionHandler}
              onToggle={(isOpen) => setPositionDropdownOpen(isOpen)}
              className={`w-100 dropdown ${positionDropdownOpen ? "show" : ""}`}
              show={positionDropdownOpen}
            >
              <Dropdown.Item eventKey="top">상단(탑)</Dropdown.Item>
              <Dropdown.Item eventKey="mid">중단(미드)</Dropdown.Item>
              <Dropdown.Item eventKey="bot">하단(봇)</Dropdown.Item>
              <Dropdown.Item eventKey="jungle">정글</Dropdown.Item>
              <Dropdown.Item eventKey="support">서포터</Dropdown.Item>
            </DropdownButton>
          </div>
        </div>
      </div>
      <div className="transbackground">{/* 추가적인 내용 배치 */}</div>
    </div>
  );
};

export default Home;
