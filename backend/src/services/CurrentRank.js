/*
CurrentRank.js는 리그 오브 레전드 듀오 메치메이킹 시스템에서 사용자 자신의 랭크를 확인하는 간단한 시스템 파라미터 모듈이다.
riotAPI.js에서 사용자 UID를 통해 사용자의 랭크를 파악하는 시스템으로, 랭크와 티어는 구분하도록 한다
최종적으로 확인 된 랭크와 티어는 MatchMaking.js에게 전달하게 된다.
riotAPI.js에서 x 는 티어, y는 랭크를 표시해 준다.
 * CurrentRank.js
 *
 * 리그 오브 레전드 듀오 메치메이킹 시스템에서 사용자 자신의 랭크 정보를 확인하는 모듈입니다.
 * 이 모듈은 Riot API를 통해 사용자 UID로 랭크 데이터를 조회하며, 반환 데이터에서 티어와 랭크(세부 랭크)를 분리하여 반환합니다.
 * 만약 API 응답이 배열 형태라면 RANKED_SOLO_5x5 정보를 우선적으로 선택하고, 없으면 첫 번째 항목을 사용합니다.
 *
 * 개선 사항:
 *   - API 응답 데이터가 배열일 경우를 고려하여 올바른 엔트리를 선택
 *   - 응답 데이터의 유효성을 검증하여 누락된 데이터에 대해 에러 처리
 *   - 간단한 캐싱 로직을 추가하여 불필요한 API 호출을 줄임 (TTL: 5분)
 *
 * @module CurrentRank
 */

const riotAPI = require("../middlewares/riotAPI");

class CurrentRank {
  /**
   * @param {string} userUID - 리그 오브 레전드 사용자 UID
   */
  constructor(userUID) {
    this.userUID = userUID;
    // 간단한 캐싱: 5분 동안 캐싱된 랭크 정보를 재사용
    this.cache = null;
    this.cacheTime = null;
    this.cacheTTL = 300000; // 300,000ms = 5분
  }

  /**
   * 사용자 UID를 통해 랭크 정보를 가져옵니다.
   * 캐시된 정보가 유효하면 캐시된 데이터를 반환합니다.
   *
   * @returns {Promise<{rank: string, tier: string}>} - rank에는 티어(예: Gold, Silver), tier에는 세부 랭크 정보(예: I, II, III, IV)가 포함됩니다.
   * @throws {Error} 랭크 정보를 가져올 수 없거나 필수 정보가 누락된 경우 에러를 던집니다.
   */
  async fetchRank() {
    const now = Date.now();
    if (this.cache && this.cacheTime && now - this.cacheTime < this.cacheTTL) {
      return this.cache;
    }

    try {
      const userData = await riotAPI.getUserInfoByUid(this.userUID);

      if (!userData || (Array.isArray(userData) && userData.length === 0)) {
        throw new Error("사용자의 랭크 데이터가 존재하지 않습니다.");
      }

      // Riot API의 반환 데이터가 배열일 경우, RANKED_SOLO_5x5 정보를 우선 선택합니다.
      // 만약 단일 객체가 반환된다면 그대로 사용합니다.
      const soloEntry = Array.isArray(userData)
        ? userData.find((entry) => entry.queueType === "RANKED_SOLO_5x5") ||
          userData[0]
        : userData;

      // 필수 정보 유효성 검사
      if (!soloEntry || !soloEntry.tier || !soloEntry.rank) {
        throw new Error("필요한 랭크 정보가 누락되었습니다.");
      }

      const result = {
        // Riot API 문서에 따르면 보통 tier는 "Gold", "Silver" 등으로, rank는 "I", "II", "III", "IV" 등으로 나타납니다.
        rank: soloEntry.tier, // 예: Gold, Silver
        tier: soloEntry.rank, // 예: I, II, III, IV
      };

      // 캐시 업데이트
      this.cache = result;
      this.cacheTime = now;

      return result;
    } catch (error) {
      console.error(`CurrentRank.fetchRank 에러: ${error.message}`);
      throw new Error("Rank fetch error");
    }
  }
}

module.exports = CurrentRank;
