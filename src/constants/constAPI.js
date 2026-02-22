import UpdateGlobalOptions from "pages/Masters/UpdateGlobalOptions";

export const API_WEB_URLS = {

  // BASE: "http://192.168.31.70:7037/api/V1/",
  // BASE: "https://localhost:44379/api/V1/",
  // BASE: "https://localhost:44379/api/V1/",
    // BASE: "https://ApiDemoBroker.shinewellsofttech.co.in/api/V1/",
    BASE: "https://ApiBrokerShreeram.shinewellsofttech.co.in/api/V1/",

  LOGIN: "Authentication/Login",
  // IMAGEURL: "https://10.222.92.203:7037/MemberImages/",
 IMAGEURL: "https://ApiBrokerShreeram.shinewellsofttech.co.in/MemberImages/",  
  
//IMAGEURL_PDF: "https://ApiBrokerShreeram.shinewellsofttech.co.in/MemberImages/PDF/",
   
  MASTER: "Masters",
  BrokerageCalculation: "BrokerageCalculation",
  VoucherList: "VoucherList",
  UserMaster: "UserMaster",
  UserMaster: "UserMaster",
  CourseMasterH: "CourseMasterH",
  CourseMasterL: "CourseMasterL",
  UserMasterNew: "UserMasterNew",
  UserTypeMaster: "UserTypeMaster",
  LedgerMaster: "LedgerMaster",
  ReminderData: "ReminderData",
  ItemTypeMaster: "ItemTypeMaster",
  UnitMaster: "UnitMaster",
  ItemMaster: "ItemMaster",
 TransportMaster: "TransportMaster",
 DeleteContract: "DeleteContract",
 DalaliMaster: "DalaliMaster",
  StateMaster: "StateMaster",
  CityMaster: "CityMaster",
  UpdateGlobalOptions : "UpdateGlobalOptions",
  ContractH : "ContractH",
  AddLifting : "AddLifting",
  GetLedgerReport : "GetLedgerReport",
  VoucherH : "VoucherH",
  ContractEditData : "ContractEditData",
  ContractEditDataApp : "ContractEditDataApp",
  ContractForLinkRegister : "ContractForLinkRegister",
  LedgerDalaliCalculation : "LedgerDalaliCalculation",
      ContractMultiPrint : "ContractMultiPrint",
  GetLedgerReportApp : "GetLedgerReportApp",
  PeriodData : "PeriodData",
  GetLedgerReportApp: 'GetLedgerReportApp',
  GetDalaliLedgerData : "GetDalaliLedgerData",
  Token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImluZm9Ac2hpbmV3ZWxsaW5ub3ZhdGlvbi5jb20iLCJuYW1laWQiOiIxIiwidW5pcXVlX25hbWUiOiIzMTZiYmI3Ny1kOWIxLTQwNWYtYWRiYy01YzYyN2I0M2YwOWQiLCJJUCI6IjQ5LjQzLjE3Ni45NSIsImlzc3VlZF9kYXRlIjoiMTY5NDQzMjU3MyIsIm5iZiI6MTY5NDQzMjU3MywiZXhwIjoxNjk1MDM3MzczLCJpYXQiOjE2OTQ0MzI1NzMsImlzcyI6Imh0dHA6Ly9zaGluZXdlbGxzb2Z0dGVjaC5jby5pbjo1MDY5My9yZXBvcnRpbmcvc2l0ZS9zaXRlMSIsImF1ZCI6Imh0dHA6Ly9zaGluZXdlbGxzb2Z0dGVjaC5jby5pbjo1MDY5My9yZXBvcnRpbmcvc2l0ZS9zaXRlMSJ9.thpdYXJuKWTDlStV-HHTv6PViEDZPrSQDO9C3aUo4mM",
};

/**
 * Returns GlobalOptions from localStorage (set at login).
 * Use this everywhere instead of fetching GlobalOptions again.
 * @returns {Array} GlobalOptions list or [] if not set
 */
export const getGlobalOptions = () => {
  try {
    const stored = localStorage.getItem("GlobalOptions");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : (parsed?.dataList ? parsed.dataList : [parsed]);
  } catch {
    return [];
  }
};

/** Get default financial year id from GlobalOptions (first item's F_FinancialYearMaster) */
export const getDefaultFinancialYearId = () => {
  const opts = getGlobalOptions();
  if (opts && opts.length > 0 && opts[0].F_FinancialYearMaster != null) {
    return opts[0].F_FinancialYearMaster;
  }
  return 0;
};

/** Company/Firm name from GlobalOptions (localStorage). Use in navbar, footer, prints, etc. */
export const getCompanyName = () => {
  const opts = getGlobalOptions();
  if (opts && opts.length > 0 && opts[0].Name) {
    return String(opts[0].Name).trim();
  }
  return "Shri Ram Agri Broker";
};

/** Address from GlobalOptions (single line: Address, City State) */
export const getCompanyAddress = () => {
  const opts = getGlobalOptions();
  if (opts && opts.length > 0) {
    const o = opts[0];
    const parts = [o.Address, o.City, o.State].filter(Boolean).map((s) => String(s).trim());
    if (parts.length) return parts.join(", ");
  }
  return "V-4, Mandore Mandi, JODHPUR - 342007 (Raj.)";
};

export const getCompanyCity = () => {
  const opts = getGlobalOptions();
  return (opts && opts.length > 0 && opts[0].City) ? String(opts[0].City).trim() : "";
};

export const getCompanyState = () => {
  const opts = getGlobalOptions();
  return (opts && opts.length > 0 && opts[0].State) ? String(opts[0].State).trim() : "";
};

export const getCompanyGstNo = () => {
  const opts = getGlobalOptions();
  return (opts && opts.length > 0 && opts[0].GstNo) ? String(opts[0].GstNo).trim() : "08ACSPC3779L3ZU";
};

export const getCompanyPanNo = () => {
  const opts = getGlobalOptions();
  return (opts && opts.length > 0 && opts[0].PanNo) ? String(opts[0].PanNo).trim() : "ACSPC3779L (Prop. Kailash Chandak)";
};

export const getCompanyMobile = () => {
  const opts = getGlobalOptions();
  return (opts && opts.length > 0 && opts[0].Mobile) ? String(opts[0].Mobile).trim() : "";
};