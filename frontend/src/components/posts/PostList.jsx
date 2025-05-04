import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PostList = ({ posts }) => {
    const [postList, setPostList] = useState(posts || []);
    const [page, setPage] = useState(0); //현재 페이지 0부터 시작
    const [size, setSize] = useState(3); //한 페이지당 보여줄 목록 개수
    const [totalPages, setTotalPages] = useState(0); //총 페이지 수
    const [totalCount, setTotalCount] = useState(0); //총 게시글 수

    useEffect(() => {
        fetchPostList();
        // if (posts && posts.length > 0) {
        //     setPostList(posts); //부모로부터 받은 posts로 상태 업데이트
        // } else {
        //     fetchPostList();
        // }
    }, [posts, page]);
    const fetchPostList = async () => {
        let url = `http://localhost:7777/api/posts`;
        try {
            const response = await axios.get(url, {
                params: { page, size },
            });
            // setPostList(response.data); 페이징 처리 안 할 때
            setPostList(response.data.data); //페이징 처리할 때 포스트글 내용을 data란 키 값으로 설정함함
            setTotalCount(response.data.totalCount);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            alert('error: ' + error.message);
        }
    };

    const blockSize = 2; //페이징 블럭
    const currentBlock = Math.floor(page / blockSize);
    const startPage = currentBlock * blockSize;
    const endPage = Math.min(startPage + blockSize, totalPages);

    return (
        <div className="post-list">
            {Array.isArray(postList) &&
                postList.length > 0 &&
                postList.map((post) => (
                    <div
                        key={post.id}
                        className="d-flex my-3 p-3"
                        style={{ backgroundColor: '#efefef', borderRadius: '10px' }}
                    >
                        <div className="flex-shrink-0" style={{ width: '25%' }}>
                            {post.fileName != null && (
                                <img
                                    src={`http://localhost:7777/uploads/${post.fileName}`}
                                    alt={post.file}
                                    style={{ width: '90%', borderRadius: '1em' }}
                                />
                            )}
                            {post.fileName == null && (
                                <img
                                    src={`http://localhost:7777/uploads/noimage.PNG`}
                                    alt={post.file}
                                    style={{ width: '90%', borderRadius: '1em' }}
                                />
                            )}
                        </div>
                        <div className="flex-grow-1 ms-3">
                            <h5>
                                {post.name}
                                <small className="text-muted">
                                    <i>Posted on {post.wdate}</i>
                                </small>
                            </h5>
                            <h2>{post.title}</h2>
                            <p>{post.content}</p>
                            <div className="d-flex justify-content-center">
                                <button className="btn btn-outline-primary mx-1">Edit</button>
                                <button className="btn btn-outline-danger">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            {/* 페이지 네비게이션 -----------------------*/}
            <div className="text-center">
                {/* 이전 블록 */}
                {startPage > 0 && (
                    <button className="btn btn-outline-primary" onClick={() => setPage(startPage - 1)}>
                        Prev
                    </button>
                )}
                {/* 페이지 번호 */}
                {Array.from({ length: endPage - startPage }, (_, i) => (
                    <button
                        className="btn btn-outline-primary"
                        key={startPage + i}
                        onClick={() => setPage(startPage + i)}
                    >
                        {startPage + i + 1}
                    </button>
                ))}
                {/* 다음 블록 */}
                {endPage < totalPages && (
                    <button className="btn btn-outline-primary" onClick={() => setPage(endPage + 1)}>
                        Next
                    </button>
                )}
            </div>
        </div>
    );
};

export default PostList;
