import { combineReducers } from "redux";

// Front
import Layout from "./layout/reducer";

// Authentication
import Login from "./auth/login/reducer";
import Account from "./auth/register/reducer";
import ForgetPassword from "./auth/forgetpwd/reducer";
import Profile from "./auth/profile/reducer";

// Global State
import GlobalDates from "./globalDates/reducer";

const rootReducer = combineReducers({
  // public
  Layout,
  Login,
  Account,
  ForgetPassword,
  Profile,
  GlobalDates,
});

export default rootReducer;
