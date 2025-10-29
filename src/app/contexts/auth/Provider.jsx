// Import Dependencies
import { useEffect, useReducer } from "react";
import PropTypes from "prop-types";

// Local Imports
import { setSession } from "utils/jwt";
import { AuthContext } from "./context";
import { ethers } from "ethers";

// ----------------------------------------------------------------------

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  errorMessage: null,
  user: null,
};

const reducerHandlers = {
  INITIALIZE: (state, action) => {
    const { isAuthenticated, user } = action.payload;
    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user,
    };
  },

  LOGIN_REQUEST: (state) => {
    return {
      ...state,
      isLoading: true,
    };
  },

  LOGIN_SUCCESS: (state, action) => {
    const { user } = action.payload;
    return {
      ...state,
      isAuthenticated: true,
      isLoading: false,
      user,
    };
  },

  LOGIN_ERROR: (state, action) => {
    const { errorMessage } = action.payload;

    return {
      ...state,
      errorMessage,
      isLoading: false,
    };
  },

  LOGOUT: (state) => ({
    ...state,
    isAuthenticated: false,
    user: null,
  }),
};

const reducer = (state, action) => {
  const handler = reducerHandlers[action.type];
  if (handler) {
    return handler(state, action);
  }
  return state;
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  

  useEffect(() => {
    const init = async () => {
      try {
        const newProvider =  new ethers.BrowserProvider(window.ethereum);
        const signer = await newProvider.getSigner();
        const address = await signer.getAddress();
        const walletSession = window.localStorage.getItem("walletSession");
        if( walletSession==address ){
          const user = {
            user: {
              id: "uid-2",
              username: "rsafi",
              firstName: "Robert",
              lastName: "Safi"
            }
          };
          dispatch({
            type: "INITIALIZE",
            payload: {
              isAuthenticated: true,
              user,
            },
          });
        }else{
          dispatch({
            type: "INITIALIZE",
            payload: {
              isAuthenticated: false,
              user: null,
            },
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: "INITIALIZE",
          payload: {
            isAuthenticated: false,
            user: null,
          },
        });
      }
    };

    init();
  }, []);

  const login = async ({ username, password }) => {
    dispatch({
      type: "LOGIN_REQUEST",
    });
    console.log(username +'-'+ password)
    try {
      const newProvider =  new ethers.BrowserProvider(window.ethereum);
      const accounts = await newProvider.send("eth_requestAccounts", []); 
      const signer = await newProvider.getSigner();
      const address = await signer.getAddress();
      if( address.toUpperCase==accounts[0].toUpperCase ){
        localStorage.setItem("walletSession", address);
        const user = {
          user: {
            id: "uid-2",
            username: "rsafi",
            firstName: "Robert",
            lastName: "Safi"
          }
        };
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user,
          },
        });
      }
      else{
        throw new Error("Wallet Not Connected");
      }
    } catch (err) {
      dispatch({
        type: "LOGIN_ERROR",
        payload: {
          errorMessage: err,
        },
      });
    }
  };

  const logout = async () => {
    setSession(null);
    dispatch({ type: "LOGOUT" });
  };

  if (!children) {
    return null;
  }

  return (
    <AuthContext
      value={{
        ...state,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
