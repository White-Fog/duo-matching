/*TargetRank.js는 사용자 파라미터로 매치메이킹 웹사이트에서 선택이 가능하다. 
TargetRank.js는 사용자의 현재 랭크 티어 기준에서 목표하고자 하는 티어를 설정해 MatchMaking.js에 전달해주는 역할을 한다.
랭크와 티어는 다르게 구분짓는다. 랭크는 하위권부터 아이언, 브론즈, 실버, 골드, 플래티넘, 에메랄드, 다이아몬드, 마스터, 그랜드마스터, 챌린저
로 이루어져 있다. 여기서 마스터, 그랜드마스터, 챌린저는 듀오 랭크 게임을 구성할 수 없다.
티어는 랭크에서 좀 더 확대한 구간으로, 4부터 1까지 존재한다.(마스터, 그랜드마스터, 챌린저는 구분짓지 않는다.)
(4에서 3, 3에서 2, 2에서 1로 올라가는 형태이고, 1에서는 한 단계 상위 랭크의 티어 4로 올라가게 된다.)
(예: 내가 골드 1에서 랭크를 한 단계 올리면 플래티넘 4가 되고, 골드 4에서 떨어지게 되면 실버 4가 된다. )
사용자가 선택할 수 있는 목표 랭크는 자신의 랭크 티어 에서 2단계 위 까지 설정 가능하다. (다이아몬드 4라면 다이아몬드 2 까지 설정 가능)


// TargetRank.js

// 랭크와 티어 데이터 정의
const RANKS = [
  "아이언",
  "브론즈",
  "실버",
  "골드",
  "플래티넘",
  "에메랄드",
  "다이아몬드",
  "마스터", // 듀오 랭크 게임 제한 시작
  "그랜드마스터",
  "챌린저",
];

// 현재 랭크와 티어로 목표 랭크 티어 계산 및 분류
const calculateTargetTiers = (currentRank, currentTier) => {
  const rankIndex = RANKS.indexOf(currentRank);
  if (rankIndex === -1) {
    throw new Error(`Invalid rank: ${currentRank}`);
  }

  const targetRankTiers = [];
  let remainingTiers = 2; // 목표 랭크는 최대 2개만 표시

  // 같은 랭크 내에서 상위 티어 추가
  for (let tier = currentTier - 1; tier >= 1 && remainingTiers > 0; tier--) {
    targetRankTiers.push(`${currentRank} ${tier}`);
    remainingTiers--;
  }

  // 상위 랭크의 티어 추가 (최대 2개까지만)
  for (let i = rankIndex + 1; i < RANKS.length && remainingTiers > 0; i++) {
    for (let tier = 4; tier >= 1 && remainingTiers > 0; tier--) {
      targetRankTiers.push(`${RANKS[i]} ${tier}`);
      remainingTiers--;
    }
  }

  return {
    currentRank: `${currentRank} ${currentTier}`, // 현재 위치해 있는 랭크는 1개만
    targetRankTiers,
  };
};

// 사용자의 현재 랭크와 티어를 입력받아 목표 랭크 옵션을 분리해서 제공
const getUserTargetRankOptions = (currentRank, currentTier) => {
  try {
    const { currentRank, targetRankTiers } = calculateTargetTiers(
      currentRank,
      currentTier
    );
    console.log(`사용자가 현재 위치해 있는 랭크:`, currentRank);
    console.log(`사용자가 선택 가능한 목표 랭크:`, targetRankTiers);
    return { currentRank, targetRankTiers };
  } catch (error) {
    console.error("Error calculating target ranks:", error.message);
    return { currentRank: null, targetRankTiers: [] };
  }
};

// MatchMaking.js로 전달할 데이터
const selectTargetRank = (currentRank, currentTier, selectedTarget) => {
  const { targetRankTiers } = calculateTargetTiers(currentRank, currentTier);
  if (!targetRankTiers.includes(selectedTarget)) {
    throw new Error("Invalid target rank selected.");
  }
  console.log(`선택된 목표 랭크: ${selectedTarget}`);
  return { selectedTarget }; // MatchMaking.js로 전달
};

// -------------------
// 테스트
// -------------------

// 사용자 현재 랭크와 티어
const currentRank = "아이언"; // 예: 사용자의 현재 랭크
const currentTier = 4; // 예: 사용자의 현재 티어 (1 ~ 4)

// 목표 랭크 옵션 제공
const targetOptions = getUserTargetRankOptions(currentRank, currentTier);

// 예제: 사용자가 목표 랭크로 '아이언 3' 선택
const selectedRank = "아이언 3";
try {
  const matchData = selectTargetRank(currentRank, currentTier, selectedRank);
  console.log("MatchMaking.js에 전달할 데이터:", matchData);
} catch (error) {
  console.error(error.message);
}
*/
