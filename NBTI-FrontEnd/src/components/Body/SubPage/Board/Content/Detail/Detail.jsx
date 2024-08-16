import styles from "./Detail.module.css";
import { useEffect, useState, useRef } from "react";
import { useBoardStore } from "../../../../../../store/store";
import axios from "axios";
import { host } from "../../../../../../config/config";
import image from "../../../../../../images/user.jpg";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import BoardEditor from "../../../../BoardEditor/BoardEditor";
import Swal from "sweetalert2";
import SweetAlert from "../../../../../../function/SweetAlert";

export const Detail = () => {
  const navi = useNavigate();

  const { boardSeq, boardType } = useBoardStore();
  const [detail, setDetail] = useState({}); // 게시글의 detail 정보
  const [board, setBoard] = useState({
    title: "",
    contents: "",
    board_code: 1,
  });

  const [replyContents, setReplyContents] = useState("");
  const [reply, setReply] = useState([]);
  const inputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null); // 로그인된 사용자 정보 상태
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [isLiked, setIsLiked] = useState({}); // 좋아요 상태를 객체로 저장
  const [likesCount, setLikesCount] = useState({}); // 댓글별 좋아요 개수
  // const [like, setLike] = useState([0, 0, 0]); // 댓글별 좋아요 개수

  // 게시판 코드
  let code = 1;
  if (boardType === "자유") code = 1;
  else if (boardType === "공지") code = 2;
  else if (boardType === "문의") code = 3;

  // 게시글 날짜 타입 변경
  const date = new Date(detail.write_date);
  const currentDate = !isNaN(date)
    ? format(date, "yyyy-MM-dd HH:mm")
    : "Invalid Date";

  // 게시글 출력
  useEffect(() => {
    if (boardSeq === -1) navi("/board"); // detail 화면에서 f5 -> 목록으로 이동
    if (boardSeq !== -1) {
      axios.get(`${host}/board/${boardSeq}/${code}`).then((resp) => {
        setDetail(resp.data); // 취소 시 원본 데이터
        setBoard(resp.data);
      });

      // 북마크 상태 확인
      axios.get(`${host}/bookmark/${boardSeq}`).then((resp) => {
        console.log("북마크 ", resp.data);
        setIsBookmarked(resp.data);
      });
    }

    // 로그인 한 사용자 정보
    axios.get(`${host}/members`).then((resp) => {
      setCurrentUser(resp.data);
    });

    // 외부 스타일시트를 동적으로 추가
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link); // 언마운트될 때 스타일시트를 제거
    };
  }, []);

  /** ================[ 삭 제 ]============= */
  const handleDelBtn = () => {
    if (boardSeq !== -1) {
      axios.delete(`${host}/board/${detail.seq}`).then((resp) => {
        navi("/board/free");
      });
    }
  };

  /** ================[ 수 정 ]============= */
  const [isEditing, setIsEditing] = useState(false);

  // 수정 click
  const handleEditBtn = () => {
    setIsEditing(true);
  };

  // 저장 click
  const handleSaveBtn = () => {
    axios.put(`${host}/board`, board).then((resp) => {
      setDetail(board);
      setIsEditing(false);
    });
  };

  // 취소 click
  const handleCancelBtn = () => {
    setIsEditing(false);
    setBoard((prev) => {
      return { ...prev, title: detail.title, contents: detail.contents };
    });
  };

  // 북마크 추가
  const handleBookmarkAdd = (seq) => {
    setIsBookmarked(!isBookmarked);
    axios.post(`${host}/bookmark/insert`, { board_seq: seq }).then((resp) => {
      if (resp.data === 1) {
        Swal.fire({
          icon: "success",
          title: "북마크",
          text: "중요 게시글에 추가되었습니다.",
        });
      }
    });
  };

  // 북마크 해제
  const handleBookmarkRemove = (seq) => {
    setIsBookmarked(!isBookmarked);
    axios.delete(`${host}/bookmark/delete/${seq}`).then((resp) => {
      console.log("삭제", resp.data);
      if (resp.data > 0) {
        Swal.fire({
          icon: "error",
          title: "북마크",
          text: "중요 게시글에 삭제되었습니다.",
        });
      }
    });
  };

  // ==========[댓 글]==========
  const handleInputReply = (e) => {
    const htmlContent = e.target.innerHTML;
    setReplyContents(htmlContent);
  };

  const [change, setChange] = useState(false);
  // 댓글 입력 및 추가
  const handleReplyAdd = () => {
    const requestBody = {
      board_seq: boardSeq,
      board_code: code,
      contents: replyContents,
    };

    axios.post(`${host}/reply`, requestBody).then((resp) => {
      if (resp.data !== "") {
        setChange((prev) => !prev);

        // setReply((prev) => {
        //   if (prev.length > 0) {
        //     return [resp.data, ...prev];
        //   }
        //   return [resp.data];
        // });

        if (inputRef.current) {
          inputRef.current.innerHTML = ""; // div 내용 비우기
          setReplyContents("");
        }
      }
    });
  };

  // (좋아요 포함) 댓글 전체 출력
  useEffect(() => {
    axios.get(`${host}/reply/${boardSeq}/${code}`).then((resp) => {
      const { replies, likes } = resp.data;
      setReply(replies); // 좋아요 count 포함된 댓글 배열
      setIsLiked(likes); // 좋아요 true / false 상태

      // 좋아요 상태 가져오기
      replies.forEach((reply) => {
        axios.get(`${host}/likes/status/${reply.seq}`).then((resp) => {
          // boolean 반환
          // 좋아요 상태의 prev에 새롭게 true / false를 업데이트
          setIsLiked((prev) => ({ ...prev, [reply.seq]: resp.data }));
        });
      });
    });
  }, [boardSeq, code, change]);

  // 댓글 삭제
  const handleDelReplyBtn = (replySeq) => {
    axios.delete(`${host}/reply/${replySeq}`).then((resp) => {
      setReply((prev) => {
        return prev.filter((item) => item.seq !== replySeq);
      });
    });
  };

  // 댓글 좋아요 클릭
  const handleLikekAdd = (seq, i) => {
    console.log("조아요..", seq);
    setIsLiked((prev) => ({ ...prev, [seq]: true })); // 상태를 true로 변환

    axios.post(`${host}/likes/insert`, { reply_seq: seq }).then((resp) => {
      if (resp.data === 1) console.log("조아요 성공");
    });

    setReply((prev) => {
      return prev.map((item, index) => {
        if (index === i) {
          return { ...item, count: item.count + 1 };
        }
        return item;
      });
    });
  };

  // 댓글 좋아요 해제
  const handleLikeRemove = (seq, i) => {
    setIsLiked((prev) => ({ ...prev, [seq]: false }));

    axios.delete(`${host}/likes/delete/${seq}`).then((resp) => {
      if (resp.data === 1) console.log("조아요 취소");

      setReply((prev) => {
        return prev.map((item, index) => {
          if (index === i) {
            return { ...item, count: item.count - 1 };
          }
          return { ...item };
        });
      });
    });
  };

  //======================================================================================

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <div className={styles.left}>
          <i
            className="fa-regular fa-star fa-lg"
            onClick={() => {
              handleBookmarkAdd(detail.seq);
            }}
            style={{ display: isBookmarked ? "none" : "inline" }}
          ></i>
          <i
            className="fa-solid fa-star fa-lg"
            onClick={() => {
              handleBookmarkRemove(detail.seq);
            }}
            style={{ display: isBookmarked ? "inline" : "none" }}
          ></i>
        </div>
        <div className={styles.right}>
          {currentUser && detail.member_id === currentUser.id && !isEditing ? (
            <>
              <p onClick={handleEditBtn}>수정</p>
              <p
                onClick={() =>
                  SweetAlert(
                    "warning",
                    "게시판",
                    "정말 삭제하시겠습니까?",
                    handleDelBtn
                  )
                }
              >
                삭제
              </p>
            </>
          ) : null}
        </div>
        {isEditing && (
          <div className={styles.editButtons}>
            <p onClick={handleSaveBtn}>저장</p>
            <p onClick={handleCancelBtn}>취소</p>
          </div>
        )}
      </div>
      <div className={styles.title}>
        <div className={styles.image}>
          <img src={image} alt="" />
        </div>
        <div className={styles.titleWriter}>
          <div className={styles.innerTitle}>
            {isEditing ? (
              <input
                type="text"
                value={board.title}
                onChange={(e) =>
                  setBoard((prev) => {
                    return { ...prev, title: e.target.value };
                  })
                }
                placeholder="제목을 입력하세요."
                className={styles.editTitle}
              />
            ) : (
              <p>{detail.title}</p>
            )}
          </div>
          <div className={styles.innerWriter}>
            <p>{detail.name}</p>
          </div>
        </div>
        <div className={styles.writeDate}>
          <span>{currentDate}</span>
        </div>
      </div>
      <div className={styles.content}>
        {isEditing ? (
          <BoardEditor setBoard={setBoard} contents={board.contents} />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: detail.contents }}></div>
        )}
      </div>

      {/* --------------[ 댓글 작성 ]------------ */}
      <div className={styles.reply}>
        <div className={styles.count}>
          <span>{reply.length}</span>
          <span>개의 댓글</span>
        </div>
        <div className={styles.replyInput}>
          <img src={image} alt="" />
          <div
            ref={inputRef} // ref 설정
            className={styles.inputText}
            contentEditable="true"
            onInput={handleInputReply}
            suppressContentEditableWarning={true}
          />
          <button onClick={handleReplyAdd}>등록</button>
        </div>

        {/* --------------[ 댓글 출력 ]------------ */}
        <div className={styles.replyOutputWrap}>
          {reply.map((item, i) => {
            // 댓글 날짜 타입 변경
            const reply_date = new Date(item.write_date);
            const reply_currentDate = !isNaN(reply_date)
              ? format(reply_date, "yyyy-MM-dd HH:mm:ss")
              : "Invalid Date";

            return (
              <div className={styles.replyOutput} key={i}>
                <img src={image} alt="" />
                <div>
                  <div className={styles.writer_writeDate}>
                    <span>{item.name}</span>
                    <span>{reply_currentDate}</span>
                  </div>
                  <div
                    className={styles.replyContent}
                    dangerouslySetInnerHTML={{ __html: item.contents }}
                  />
                </div>
                <div className={styles.likes}>
                  <i
                    className="fa-regular fa-heart fa-lg"
                    onClick={() => {
                      handleLikekAdd(item.seq, i);
                    }}
                    style={{ display: isLiked[item.seq] ? "none" : "inline" }}
                  />
                  <i
                    className="fa-solid fa-heart fa-lg"
                    onClick={() => {
                      handleLikeRemove(item.seq, i);
                    }}
                    style={{ display: isLiked[item.seq] ? "inline" : "none" }}
                  />
                  {/* <p>5</p> */}
                  <p>{item.count}</p>
                </div>
                {currentUser && currentUser.id === item.member_id && (
                  <button
                    onClick={() => {
                      handleDelReplyBtn(item.seq);
                    }}
                  >
                    {" "}
                    X{" "}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
