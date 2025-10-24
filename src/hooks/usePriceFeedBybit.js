import { useState, useEffect,useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

export function usePriceFeedBybit() {

  const [bybitFeed, setBybitFeed] = useState({price:0, symbol:'', timestamp: new Date().toLocaleTimeString(), color:'white'});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [ws, setWs] = useState(null);
  const previousPrice = useRef(0);
  const previousColor = useRef('#f2f4f9');
  useEffect(() => {
    const socketUrl = 'wss://stream.bybit.com/v5/public/spot';
    const rws = new ReconnectingWebSocket(socketUrl, [], {
        maxReconnectionDelay: 5000,
        minReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.3,
        maxRetries: Infinity,
    });
    setWs(rws);
    rws.onopen = () => {
        console.log('Connected to Bybit WebSocket');
        setIsConnected(true);
        setError(null);
        // Subscribe to BTC/USDT ticker updates
        const subscribeMessage = {
          op: 'subscribe',
          args: ['tickers.BNBUSDT','tickers.BTCUSDT','tickers.ETHUSDT']
        };
        rws.send(JSON.stringify(subscribeMessage));
    };

    rws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // Handle the ticker data
            if (data.topic === 'tickers.BNBUSDT') {
              const newPrice = data.data.lastPrice;
              if( newPrice>previousPrice.current ) { 
                previousColor.current = '#95e4d2'
              }
              else if ( newPrice<previousPrice.current ){ 
                previousColor.current = '#ff6f4a'
              }
              else{
                previousColor.current = '#f2f4f9'
              }
              previousPrice.current = newPrice;
              setBybitFeed({price: newPrice,symbol: 'BNBUSDT',timestamp: new Date().toLocaleTimeString(), 'color': previousColor.current });
            }           
            
            // Handle subscription success message
            if (data.success === true) {
              console.log('Subscription successful:', data.ret_msg);
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

  return { bybitFeed, isConnected, error,ws };
};
