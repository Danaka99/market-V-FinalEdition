import React, { useState, useRef, useEffect } from "react";
import { IoChatbubbleEllipsesOutline, IoSend } from "react-icons/io5";
import { companyInfo } from "./companyInfo";
import styles from "./ClientChatBox.module.css";

const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const API_URL = `${process.env.REACT_APP_GEMINI_API_URL}?key=${API_KEY}`;

const ClientChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messageWrapperRef = useRef(null);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input.trim(), time: new Date(), type: "sent" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsBotTyping(true);

    try {
      const botReply = await generateBotResponse(userMessage.text);
      setMessages((prev) => [...prev, botReply]);
      setIsBotTyping(false);
    } catch (error) {
      console.error("Error fetching bot response:", error);
      setIsBotTyping(false);
    }
  };

  const generateBotResponse = async (userMessage) => {
    const greetingWords = ["hello", "hi", "hey", "greetings"];
    const lowerCaseMessage = userMessage.toLowerCase();

    if (greetingWords.some((word) => lowerCaseMessage.includes(word))) {
      const welcomeMessage = `Hello! Welcome to Market-V. We're your AI-powered e-commerce platform for all your supermarket and grocery needs. How can I assist you today?`;
      return { text: welcomeMessage, time: new Date(), type: "received" };
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Answer only based on the following information: ${companyInfo}\n\nUser: ${userMessage}` }] }],
        }),
      });

      const data = await response.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, but I can only answer questions related to Market-V.";

      if (!botText.toLowerCase().includes("market-v")) {
        return { text: "I'm sorry, but I can only answer questions related to Market-V.", time: new Date(), type: "received" };
      }

      return { text: botText, time: new Date(), type: "received" };
    } catch (error) {
      console.error("API Error:", error);
      return { text: "Error: Unable to generate a response.", time: new Date(), type: "received" };
    }
  };

  const toggleChatBox = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (messageWrapperRef.current) {
      messageWrapperRef.current.scrollTop = messageWrapperRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.chatboxWrapper}>
      <div className={styles.chatboxToggle} onClick={toggleChatBox}>
        <IoChatbubbleEllipsesOutline />
      </div>
      <div className={`${styles.chatboxMessageWrapper} ${isOpen ? styles.chatboxMessageWrapperShow : ""}`}>
        <div className={styles.chatboxMessageHeader}>
          <div className={styles.chatboxMessageProfile}>
            <div className={styles.chatboxMessageImage}>
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
                <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" />
              </svg>
            </div>
            <div>
              <h4 className={styles.chatboxMessageName}>&nbsp;Support Center</h4>
              <p className={styles.chatboxMessageStatus}>&nbsp;online</p>
            </div>
          </div>
        </div>
        <div className={styles.chatboxMessageContent} ref={messageWrapperRef}>
          {messages.length === 0 ? (
            <h4 className={styles.chatboxMessageNoMessage}>No messages yet!</h4>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`${styles.chatboxMessageItem} ${msg.type === "sent" ? styles.chatboxMessageItemSent : styles.chatboxMessageItemReceived}`}>
                <span className={styles.chatboxMessageItemText}>{msg.text}</span>
                <span className={styles.chatboxMessageItemTime}>
                  {msg.time.getHours().toString().padStart(2, "0")}:
                  {msg.time.getMinutes().toString().padStart(2, "0")}
                </span>
              </div>
            ))
          )}
          {isBotTyping && (
            <div className={`${styles.chatboxMessageItem} ${styles.chatboxMessageItemReceived} ${styles.typingIndicator}`}>
              <span className={styles.chatboxMessageItemText}>...</span>
            </div>
          )}
        </div>
        <div className={styles.chatboxMessageBottom}>
          <form className={styles.chatboxMessageForm}>
            <textarea
              rows="1"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type message..."
              className={styles.chatboxMessageInput}
            ></textarea>
            <button type="button" onClick={handleSubmit} className={styles.chatboxMessageSubmit}>
              <IoSend />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientChatBox;