//src/context/AuthContext.jsx
//
//index.js에서 아래와 같이
//<AuthProvider><App/></AuthProvider>
import { useState, createContext } from 'react';

export const AuthContext = createContext({ id: '', name: '', email: '' });

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    //로그인에 성공하면 loginAuthUser(authUser)를 호출
    const loginAuthUser = (userInfo) => {
        console.log(userInfo.name);
        setUser(userInfo);
    };

    //로그아웃시 호출 logoutUser()
    const logoutUser = () => {
        setUser(null);
    };
    return <AuthContext.Provider value={{ user, loginAuthUser, logoutUser }}>{children}</AuthContext.Provider>;
};
