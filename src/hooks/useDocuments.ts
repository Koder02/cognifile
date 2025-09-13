import { useContext } from 'react';
import { DocumentContext } from '../contexts/DocumentContext';

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}