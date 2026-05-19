import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import RequestAccess from "./pages/RequestAccess";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import RecentReports from "./pages/RecentReports";
import ItemDetail from "./pages/ItemDetail";
import ReportItem from "./pages/ReportItem";
import ConfirmFound from "./pages/ConfirmFound";
import SuccessProcess from "./pages/SuccessProcess";
import LostItems from "./pages/LostItems";
import FoundItems from "./pages/FoundItems";
import Messages from "./pages/Messages";
import ChatRoom from "./pages/ChatRoom";
import MyReports from "./pages/Myreports";
import MyReportDetail from "./pages/MyReportDetail";
import ReviewMatch from "./pages/ReviewMatch";
import EditItemReport from "./pages/EditItemReport";
import CloseReport from "./pages/CloseReport";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/request-access" element={<RequestAccess />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/recent-reports" element={<RecentReports />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/report-item" element={<ReportItem />} />
        <Route path="/confirm-found/:id" element={<ConfirmFound />} />
        <Route path="/success-process" element={<SuccessProcess />} />
        <Route path="/lost-items" element={<LostItems />} />
        <Route path="/found-items" element={<FoundItems />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:conversationId" element={<ChatRoom />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/my-reports/:id" element={<MyReportDetail />} />
        <Route path="/review-match" element={<ReviewMatch />} />
        <Route path="/edit-report/:id" element={<EditItemReport />} />
        <Route path="/close-report/:id" element={<CloseReport />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
