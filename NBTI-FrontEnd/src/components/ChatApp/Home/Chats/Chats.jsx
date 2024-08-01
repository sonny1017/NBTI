import styles from './Chats.module.css';
import { useAuthStore } from '../../../../store/store';
import { ChatsContext } from './../../../../Context/ChatsContext';
import axios from 'axios';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { host } from './../../../../config/config';
import avatar from '../../../../images/user.jpg';
import ChatsModal from './ChatsModal/ChatsModal';
import { useCheckList } from './../../../../store/store';
import { format } from 'date-fns';
const Chats = () => {
    const { loginID } = useAuthStore();
    const { setChatSeq, onMessage } = useCheckList();
    const { setChatNavi } = useContext(ChatsContext);
    const [group_chats, setGroup_chats] = useState([]);
    const [alarm,setAlarm] =useState();

    const [modalDisplay, setModalDisplay] = useState(null);
    const modalRef = useRef([]);

    useEffect(() => {
        axios.get(`${host}/group_chat`).then((resp) => {
            if (resp != null) {
                if (resp.data !== '') {
                     console.log(resp.data);
                    setGroup_chats(resp.data);
                }
                else {
                    setGroup_chats([]);
                }
            }

        })
    }, [onMessage])

    const handleRightClick = (index) => (e) => {
        const { clientX: x, clientY: y } = e;
        console.log(`${x}:${y}`);
        e.preventDefault();
        setModalDisplay((prev) => {
            if (prev != null) {
                prev.style.display = 'none'
            }
            modalRef.current[index].style.display = 'flex';
            modalRef.current[index].style.top = (y) + 'px';
            modalRef.current[index].style.left = (x) + 'px';
            return modalRef.current[index];
        });
    };

    const handleClick = () => {
        setModalDisplay((prev) => {
            if (prev != null) {
                prev.style.display = 'none'
            }
            return null;
        })
    }

    const handleDoubleClick = (seq) => () => {
        if (loginID === null) {
            setChatNavi('');
        }
        else {

            setChatNavi((prev) => {
                setChatSeq(seq);
                return 'chat';
            });
        }
    }

    return (
        <div className={styles.container} onClick={handleClick}>
            {
                group_chats.map((item, index) => {
                    let formattedTimestamp = '';
                    if (item.dto != null) {
                        formattedTimestamp = format(new Date(item.dto.write_date), 'yyyy-MM-dd');
                    }
                    return (
                        <React.Fragment key={index}>
                            <div className={styles.room} onContextMenu={handleRightClick(index)} onDoubleClick={handleDoubleClick(item.seq)}>
                                <div>
                                    <img src={avatar} alt='' className={styles.avatar}></img>
                                </div>
                                <div className={styles.message}>
                                    <div className={styles.name}>
                                        <div>
                                            {item.name}
                                        </div>
                                        <div className={styles.size}>
                                            {item.size}
                                        </div>

                                    </div>
                                    <div className={styles.content} dangerouslySetInnerHTML={{ __html: (item.dto != null) ? item.dto.message : '메세지가 없습니다' }}>

                                    </div>
                                </div>
                                <div>
                                    <div className={styles.write_date}>
                                        {formattedTimestamp}
                                    </div>
                                    <div className={styles.alarm}>
                                        {item.alarm==='Y'?(<i className="fa-solid fa-bell"></i>):(<i className="fa-solid fa-bell-slash"></i>)}
                                    </div>
                                </div>

                            </div>
                            <ChatsModal modalRef={modalRef} index={index} item={item} setGroup_chats={setGroup_chats}></ChatsModal>
                        </React.Fragment>
                    );
                })
            }

        </div>
    )

}
export default Chats;