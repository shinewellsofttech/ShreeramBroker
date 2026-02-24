import React from "react";
import { Navigate } from "react-router-dom";

// Profile
import UserProfile from "../pages/Authentication/user-profile";

// Authentication related pages
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";
import ForgetPwd from "../pages/Authentication/ForgetPassword";

// Dashboard
import Dashboard from "../pages/Dashboard/index";
import Ganesh from "pages/Masters/Ganesh";
import AddEdit_UserMaster from "pages/Masters/AddEdit_UserMaster";
import PageList_UserMaster from "pages/Masters/PageList_UserMaster";
import PageList_CourseMasterH from "pages/Masters/PageList_CourseMasterH";
import AddEdit_CourseMasterH from "pages/Masters/AddEdit_CourseMasterH";
import AddEdit_CourseMasterL from "pages/Masters/AddEdit_CourseMasterL";
import PageList_CourseMasterL from "pages/Masters/PageList_CourseMasterL";
import PageList_LedgerMaster from "pages/Masters/PageList_LedgerMaster";
import AddEdit_LedgerMaster from "pages/Masters/AddEdit_LedgerMaster";

import AddEdit_ItemMaster from "pages/Masters/AddEdit_ItemMaster";
import PageList_ItemMaster from "pages/Masters/PageList_ItemMaster";

import AddEdit_CityMaster from "pages/Masters/AddEdit_CityMaster";
import PageList_CityMaster from "pages/Masters/PageList_CItyMaster";

import AddEdit_StateMaster from "pages/Masters/AddEdit_StateMaster";
import PageList_StateMaster from "pages/Masters/PageList_StateMaster";

import AddEdit_TransportMaster from "pages/Masters/AddEdit_TransportMaster";
import PageList_TransportMaster from "pages/Masters/PageList_TransportMaster";

import AddEdit_UnitMaster from "pages/Masters/AddEdit_UnitMaster";
import PageList_UnitMaster from "pages/Masters/PageList_UnitMaster";

import Contract from "pages/Transaction/Contract";
import ContractPrint from "pages/Transaction/ContractPrint";
import ContractPrint2 from "pages/Transaction/ContractPrint2";
import EditContract from "pages/Transaction/EditContract";
import UpdateGlobalOptions from "pages/Masters/UpdateGlobalOptions";

import Header from "headerfile/header";
import LedgerReport from "pages/Reports/LedgerReport";
import DalaliReport from "pages/Reports/DalaliReport";
import ContractRegister from "pages/Reports/ContractRegister";
import LinkCreateRegister from "pages/Reports/LinkCreateRegister";
import LinkRegisterShow from "pages/Reports/LinkRegisterShow";
import MultiPrint from "pages/Reports/MultiPrint";

import NewLedgerReport from "pages/Reports/NewLedgerReport";
import DalaliModal from "pages/Reports/DalaliModal";
import BrokerageCalculation from "pages/Reports/BrokerageCalculation";
import VoucherList from "pages/Reports/VoucherList";
import ReminderData from "pages/Reports/ReminderData";
import Voucher from "pages/Transaction/Voucher";
import AddEdit_PartyAccount from "pages/Masters/AddEdit_PartyAccount";
import PageList_PartyAccount from "pages/Masters/PageList_PartyAccount";
import TabVoucherSystemBro from "pages/BroVoucherSystem/TabVoucherSystemBro";
import TabVoucherSystemH from "pages/HiddenVoucherSystem/TabVoucherSystemH";



const authProtectedRoutes = [
  { path: "/dashboard", component: <Dashboard /> },
  // //profile
  { path: "/profile", component: <UserProfile /> },
  { path: "/header", component: <Header /> },

  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  {
    path: "/",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },
  { path: "/Ganesh", component: <Ganesh /> },
  { path: "/AddUser", component: <AddEdit_UserMaster /> },
  { path: "/EditUser", component: <AddEdit_UserMaster /> },
  { path: "/UserMaster", component: <PageList_UserMaster /> },



  { path: "/AddCourseH", component: <AddEdit_CourseMasterH /> },
  { path: "/EditCourseH", component: <AddEdit_CourseMasterH /> },
  { path: "/CourseMasterH", component: <PageList_CourseMasterH /> },

  { path: "/AddCourseL", component: <AddEdit_CourseMasterL /> },
  { path: "/EditCourseL", component: <AddEdit_CourseMasterL /> },
  { path: "/CourseMasterL", component: <PageList_CourseMasterL /> },

  { path: "/AddLedger", component: <AddEdit_LedgerMaster /> },
  { path: "/EditLedger", component: <AddEdit_LedgerMaster /> },
  { path: "/LedgerMaster", component: <PageList_LedgerMaster /> },
  { path: "/LedgerReport", component: <LedgerReport /> },
  { path: "/DalaliReport", component: <DalaliReport /> },
  { path: "/ContractRegister", component: <ContractRegister /> },
  { path: "/LinkCreateRegister", component: <LinkCreateRegister /> },
  { path: "/LinkRegisterShow", component: <LinkRegisterShow /> },
  { path: "/NewLedgerReport", component: <NewLedgerReport /> },
  { path: "/BrokerageCalculation", component: <BrokerageCalculation /> },
  { path: "/Voucher", component: <Voucher /> },
  { path: "/VoucherList", component: <VoucherList /> },
  { path: "/ReminderData", component: <ReminderData /> },
  { path: "/AddItem", component: <AddEdit_ItemMaster /> },
  { path: "/EditItem", component: <AddEdit_ItemMaster /> },
  { path: "/ItemMaster", component: <PageList_ItemMaster /> },
  { path: "/DalaliModal", component: <DalaliModal /> },

  { path: "/AddCity", component: <AddEdit_CityMaster /> },
  { path: "/EditCity", component: <AddEdit_CityMaster /> },
  { path: "/CityMaster", component: <PageList_CityMaster /> },

  { path: "/AddState", component: <AddEdit_StateMaster /> },
  { path: "/EditState", component: <AddEdit_StateMaster /> },
  { path: "/StateMaster", component: <PageList_StateMaster /> },

  { path: "/AddTransport", component: <AddEdit_TransportMaster /> },
  { path: "/EditTransport", component: <AddEdit_TransportMaster /> },
  { path: "/TransportMaster", component: <PageList_TransportMaster /> },

  { path: "/AddUnit", component: <AddEdit_UnitMaster /> },
  { path: "/EditUnit", component: <AddEdit_UnitMaster /> },
  { path: "/UnitMaster", component: <PageList_UnitMaster /> },

  { path: "/AddPartyAccount", component: <AddEdit_PartyAccount /> },
  { path: "/EditPartyAccount", component: <AddEdit_PartyAccount /> },
  { path: "/PartyAccountMaster", component: <PageList_PartyAccount /> },

  { path: "/Contract", component: <Contract /> },
  { path: "/EditContract", component: <EditContract /> },
  { path: "/MultiPrint", component: <MultiPrint /> },
  { path: "/UpdateGlobalOptions", component: <UpdateGlobalOptions /> },
  { path: "/TabVoucherSystemBro", component: <TabVoucherSystemBro /> },
  { path: "/TabVoucherSystemH", component: <TabVoucherSystemH /> },

];

const publicRoutes = [
  { path: "/login", component: <Login /> },
  { path: "/logout", component: <Logout /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },
  { path: "/contract-print", component: <ContractPrint /> },
  { path: "/contract-print2", component: <ContractPrint2 /> },
];

export { authProtectedRoutes, publicRoutes };
