import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';

const Admin = () => {
    const [members, setMembers] = useState([]);
    const [user, setUser] = useState({ id: '', name: '' });
    const { id } = user;

    // 데이터베이스에서 모든 회원 정보를 가져옴
    const fetchMembers = async () => {
        try {
            const response = await axios.get('http://localhost:7777/api/users');
            response.data.sort((a, b) => a.id - b.id);
            setMembers(response.data);
        } catch (error) {
            console.error('회원 정보를 가져오는 중 오류 발생:', error);
        }
    };
    // 컴포넌트가 마운트될 때 회원 정보를 가져옴
    useEffect(() => {
        fetchMembers();
    }, []);

    const onChange = (e) => {
        const { id, value } = e.target;
        setUser((prevUser) => ({ ...prevUser, [id]: value }));
    };
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            const userName = members.find((member) => member.id === parseInt(id, 10));
            console.log(userName.id);
            const response = await axios.delete(`http://localhost:7777/api/users/${userName.id}`);
            if (response.data.result === 'success') {
                alert(`${userName.name}님이 추방되었습니다.`);
                window.location.reload();
            } else {
                alert('회원을 찾지 못함.');
            }
        } catch (error) {
            alert('회원을 찾을 수 없음');
            console.error('회원을 찾을 수 없음: ', error);
        }

        setUser({ id: '', name: '' });
    };
    return (
        <div>
            <h2>관리자</h2>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>이름</th>
                        <th>이메일</th>
                        <th>가입 날짜</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((member) => (
                        <tr key={member.id}>
                            <td>{member.id}</td>
                            <td>{member.name}</td>
                            <td>{member.email}</td>
                            <td>{formatDate(member.indate)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div>
                <form onSubmit={onSubmit}>
                    <label htmlFor="userid">ID</label>
                    <input
                        type="text"
                        name="id"
                        id="id"
                        value={id}
                        onChange={onChange}
                        placeholder="아이디(숫자) 입력 후 버튼 클릭 시 회원 추방"
                        className="form-control"
                    ></input>
                    <Button variant="outline-danger" type="submit">
                        추방
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default Admin;
