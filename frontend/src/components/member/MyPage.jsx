// MyPage.jsx
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosInstance';
import { Button } from 'react-bootstrap';
import axios from 'axios';

export default function MyPage() {
    const { user, loginAuthUser, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [users, setUser] = useState({ name: '', email: '', password: '' });
    const [pwdChk, setPwdChk] = useState('');
    //에러 관련
    const [nameError, setNameError] = useState(false);
    const [passwordError, setpasswordError] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [passwordChkError, setpasswordChkError] = useState(false);
    const [duplexError, setDuplexError] = useState(true);

    //구조 분해 할당
    const { name, email, password } = users;
    //useEffect()훅에서 로그인 하지 않았다면 홈으로 이동시키자
    useEffect(() => {
        //세션 스토리지에서 accessToken을 꺼낸다.
        //토큰이 있다면 백엔드쪽에 토큰에 해당하는 사용자 정보를 얻자
        // '/api/auth/user' 로 요청을 보내서 user정보를 받아
        //user정보가 있다면 loginAuthUser(user)
        //세션 스토리지에 저장한 user가 있는지 확인. 있다면 로그인했다는 의미. user정보를 꺼내서 활용하자
        //const tmpUser = JSON.parse(sessionStorage.getItem('user'));
        const accessToken = sessionStorage.getItem('accessToken'); //세션스토리지에서 꺼내기
        // if (accessToken) alert(accessToken);
        //const refreshToken = localStorage.getItem('refreshToken'); //로컬스토리지에서 꺼내기
        console.log('MyPage component rendered with user:', JSON.stringify(user)); // JSON 형태로 로그 출력
        if (accessToken) {
            // 토큰이 있다면, 로그인된 상태로 간주
            axiosInstance
                .get('http://localhost:7777/api/auth/user', {
                    //package.json에 proxy 설정하면 http://localhost:7777 생략해도 된다 but 자꾸 오류가 나서 붙이도록 한다
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
                .then((response) => {
                    //alert('/api/auth/user요청으로 받음 데이터' + JSON.stringify(response.data));
                    const authUser = {
                        id: response.data.id,
                        email: response.data.email,
                        name: response.data.name,
                    };

                    loginAuthUser(authUser); // 로그인된 사용자 정보 설정
                })
                .catch((error) => {
                    alert('로그인해야 사용할 수 있어요');
                    console.error('Access token이 유효하지 않습니다.', error);
                    // sessionStorage.removeItem('accessToken');
                    // localStorage.removeItem('refreshToken');
                    navigate('/');
                });
        } else {
            alert('로그인해야 사용할 수 있어요');
            navigate('/');
        }
    }, [navigate]);

    const onChange = (e) => {
        setUser({ ...users, [e.target.name]: e.target.value });
        if (e.target.name === 'name') setNameError(false);
        if (e.target.name === 'email') setEmailError(false);
        if (e.target.name === 'password') setpasswordError(false);
    };

    const onCheckEmail = (e) => {
        //이메일 중복 체크

        isDuplicatedEmail();
    }; //onCheckEmail 종료

    const isDuplicatedEmail = async () => {
        try {
            setDuplexError(true);
            const response = await axios.post(`http://localhost:7777/api/users/duplex`, { email });
            const data = response.data;
            if (data.result === 'ok') {
                alert(data.message);
                setDuplexError(false);
            } else {
                alert(data.message);

                setUser({ ...user, email: '' });
                setDuplexError(true);
            }
        } catch (error) {
            alert('Error: ', error);
            setDuplexError(true);
        }
    }; //isDuplicatedEmail 종료
    const onChangepasswordChk = (e) => {
        setpasswordChkError(e.target.value !== password);
        setPwdChk(e.target.value);
    };
    const [changeOn, setChangeOn] = useState(false);
    //회원 정보 수정 창 오픈
    const openChange = () => {
        setChangeOn(!changeOn);
    };

    //회원 정보 수정 요청
    const onSubmit = async (e) => {
        e.preventDefault();
        //유효성체크
        if (!name) {
            setNameError(true);
            return;
        }
        if (!email) {
            setEmailError(true);
            return;
        }
        if (!password) {
            setpasswordError(true);
            return;
        }
        //비밀번호와 비번 확인 입력값 체크
        if (password !== pwdChk) {
            setpasswordChkError(true);
            return;
        }

        //이메일 중복여부 체크
        if (duplexError) {
            alert('해당 이메일은 이미 사용 중입니다.');
            return;
        }

        await changedProfile();

        alert('다시 로그인하여 주십시오.');

        setChangeOn(false);
    };

    const changedProfile = async () => {
        try {
            const response = await axiosInstance.put(`http://localhost:7777/api/auth/update/${user.id}`, users);
            if (response.data.result === 'success') {
                alert('회원 정보가 성공적으로 수정되었습니다.');

                sessionStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');

                logoutUser();
                navigate('/'); // 홈으로 이동
            } else {
                alert('회원 정보 수정에 실패하였습니다.');
            }
        } catch (error) {
            console.error('회원의 정보 수정 중 에러 발생: ' + error + 'catch에 잡혔습니다.');
        }
    };
    //회원 탈퇴
    const mWithdrawal = async () => {
        try {
            const response = await axiosInstance.delete(`http://localhost:7777/api/auth/delete/${user.id}`);
            if (response.data.result === 'success') {
                alert(response.data.message);
                logoutUser(); // 로그아웃 처리
                navigate('/'); // 홈으로 이동
            } else {
                alert('회원 탈퇴에 실패하였습니다. 다시 시도하세요.');
            }
        } catch (error) {
            console.error('탈퇴 중 에러 발생: ' + error + 'catch에 잡혔습니다.');
        }
    };
    return (
        <div className="container py-4">
            <h1 className="my-4">MyPage</h1>
            {user && (
                <div>
                    <div className="alert alert-primary p-3">
                        {!changeOn && (
                            <div>
                                <h3>회원번호: {user.id} </h3>
                                <h3>이 름 : {user.name} </h3>
                                <h3>이 메 일 : {user.email} </h3>
                            </div>
                        )}
                        {changeOn && (
                            <div>
                                <form action="/input" method="post" onSubmit={onSubmit}>
                                    <div className="row my-4">
                                        <div className="col-md-8 offset-md-2">
                                            <label htmlFor="userid">이름:</label>
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                onChange={onChange}
                                                placeholder="User Name"
                                                className="form-control"
                                            ></input>
                                            {nameError && <span className="text-danger">이름을 입력해야 해요</span>}
                                            {/* 위가 true가 되면 이름을 입력해야 해요가 나타남  */}
                                        </div>
                                    </div>
                                    <div className="row my-4">
                                        <div className="col-md-8 offset-md-2">
                                            <label htmlFor="userid">Email:</label>
                                            <input
                                                type="text"
                                                name="email"
                                                id="email"
                                                onChange={onChange}
                                                value={email}
                                                placeholder="Email"
                                                className="form-control"
                                            ></input>
                                            <button
                                                className="btn btn-outline-success"
                                                type="button"
                                                onClick={onCheckEmail}
                                            >
                                                중복체크
                                            </button>
                                            {emailError && <span className="text-danger">Email을 입력해야 해요</span>}
                                        </div>
                                    </div>
                                    <div className="row my-4">
                                        <div className="col-md-8 offset-md-2">
                                            <label htmlFor="userid">비밀번호:</label>
                                            <input
                                                type="password"
                                                name="password"
                                                id="password"
                                                onChange={onChange}
                                                value={password}
                                                placeholder="password"
                                                className="form-control"
                                            ></input>
                                            {passwordError && (
                                                <span className="text-danger">비밀번호를 입력해야 해요</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="row my-4">
                                        <div className="col-md-8 offset-md-2">
                                            <label htmlFor="userid">비밀번호 확인:</label>
                                            <input
                                                type="password"
                                                name="pwdChk"
                                                id="pwdChk"
                                                onChange={onChangepasswordChk}
                                                value={pwdChk}
                                                placeholder="Re password"
                                                className="form-control"
                                            ></input>
                                            {passwordChkError && (
                                                <span className="text-danger">비밀번호가 일치하지 않아요</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <Button type="submit">완료</Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                    <Button variant="outline-secondary" onClick={openChange}>
                        회원 정보 수정
                    </Button>
                    {!changeOn && (
                        <Button variant="outline-danger" className="ms-2" onClick={mWithdrawal}>
                            회원 탈퇴
                        </Button>
                    )}{' '}
                </div>
            )}

            {!user && (
                <div className="alert alert-danger p-3">
                    <h3>로그인한 사용자만 확인할 수 있어요</h3>
                </div>
            )}
        </div>
    );
}
