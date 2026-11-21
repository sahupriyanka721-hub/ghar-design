import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * AdminRegister (Decommissioned per user instruction)
 * Admins now login exclusively via Mobile Number + OTP at /admin.
 */
export const AdminRegister: React.FC = () => {
  return <Navigate to="/admin" replace />;
};
