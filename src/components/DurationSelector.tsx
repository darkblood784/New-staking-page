import React, { useState } from 'react';
import { useTranslation } from "react-i18next";

interface DurationOption {
    key: string;
    percent: string;
}

interface DurationSelectorProps {
    durations: DurationOption[];
    setDuration: (duration: string) => void;
}

const DurationSelector: React.FC<DurationSelectorProps> = ({ durations, setDuration }) => {
    const { t } = useTranslation();
    const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

    return (
        <div className="flex mt-5 w-full justify-between text-white">
            {durations.map((duration) => (
                <div
                    key={duration.key}
                    className={`rounded-3xl border w-[31%] h-auto text-center cursor-pointer transition-all duration-300
                        ${
                            selectedDuration === duration.key
                                ? "bg-blue-500 text-white border-blue-700" // Style when selected
                                : "border-gray-100 hover:bg-gray hover:border-blue-400 hover:shadow-lg" // Style when not selected (hover effects)
                        }`}
                    onClick={() => {
                        setDuration(t(duration.key));
                        setSelectedDuration(duration.key);
                    }}
                >
                    <div
                        className={`text-[15px] md:text-[17px] py-2 rounded-3xl md:rounded-full
                            ${
                                selectedDuration === duration.key
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-black"
                            }`}
                    >
                        {t(duration.key)}
                    </div>
                    <p className={`text-[20px] md:text-[30px] my-auto transition-opacity 
                        ${selectedDuration === duration.key ? "text-blue" : ""}
                        hover:opacity-80 active:scale-95`}
                    >
                        {duration.percent}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default DurationSelector;
