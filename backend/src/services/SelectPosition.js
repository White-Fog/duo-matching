/* SelectPosition.js는 선택한 포지션이다.
사용자 파라미터로서, 매치메이킹 페이지에서 사용자가 직접 원하는 포지션을 선택 가능하다.
사용자가 선택한 포지션을 매치메이킹 모듈에 전달하는 데, 이 때 매치메이킹되는 다른 사용자와는 포지션이 겹쳐서는 안 된다.
포지션은 탑, 정글, 미드, 원거리 딜러, 서포터 5 포지션이다. 
SelectPosition.js에는 사용자가 선택한 포지션만 입력받고, MatchMaking.js 모듈이 다른 사용자와 포지션이 겹치는지 확인하도록 전달해준다.


class SelectPosition {
  constructor(position) {
    const validPositions = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

    // 유효한 포지션인지 확인
    if (!validPositions.includes(position.toUpperCase())) {
      throw new Error(
        `유효하지 않은 포지션입니다: ${position}. 사용 가능한 포지션은 ${validPositions.join(
          ", "
        )}입니다.`
      );
    }

    this.position = position.toUpperCase(); // 포지션 저장
  }

  // 선택한 포지션 반환
  getPosition() {
    return this.position;
  }
}

module.exports = SelectPosition;
*/
