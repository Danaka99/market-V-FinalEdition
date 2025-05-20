import React, { useState, useRef, useEffect } from "react";
import { IoChatbubbleEllipsesOutline, IoSend } from "react-icons/io5";
import { companyInfo } from "./companyInfo";
import styles from "./ClientChatBox.module.css";
import { fetchDataFromApi } from "../../utils/api";
import { Link } from "react-router-dom";

const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const API_URL = `${process.env.REACT_APP_GEMINI_API_URL}?key=${API_KEY}`;

const ClientChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messageWrapperRef = useRef(null);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        text: "Hello! Welcome to Market-V. We're your AI-powered e-commerce platform for all your shopping needs. How can I assist you today?",
        time: new Date(),
        type: "received",
        productSuggestions: [] // Initialize with empty product suggestions
      }]);
    }
  }, []);

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
      // First determine if this is a query about products or general info
      let botResponse;
      
      // Use Gemini AI to determine if this is a product request and extract product details
      const productQuery = await analyzeWithGemini(userMessage.text);
      
      if (productQuery.isProductQuery) {
        botResponse = await handleProductSearch(userMessage.text, productQuery);
      } else {
        botResponse = await handleGeneralQuery(userMessage.text);
      }
      
      setMessages((prev) => [...prev, botResponse]);
      setIsBotTyping(false);
    } catch (error) {
      console.error("Error processing query:", error);
      setIsBotTyping(false);
      setMessages((prev) => [
        ...prev,
        { 
          text: "I'm sorry, I encountered an error. Please try again.", 
          time: new Date(), 
          type: "received",
          productSuggestions: []
        }
      ]);
    }
  };

  // Use AI to analyze the query for product details
  const analyzeWithGemini = async (message) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `You are a shopping assistant for an e-commerce platform called Market-V. Analyze this query: "${message}"
              Determine if this is a product search query. If it is, extract the following information, being as specific as possible:
              1. Product type (e.g., 'laptop', 'running shoes', 'smartwatch', 't-shirt')
              2. Brand names (if any, e.g., 'Nike', 'Apple', 'Samsung')
              3. Product attributes (e.g., 'color: red', 'size: large', 'RAM: 16GB', 'screen_size: 13-inch', 'gender: men's')
              4. Target audience (e.g., 'men', 'women', 'kids', 'unisex')
              5. Desired price range (e.g., 'under $500', 'between $100 and $200', 'expensive')
              6. Key search terms that would be effective for finding this product (e.g., ['gaming laptop', 'wireless earbuds', 'men's running shorts'])
              7. Any implied sentiment or preference (e.g., 'cheap', 'best', 'latest model')
              
              Respond in JSON format like this:
              {
                "isProductQuery": true/false,
                "productType": "string",
                "brands": ["string"],
                "attributes": ["string"],
                "audience": "string",
                "priceRange": "string",
                "searchTerms": ["string"],
                "sentiment": "string"
              }
              
              If it's not a product query, just return {"isProductQuery": false}`
            }] 
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Try to parse JSON from the response
      try {
        // Find JSON in the response
        const jsonMatch = result.match(/\{.*\}/s);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          return JSON.parse(jsonString);
        }
      } catch (e) {
        console.error("Error parsing JSON from AI response:", e);
      }
      
      // Fallback if JSON parsing fails
      return { 
        isProductQuery: 
          message.toLowerCase().includes("product") || 
          message.toLowerCase().includes("buy") || 
          message.toLowerCase().includes("purchase") ||
          message.toLowerCase().includes("show me") ||
          message.toLowerCase().includes("find") ||
          message.toLowerCase().includes("recommend") ||
          message.toLowerCase().includes("suggest"),
        searchTerms: [message]
      };
    } catch (error) {
      console.error("Error analyzing with Gemini:", error);
      return { isProductQuery: false };
    }
  };

  // Handle product search queries
  const handleProductSearch = async (message, productQuery) => {
    let suggestedProducts = [];
    let botReplyText = "";
    
    try {
      console.log("Product query details:", productQuery);
      
      // Try each search term
      if (productQuery.searchTerms && productQuery.searchTerms.length > 0) {
        for (const term of productQuery.searchTerms) {
          const results = await searchProducts(term);
          if (results.length > 0) {
            suggestedProducts = results;
            break;
          }
        }
      }
      
      // Try brand + product type if available
      if (suggestedProducts.length === 0 && 
          productQuery.brands && productQuery.brands.length > 0 && 
          productQuery.productType) {
        const brandProductQuery = `${productQuery.brands[0]} ${productQuery.productType}`;
        const results = await searchProducts(brandProductQuery);
        if (results.length > 0) {
          suggestedProducts = results;
        }
      }
      
      // Try brand only if available
      if (suggestedProducts.length === 0 && 
          productQuery.brands && productQuery.brands.length > 0) {
        const results = await searchProducts(productQuery.brands[0]);
        if (results.length > 0) {
          suggestedProducts = results;
        }
      }
      
      // Try product type if available
      if (suggestedProducts.length === 0 && productQuery.productType) {
        const results = await searchProducts(productQuery.productType);
        if (results.length > 0) {
          suggestedProducts = results;
        }
      }
      
      // Try attributes if available
      if (suggestedProducts.length === 0 && 
          productQuery.attributes && productQuery.attributes.length > 0) {
        for (const attribute of productQuery.attributes) {
          const results = await searchProducts(attribute);
          if (results.length > 0) {
            suggestedProducts = results;
            break;
          }
        }
      }
      
      // Last resort - try flexible search with full query
      if (suggestedProducts.length === 0) {
        const results = await flexibleProductSearch(message);
        if (results.length > 0) {
          suggestedProducts = results;
        }
      }
      
      // Generate appropriate response based on what we found
      if (suggestedProducts.length > 0) {
        if (productQuery.brands && productQuery.brands.length > 0) {
          const brandName = productQuery.brands[0].charAt(0).toUpperCase() + productQuery.brands[0].slice(1);
          if (productQuery.productType) {
            botReplyText = `Here are some ${brandName} ${productQuery.productType} options that might interest you:`;
          } else {
            botReplyText = `Here are some ${brandName} products that might interest you:`;
          }
        } else if (productQuery.audience) {
          botReplyText = `Here are some ${productQuery.productType || "products"} for ${productQuery.audience} that might interest you:`;
        } else {
          botReplyText = `Here are some ${productQuery.productType || "products"} that might interest you:`;
        }
      } else {
        if (productQuery.brands && productQuery.brands.length > 0) {
          const brandName = productQuery.brands[0].charAt(0).toUpperCase() + productQuery.brands[0].slice(1);
          botReplyText = `I couldn't find any ${brandName} products matching your criteria. Please try different search terms or browse our categories.`;
        } else {
          botReplyText = `I couldn't find specific products matching your request. Please try different search terms or browse our categories.`;
        }
      }
      
      return {
        text: botReplyText, 
        time: new Date(), 
        type: "received",
        productSuggestions: suggestedProducts
      };
    } catch (error) {
      console.error("Error handling product query:", error);
      return {
        text: "I'm having trouble searching for products right now. Please try again later.", 
        time: new Date(), 
        type: "received",
        productSuggestions: []
      };
    }
  };

  // Handle general (non-product) queries with Gemini
  const handleGeneralQuery = async (message) => {
    const greetingWords = ["hello", "hi", "hey", "greetings"];
    const lowerCaseMessage = message.toLowerCase();
    
    if (greetingWords.some((word) => lowerCaseMessage.includes(word))) {
      const welcomeMessage = `Hello! Welcome to Market-V. We're your AI-powered e-commerce platform for all your shopping needs. How can I assist you today?`;
      return { 
        text: welcomeMessage, 
        time: new Date(), 
        type: "received",
        productSuggestions: []
      };
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `Answer based on this information: ${companyInfo}\n\nUser: ${message}` 
            }] 
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        "I'm sorry, but I can only answer questions related to Market-V.";

      return { 
        text: botText, 
        time: new Date(), 
        type: "received",
        productSuggestions: []
      };
    } catch (error) {
      console.error("API Error:", error);
      return { 
        text: "I'm having trouble connecting right now. Please try again later.", 
        time: new Date(), 
        type: "received",
        productSuggestions: []
      };
    }
  };

  // Search products by query
  const searchProducts = async (query) => {
    if (!query || query.trim() === '') return [];
    
    try {
      console.log(`Searching for products with query: "${query}"`);
      const results = await fetchDataFromApi(`/api/search?q=${query}`);
      console.log(`Found ${results?.length || 0} products matching "${query}"`);
      return results || [];
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    }
  };

  // Flexible product search for when direct searches fail
  const flexibleProductSearch = async (query) => {
    try {
      console.log(`Trying flexible product search for: "${query}"`);
      
      // Get all products
      const allProducts = await fetchDataFromApi(`/api/products`);
      if (!allProducts || !allProducts.products) return [];
      
      // Split query into tokens
      const tokens = query.toLowerCase().split(/\s+/).filter(token => token.length > 2);
      
      // Find products that match at least some tokens
      const matches = allProducts.products.filter(product => {
        const productName = product.name.toLowerCase();
        const productBrand = product.brand ? product.brand.toLowerCase() : '';
        const productDescription = product.description ? product.description.toLowerCase() : '';
        
        let matchCount = 0;
        for (const token of tokens) {
          if (productName.includes(token) || 
              productBrand.includes(token) || 
              productDescription.includes(token)) {
            matchCount++;
          }
        }
        
        return matchCount >= Math.max(2, Math.floor(tokens.length * 0.3));
      });
      
      console.log(`Flexible search found ${matches.length} products`);
      return matches;
    } catch (error) {
      console.error("Error in flexible search:", error);
      return [];
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
              <h4 className={styles.chatboxMessageName}>&nbsp;Market-V Assistant</h4>
              <p className={styles.chatboxMessageStatus}>&nbsp;online</p>
            </div>
          </div>
        </div>
        
        <div className={styles.chatboxMessageContent} ref={messageWrapperRef}>
          {messages.length === 0 ? (
            <h4 className={styles.chatboxMessageNoMessage}>Loading...</h4>
          ) : (
            <>
              {messages.map((msg, index) => (
                <React.Fragment key={index}>
                  <div className={`${styles.chatboxMessageItem} ${
                    msg.type === "sent" ? styles.chatboxMessageItemSent : styles.chatboxMessageItemReceived
                  }`}>
                    <span className={styles.chatboxMessageItemText}>
                      {msg.text.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          <br />
                        </React.Fragment>
                      ))}
                    </span>
                    <span className={styles.chatboxMessageItemTime}>
                      {msg.time.getHours().toString().padStart(2, "0")}:
                      {msg.time.getMinutes().toString().padStart(2, "0")}
                    </span>
                  </div>
                  
                  {/* Product Suggestions - Only shown right after bot messages with products */}
                  {msg.type === "received" && msg.productSuggestions && msg.productSuggestions.length > 0 && (
                    <div className={`${styles.chatboxMessageItem} ${styles.chatboxMessageItemReceived} ${styles.productSuggestions}`}>
                      <div className={styles.productGrid}>
                        {msg.productSuggestions.slice(0, 3).map((product, idx) => (
                          <Link to={`/product/${product.id}`} key={idx} className={styles.productCard}>
                            <div className={styles.productImage}>
                              <img src={product.images[0]} alt={product.name} />
                            </div>
                            <div className={styles.productInfo}>
                              <h4>{product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name}</h4>
                              <p className={styles.productPrice}>LKR {product.price}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      {msg.productSuggestions.length > 3 && (
                        <p className={styles.moreProducts}>
                          <Link to="/search">View more products ({msg.productSuggestions.length - 3} more)</Link>
                        </p>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}
              
              {isBotTyping && (
                <div className={`${styles.chatboxMessageItem} ${styles.chatboxMessageItemReceived} ${styles.typingIndicator}`}>
                  <span className={styles.chatboxMessageItemText}>...</span>
                </div>
              )}
            </>
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