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
      // Load table from localStorage first
      const storedTable = localStorage.getItem('currentTable');
      if (storedTable) {
        setCurrentTable(JSON.parse(storedTable));
        return;
      }

      // Check URL for table parameter
      const urlParams = new URLSearchParams(window.location.search);
      const tableId = urlParams.get('table');
      if (tableId) {
        try {
          // Try to load from API
          const table = await tablesAPI.getById(tableId);
          const tableData = {
            id: table.id,
            number: table.name,
            capacity: table.capacity,
            status: table.status
          };
          setCurrentTable(tableData);
          localStorage.setItem('currentTable', JSON.stringify(tableData));
        } catch (error) {
          console.error('Error loading table from API:', error);
          // Fallback to basic table data
          const table = { id: tableId, number: `Bàn ${tableId}` };
          setCurrentTable(table);
          localStorage.setItem('currentTable', JSON.stringify(table));
        }
      }
    };

    loadTable();
  }, []);

  const setTable = (table) => {
    setCurrentTable(table);
    if (table) {
      localStorage.setItem('currentTable', JSON.stringify(table));
    } else {
      localStorage.removeItem('currentTable');
    }
  };

  const clearTable = () => {
    setCurrentTable(null);
    localStorage.removeItem('currentTable');
  };

  const value = {
    currentTable,
    setTable,
    clearTable
  };

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
};



