import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../memberCss/SignUp.css';

const SignUp = () => {
    const navigate = useNavigate();

    const [user, setUser] = useState({ name: '', id: '', password: '' });
    const [agree, setAgree] = useState(false);
    const [pwdChk, setPwdChk] = useState('');
    const [nameError, setNameError] = useState(false);
    const [passwordError, setpasswordError] = useState(false);
    const [idError, setidError] = useState(false);
    const [agreeError, setAgreeError] = useState(false);
    const [passwordChkError, setpasswordChkError] = useState(false);
    const [duplexError, setDuplexError] = useState(true);

    const { name, id, password } = user;

    const onChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
        if (e.target.name === 'name') setNameError(false);
        if (e.target.name === 'id') setidError(false);
        if (e.target.name === 'password') setpasswordError(false);
    };

    const onCheckid = () => {
        isDuplicatedid();
    };

    const isDuplicatedid = async () => {
        try {
            setDuplexError(true);
            const response = await axios.post(`http://localhost:7777/api/users/duplex`, { id });
            const data = response.data;
            if (data.result === 'ok') {
                alert(data.message);
                setDuplexError(false);
            } else {
                alert(data.message);
                setUser({ ...user, id: '' });
                setDuplexError(true);
            }
        } catch (error) {
            alert('Error: ', error);
            setDuplexError(true);
        }
    };

    const onChangepasswordChk = (e) => {
        setpasswordChkError(e.target.value !== password);
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

        if (!name) {
            setNameError(true);
            return;
        }
        if (!id) {
            setidError(true);
            return;
        }
        if (!password) {
            setpasswordError(true);
            return;
        }
        if (password.length < 4 || password.length > 10) {
            setpasswordError(true);
            return;
        }
        if (password !== pwdChk) {
            setpasswordChkError(true);
            return;
        }
        if (!agree) {
            setAgreeError(true);
            return;
        }

        if (duplexError) {
            alert('해당 아이디는 이미 사용 중입니다.');
            return;
        }

        requestSignUp();
    };

    const onReset = () => {
        setUser({ name: '', id: '', password: '' });
        setAgree(false);
        setPwdChk('');
    };

    const requestSignUp = async () => {
        let url = `http://localhost:7777/api/users`;
        try {
            const response = await axios.post(url, { ...user, role: 'USER' });
            const { result, message } = response.data;
            if (result === 'success') {
                alert(message + '-가입에 성공하여 로그인할 수 있습니다.');
                navigate('/');
            } else {
                alert('회원 가입에 실패하였습니다. 다시 시도하세요.');
                onReset();
            }
        } catch (error) {
            if (error.response && (error.response.status === 500 || error.response.status === 400)) {
                alert('아이디 중복체크를 안 했군 자네?');
                setDuplexError(true);
            } else {
                alert('Error: ', error);
            }
        }
    };

    return (
        <div className="signup">
            <div className="container transbackground">
                <form action="/input" method="post" onSubmit={onSubmit}>
                    <div className="row">
                        <div className="col-md-12">
                            <label htmlFor="userid">이름</label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                onChange={onChange}
                                placeholder="User Name"
                                className="form-control form-control-lg"
                            />
                            {nameError && <span className="text-danger">이름을 입력하시오.</span>}
                        </div>
                    </div>
                    <div className="row my-4">
                        <div className="col-md-12">
                            <label htmlFor="userid">id</label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    name="id"
                                    id="id"
                                    onChange={onChange}
                                    value={id}
                                    placeholder="id"
                                    className="form-control form-control-lg"
                                />

                                <button className="btn btn-outline-success" type="button" onClick={onCheckid}>
                                    중복체크
                                </button>
                            </div>
                            {idError && <span className="text-danger">아이디를 입력하시오.</span>}
                        </div>
                    </div>

                    <div className="row my-4">
                        <div className="col-md-12">
                            <label htmlFor="userid">비밀번호</label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                onChange={onChange}
                                value={password}
                                placeholder="password"
                                className="form-control form-control-lg"
                            />
                            {passwordError && <span className="text-danger">비밀번호는 4-10자 사이로 입력하시오.</span>}
                        </div>
                    </div>
                    <div className="row my-4">
                        <div className="col-md-12">
                            <label htmlFor="userid">비밀번호 확인</label>
                            <input
                                type="password"
                                name="pwdChk"
                                id="pwdChk"
                                onChange={onChangepasswordChk}
                                value={pwdChk}
                                placeholder="Re password"
                                className="form-control form-control-lg"
                            />
                            {passwordChkError && <span className="text-danger">비밀번호가 일치하지 않음.</span>}
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 offset-md-3 text-center">
                            <button type="submit" className="btn btn-outline-primary btn-lg w-100">
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
