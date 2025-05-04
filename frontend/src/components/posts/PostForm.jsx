import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

const PostForm = ({ addPost }) => {
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        content: '',
        pwd: '',
        file: null,
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFormData({ ...formData, file: e.target.files[0] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const data = new FormData(); //파일 업로드할 때는 FormData 객체에 담아 보낸다.
            data.append('name', formData.name);
            data.append('title', formData.title);
            data.append('content', formData.content);
            data.append('pwd', formData.pwd);
            if (formData.file) {
                data.append('file', formData.file);
            }

            const response = await axios.post('http://localhost:7777/api/posts', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert(JSON.stringify(response));
            const newPost = {
                id: response.data.id, // 서버에서 받은 ID
                name: formData.name,
                title: formData.title,
                content: formData.content,
                file: response.data.fileUrl, // 서버에서 파일 URL 받았다고 가정
            };

            addPost(newPost); // 부모 컴포넌트에 새로운 글 추가 요청
            setFormData({ name: '', title: '', content: '', file: null, pwd: '' }); // 입력값 초기화
            alert('폼 제출이 완료되었습니다!');
        } catch (error) {
            console.error('서버 요청 오류:', error);
            alert('서버 요청 중 오류가 발생했습니다.');
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group controlId="name">
                <Form.Label>Name</Form.Label>
                <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
            </Form.Group>
            <Form.Group controlId="title">
                <Form.Label>Title</Form.Label>
                <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required />
            </Form.Group>
            <Form.Group controlId="content">
                <Form.Label>Content</Form.Label>
                <Form.Control as="textarea" name="content" value={formData.content} onChange={handleChange} />
            </Form.Group>
            <Form.Group controlId="file">
                <Form.Label>File</Form.Label>
                <Form.Control type="file" name="file" onChange={handleFileChange} />
            </Form.Group>
            <Form.Group controlId="pwd">
                <Form.Label>password</Form.Label>
                <Form.Control type="password" name="pwd" value={formData.pwd} onChange={handleChange} required />
            </Form.Group>
            <Button variant="primary" type="submit">
                Submit
            </Button>
        </Form>
    );
};

export default PostForm;
