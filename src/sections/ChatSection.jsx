import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import gql from 'graphql-tag';


const SEND_MESSAGE = gql`
  mutation SendMessage($senderId: ID!, $receiverId: ID!, $message: String!) {
    sendMessage(senderId: $senderId, receiverId: $receiverId, message: $message) {
      message
    }
  }
`;

const GET_STUDENTS = gql`
  query GetStudents {
    users {
      id
      name
      role
      UniId
    }
  }
`;

const GET_ADMINS = gql`
  query GetAdmins {
    admins {
      id
      name
      role
    }
  }
`;

// GraphQL Query to get a conversation between two users
const GET_MESSAGES = gql`
  query GetConversation($senderId: ID!, $receiverId: ID!) {
    messages(senderId: $senderId, receiverId: $receiverId) {
      id
      sender {
        id
        name
      }
      receiver {
        id
        name
      }
      message
      timestamp
    }
  }
`;

// GraphQL Query to get received messages for a user
const GET_RECEIVED_MESSAGES = gql`
  query GetReceivedMessages($receiverId: ID!) {
    receivedMessages(receiverId: $receiverId) {
      id
      sender {
        id
        name
      }
      receiver {
        id
        name
      }
      message
      timestamp
    }
  }
`;

function ChatSection({ currentUser }) {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sendMessageMutation] = useMutation(SEND_MESSAGE);
  const { loading: studentsLoading, error: studentsError, data: studentsData } = useQuery(GET_STUDENTS);
  const { loading: adminsLoading, error: adminsError, data: adminsData } = useQuery(GET_ADMINS);
  const {
    loading: conversationLoading,
    error: conversationError,
    data: conversationData,
    refetch: refetchConversation,
  } = useQuery(GET_MESSAGES, {
    skip: !currentUser || !selectedUser,
    variables: {
      senderId: currentUser?.id,
      receiverId: selectedUser?.id,
    },
  });

  const {
    loading: receivedLoading,
    error: receivedError,
    data: receivedData,
    refetch: refetchReceived,
  } = useQuery(GET_RECEIVED_MESSAGES, {
    skip: !currentUser,
    variables: {
      receiverId: currentUser?.id,
    },
  });


  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'Admin') {
        if (studentsData?.users) {
          setAvailableUsers(studentsData.users.filter(user => user.role === 'Student'));
        } else {
          setAvailableUsers([]);
        }
      } else if (currentUser.role === 'Student') {
        if (adminsData?.admins) {
          setAvailableUsers(adminsData.admins);
        } else {
          setAvailableUsers([]);
        }
      }
    } else {
      setAvailableUsers([]);
    }
  }, [currentUser, studentsData, adminsData]);

  useEffect(() => {
    if (currentUser && !selectedUser) {
      if (currentUser.role === 'Admin' && availableUsers.length > 0) {
        setSelectedUser(availableUsers[0]);
      }
      if (currentUser.role === 'Student' && availableUsers.length > 0) {
        setSelectedUser(availableUsers[0]);
      }
    }
  }, [availableUsers, currentUser]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setMessages([]);
  };

  const handleMessageInputChange = (e) => {
    setMessageInput(e.target.value);
  };

  const sendMessage = async () => {
    if (messageInput.trim() !== '' && selectedUser) {
      const senderId = currentUser?.id;
      const receiverId = selectedUser.id;
      const messageText = messageInput.trim();

      console.log("Type of selectedUser.id:", typeof selectedUser.id);
      console.log("Value of selectedUser.id:", selectedUser.id);

      try {
        const { data } = await sendMessageMutation({
          variables: { senderId, receiverId, message: messageText },
        });

        const newMessage = {
          text: data?.sendMessage?.message || '',
          sender: currentUser?.name || 'Unknown',
          timestamp: new Date().toLocaleTimeString(),
          isSent: true,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setMessageInput('');
        await refetchConversation(); // Refetch conversation
        await refetchReceived();
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  useEffect(() => {
    if (conversationData) {
      const formattedMessages = conversationData.messages.map(msg => ({
        text: msg.message,
        sender: msg.sender.name,
        timestamp: new Date(msg.timestamp).toLocaleTimeString(),
        isSent: msg.sender.id === currentUser?.id,
      }));
      setMessages(formattedMessages);
    }
  }, [conversationData, currentUser]);

  useEffect(() => {
    if (receivedData) {
      //  Handle new messages.  For simplicity, we'll just log them.
      console.log("Received Messages:", receivedData.receivedMessages);
      //  In a real app, you'd update the messages state,
      //  trigger notifications, etc.
      if (receivedData.receivedMessages.length > 0 && selectedUser) {
        // Find the latest message and check if it's for the currently selected user
        const latestMessage = receivedData.receivedMessages[receivedData.receivedMessages.length - 1];
        if (latestMessage.sender.id === selectedUser.id) {
          // Add new message to the chat
          const newMessage = {
            text: latestMessage.message,
            sender: latestMessage.sender.name,
            timestamp: new Date(latestMessage.timestamp).toLocaleTimeString(),
            isSent: false, // Mark as received
          };
          setMessages(prevMessages => [...prevMessages, newMessage]);
        }
      }
    }
  }, [receivedData, selectedUser]);


  useEffect(() => {
    const chatMessagesDiv = document.getElementById('chatMessages');
    if (chatMessagesDiv) {
      chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    }
  }, [messages]);

  if (studentsLoading || adminsLoading) {
    return <p>Loading users...</p>;
  }

  if (studentsError || adminsError) {
    return <p>
      Error fetching users: {studentsError?.message || adminsError?.message}
    </p>;
  }

  if (conversationLoading) return <p>Loading conversation...</p>
  if (conversationError) return <p>Error loading conversation: {conversationError.message}</p>

  if (receivedLoading) return <p>Loading received messages...</p>
  if (receivedError) return <p>Error loading received messages: {receivedError.message}</p>

  return (
    <section id="chat-section" className="section-content p-8 flex flex-col bg-[#1a1a1a]">
      <h5 className="text-left pl-4 mb-4">
        {currentUser?.role === 'Admin' ? 'List of Students' : 'Admin Chat'}
      </h5>
      <div className="flex flex-col md:flex-row gap-6 bg-gray-900 p-4 rounded h-[calc(100vh-15rem)]">
        <ul
          id="userList"
          className="w-full md:w-1/4 bg-[#404040] p-4 rounded space-y-2 list-none text-left overflow-y-auto"
        >
          {availableUsers.map((user) => (
            <li
              key={user.id}
              className={`cursor-pointer hover:bg-gray-500 p-2 rounded ${selectedUser?.id === user.id ? 'bg-gray-600' : ''
                }`}
              onClick={() => handleUserClick(user)}
            >
              {user.name}
            </li>
          ))}
          {availableUsers.length === 0 && (
            <li className="text-center text-gray-400">
              {currentUser?.role === 'Admin'
                ? 'No students found.'
                : 'No admins found.'}
            </li>
          )}
        </ul>

        <div className="w-full md:w-3/4 flex flex-col bg-[#404040] p-4 rounded">
          <h6 id="chatHeader" className="mb-4 font-semibold">
            {selectedUser
              ? `Chatting with ${selectedUser.name}...`
              : `Select a ${currentUser?.role === 'Admin' ? 'student' : 'admin'} to chat`}
          </h6>
          <div
            id="chatMessages"
            className="flex-1 overflow-y-auto mb-4 space-y-3"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded max-w-[80%] ${msg.isSent
                  ? 'ml-auto bg-green-700 text-white'
                  : 'mr-auto bg-gray-600 text-white'
                  }`}
              >
                {msg.text}
                <span className="block text-right text-xs text-gray-300">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            {selectedUser && messages.length === 0 && (
              <div className="text-center text-gray-400">Start chatting!</div>
            )}
            {!selectedUser && (
              <div className="text-center text-gray-400">
                Select a{' '}
                {currentUser?.role === 'Admin' ? 'student' : 'admin'} from the
                list to start a conversation.
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              id="messageInput"
              type="text"
              placeholder="Type your message..."
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded"
              value={messageInput}
              onChange={handleMessageInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') sendMessage();
              }}
              disabled={!selectedUser}
            />
            <button
              onClick={sendMessage}
              className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
              disabled={!selectedUser || messageInput.trim() === ''}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChatSection;

