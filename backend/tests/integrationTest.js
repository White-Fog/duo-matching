const MatchMaking = require("../src/routes/MatchMaking"); // MatchMaking 모듈 가져오기
const readline = require("readline");
const riotAPI = require("../src/middlewares/riotAPI"); // Riot API 모듈 가져오기

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 아라비아 숫자를 로마 숫자로 변환하는 함수
function convertToRomanNumber(arabicNumber) {
  const romanMap = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
  };
  return romanMap[arabicNumber] || arabicNumber; // 해당 숫자가 없으면 그대로 반환
}

async function getUserInput(matchmaking) {
  rl.question("사용자 이름을 입력하세요: ", async (username) => {
    rl.question(
      "사용자의 태그라인(예: KR1)을 입력하세요: ",
      async (tagLine) => {
        // Riot API를 통해 사용자 현재 티어 가져오기
        try {
          const summonerData = await riotAPI.getSummonerUidByName(
            username,
            tagLine
          );
          if (!summonerData || !summonerData.puuid) {
            console.error(
              "사용자 데이터를 가져올 수 없습니다. 이름과 태그라인을 확인하세요."
            );
            rl.close();
            return;
          }

          const rankData = await riotAPI.getUserInfoByUid(summonerData.puuid);
          const soloEntry =
            rankData.find((entry) => entry.queueType === "RANKED_SOLO_5x5") ||
            rankData[0];

          let currentRank = "정보 없음";
          if (soloEntry && soloEntry.tier && soloEntry.rank) {
            currentRank = `${soloEntry.tier} ${soloEntry.rank}`;
            console.log(`현재 티어: ${currentRank}`);
          } else {
            console.log("현재 티어 정보를 가져올 수 없습니다.");
          }

          // 사용자 목표 티어 설정
          rl.question(
            "사용자의 목표 티어(예: 골드 1)를 입력하세요: ",
            (targetRankInput) => {
              rl.question(
                "사용자의 포지션(예: MID, TOP 등)을 입력하세요: ",
                (selectPosition) => {
                  // 아라비아 숫자를 로마 숫자로 변환
                  const [targetTier, targetArabic] = targetRankInput.split(" ");
                  const targetRoman = convertToRomanNumber(
                    parseInt(targetArabic, 10)
                  );
                  const targetRank = `${targetTier} ${targetRoman}`;

                  const user = {
                    username,
                    tagLine,
                    CurrentRank: currentRank,
                    TargetRank: targetRank,
                    SelectPosition: selectPosition,
                    enqueueTime: Date.now(),
                    OPScore: Math.floor(Math.random() * 100) + 1, // 테스트용 OPScore 생성
                  };

                  matchmaking.addUserToQueue(user);
                  console.log(`${user.username}가 큐에 추가되었습니다!`);
                  rl.question(
                    "다른 사용자를 추가하시겠습니까? (yes/no): ",
                    (answer) => {
                      if (answer.toLowerCase() === "yes") {
                        getUserInput(matchmaking); // 다음 사용자 입력
                      } else {
                        rl.close();
                        console.log("매칭을 시작합니다...");
                        matchmaking.startMatchMaking(); // 매칭 알고리즘 실행
                      }
                    }
                  );
                }
              );
            }
          );
        } catch (error) {
          console.error("Riot API 호출 중 오류가 발생했습니다:", error.message);
          rl.close();
        }
      }
    );
  });
}

async function runIntegrationTest() {
  const matchmaking = new MatchMaking();
  console.log("MatchMaking 테스트가 시작되었습니다...");
  getUserInput(matchmaking);
}

runIntegrationTest();
