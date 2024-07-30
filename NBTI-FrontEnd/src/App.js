import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Header } from './components/Header/Header';
import { Body } from './components/Body/Body';
import axios from 'axios';
import { useAuthStore, useMemberStore } from './store/store';
import { useEffect, useContext } from 'react';
import ChatApp from './components/ChatApp/ChatApp';
import { ChatsProvider ,ChatsContext} from './Context/ChatsContext';
import { host } from './config/config';
import { ToastContainer } from'react-toastify';
import { useRef } from 'react';


axios.defaults.withCredentials = true;

function App() {
  const { loginID, setLoginID } = useAuthStore();
  const { setMembers } = useMemberStore();
  const websocketRef=useRef(null);
  useEffect(() => {
    setLoginID(sessionStorage.getItem("loginID"));
  }, []); // 의존성 배열에 setMembers 추가

  useEffect(() => {
    if (loginID !== null) {
      axios.get(`${host}/members/selectAll`)
        .then((resp) => {
          const filteredMembers = resp.data.map(({ pw, ...rest }) => rest);
          setMembers(filteredMembers);
          console.log('Fetched Members:', filteredMembers);
        })
    }
  }, [loginID])

  //웹소켓 전체 관리
  useEffect(()=>{
    if (loginID !== null) {
      const url=host.replace(/^https?:/, '')
      websocketRef.current = new WebSocket(`${url}/chatWebsocket`);
      
    }
    if(websocketRef.current!=null){
      websocketRef.current.onopen = () => {
        console.log('Connected to WebSocket');
      }
    }
 

    return () => {
      if(websocketRef.current!=null){
        websocketRef.current.close();
      }
      
  
    };
    
  },[loginID])

  return (

    <ChatsProvider>
      <Router>
        <div className="container">
          <Header />
          <Body />
          <ChatApp websocketRef={websocketRef}></ChatApp>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>

    </ChatsProvider>
  );
}

export default App;
