import axios from 'axios'; //사용자 인증이 필요없는 api 요청시 사용
import axiosInstance from './axiosInstance'; //사용자 인증이 필요한 요청시 사용

//authUtil.js
//토큰이 유효한지 여부를 체크해서 유효하지 않다면 true를 반환하는 함수
export const checkTokenExpiration = (token) => {
    //header.payload.signature
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expTime = payload.exp * 1000; //exp 초단위
    let isInValid = expTime < Date.now(); //accessToken의 만료시간이 지났는지 여부를 체크
    // 1시  < 2시 ==> 유효시간이 지난 경우 true반환, 아직 남은 경우는 false반환
    return isInValid;
};

//리프레시 토큰을 가지고 서버에 요청을 보내는 함수
export const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
        //서버에 리프레시 토큰을 보내서 검증을 받자==>검증에 통과하면 새로운 accessToken을 받는다
        let url = `http://localhost:7777/api/auth/refresh`;
        try {
            const response = await axiosInstance.post(url, { refreshToken });
            const newAccessToken = response.data;
            return newAccessToken;
        } catch (error) {
            console.error('refresh token error: ', error);
            return null;
        }
    }
    console.log('refreshToken  없음');
    return null;
};

//브라우저 새로고침시 로그인 풀이는 문제 해결 위해 useEffect에서
//accessToken으로 사용자 정보를 가져오는 메서드
export const getAuthenticUserInfo = () => {
    let url = `http://localhost:7777/api/auth/user`;
    const accessToken = sessionStorage.getItem('accessToken');
    if (accessToken) {
        axios
            .get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            .then((response) => {
                const { id, email, name } = response.data;
                const authUser = { id, name, email };
                console.log('authUser: ', authUser);

                return authUser;
            })
            .catch((error) => {
                alert('error [getAuthenticUserInfo 에서 에러] ' + error);
                console.error(error);
                sessionStorage.removeItem('accessToken');
                return null;
            });
    }
};
