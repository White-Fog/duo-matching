/*OPScore.js 는  소환사 지표를 기준으로 게임 내 활약 정도를 추정하는 평가 시스템이며, 
게임 내 활약 정도에 따라 0점부터 100점까지 점수가 주어진다. 
OP 스코어에는 크게 5가지 중요한 요소가 들어간다.
1번부터 4번까지는 최근 5경기에 대해서 평균으로 점수를 보여준다.
1. K/D/A (kill /death / assist) : 최근 5경기에서 소환사가 게임 내에서 얼마나 승리에 기여했는지 보여주는 것으로,
이 점수는 (Kill + Assist / death)로 계산한다.
2. CS (Creep Score) : 최근 5경기에서 소환사가 게임에서 획득한 미니언, 중립 몬스터 처치 수로, CS가 높을수록 많은 양의 골드를 획득했다는 것을
보여주는 스코어이다.
3. 골드 스코어 : 최근 5경기에서 소환사가 획득한 골드를 점수로 표현한 것이다.
4. 시야 점수 : Vision Score로, 최근 5경기에서  와드를 통해 상대의 시야를 얻거나, 렌즈, 제어 와드를 통해 얼마나 많은 수의 와드를 
지웠냐에 따라 점수를 얻는다.
5. 승률 : 최근 게임 5판의 경기를 이겼는지, 졌는지를 통해 퍼센트로 수치화한다. 


5가지의 요소에 적당한 가중치를 통하여 최대 100점까지 환산해 OP 스코어로 매겨지고, 매겨진 OP 스코어는 매치메이킹 모듈에 전달된다.
사용되는 API 정보는 다음과 같다.
1. kill = kills
   death = deaths
   assist = assists
2. cs : totalMinionskilled
3. 골드 스코어 : goldearned
*/

class OPScoreCalculator {
  constructor(games) {
    this.games = games;
    this.playedtime = 0;
    this.games.forEach((game) => {
      this.playedtime += game.playedtime / 60; // 각 게임의 플레이 시간을 저장합니다.
    });

    //사용자의 최근 5경기 데이터를 담고 있는 배열입니다. 각 요소는 개별 게임의 정보를 나타냅니다.
    // 각 게임 데이터에는 kills, deaths, assists, totalMinionsKilled, goldEarned, visionScore, win 등의 필드가 포함됩니다.
  }
  //game.length 게임 횟수
  //gameInfo['info']['participants'][null]['challenges']['kda']
  calculateKDA() {
    let totalKDA = 0;
    this.games.forEach((game) => {
      totalKDA += game.kda;
    });
    return totalKDA / this.games.length;
  }
  //gameInfo['info']['participants'][null]['neutralMinionsKilled'] 중립 CS
  //gameInfo['info']['participants'][null]['totalMinionsKilled'] 적군 CS
  calculateCS() {
    let totalCS = 0;
    this.games.forEach((game) => {
      totalCS += game.totalMinionsKilled;
      totalCS += game.neutralMinionsKilled;
    });
    return totalCS / this.playedtime;
  }
  //gameInfo['info']['participants'][null]['goldEarned']
  calculateGold() {
    let totalGold = 0;
    this.games.forEach((game) => {
      totalGold += game.goldEarned;
    });
    return totalGold / this.playedtime;
  }
  //gameInfo['info']['participants'][null]['visionScore']
  calculateVisionScore() {
    let totalVision = 0;
    this.games.forEach((game) => {
      totalVision += game.visionScore;
    });
    return totalVision / this.playedtime;
  }
  //gameInfo['info']['participants'][null]['win']
  calculateWinRate() {
    let totalWins = 0;
    this.games.forEach((game) => {
      if (game.win) totalWins += 1;
    });
    return (totalWins / this.games.length) * 100;
  }

  calculateOPScore() {
    const kdaWeight = 10;
    const csWeight = 20;
    const goldWeight = 10;
    const visionWeight = 20;
    const winRateWeight = 0.2;

    const opScore =
      (Math.log(this.calculateKDA() + 1) / Math.log(3)) * kdaWeight +
      (1 / (1 + Math.exp(-0.3 * this.calculateCS()))) * csWeight +
      (this.calculateGold() / 300) * goldWeight +
      (1 / (1 + Math.exp(1 - 2 * this.calculateVisionScore()))) * visionWeight +
      this.calculateWinRate() * winRateWeight;

    return opScore;
  }
}

// OPScore 계산 함수 내보내기
module.exports = OPScoreCalculator;
