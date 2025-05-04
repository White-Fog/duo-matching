// Header.jsx
import React, { useContext } from 'react';
import { AuthContext } from './member/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './member/axiosInstance';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header({ onShowLogin }) {
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const handleLogout = async () => {
        //로그아웃 처리
        //1. 서버에 로그아웃 요청
        try {
            const url = `http://localhost:7777/api/auth/logout`;
            await axiosInstance.post(url, { email: user.email });
        } catch (error) {
            alert('로그아웃 처리 중 에러: ' + error);
        }

        logoutUser(); //2. AuthContext 에서 제공하는 logoutUser를 호출하여 user 상태를 null로 초기화
        //sessionStorage.removeItem('user'); //세션스토리지에 저장한 user정보 삭제
        //3. 토큰 삭제
        sessionStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        navigate('/'); //5. 페이지 이동
    };

    return (
        <Navbar collapseOnSelect style={{ color: 'black', background: '#3b3b3b45' }} fixed="top" data-bs-theme="dark">
            <Container>
                <Navbar.Brand className="topMenu" as={Link} to="/">
                    매치메이킹
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="me-auto">
                        <span>｜</span>
                        <Nav.Link className="topMenu" href="https://www.leagueoflegends.com/ko-kr/">
                            게임 홈페이지
                        </Nav.Link>
                        <span>｜</span>
                        <Nav.Link className="topMenu" as={Link} to="/match-success">
                            매칭 결과
                        </Nav.Link>
                        {user && (
                            <Nav.Link className="topMenu" as={Link} to="/admin">
                                관리자 페이지
                            </Nav.Link>
                        )}
                        {/* <NavDropdown title="Dropdown" id="collapsible-nav-dropdown">
                            <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                            <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
                        </NavDropdown>  */}
                    </Nav>
                    <Nav>
                        <Nav.Link className="topMenu" as={Link} to="/posts">
                            Posts
                        </Nav.Link>
                        <span>|</span>

                        {user ? (
                            <Nav.Link className="topMenu" eventKey={2} as={Link} to="/mypage">
                                마이페이지
                            </Nav.Link>
                        ) : (
                            <Nav.Link className="topMenu" as={Link} to="/signup">
                                회원가입
                            </Nav.Link>
                        )}
                        <span>|</span>
                        {user ? (
                            <Nav.Link className="topMenu" onClick={handleLogout}>
                                로그아웃
                            </Nav.Link>
                        ) : (
                            <Nav.Link className="topMenu" onClick={() => onShowLogin(true)} as={Link}>
                                로그인
                            </Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
