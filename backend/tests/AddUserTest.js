const axios = require("axios");
const readline = require("readline");
const riotAPI = require("../src/middlewares/riotAPI"); // Riot API 모듈 가져오기

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 한글로 티어 번역
const tierTranslation = {
  IRON: "아이언",
  BRONZE: "브론즈",
  SILVER: "실버",
  GOLD: "골드",
  PLATINUM: "플래티넘",
  DIAMOND: "다이아몬드",
  MASTER: "마스터",
  GRANDMASTER: "그랜드마스터",
  CHALLENGER: "챌린저",
};

// 로마 숫자를 아라비아 숫자로 변환
function convertRomanToArabic(rank) {
  const romanToArabic = {
    IV: "4",
    III: "3",
    II: "2",
    I: "1",
  };
  return romanToArabic[rank] || rank;
}

// 아라비아 숫자를 로마 숫자로 변환
function convertArabicToRoman(rank) {
  const arabicToRoman = {
    4: "IV",
    3: "III",
    2: "II",
    1: "I",
  };
  return arabicToRoman[rank] || rank;
}

// 입력값을 정규화하는 함수
function normalizeRankInput(rank) {
  return rank
    .toUpperCase() // 대소문자 통일
    .replace(/\d+/g, (match) => convertArabicToRoman(match)) // 숫자 → 로마 숫자로 변환
    .replace(/IV|III|II|I/g, (match) => convertRomanToArabic(match)) // 로마 숫자 → 숫자로 변환
    .trim(); // 공백 제거
}

// 목표 티어 계산 함수
function calculateTargetTiers(currentTier) {
  const higherTierKey =
    Object.keys(tierTranslation)[
      Object.keys(tierTranslation).indexOf(currentTier) + 1
    ];

  let targetOptions = [];

  if (currentTier === "다이아몬드" || currentTier === "DIAMOND") {
    // 다이아몬드 2, 1 유저가 마스터를 목표로 설정할 경우 마스터만 출력
    if (higherTierKey === "MASTER") {
      targetOptions.push("마스터"); // 마스터만 표시
      return targetOptions;
    }
  }

  if (higherTierKey) {
    targetOptions.push(`${tierTranslation[higherTierKey]} 4`);
    targetOptions.push(`${tierTranslation[higherTierKey]} 3`);
  }

  return targetOptions;
}

// 목표 티어 입력 함수
function askTargetRankInput(currentTier, targetOptions, callback) {
  // 챌린저, 마스터, 그랜드마스터 티어 체크
  const restrictedTiers = ["챌린저", "마스터", "그랜드마스터"];

  if (restrictedTiers.includes(currentTier)) {
    console.error(
      `당신의 티어는 ${currentTier}이기 때문에 개인/2인 랭크 게임에서 듀오를 할 수 없습니다.`
    );
    askToAddAnotherUser(); // 다른 유저 입력 요청
    return; // 함수 종료
  }

  rl.question(
    "목표 티어를 입력하세요 (위 옵션 중 하나 선택): ",
    (targetRankInput) => {
      const normalizedInput = targetRankInput.toUpperCase().trim();
      const normalizedOptions = targetOptions.map((option) =>
        option.toUpperCase().trim()
      );

      if (!normalizedOptions.includes(normalizedInput)) {
        console.error(
          `잘못된 목표 티어입니다. 설정 가능한 티어는: ${targetOptions.join(
            ", "
          )}`
        );
        askTargetRankInput(currentTier, targetOptions, callback); // 재입력 요청
        return;
      }

      console.log(`입력된 목표 티어: "${normalizedInput}"`);
      callback(normalizedInput);
    }
  );
}

// 사용자 포지션 입력 함수
function askPositionInput(callback) {
  const validPositions = ["TOP", "JUG", "MID", "AD", "SUP"]; // 유효한 포지션 목록

  rl.question(
    `사용자의 포지션(예: ${validPositions.join(", ")})을 입력하세요: `,
    (selectPosition) => {
      const normalizedPosition = selectPosition.toUpperCase().trim(); // 대소문자 통일 및 공백 제거

      // 입력값 검증
      if (!validPositions.includes(normalizedPosition)) {
        console.error(
          `잘못된 포지션입니다. 유효한 포지션은 다음 중 하나여야 합니다: ${validPositions.join(
            ", "
          )}`
        );
        askPositionInput(callback); // 재입력 요청
        return;
      }

      console.log(`입력된 포지션: "${normalizedPosition}"`);
      callback(normalizedPosition); // 유효한 포지션 입력 시 콜백 실행
    }
  );
}

// 사용자 정보를 입력하고 서버에 전송하는 함수
async function addUserToQueue() {
  rl.question("사용자 이름을 입력하세요: ", (username) => {
    rl.question(
      "사용자의 태그라인(예: KR1)을 입력하세요: ",
      async (tagLine) => {
        try {
          const summonerData = await riotAPI.getSummonerUidByName(
            username,
            tagLine
          );
          if (!summonerData || !summonerData.puuid) {
            console.error(
              "소환사 정보를 가져올 수 없습니다. 이름과 태그라인을 확인하세요."
            );
            askToAddAnotherUser(); // 다른 사용자 입력 요청
            return;
          }

          const rankData = await riotAPI.getUserInfoByUid(summonerData.puuid);
          const soloQueueRank = rankData.find(
            (entry) => entry.queueType === "RANKED_SOLO_5x5"
          );
          if (!soloQueueRank || !soloQueueRank.tier || !soloQueueRank.rank) {
            console.error("현재 티어 정보를 가져올 수 없습니다.");
            askToAddAnotherUser(); // 다른 사용자 입력 요청
            return;
          }

          const currentTier = soloQueueRank.tier;
          const currentRank = soloQueueRank.rank;
          const translatedTier = tierTranslation[currentTier] || currentTier;

          // 챌린저, 마스터, 그랜드마스터 티어 체크
          const restrictedTiers = ["챌린저", "마스터", "그랜드마스터"];
          if (restrictedTiers.includes(translatedTier)) {
            console.error(
              `당신의 티어는 ${translatedTier}이기 때문에 개인/2인 랭크 게임에서 듀오를 할 수 없습니다.`
            );
            askToAddAnotherUser(); // 다른 사용자 입력 요청
            return;
          }

          const targetOptions = calculateTargetTiers(currentTier);
          console.log(
            `현재 티어: ${translatedTier} ${convertRomanToArabic(currentRank)}`
          );
          console.log(
            `목표로 설정할 수 있는 티어는: ${targetOptions.join(", ")}`
          );

          askTargetRankInput(currentTier, targetOptions, (targetRankInput) => {
            askPositionInput((selectPosition) => {
              const user = {
                username,
                tagLine,
                CurrentRank: `${translatedTier} ${convertRomanToArabic(
                  currentRank
                )}`,
                targetRank: targetRankInput,
                selectPosition: selectPosition,
                enqueueTime: Date.now(),
                OPScore: Math.floor(Math.random() * 100) + 1,
              };

              console.log("서버로 전송하는 데이터:", user);

              axios
                .post("http://localhost:3000/add-user", user)
                .then((response) => {
                  console.log("서버 응답 데이터:", response.data);
                  askToAddAnotherUser();
                })
                .catch((error) => {
                  console.error("사용자 추가 중 오류:", error.message);
                  askToAddAnotherUser();
                });
            });
          });
        } catch (error) {
          console.error("Riot API 호출 중 오류 발생:", error.message);
          askToAddAnotherUser();
        }
      }
    );
  });
}

// 다른 사용자 추가 여부 확인 함수
function askToAddAnotherUser() {
  rl.question("다른 사용자를 추가하시겠습니까? (yes/no): ", (answer) => {
    if (answer.toLowerCase() === "yes") {
      addUserToQueue();
    } else {
      console.log("사용자 입력을 종료합니다.");
      rl.close();
    }
  });
}

// 프로그램 시작
addUserToQueue();
