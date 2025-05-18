import React, { useRef } from 'react';
import { useState } from 'react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { TelepartyClient, SocketEventHandler, SocketMessageTypes, SessionChatMessage } from 'teleparty-websocket-lib';
import "./Chatroom.css";

const Chatroom: React.FC = () => {
  const client = useRef<TelepartyClient>({} as TelepartyClient);
  const [messages, setMessages] = useState<Array<SessionChatMessage>>([] as SessionChatMessage[])
  const [text, setText] = useState<string>("");
  const [searchRoomId, setSearchRoomId] = useState<string>("");
  const [currentRoomId, setRoomId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setUser] = useState<string>();
  const [userList, setUserList] = useState<any[]>([])

  const handleOnMessage = (message: any) => {
    if (message.type && message.type === SocketMessageTypes.SEND_MESSAGE) {
      setMessages((prev) => ([...prev, message.data]))
    }
    if (message.type === "userId") {
      setUser(message.data?.userId)
    }
    if (message.type === "userList") {
      setUserList(message.data.map((val: any) => val.userSettings))
    }
    console.log(message)
  }

  const initialise = useCallback(() => {
    const eventHandler: SocketEventHandler = {
      onConnectionReady: () => {
        console.log("Connection has been established");
        setIsConnected(true);
      },
      onClose: () => {
        setIsConnected(false);
        alert("Please reload to connect again")
      },
      onMessage: handleOnMessage
    };
    client.current = new TelepartyClient(eventHandler);
  }, [])

  useEffect(() => {
    initialise();
  }, [initialise])

  const handleCreateChatRoom = async (nickname?: string, userIcon?: string) => {
    try {
      if (client.current) {
        const userName = nickname ?? `User-${currentUser}`;
        const room = await client.current.createChatRoom(userName, userIcon);
        setRoomId(room);
      }
    } catch (err) {
      console.log(err)
    }
  }

  const joinRoom = async () => {
    try {
      client.current.joinChatRoom(`User - ${currentUser}`, searchRoomId);
      setMessages([]);
      setRoomId(searchRoomId);
      setSearchRoomId("")
    } catch (err) {
      console.log(err)
    }
  }

  const handleWriteText = useCallback((e: any) => {
    setText(e.target.value);
  }, []);

  const handleChangeRoom = useCallback((e: any) => {
    setSearchRoomId(e.target.value?.trim());
  }, [])

  const handleSendMessage = useCallback(() => {
    client.current.sendMessage(SocketMessageTypes.SEND_MESSAGE, {
      body: text.trim()
    });
    setText("");
  }, [text])

  const handleTyping = useCallback(() => {
    client.current.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, {
      typing: true
    });
  }, [])

  const handleTypingOff = useCallback(() => {
    client.current.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, {
      typing: false
    });
  }, [])


  return (
    <div className='Chatroom'>
      <header className='Chatroom-header'>
        <h1 className='Chatroom-text'>TELECHAT</h1>
        <div className='Chatroom-joinRoom'>
          <input placeholder='Enter Room Id to join' className='Chat-textbox' type="text" maxLength={50} value={searchRoomId} onChange={handleChangeRoom} disabled={!isConnected} />
          <button className='Chatroom-btn' onClick={joinRoom} disabled={!searchRoomId || !isConnected}>
            Join Room
          </button>
        </div>
        {currentRoomId
          ? <p className='Chatroom-roomName'>RoomId : {currentRoomId}</p>
          :
          <button className='Chatroom-btn' onClick={() => handleCreateChatRoom()} disabled={!isConnected}>
            Create Room
          </button>}
      </header>

      <div className='Chatroom-content'>
        <aside className="Chatroom-list">
          {userList.length
            ? <>
              <p className='Chatroom-user-text'>Users in Current Chat Room</p>
              <ul className='Users-List'>
                {userList.map((item) => (
                  <li className='Chatroom-user'>
                    {item.userNickname}
                  </li>
                ))}
              </ul>
            </>
            : <></>
          }
        </aside>

        <section className='Chatroom-chat'>
          <ul className='Chatroom-msgs'>
            {messages.map((msg, i) => {
              const timestamp = new Date(msg.timestamp);
              const timeString = timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <li key={i} className={['Msg-body', msg.isSystemMessage && "Msg-System"].filter(Boolean).join(" ")}>
                  <p className='Msg-text'>{msg.isSystemMessage ? `${msg.userNickname} ` : ""}{msg.body}</p>
                  {!msg.isSystemMessage && msg.userNickname && (
                    <p className="Msg-username">
                      {msg.userNickname} at {timeString}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
          <div className='Chat-footer'>
            <input placeholder='Enter your message' className='Chat-textbox' type="text" maxLength={200} value={text} onChange={handleWriteText} disabled={!currentRoomId} onFocus={handleTyping} onBlur={handleTypingOff} />
            <button className='Chatroom-btn' onClick={handleSendMessage} disabled={!currentRoomId || !isConnected}>
              Send
            </button>
          </div>
        </section>
      </div>
    </div>

  )
}

export default Chatroom