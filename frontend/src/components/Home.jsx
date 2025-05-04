import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './member/AuthContext';
import './Home.css';
import { Dropdown, DropdownButton } from 'react-bootstrap';

const Home = ({ onShowLogin }) => {
    const { user, logoutUser } = useContext(AuthContext); //로그인 상태여부 체크 구조 분해 할당

    const [matchingButton, setMatchingButton] = useState('/matching_button.png'); //매칭 버튼
    const [rotation, setRotation] = useState(0); //매칭 버튼 회전
    const [buttonClicked, setButtonClicked] = useState(false); //매칭 버튼 클릭 여부
    const [count, setCount] = useState(0); //매칭 시간

    const [drondown, dropdownSet] = useState(false);

    const [targetTier, setTargetTier] = useState(''); //전달할 목표티어 값
    const [targetTierList, setTargetTierList] = useState('목표 티어 설정'); //드롭다운에서 선택 시 보여질 목표티어

    const [position, setPosition] = useState(''); //전달할 포지션 값
    const [positionList, setPositionList] = useState('포지션 설정'); //드롭다운에서 선택 시 보여질 포지션

    // New states for dropdown open status
    const [tierDropdownOpen, setTierDropdownOpen] = useState(false);
    const [positionDropdownOpen, setPositionDropdownOpen] = useState(false);

    let min = parseInt(count / 60);

    //버튼 회전
    useEffect(() => {
        let interval;

        if (buttonClicked) {
            interval = setInterval(() => {
                setRotation((prerotation) => prerotation + 1);
            }, 10);
        } else {
            clearInterval(interval);
            setRotation(0);
        }
        return () => clearInterval(interval);
    }, [buttonClicked]);

    //매칭 경과 시간
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

    const matchClickHandler = () => {
        setButtonClicked((pre) => !pre);
    };
    const tierHandler = (eventKey) => {
        setTargetTier(eventKey); // 목표 랭크 업데이트

        let tier = '';
        switch (eventKey) {
            case 'bronze4':
                tier = '브론즈4';
                break;
            case 'bronze3':
                tier = '브론즈3';
                break;
            case 'bronze2':
                tier = '브론즈2';
                break;
            case 'bronze1':
                tier = '브론즈1';
                break;
            case 'silver4':
                tier = '실버4';
                break;
            case 'silver3':
                tier = '실버3';
                break;
            case 'silver2':
                tier = '실버2';
                break;
            case 'silver1':
                tier = '실버1';
                break;
            case 'gold4':
                tier = '골드4';
                break;
            case 'gold3':
                tier = '골드3';
                break;
            case 'gold2':
                tier = '골드2';
                break;
            case 'gold1':
                tier = '골드1';
                break;
            case 'Platinum4':
                tier = '플래티넘4';
                break;
            case 'Platinum3':
                tier = '플래티넘3';
                break;
            case 'Platinum2':
                tier = '플래티넘2';
                break;
            case 'Platinum1':
                tier = '플래티넘1';
                break;
            case 'emerald4':
                tier = '에메랄드4';
                break;
            case 'emerald3':
                tier = '에메랄드3';
                break;
            case 'emerald2':
                tier = '에메랄드2';
                break;
            case 'emerald1':
                tier = '에메랄드1';
                break;
            case 'diamond4':
                tier = '다이아몬드4';
                break;
            case 'diamond3':
                tier = '다이아몬드3';
                break;
            case 'diamond2':
                tier = '다이아몬드2';
                break;
            case 'diamond1':
                tier = '다이아몬드1';
                break;
            case 'master':
                tier = '마스터';
                break;
            case 'grandmaster':
                tier = '그랜드마스터';
                break;
            case 'challanger':
                tier = '챌린저';
                break;
        }
        setTargetTierList(tier);
        setTierDropdownOpen(false);
    };

    const positionHandler = (eventKey) => {
        let position = '';
        switch (eventKey) {
            case 'top':
                position = '상단(탑)';
                break;
            case 'mid':
                position = '중단(미드)';
                break;
            case 'bot':
                position = '하단(봇)';
                break;
            case 'jungle':
                position = '정글';
                break;
            case 'support':
                position = '서포터';
                break;
        }
        setPositionList(position);
        setPositionDropdownOpen(false);
    };

    const dropdownstyle = {
        nonactive: {},
        active: {},
    };

    return (
        <div className="panel-container">
            <div className="panel">
                <div className="section1">
                    <div className="section-container">
                        <DropdownButton
                            id="dropdown-basic-button"
                            title={targetTierList}
                            variant="dark"
                            onSelect={tierHandler}
                            onToggle={(isOpen) => setTierDropdownOpen(isOpen)}
                            className={`w-100 dropdown ${tierDropdownOpen ? 'show' : ''}`}
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
                <div className="section2">
                    {!user ? (
                        <>
                            <button
                                className="matchingButton"
                                onMouseDown={() => setMatchingButton('/matching_button_clicked.PNG')}
                                onMouseUp={() => setMatchingButton('/matching_button.png')}
                                onMouseLeave={() => setMatchingButton('/matching_button.png')}
                                onClick={matchClickHandler}
                            >
                                <img
                                    src={matchingButton}
                                    alt="button image"
                                    style={{
                                        transform: `rotate(${rotation}deg)`,
                                    }}
                                />
                            </button>

                            {buttonClicked && (
                                <h3 className="count">
                                    <b>
                                        경과 시간 : {count < 60 ? '' : min + '분'} {count % 60}초
                                    </b>
                                </h3>
                            )}
                        </>
                    ) : (
                        <button
                            className="btn btn-danger"
                            onClick={() => onShowLogin(true)}
                            style={{ width: '280x', height: '90px', border: 'none', borderRadius: '15%' }}
                        >
                            <b style={{ fontSize: '2rem' }}>로그인</b>
                        </button>
                    )}
                </div>

                <div className="section3">
                    <div className="section-container">
                        <DropdownButton
                            id="dropdown-basic-button"
                            title={positionList}
                            variant="dark"
                            onSelect={positionHandler}
                            onToggle={(isOpen) => setPositionDropdownOpen(isOpen)}
                            className={`w-100 dropdown ${positionDropdownOpen ? 'show' : ''}`}
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
            <div className="transbackground">{/* 여기에 추가적인 내용이나 컴포넌트를 배치할 수 있습니다. */}</div>
        </div>
    );
};

export default Home;
