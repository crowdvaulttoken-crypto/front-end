import { useState, useEffect,useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

export function usePriceFeedBitget() {

  const [bitgetFeed, setBybitFeed] = useState({price:0, symbol:'', timestamp: new Date().toLocaleTimeString(), color:'white'});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [ws, setWs] = useState(null);
  const previousPrice = useRef(0);
  const previousColor = useRef('#f2f4f9');
  useEffect(() => {
    const socketUrl = 'wss://ws.bitget.com/v2/ws/public';
    const rws = new ReconnectingWebSocket(socketUrl, [], {
        maxReconnectionDelay: 5000,
        minReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.3,
        maxRetries: Infinity,
    });
    setWs(rws);
    rws.onopen = () => {
        console.log('Connected to BitGet WebSocket');
        setIsConnected(true);
        setError(null);
        // Subscribe to BTC/USDT ticker updates
        const subscribeMessage = {
            "op": "subscribe",
            "args": [{
                "instType": 'SPOT',
                "channel": "ticker",
                "instId": "BNBUSDT"
            }]
        };
        rws.send(JSON.stringify(subscribeMessage));
    };

    rws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            //console.log(data);
            // Handle the ticker data
            if (data.arg && data.arg.channel === 'ticker' && data.action==='snapshot' ) {
                const newPrice = parseFloat(data.data[0].lastPr).toFixed(2);
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
            if (data.event === "subscribe") {
              console.log('Subscription successful:', data.event);
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

  return { bitgetFeed, isConnected, error, ws };
};
