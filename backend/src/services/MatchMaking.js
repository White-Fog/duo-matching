const Queue = require("./Queue");
const riotAPI = require("../middlewares/riotAPI");
const matchManager = require("./matchManager");

class MatchMaking {
  // 생성자에 io 인스턴스 전달 (실시간 이벤트 발송용)
  constructor(io) {
    this.io = io;
    this.serverStartTime = Date.now(); // 서버 전체 운영 시간 측정을 위한 시작 시점
    this.queue = [];
    this.attemptedPairs = new Set(); // 매칭 시도한 사용자 페어 저장
    this.maxWaitTimeLevel1 = 60000;
    this.maxWaitTimeLevel2 = 120000;
  }

  formatWaitTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  }

  async addUserToQueue(user) {
    try {
      const rankData = await riotAPI.getUserInfoByUid(user.puuid);
      console.log("사용자명:", user.account_ID);
      const soloEntry =
        rankData.find((entry) => entry.queueType === "RANKED_SOLO_5x5") ||
        rankData[0];

      let currentRank = "정보 없음";
      if (soloEntry && soloEntry.tier && soloEntry.rank) {
        currentRank = `${soloEntry.tier} ${soloEntry.rank}`;
      }

      // 사용자 데이터에 등록 시각(enqueueTime) 추가
      const userWithRank = {
        ...user,
        CurrentRank: currentRank,
        enqueueTime: Date.now(),
      };

      // 사용자 추가 후 대기열 업데이트
      this.queue.push(userWithRank);
      console.log(`${user.account_ID}가 큐에 추가되었습니다!`);

      // 대기열 변경 이벤트 전송 (필요시)
      if (this.io) {
        this.io.emit("queueUpdated", {
          message: `${user.account_ID}가 대기열에 추가되었습니다.`,
          queueLength: this.queue.length,
        });
      }
    } catch (error) {
      console.error(`사용자 추가 중 오류 발생: ${error.message}`);
    }
  }

  // 취소 기능: 지정된 account_ID를 가진 사용자를 대기열에서 제거
  cancelUserFromQueue(account_ID) {
    const initialLength = this.queue.length;
    // 큐에서 account_ID가 일치하는 항목을 제거합니다.
    this.queue = this.queue.filter((user) => user.account_ID !== account_ID);
    if (this.queue.length < initialLength) {
      console.log(`${account_ID}가 큐에서 취소(제거)되었습니다.`);
      if (this.io) {
        this.io.emit("queueUpdated", {
          message: `${account_ID}가 매치메이킹 큐에서 제거되었습니다.`,
          queueLength: this.queue.length,
        });
      }
      return true;
    } else {
      console.log(`${account_ID}는 큐에 존재하지 않습니다.`);
      return false;
    }
  }

  displayQueueState() {
    console.log("\n=== 현재 대기열 상태 ===");
    this.queue.forEach((user) => {
      console.log(
        `- 계정: ${user.account_ID}, 현재 랭크: ${user.CurrentRank}, 목표 랭크: ${user.targetRank}, 포지션: ${user.selectPosition}`
      );
    });
    console.log("=========================");
  }

  async startMatchMaking() {
    console.log("매치메이킹이 시작되었습니다.");
    const startTime = Date.now();

    while (true) {
      const currentTime = Date.now();
      // 서버 운영 시간 측정
      const serverUptimeMillis = currentTime - this.serverStartTime;
      const serverUptimeSeconds = Math.floor(serverUptimeMillis / 1000);
      const serverUptimeFormatted = this.formatWaitTime(serverUptimeSeconds);
      console.log(`서버 운영 시간: ${serverUptimeFormatted}`);

      const elapsedTimeSeconds = Math.floor((currentTime - startTime) / 1000);
      const formattedTime = this.formatWaitTime(elapsedTimeSeconds);

      if (this.queue.length < 2) {
        console.log(
          `매칭할 사용자가 부족합니다. 대기 중... 현재 대기시간: ${formattedTime}`
        );
        this.displayQueueState();
        await this.delay(5000);
        continue;
      }

      // findMatch()에서 반환한 결과는 매치 객체(matchManager.createMatch로 생성된)임.
      const match = await this.findMatch();
      if (match) {
        console.log("매칭 완료:");
        // 매치 객체 내부의 user1.data, user2.data 사용
        this.displayMatchInfo(match.user1.data, match.user2.data);
        // 매칭 성공 시 Socket.io 이벤트를 통해 프론트엔드에 알림 전송
        if (this.io) {
          this.io.emit("matchSuccess", {
            message: "매칭이 확정되었습니다.",
            matchId: match.id,
            opponent: {
              user1: match.user1.data,
              user2: match.user2.data,
            },
          });
        }
      } else {
        console.log(
          `매칭 조건에 맞는 사용자를 찾지 못했습니다. 현재 대기시간: ${formattedTime}`
        );
        this.displayQueueState();
        await this.delay(5000);
      }
    }
  }

  async findMatch() {
    const currentTime = Date.now();
    // OPScore 기준으로 큐 정렬 (대기시간 계산은 전체 큐 기준)
    this.queue.sort((a, b) => b.OPScore - a.OPScore);

    // 전체 큐에서 가장 오래된 enqueueTime을 기준으로 전체 대기 시간 계산
    const minEnqueueTime = Math.min(...this.queue.map((u) => u.enqueueTime));
    const globalWaitMillis = currentTime - minEnqueueTime;
    const globalWaitSeconds = Math.floor(globalWaitMillis / 1000);
    const globalMinutes = Math.floor(globalWaitSeconds / 60);
    const globalSeconds = globalWaitSeconds % 60;

    // 동적 offset 계산을 위한 변수 관리 – 매칭 성공 전까지 누적
    if (this.lastOffsetUpdate === undefined) {
      this.lastOffsetUpdate = currentTime;
      this.lastDynamicOffset = 0;
      this.attemptedPairs.clear();
    }

    const offsetGrowthMillis = currentTime - this.lastOffsetUpdate;
    const newOffset = Math.min(Math.floor(offsetGrowthMillis / 20000), 2);

    if (newOffset > this.lastDynamicOffset) {
      this.lastDynamicOffset = newOffset;
      this.lastOffsetUpdate = currentTime;
      this.attemptedPairs.clear();
      console.log(
        `ℹ️ 오차 범위가 ${newOffset}로 증가하여 이전 시도 기록을 초기화합니다.`
      );
    }
    const dynamicOffset = this.lastDynamicOffset;

    if (
      globalWaitMillis % 20000 < 2000 &&
      Math.floor(globalWaitMillis / 20000) > 0
    ) {
      console.log(
        `⚠️ 오차 범위가 ${dynamicOffset}로 증가했습니다. (전체 경과 시간: ${
          Math.floor(globalWaitMillis / 20000) * 20
        }초)`
      );
    }

    console.log(
      `⏳ 전체 매칭 대기 시간: ${globalMinutes}분 ${globalSeconds}초`
    );
    console.log(`⚠️ 현재 오차 범위: ${dynamicOffset}`);

    // 큐에 있는 모든 사용자 쌍에 대해 매칭 조건 검사
    for (let i = 0; i < this.queue.length; i++) {
      const user1 = this.queue[i];
      for (let j = i + 1; j < this.queue.length; j++) {
        const user2 = this.queue[j];
        const pairKey = `${user1.account_ID}-${user2.account_ID}-${dynamicOffset}`;
        if (this.attemptedPairs.has(pairKey)) continue;

        const failedConditions = [];

        // 목표 티어 조건 검사 (동적 offset이 0인 경우)
        if (user1.targetRank !== user2.targetRank) {
          if (dynamicOffset === 0) {
            failedConditions.push(
              `목표 티어 불일치 (사용자 1: ${user1.targetRank}, 사용자 2: ${user2.targetRank})`
            );
          }
        }

        // 현재 티어 차이 조건 검사 (동적 offset 반영)
        if (
          !this.isRankWithinOffset(
            user1.CurrentRank,
            user2.CurrentRank,
            dynamicOffset
          )
        ) {
          failedConditions.push(
            `현재 티어 차이 초과 (사용자 1: ${user1.CurrentRank}, 사용자 2: ${user2.CurrentRank}, 허용 오차: ${dynamicOffset})`
          );
        }

        if (failedConditions.length === 0) {
          console.log(
            `✅ 매치 성공: ${user1.account_ID}와 ${user2.account_ID}`
          );

          // 매칭 성공 시 각 사용자의 대기 시간을 계산
          const waitTimeUser1 = currentTime - user1.enqueueTime;
          const waitTimeUser2 = currentTime - user2.enqueueTime;
          console.log(
            `사용자 ${user1.account_ID} 대기 시간: ${Math.floor(
              waitTimeUser1 / 1000
            )}초, 사용자 ${user2.account_ID} 대기 시간: ${Math.floor(
              waitTimeUser2 / 1000
            )}초`
          );

          // 매칭 성공 시 해당 사용자들을 큐에서 제거
          this.queue.splice(j, 1);
          this.queue.splice(i, 1);
          // 오차 관련 변수 초기화 – 새로운 매칭은 offset 0부터 시작
          this.lastOffsetUpdate = undefined;
          this.lastDynamicOffset = 0;
          this.attemptedPairs.clear();

          // matchManager의 createMatch()를 사용하여 in-memory 매치 객체 생성
          const match = matchManager.createMatch(user1, user2);
          return match;
        } else {
          console.log(
            `❌ 매치 실패: ${user1.account_ID}와 ${user2.account_ID}`
          );
          console.log("실패 조건:", failedConditions.join(", "));
          this.attemptedPairs.add(pairKey);
        }
      }
    }

    console.log(
      `매칭 조건에 맞는 사용자를 찾지 못했습니다. 현재 대기시간: ${globalMinutes}분 ${globalSeconds}초`
    );
    await this.delay(2000);
    return this.findMatch();
  }

  isRankWithinOffset(rank1, rank2, offset) {
    const ranks = [
      "아이언",
      "브론즈",
      "실버",
      "골드",
      "플래티넘",
      "에메랄드",
      "다이아몬드",
    ];
    const romanToInt = {
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
    };

    const [rankName1, tierStr1] = rank1.split(" ");
    const [rankName2, tierStr2] = rank2.split(" ");

    const rankIndex1 = ranks.indexOf(rankName1);
    const rankIndex2 = ranks.indexOf(rankName2);

    const tier1 = romanToInt[tierStr1] || parseInt(tierStr1, 10);
    const tier2 = romanToInt[tierStr2] || parseInt(tierStr2, 10);

    if (rankIndex1 === rankIndex2 && tier1 === tier2) {
      return true;
    }

    if (Math.abs(rankIndex1 - rankIndex2) > offset) {
      return false;
    }

    if (rankIndex1 === rankIndex2) {
      return Math.abs(tier1 - tier2) <= offset;
    }

    return true;
  }

  displayMatchInfo(user1, user2) {
    console.log("\n=== 매칭된 사용자 정보 ===");
    console.log(`사용자 1:`);
    console.log(`- 계정: ${user1.account_ID}`);
    console.log(`- 포지션: ${user1.selectPosition}`);
    console.log(`- 현재 티어: ${user1.CurrentRank}`);
    console.log(`- 목표 티어: ${user1.targetRank}`);
    console.log(`사용자 2:`);
    console.log(`- 계정: ${user2.account_ID}`);
    console.log(`- 포지션: ${user2.selectPosition}`);
    console.log(`- 현재 티어: ${user2.CurrentRank}`);
    console.log(`- 목표 티어: ${user2.targetRank}`);
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = MatchMaking;
