// matchManager.js
// 사용자의 응답을 관리(수락 또는 거절)
class MatchManager {
  constructor() {
    // pendingMatches는 matchId를 key로, 매칭 후보 정보를 저장합니다.
    this.pendingMatches = {};
  }

  // 두 사용자의 후보 매칭을 생성합니다.
  createMatch(user1, user2) {
    // 간단히 고유 id를 생성 (실무에서는 UUID 등 사용 권장)
    const matchId = `${user1.username}-${user2.username}-${Date.now()}`;
    this.pendingMatches[matchId] = {
      user1: {
        data: user1,
        responded: false,
        accepted: null,
      },
      user2: {
        data: user2,
        responded: false,
        accepted: null,
      },
      finalized: false,
      // 타임아웃 설정 (예: 30초)
      timeout: setTimeout(() => {
        this.finalizeMatch(matchId, "timeout");
      }, 30000),
    };

    return matchId;
  }

  // 사용자의 응답을 기록하고 매칭 상태를 확인합니다.
  recordResponse(matchId, userId, accepted) {
    const match = this.pendingMatches[matchId];
    if (!match) {
      return { error: "Match not found" };
    }

    // 응답자가 user1 또는 user2중 어느 쪽인지 확인
    if (match.user1.data.username === userId) {
      match.user1.responded = true;
      match.user1.accepted = accepted;
    } else if (match.user2.data.username === userId) {
      match.user2.responded = true;
      match.user2.accepted = accepted;
    } else {
      return { error: "User not part of this match" };
    }

    // 응답 후 매칭 상태 확인
    return this.checkMatchStatus(matchId);
  }

  // 두 사용자의 응답 상태를 확인합니다.
  checkMatchStatus(matchId) {
    const match = this.pendingMatches[matchId];
    if (match.user1.responded && match.user2.responded) {
      // 두 사용자가 모두 응답했다면 타임아웃 취소
      clearTimeout(match.timeout);
      match.finalized = true;
      // 두 사용자 모두 수락한 경우
      if (match.user1.accepted && match.user2.accepted) {
        return { finalized: true, successful: true, match };
      } else {
        // 한쪽이 거절한 경우
        return { finalized: true, successful: false, match };
      }
    } else {
      // 한쪽 응답 대기 중
      return { finalized: false, message: "Waiting for the other response" };
    }
  }

  // 타임아웃 또는 기타 이유로 매칭을 강제로 종료합니다.
  finalizeMatch(matchId, reason) {
    const match = this.pendingMatches[matchId];
    if (match && !match.finalized) {
      match.finalized = true;
      // 타임아웃이 발생한 경우 등은 자동 거절로 처리
      match.user1.responded ||= false;
      match.user2.responded ||= false;
      // 여기서는 두 사용자 모두 (자동) 거절한 것으로 처리합니다.
      return { finalized: true, successful: false, reason, match };
    }
    return null;
  }

  // 매칭 정보를 조회합니다.
  getMatch(matchId) {
    return this.pendingMatches[matchId];
  }

  // 매칭 정보 삭제 (매칭 처리 완료 후 호출)
  removeMatch(matchId) {
    delete this.pendingMatches[matchId];
  }
}

// 인스턴스를 생성하여 단일 객체로 내보냅니다.
module.exports = new MatchManager();
