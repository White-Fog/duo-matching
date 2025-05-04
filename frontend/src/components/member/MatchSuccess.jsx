import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MatchSuccess.css';

const MatchSuccess = () => {
    const navigate = useNavigate();
    const [matchedUser, setMatchedUser] = useState(null);

    useEffect(() => {
        // 매칭된 사용자 정보를 가져오는 API 호출
        const fetchMatchedUser = async () => {
            try {
                const response = await fetch('http://localhost:7777/api/match/success');
                const data = await response.json();
                setMatchedUser(data);
            } catch (error) {
                console.error('매칭 정보를 가져오는데 실패했습니다:', error);
            }
        };

        fetchMatchedUser();
    }, []);

    return (
        <div className="match-success-container">
            <div className="match-success-card">
                <div className="match-header">
                    <h1 className="match-success-title">매칭 성공!</h1>
                    <div className="match-timer">매칭 시간: {matchedUser?.matchTime || 0}초</div>
                </div>

                <div className="match-success-content">
                    {matchedUser ? (
                        <div className="user-profile">
                            <div className="profile-header">
                                <img
                                    src={matchedUser.profileImage || '/default-profile.png'}
                                    alt="프로필 이미지"
                                    className="profile-image"
                                />
                                <div className="user-info">
                                    <h2 className="username">{matchedUser.username}</h2>
                                    <span className="hashtag">#{matchedUser.tag}</span>
                                </div>
                            </div>

                            <div className="stats-container">
                                <div className="stat-box">
                                    <span className="stat-label">현재 티어</span>
                                    <span className="stat-value">{matchedUser.currentTier}</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">목표 티어</span>
                                    <span className="stat-value">{matchedUser.targetTier}</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">포지션</span>
                                    <span className="stat-value">{matchedUser.position}</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">OP Score</span>
                                    <span className="stat-value">{matchedUser.opScore}점</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>매칭 정보를 불러오는 중...</p>
                        </div>
                    )}
                </div>

                <button className="go-home-btn" onClick={() => navigate('/')}>
                    홈으로 가기
                </button>
            </div>
        </div>
    );
};

export default MatchSuccess;
