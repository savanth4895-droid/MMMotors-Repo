import React, { useState } from 'react';
import { Button } from './ui/button';
import { ArrowUpDown, Check } from 'lucide-react';

const SortDropdown = ({ currentSort, currentOrder, onSortChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSortSelect = (field, order) => {
    onSortChange(field, order);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <ArrowUpDown className="h-4 w-4" />
        Sort
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 border">
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={`${option.field}-${option.order}`}
                  onClick={() => handleSortSelect(option.field, option.order)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                    currentSort === option.field && currentOrder === option.order
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700'
                  }`}
                >
                  <span>{option.label}</span>
                  {currentSort === option.field && currentOrder === option.order && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SortDropdown;
