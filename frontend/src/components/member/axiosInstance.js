// axiosInstance.js
import axios from 'axios';
import { checkTokenExpiration, refreshAccessToken } from './authUtil';

//axios 인스턴스 생성
const axiosInstance = axios.create();

//요청 인터셉터(interceptor) 설정
//요청(request) 헤더에 'Authorization': 'Bearer accessToken값'
axiosInstance.interceptors.request.use(
    async (config) => {
        const accessToken = sessionStorage.getItem('accessToken');
        console.log('요청 인터셉터 실행중 ... accessToken: ' + accessToken);
        if (accessToken) {
            //유효한 토큰인지 체크하는 로직
            if (checkTokenExpiration(accessToken)) {
                console.log('요청 인터셉터...accessToken유효시간 지난 경우...');

                //유효시간이 지났다면
                //리프레시 토큰을 서버에 보내서 새로운 accessToken을 발급받고 요청 헤더에 넣어준다
                const newAccessToken = await refreshAccessToken(); //
                console.log('새 억세스토큰 발급 받음');

                if (newAccessToken) {
                    //새토큰을 받았다면
                    sessionStorage.setItem('accessToken', newAccessToken);
                    config.headers['Authorization'] = `Bearer ${accessToken}`;
                    return config;
                }
                //////////////////////////////
            } //if----
            //요청 헤더에 authorization 키값으로 토큰 저장
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        } //if-----
        return config;
    },
    (error) => Promise.reject(error)
);

//응답 인터셉터(interceptor)  설정
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        console.log('응답 인터셉터에서 받은 응답 상태코드(status): ', status);
        if (status === 400) {
            alert(error.response.data.message); //로그인을 하세요
            window.location.href = '/';
            return Promise.reject(error);
        }

        if (status === 401) {
            //인증받지 않은 사용자인 경우
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const newAccessToken = await refreshAccessToken();
                    if (newAccessToken) {
                        sessionStorage.setItem('accessToken', newAccessToken);
                        error.config.headers['Authorization'] = `Bearer ${newAccessToken}`;
                        return axiosInstance(error.config); //원래 요청 재시도
                    }
                } catch (err) {
                    //리프레시 토큰도 유효하지 않은 경우
                    //=>로그아웃 처리
                    //??????
                }
            }
            localStorage.removeItem('refreshToken');
            sessionStorage.removeItem('accessToken');
            window.location.href = '/';
            return Promise.reject(error);
        }
        if (status === 403) {
            //Forbidden
            alert('접근 권한이 없습니다');
            window.location.href = '/';
            return Promise.reject(error);
        }
    }
);

export default axiosInstance;
