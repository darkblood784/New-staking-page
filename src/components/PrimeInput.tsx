import React, { useState, useEffect } from 'react';

interface PrimeInputProps {
  value: string;
  setValue: (value: string) => void;
  validatePrime: (value: string, setValue: (value: string) => void) => void;
}

const PrimeInput: React.FC<PrimeInputProps> = ({ value, setValue, validatePrime }) => {
  const [highlight, setHighlight] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.replace(/[^0-9.]/g, '');
    const parts = newValue.split('.');
    if (parts.length > 2) {
      setValue(parts.slice(0, 2).join('.') + parts.slice(2).join(''));
    } else {
      setValue(newValue);
    }
    // Trigger highlight effect
    setHighlight(true);
  };

  // Remove highlight effect after 300ms
  useEffect(() => {
    if (highlight) {
      const timer = setTimeout(() => setHighlight(false), 300);
      return () => clearTimeout(timer);
    }
  }, [highlight]);

  return (
    <input
      type="text"
      pattern="[0-9.]*"
      className={`text-white bg-opacity-50 bg-black outline-none rounded text-right p-2 w-[80%] ${highlight ? 'bg-blue-100 text-blue-600' : ''}`}
      value={value}
      onChange={handleInputChange}
      onBlur={() => validatePrime(value, setValue)}
    />
  );
};

export default PrimeInput;
