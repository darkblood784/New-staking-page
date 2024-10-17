import React from 'react';

interface PrimeInputProps {
  value: string;
  setValue: (value: string) => void;
  validatePrime: (value: string, setValue: (value: string) => void) => void;
}

const PrimeInput: React.FC<PrimeInputProps> = ({ value, setValue, validatePrime }) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.replace(/[^0-9.]/g, '');
    const parts = newValue.split('.');
    if (parts.length > 2) {
      setValue(parts.slice(0, 2).join('.') + parts.slice(2).join(''));
    } else {
      setValue(newValue);
    }
  };

  return (
    <input
      type="text"
      pattern="[0-9.]*"
      className="text-white bg-opacity-50 bg-black outline-none rounded text-right p-2 w-[80%] "
      value={value}
      onChange={handleInputChange}
      onBlur={() => validatePrime(value, setValue)}
    />
  );
};

export default PrimeInput;
