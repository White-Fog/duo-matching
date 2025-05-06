import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../memberCss/SignUp.css";

const SignUp = () => {
  const navigate = useNavigate();

  // 상태 객체는 그대로 사용하되, 'nickname'은 이제 웹에서 사용할 사용자 아이디를 의미합니다.
  const [user, setUser] = useState({
    nickname: "", // 사용자가 웹 아이디로 사용할 값을 입력
    account_ID: "", // 라이엇 계정
    password: "",
  });
  const [agree, setAgree] = useState(false);
  const [pwdChk, setPwdChk] = useState("");
  const [nameError, setNameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [idError, setIdError] = useState(false);
  const [agreeError, setAgreeError] = useState(false);
  const [passwordChkError, setPasswordChkError] = useState(false);
  // 라이엇 계정과 사용자 아이디 각각의 중복 체크 결과를 관리
  const [duplexIdError, setDuplexIdError] = useState(true);
  const [duplexNickError, setDuplexNickError] = useState(true);

  const { nickname, account_ID, password } = user;

  const onChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
    if (e.target.name === "nickname") setNameError(false);
    if (e.target.name === "account_ID") setIdError(false);
    if (e.target.name === "password") setPasswordError(false);
  };

  // 라이엇 계정 중복 체크 (경로: /api/users/duplexid)
  const onCheckId = async () => {
    try {
      setDuplexIdError(true);
      const response = await axios.post(
        `http://localhost:7777/api/users/duplexid`,
        { account_ID }
      );
      const data = response.data;
      if (data.result === "ok") {
        alert(data.message);
        setDuplexIdError(false);
      } else {
        alert(data.message);
        setUser({ ...user, account_ID: "" });
        setDuplexIdError(true);
      }
    } catch (error) {
      alert("Error: " + error.message);
      setDuplexIdError(true);
    }
  };

  // 사용자 아이디(닉네임) 중복 체크 (경로: /api/users/duplexname)
  const onCheckNickname = async () => {
    try {
      setDuplexNickError(true);
      const response = await axios.post(
        `http://localhost:7777/api/users/duplexname`,
        { nickname }
      );
      const data = response.data;
      if (data.result === "ok") {
        alert(data.message);
        setDuplexNickError(false);
      } else {
        alert(data.message);
        setUser({ ...user, nickname: "" });
        setDuplexNickError(true);
      }
    } catch (error) {
      alert("Error: " + error.message);
      setDuplexNickError(true);
    }
  };

  const onChangepasswordChk = (e) => {
    setPasswordChkError(e.target.value !== password);
    setPwdChk(e.target.value);
  };

  const onChangeAgree = (e) => {
    setAgree(e.target.checked);
    if (e.target.checked) {
      setAgreeError(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    console.log("onSubmit 호출됨"); // 디버깅 로그

    if (!nickname) {
      setNameError(true);
      return;
    }
    if (!account_ID) {
      setIdError(true);
      return;
    }
    if (!password) {
      setPasswordError(true);
      return;
    }
    if (password.length < 4 || password.length > 10) {
      setPasswordError(true);
      return;
    }
    if (password !== pwdChk) {
      setPasswordChkError(true);
      return;
    }
    if (!agree) {
      setAgreeError(true);
      return;
    }
    // 중복체크가 모두 완료되어야 회원가입 요청 실행
    if (duplexIdError || duplexNickError) {
      alert("라이엇 계정 및 사용자 아이디 중복체크를 완료해주세요.");
      return;
    }
    console.log("모든 조건 만족 - requestSignUp 호출 직전");
    requestSignUp();
  };

  const onReset = () => {
    setUser({ nickname: "", account_ID: "", password: "" });
    setAgree(false);
    setPwdChk("");
  };

  const requestSignUp = async () => {
    console.log("requestSignUp 호출됨");
    let url = `http://localhost:7777/api/users`;
    try {
      // 회원가입 요청 시, 백엔드는 nickname, account_ID, password를 받습니다.
      const response = await axios.post(url, { ...user, role: "USER" });
      const { result, message } = response.data;
      if (result === "success") {
        alert(message + "-가입에 성공하여 로그인할 수 있습니다.");
        navigate("/");
      } else {
        alert("회원 가입에 실패하였습니다. 다시 시도하세요.");
        onReset();
      }
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 500 || error.response.status === 400)
      ) {
        alert("라이엇 계정 및 사용자 아이디 중복체크를 완료해주세요.");
        setDuplexIdError(true);
        setDuplexNickError(true);
      } else {
        alert("Error: " + error.message);
      }
    }
  };

  return (
    <div className="signup">
      <div className="container transbackground">
        <form action="/input" method="post" onSubmit={onSubmit}>
          {/* 사용자 아이디 입력 및 중복 체크 */}
          <div className="row">
            <div className="col-md-12">
              <label htmlFor="nickname">사용자 아이디</label>
              <div className="input-group">
                <input
                  type="text"
                  name="nickname"
                  id="nickname"
                  onChange={onChange}
                  value={nickname}
                  placeholder="사용할 아이디 (예: user123)"
                  className="form-control form-control-lg"
                />
                <button
                  className="btn btn-outline-primary"
                  type="button"
                  onClick={onCheckNickname}
                >
                  중복체크
                </button>
              </div>
              {nameError && (
                <span className="text-danger">사용자 아이디를 입력하세요.</span>
              )}
            </div>
          </div>
          {/* 라이엇 계정 입력 및 중복 체크 */}
          <div className="row my-4">
            <div className="col-md-12">
              <label htmlFor="account_ID">라이엇 계정</label>
              <div className="input-group">
                <input
                  type="text"
                  name="account_ID"
                  id="account_ID"
                  onChange={onChange}
                  value={account_ID}
                  placeholder="라이엇 계정"
                  className="form-control form-control-lg"
                />
                <button
                  className="btn btn-outline-primary"
                  type="button"
                  onClick={onCheckId}
                >
                  중복체크
                </button>
              </div>
              {idError && (
                <span className="text-danger">라이엇 계정을 입력하세요.</span>
              )}
            </div>
          </div>
          {/* 비밀번호 입력 */}
          <div className="row my-4">
            <div className="col-md-12">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                name="password"
                id="password"
                onChange={onChange}
                value={password}
                placeholder="비밀번호 (4-10자)"
                className="form-control form-control-lg"
              />
              {passwordError && (
                <span className="text-danger">
                  비밀번호는 4-10자 사이로 입력하세요.
                </span>
              )}
            </div>
          </div>
          <div className="row my-4">
            <div className="col-md-12">
              <label htmlFor="pwdChk">비밀번호 확인</label>
              <input
                type="password"
                name="pwdChk"
                id="pwdChk"
                onChange={onChangepasswordChk}
                value={pwdChk}
                placeholder="비밀번호 확인"
                className="form-control form-control-lg"
              />
              {passwordChkError && (
                <span className="text-danger">
                  비밀번호가 일치하지 않습니다.
                </span>
              )}
            </div>
          </div>
          {/* 약관 동의 체크박스 */}
          <div className="row my-4">
            <div className="col-md-12">
              <label>
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={onChangeAgree}
                />
                약관에 동의합니다.
              </label>
              {agreeError && (
                <span className="text-danger">약관 동의가 필요합니다.</span>
              )}
            </div>
          </div>
          {/* 회원가입 버튼 */}
          <div className="row">
            <div className="col-md-6 offset-md-3 text-center">
              <button
                type="submit"
                className="btn btn-outline-primary btn-lg w-100"
              >
                회원가입
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
