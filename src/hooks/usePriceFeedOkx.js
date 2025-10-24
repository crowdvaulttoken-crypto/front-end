import { useState, useEffect,useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

export function usePriceFeedOkx() {

  const [okxFeed, setBybitFeed] = useState({price:0, symbol:'', timestamp: new Date().toLocaleTimeString(), color:'white'});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [ws, setWs] = useState(null);
  const previousPrice = useRef(0);
  const previousColor = useRef('#f2f4f9');
  useEffect(() => {
    const socketUrl = 'wss://ws.okx.com:8443/ws/v5/public';
    const rws = new ReconnectingWebSocket(socketUrl, [], {
        maxReconnectionDelay: 5000,
        minReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.3,
        maxRetries: Infinity,
    });
    setWs(rws);
    rws.onopen = () => {
        console.log('Connected to Okx WebSocket');
        setIsConnected(true);
        setError(null);
        // Subscribe to BTC/USDT ticker updates
        const subscribeMessage = {
            "op": "subscribe",
            "args": [{
                "channel": "trades",
                "instId": "BNB-USDT"
            }]
        };
        rws.send(JSON.stringify(subscribeMessage));
    };

    rws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            //console.log(data);
            // Handle the ticker data
            if (data.arg && data.arg.channel === 'trades' && data.data) {
                const newPrice = parseFloat(data.data[0].px).toFixed(2);
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

  return { okxFeed, isConnected, error,ws };
};
