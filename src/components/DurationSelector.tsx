import React from 'react';
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

    return (
        <div className="flex mt-5 w-full justify-between text-white">
            {durations.map((duration) => (
                <div key={duration.key} className="rounded-3xl border-gray-300 border w-[31%] h-auto text-center cursor-pointer" onClick={() => setDuration(t(duration.key))}>
                    <div className="bg-white text-black text-[15px] md:text-[17px] py-2 rounded-3xl md:rounded-full">{t(duration.key)}</div>
                    <p className="text-[20px] md:text-[30px] my-auto hover:opacity-40 active:opacity-50">{duration.percent}</p>
                </div>
            ))}
        </div>
    );
};

export default DurationSelector;
