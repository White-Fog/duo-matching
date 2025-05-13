// /services/matchManager.js
const { v4: uuidv4 } = require("uuid");

class MatchManager {
  constructor() {
    // 메모리 내에서 매치 정보를 보관하는 객체
    // 키는 matchId, 값은 매치 정보 객체
    this.matches = {};
  }

  // 새로운 매치를 생성하는 메소드
  createMatch(user1, user2) {
    const matchId = uuidv4(); // 고유 매치 식별자 생성
    const match = {
      id: matchId,
      user1: { data: user1 },
      user2: { data: user2 },
      // 필요에 따라 추가 정보 저장 가능
      createdAt: Date.now(),
    };
    this.matches[matchId] = match;
    return match;
  }

  // 매치 응답을 기록하고 처리하는 메소드 (예시)
  recordResponse(matchId, username, accepted) {
    const match = this.matches[matchId];
    if (!match) {
      return { error: "매치를 찾을 수 없습니다." };
    }

    // 단순한 예시로 양쪽 사용자 모두 수락하면 성공 처리한다고 가정.
    // 실제 로직에서는 각 사용자의 응답을 별도로 기록하고,
    // 양쪽이 모두 수락했을 때 성공이라고 처리할 수 있습니다.
    // 여기서는 응답을 기록한 후 바로 최종 확정(finalized)되었다고 가정.
    return { finalized: true, successful: accepted, match };
  }

  // 해당 매치를 메모리에서 제거하는 메소드
  removeMatch(matchId) {
    delete this.matches[matchId];
  }
}

module.exports = new MatchManager();
