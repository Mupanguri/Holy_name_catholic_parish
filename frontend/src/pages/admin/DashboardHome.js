import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardHome = () => {
  const { theme, colors } = useOutletContext() || {};
  const {
    currentUser,
    isSuperAdmin,
    getLivePages,
    getDraftPages,
    getLivePosts,
    getDraftPosts,
    getAllMedia,
    getPendingSubmissions,
    getMyTasks,
    getPendingDocuments,
    getUnreadNotifications,
    getAllVideoLinks,
    users,
    loading,
  } = useAuth();

  console.log('DashboardHome rendering, currentUser:', currentUser);
  
  if (loading) {
    return <div style={{color: 'white', padding: 20, background: 'blue'}}>Loading data...</div>;
  }
  
  if (!currentUser) {
    return <div style={{color: 'white', padding: 20, background: 'red'}}>Not logged in - currentUser is null</div>;
  }

  const role = isSuperAdmin ? isSuperAdmin() : false;
  console.log('Role check:', role);
  
  return (
    <div style={{color: 'white', padding: 50, background: '#333'}}>
      <h1>Admin Dashboard Works!</h1>
      <p>User: {currentUser?.name}</p>
      <p>Role: {currentUser?.role}</p>
      <p>Is SuperAdmin: {role ? 'Yes' : 'No'}</p>
    </div>
  );
};

export default DashboardHome;