// src/App.jsx
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import { useState, useEffect, useContext } from "react";
import Header from "./components/Header";
import Home from "./components/Home";
import PageNotFound from "./components/PageNotFound";
import SignUp from "./components/member/SignUp";
import LoginModal from "./components/member/LoginModel";
import MyPage from "./components/member/MyPage";
import { AuthContext } from "./components/member/AuthContext";
import axiosInstance from "./components/member/axiosInstance";
import PostApp from "./components/posts/PostApp";
import Admin from "./components/member/Admin";
import MatchSuccess from "./components/member/MatchSuccess";
import MatchDecisionModal from "./components/member/MatchDecisionModal";
import "./App.css";

function App() {
  // 로그인 모달을 보여줄지 여부를 관리하는 state
  const [showLogin, setShowLogin] = useState(false);

  const { loginAuthUser } = useContext(AuthContext);

  const onShowLoginChange = (bool) => {
    setShowLogin(bool);
  };

  // 로그인 관련: accessToken 존재 시 사용자 정보 요청
  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");

    if (accessToken) {
      axiosInstance
        .get("http://localhost:7777/api/auth/user", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          const authUser = {
            id: response.data.id,
            email: response.data.email,
            name: response.data.name,
          };

          loginAuthUser(authUser);
        })
        .catch((error) => {
          alert(error);
          console.error("Access token이 유효하지 않습니다.", error);
          sessionStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        });
    }
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        backgroundImage: `url('/matching_background_image.jpg')`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundColor: "black",
      }}
    >
      <BrowserRouter>
        <div className="all">
          <div className="headers">
            <Header onShowLogin={onShowLoginChange} />
            <LoginModal show={showLogin} setShow={setShowLogin} />
          </div>

          <div className="bodys">
            <Routes>
              <Route
                path="/"
                element={<Home onShowLogin={onShowLoginChange} />}
              />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/posts" element={<PostApp />} />
              <Route path="/match-success" element={<MatchSuccess />} />
              <Route path="/*" element={<PageNotFound />} />
              <Route path="/match-decision" element={<MatchDecisionModal />} />
            </Routes>
          </div>
          {/* 언제나 모달 컴포넌트를 렌더링하여 Socket.IO 이벤트를 수신 */}
          <MatchDecisionModal />
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
