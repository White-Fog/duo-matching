import React, { useState, useRef, useContext } from "react";
import { Modal, Button, Row, Col, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "./AuthContext";

export default function LoginModal({ show, setShow }) {
  // 초기 상태를 nickname과 password로 정의합니다.
  const [loginUser, setLoginUser] = useState({ nickname: "", password: "" });

  const navigate = useNavigate();
  const { loginAuthUser } = useContext(AuthContext);
  const idRef = useRef(null);
  const pwRef = useRef(null);

  // 올바르게 state에서 nickname과 password를 구조 분해합니다.
  const { nickname, password } = loginUser;

  const onChangeHandler = (e) => {
    setLoginUser({ ...loginUser, [e.target.name]: e.target.value });
  };

  // 사용자 입력값(아이디와 비밀번호)이 올바른지 체크합니다.
  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (!nickname) {
      alert("아이디를 입력하세요");
      idRef.current.focus();
      return;
    }
    if (!password) {
      alert("비밀번호를 입력하세요");
      pwRef.current.focus();
      return;
    }
    requestLogin();
  };

  // 백엔드에 로그인 요청을 보냅니다.
  const requestLogin = async () => {
    const url = `http://localhost:7777/api/auth/login`;
    try {
      // loginUser는 { nickname, password }로 전송됩니다.
      const response = await axios.post(url, loginUser);
      console.log("로그인 응답:", response.data);
      const { result } = response.data;
      if (result === "success") {
        const authUser = response.data.data;
        alert(response.data.message + ` ${authUser.nickname}님 환영합니다`);
        loginAuthUser(authUser);
        const { accessToken, refreshToken } = response.data;
        sessionStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        inputClear();
        setShow(false);
        navigate("/");
      } else {
        const { message } = response.data;
        alert(message);
        inputClear();
        idRef.current.focus();
      }
    } catch (error) {
      console.error("로그인 에러:", error);
      alert("Error: " + error);
      inputClear();
      setShow(false);
    }
  };

  const inputClear = () => {
    setLoginUser({ nickname: "", password: "" });
  };

  return (
    <div>
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Body style={{ backgroundColor: "black", color: "white" }}>
          <Modal.Header closeButton style={{ border: "none", color: "white" }}>
            <style>
              {`
                .btn-close {
                  background-color: black;
                  border: 1px solid white;
                  opacity: 1;
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                }
                .btn-close::before {
                  content: '×';
                  color: white;
                  font-size: 1.5rem;
                  vertical-align: middle;
                  padding-bottom: 0.25rem;
                  margin: 0;
                }
              `}
            </style>
          </Modal.Header>
          <Row className="LoginForm">
            <Col className="px-4 mx-auto mb-5" xs={10} sm={10} md={8}>
              <Form onSubmit={onSubmitHandler}>
                <Form.Group className="mb-3">
                  <Form.Label>아이디</Form.Label>
                  {/* 필드 이름, id, value를 모두 nickname으로 수정 */}
                  <Form.Control
                    type="text"
                    id="nickname"
                    ref={idRef}
                    name="nickname"
                    onChange={onChangeHandler}
                    value={loginUser.nickname}
                    placeholder="사용자 아이디"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>비밀번호</Form.Label>
                  <Form.Control
                    type="password"
                    id="password"
                    ref={pwRef}
                    name="password"
                    onChange={onChangeHandler}
                    value={loginUser.password}
                    placeholder="비밀번호"
                  />
                </Form.Group>
                <div className="d-grid gap-2">
                  <Button
                    className="mt-4"
                    type="submit"
                    variant="outline-light"
                  >
                    Login
                  </Button>
                </div>
              </Form>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </div>
  );
}
