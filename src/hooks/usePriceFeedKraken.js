import { useState, useEffect,useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

export function usePriceFeedKraken() {

  const [krakenFeed, setKrakenFeed] = useState({price:0, symbol:'', timestamp: new Date().toLocaleTimeString(), color:'white'});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [ws, setWs] = useState(null);
  const previousPrice = useRef(0);
  const previousColor = useRef('#f2f4f9');

  useEffect(() => {
    const socketUrl = 'wss://ws.kraken.com';
    const rws = new ReconnectingWebSocket(socketUrl, [], {
        maxReconnectionDelay: 5000,
        minReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.3,
        maxRetries: Infinity,
    });
    setWs(rws);
    rws.onopen = () => {
        console.log('Connected to Kraken WebSocket');
        setIsConnected(true);
        setError(null);
        // Subscribe to BTC/USDT ticker updates
        const subscribeMessage = {
          "event":"subscribe",
          "pair":["BNB/USD"],
          "subscription":{"name":"trade"}
        };
        rws.send(JSON.stringify(subscribeMessage));
        
    };

    rws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            //console.log(data);
            let newPrice = Array.isArray(data) && data[2] === 'trade' ? parseFloat(data[1][0][0]).toFixed(2): parseFloat(previousPrice.current).toFixed(2) ;
            if( newPrice>previousPrice.current ) { previousColor.current = '#95e4d2'}
            else if ( newPrice<previousPrice.current ){ previousColor.current = '#ff6f4a'}
            else{previousColor.current = '#f2f4f9'}
            previousPrice.current = newPrice;
            setKrakenFeed({price: newPrice, symbol: 'BNB/USD',timestamp: new Date().toLocaleTimeString(), color: previousColor.current });

            // Handle subscription success message
            if (data.status === "subscribed") {
              console.log('Subscription successful:', data.status);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
            setError('Failed to parse price data');
          }
    };  
    
    rws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error occurred');
        setIsConnected(false);
    };

    rws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
    };  

    return () => {
        if (rws) {
            rws.close();
        }
    };
  }, []);

  return { krakenFeed,isConnected, error,ws };
};
