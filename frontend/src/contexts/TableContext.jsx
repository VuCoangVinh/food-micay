import React, { createContext, useContext, useState, useEffect } from 'react';
import { tablesAPI } from '../services/api.js';
import { useAuth } from './AuthContext';

const TableContext = createContext();

export const useTable = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
};

export const TableProvider = ({ children }) => {
  const [currentTable, setCurrentTable] = useState(null);
  const { setGuestUser } = useAuth();

  const createGuestUser = (tableId, tableNumber) => {
    // Tạo device ID cố định cho thiết bị này
    let deviceId = localStorage.getItem('guestDeviceId');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guestDeviceId', deviceId);
    }

    const guestUserData = {
      id: `guest_${tableId}_${deviceId}`,
      name: `Khách ${tableNumber}`,
      role: 'guest',
      isGuest: true,
      tableId: tableId,
      token: null
    };

    setGuestUser(guestUserData);
  };

  useEffect(() => {
    const loadTable = async () => {
      // Check URL for table parameter first, so QR code always overrides stale data
      const urlParams = new URLSearchParams(window.location.search);
      const tableId = urlParams.get('table');

      if (tableId) {
        try {
          const table = await tablesAPI.getById(tableId);
          const tableData = {
            id: table.id,
            number: table.name,
            capacity: table.capacity,
            status: table.status
          };
          setCurrentTable(tableData);
          sessionStorage.setItem('currentTable', JSON.stringify(tableData));
          localStorage.removeItem('currentTable');

          // Luôn tạo guest user khi vào link bàn (không xóa localStorage admin)
          // sessionStorage là per-tab → tab admin vẫn dùng localStorage bình thường
          const storedUser = localStorage.getItem('user');
          const currentUser = storedUser ? JSON.parse(storedUser) : null;
          if (!currentUser || currentUser.role === 'admin' || currentUser.isGuest) {
            createGuestUser(tableId, table.name || `Bàn ${tableId}`);
          }
          return;
        } catch (error) {
          console.error('Error loading table from API:', error);
          const tableFallback = { id: tableId, number: `Bàn ${tableId}` };
          setCurrentTable(tableFallback);
          sessionStorage.setItem('currentTable', JSON.stringify(tableFallback));
          localStorage.removeItem('currentTable');

          const storedUser = localStorage.getItem('user');
          const currentUser = storedUser ? JSON.parse(storedUser) : null;
          if (!currentUser || currentUser.role === 'admin' || currentUser.isGuest) {
            createGuestUser(tableId, `Bàn ${tableId}`);
          }
          return;
        }
      }

      // Không có table param trong URL: chỉ dùng sessionStorage (không localStorage)
      const storedTable = sessionStorage.getItem('currentTable');
      if (storedTable) {
        setCurrentTable(JSON.parse(storedTable));
      }
      // Xóa localStorage cũ để tránh bàn cũ bị load lại
      localStorage.removeItem('currentTable');
    };

    loadTable();
  }, []);

  const setTable = (table) => {
    setCurrentTable(table);
    if (table) {
      sessionStorage.setItem('currentTable', JSON.stringify(table));
    } else {
      sessionStorage.removeItem('currentTable');
    }
    localStorage.removeItem('currentTable');
  };

  const clearTable = () => {
    setCurrentTable(null);
    sessionStorage.removeItem('currentTable');
    localStorage.removeItem('currentTable');
  };

  const value = {
    currentTable,
    setTable,
    clearTable
  };

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
};
