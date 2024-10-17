import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../constants";
import { ConnectButton } from '@rainbow-me/rainbowkit';

function Navbar() {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    // Initialize state for selected language label and image
    const [selectedLanguage, setSelectedLanguage] = useState({
        label: t('English'),  // Default language label
        img: ''  // Default image path
    });

    const onChangeLang = (code: string, label: string, img: string) => {
        i18n.changeLanguage(code);
        setSelectedLanguage({ label, img });  // Update the label and image
        setIsOpen(false);
    }

    return (
        <div className="px-2 flex w-full items-center justify-between fixed z-40 top-0 left-0 h-28 md:pr-8 font dark:bg-[rgba(255,255,255,0)] backdrop-blur-[30px] shadow-[0_3px_6px_3px_rgba(0,0,0,0.4)] transition-all duration-300">
            <a href="https://staking.whalestrategy.net/">
                <img src="/logo.png" className="w-16 h-16 sm:ml-10" alt="Logo" />
            </a>
            <div className="flex items-center">
                <ConnectButton />
                <div className="relative">
                    <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-center w-24 md:w-32 h-10 rounded-[13px] p-2 bg-[#0E76FD] text-white text-[16px] font-bold ml-4">
                        {selectedLanguage.img && (
                            <img src={selectedLanguage.img} alt="" className="w-6 h-auto mr-2 mt-[4px]" />
                        )}
                        {t(selectedLanguage.label)}
                    </button>
                    {isOpen && (
                        <div className="absolute ml-4 top-full mt-1 w-24 md:w-32 bg-[#2c2d30] text-white shadow-lg">
                            {LANGUAGES.map(({ code, label, lang }) => (
                                <div key={code} className="flex items-center justify-center cursor-pointer p-2 hover:bg-blue-100" onClick={() => onChangeLang(code, label, lang)}>
                                    <img src={lang} alt="" className="w-6 h-auto mr-2 mt-[4px]" />
                                    <span>{t(label)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Navbar;
