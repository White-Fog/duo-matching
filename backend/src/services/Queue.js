/* AddUserTest.js에서 추가한 사용자의 정보를 대기열로 관리하는 코드이다. 큐에 저장되면 MatchMaking.js에 전달한다.
임시적인 코드로 이 코드는 수정될 수 있다.

class Queue {
  static queue = []; // 대기열 배열

  // 매칭 핸들링
  static async handleMatch(matchInfo) {
    console.log("매칭된 상대 정보:");
    console.log(`사용자명: ${matchInfo.username}`);
    console.log(`승률: ${matchInfo.winRate}`);
    console.log(`OP 스코어: ${matchInfo.OPScore}`);

    const userDecision = await this.getUserDecision();

    if (userDecision === "ACCEPT") {
      console.log("매칭이 수락되었습니다!");
    } else if (userDecision === "DECLINE") {
      console.log("매칭이 거절되었습니다. 재매칭을 시작합니다.");
      this.handleReMatch();
    } else {
      console.log("유효하지 않은 선택입니다.");
    }
  }

  // 재매칭 로직
  static async handleReMatch() {
    console.log("재매칭 로직이 실행되었습니다. 대기열을 다시 탐색합니다.");

    while (true) {
      console.log("재매칭 시도 중...");

      const potentialMatch = await this.findPotentialMatch();
      if (potentialMatch) {
        console.log("새로운 매칭 상대를 찾았습니다!");
        await this.handleMatch(potentialMatch);
        break;
      } else {
        console.log("조건에 맞는 사용자를 찾지 못했습니다. 다시 탐색 중...");
        await this.delay(3000);
      }

      if (Queue.queue.length < 2) {
        console.log("대기열에 사용자가 부족합니다. 재매칭을 중단합니다.");
        break;
      }
    }
  }

  // 잠재적 매칭 대상 찾기
  static async findPotentialMatch() {
    if (Queue.queue.length < 2) {
      console.log("대기열에 사용자가 부족합니다.");
      return null;
    }

    const user1 = Queue.queue[0];
    for (let i = 1; i < Queue.queue.length; i++) {
      const user2 = Queue.queue[i];
      if (this.isMatchValid(user1, user2)) {
        Queue.queue.splice(i, 1);
        return user2;
      }
    }

    return null;
  }

  // 매칭 조건 확인
  static isMatchValid(user1, user2) {
    return user1.position !== user2.position && user1.rank === user2.rank;
  }

  // 사용자 입력 시뮬레이션 (ACCEPT/DECLINE)
  static async getUserDecision() {
    return new Promise((resolve) => {
      setTimeout(() => resolve("ACCEPT"), 1000);
    });
  }

  // 지연 처리
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = Queue;
*/
