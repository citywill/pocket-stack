import { lazy } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { UserDashboard } from './UserDashboard';
import { UserList } from './UserList';

export function UserManager() {
  return (
    <Routes>
      <Route index element={<UserDashboard />} />
      <Route path="list" element={<UserList />} />
    </Routes>
  );
}