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
    console.log("매치 생성:", matchId);
    const match = {
      id: matchId,
      user1: { accepted: null, data: user1 },
      user2: { accepted: null, data: user2 },
      createdAt: Date.now(),
    };
    this.matches[matchId] = match;
    return match;
  }

  // 매치 응답을 기록하고 처리하는 메소드 (예시)
  recordResponse(matchId, accepted, account_ID) {
    const match = this.matches[matchId];
    if (!match) {
      return { error: "매치를 찾을 수 없습니다." };
    }
    if (match.user1.data.account_ID === account_ID) {
      match.user1.accepted = accepted;
    } else if (match.user2.data.account_ID === account_ID) {
      match.user2.accepted = accepted;
    } else {
      return { error: "해당 매치에 사용자가 포함되어 있지 않습니다." };
    }
    const finalized =
      match.user1.accepted !== null && match.user2.accepted !== null;

    const successful =
      finalized && match.user1.accepted && match.user2.accepted;

    return { finalized, successful, match };
  }

  infoMatch(matchId) {
    const match = this.matches[matchId];
    const user1 = match.user1;
    const user2 = match.user2;
    return {user1, user2}
  }
  // 해당 매치를 메모리에서 제거하는 메소드
  removeMatch(matchId) {
    delete this.matches[matchId];
  }
}

module.exports = new MatchManager();
