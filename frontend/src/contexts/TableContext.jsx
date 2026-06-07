import React, { createContext, useContext, useState, useEffect } from 'react';
import { tablesAPI } from '../services/api.js';

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
          // Dùng sessionStorage: tự xóa khi đóng tab, không rò sang phiên khác
          sessionStorage.setItem('currentTable', JSON.stringify(tableData));
          // Xóa localStorage cũ nếu có
          localStorage.removeItem('currentTable');
          return;
        } catch (error) {
          console.error('Error loading table from API:', error);
          const table = { id: tableId, number: `Bàn ${tableId}` };
          setCurrentTable(table);
          sessionStorage.setItem('currentTable', JSON.stringify(table));
          localStorage.removeItem('currentTable');
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
