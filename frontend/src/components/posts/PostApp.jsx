import React, { useState } from 'react';
import PostList from './PostList';
import PostForm from './PostForm';

export default function PostApp() {
    const [postList, setPostList] = useState([
        { name: '홍길동', title: '어쩌구 저쩌구', content: 'Hello World', wdate: '2025-03-01' },
    ]); // postList 상태 더미데이터 추가

    const addPostHandler = (newPost) => {
        //alert(newPost.id + '/' + newPost.file);
        setPostList([newPost, ...postList]);
    };

    return (
        <div className="container">
            <div className="row my-4">
                <div className="col-md-8 offset-md-2 col-sm-10 offset-sm-1">
                    <h1 className="text-center">Posts</h1>
                    <PostForm addPost={addPostHandler} />
                </div>
            </div>
            <div className="row my-2">
                <div className="col-md-8 offset-md-2 col-sm-10 offset-sm-1">
                    <PostList posts={postList} />
                </div>
            </div>
        </div>
    );
}
