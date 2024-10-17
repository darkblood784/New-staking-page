import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import banner from '../assets/banner.png';
import usdtbackground from '../assets/usdtplanbackground.png';
import btcbg from '../assets/bitcoinplanbackground.png';
import ethbg from '../assets/ethereumplanbackground.png';
import mystake from '../assets/my_staking_btg.png'
import usdt from '../assets/usdt.png';
import btc from '../assets/btc.png';
import eth from '../assets/eth.png';
import bg_whale from '../assets/bg-whale.png';
import linktree from '../assets/social/linktree.png';
import discord from '../assets/social/discord.png';
import symbol from '../assets/symbol.png';

import WhaleSlider from "../components/SliderComponent";
import PrimeInput from "../components/PrimeInput";
import DurationSelector from "../components/DurationSelector";

interface WhaleImagePaths {
    "0-25": string;
    "25-75": string;
    "75-100": string;
}

interface BlinkingUnderscoreInputProps {
    inputValue: string;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    validatePrime: () => void;
}

const headImages: WhaleImagePaths = {
    "0-25": './whale/TTTTWHALE.png',
    "25-75": './whale/25-75.png',
    "75-100": './whale/75-100.png'
};


function Staking() {
    const { t } = useTranslation();
    const [usdtduration, setUsdtDuration] = useState("");
    const [btcduration, setBtcDuration] = useState("");
    const [ethduration, setEthDuration] = useState("");
    const [inputValueusdt, setInputValueusdt] = useState('');
    const [inputValuebtc, setInputValuebtc] = useState('');
    const [inputValueeth, setInputValueeth] = useState('');
    const [sliderValueusdt, setSliderValueusdt] = useState<number>(0);
    const [sliderValuebtc, setSliderValuebtc] = useState<number>(0);
    const [sliderValueeth, setSliderValueeth] = useState<number>(0);

    const durationOptions = [
        { key: 'day', percent: '15%' },
        { key: 'month', percent: '24%' },
        { key: 'year', percent: '36%' }
    ];

    const isPrime = (num: number): boolean => {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        for (let i = 5; i * i <= num; i += 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
    };

    const validatePrime = (value: string, setter: (value: string) => void) => {
        const num = Number(value);
        if (num !== Math.floor(num)) {
            return;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
        const value = e.target.value;
        const validValue = value.replace(/[^0-9.]/g, ''); // Allow only digits and a single decimal point
        setter(validValue);
    };

    const getWhaleHeadSrcusdt = (): string => {
        if (sliderValueusdt <= 25) return headImages["0-25"];
        if (sliderValueusdt <= 75) return headImages["25-75"];
        return headImages["75-100"];
    };

    const getWhaleHeadSrcbtc = (): string => {
        if (sliderValuebtc <= 25) return headImages["0-25"];
        if (sliderValuebtc <= 75) return headImages["25-75"];
        return headImages["75-100"];
    };

    const getWhaleHeadSrceth = (): string => {
        if (sliderValueeth <= 25) return headImages["0-25"];
        if (sliderValueeth <= 75) return headImages["25-75"];
        return headImages["75-100"];
    };

    return (
        <div className="flex flex-col w-full items-center text-white">
            <div className="flex h-screen w-full items-center text-[40px] my-[20px] md:my-0 md:text-[80px] relative justify-center">
                <img src={banner} alt="Whale" className="absolute w-full h-[100%] my-[20px] md:h-[auto]" />
                <div className="relative z-10 flex flex-col justify-center items-start w-full h-full px-4 mb-[-40px]">
                    <h1 className="font-bold">{t('swim')}</h1>
                    <h1 className="font-bold">{t('earn')}</h1>
                    <p className="mt-4 text-[15px] md:text-[25px]">{t('Join')}</p>
                </div>
            </div>
            <div className="flex justify-between w-full">
                <h1 className="flex md:text-[60px] text-[30px] font-bold">{t('trading')}</h1>
                <p className="md:text-[20px] text-[13px] items-end flex">{t('risk')}</p>
            </div>

            {/* USDT Section */}
            <div className="flex flex-wrap w-full relative mt-10">
                <img src={usdtbackground} className="absolute w-full h-full" alt="" />
                <div className="p-2 flex flex-wrap w-full relative z-10 md:p-0 md:justify-between">
                    <div className="my-auto pt-5 md:pt-0 ml-2 w-full md:w-[35%] lg:ml-10">
                        <div className="flex items-center">
                            <img src={usdt} alt="" className="w-14 h-14 mr-4" />
                            <p className="text-[35px] md:text-[30px] font-bold flex">USDT</p>
                        </div>
                        <DurationSelector durations={durationOptions} setDuration={setUsdtDuration} />

                    </div>
                    <div className="w-full md:w-[30%] lg:pl-10 pt-16 pb-5">
                        <div className="flex justify-between">
                            <p className="text-[25px] md">{t('stake')}</p>
                            <PrimeInput
                                value={inputValueusdt}
                                setValue={setInputValueusdt}
                                validatePrime={validatePrime}

                            />
                        </div>
                        <div className="flex w-full justify-between">
                            <p className="text-[25px] md">{usdtduration ? usdtduration : "0 Days"}</p>
                            <div className="text-2xl mt-2.5">{`${Math.round(sliderValueusdt)}%`}</div>
                        </div>
                        <WhaleSlider
                            sliderValue={sliderValueusdt}
                            setSliderValue={setSliderValueusdt}
                            getWhaleHeadSrc={getWhaleHeadSrcusdt}
                        />
                    </div>
                    <div className="w-full h-20 md:w-1/4 md:h-full opacity-50 bg-black rounded-2xl flex justify-center items-center cursor-pointer">
                        <p className="text-[35px] md:text-[30px] font-bold">{t('take')} <span className="ml-2">&#9660;</span></p>
                    </div>
                </div>
            </div>

            {/* BTC Section */}
            <div className="flex flex-wrap w-full relative mt-10">
                <img src={btcbg} className="absolute w-full h-full" alt="" />
                <div className="p-2 flex flex-wrap w-full relative z-10 md:p-0 md:justify-between">
                    <div className="my-auto pt-5 md:pt-0 ml-2 w-full md:w-[35%] lg:ml-10">
                        <div className="flex items-center">
                            <img src={btc} alt="" className="w-14 h-14 mr-4" />
                            <p className="text-[35px] md:text-[30px] font-bold flex">Bitcoin
                                <sup>
                                    <button title={t('wbtc')}>
                                        <img src={symbol} className="ml-4" alt="" />
                                    </button>
                                </sup>
                            </p>
                        </div>
                        <DurationSelector durations={durationOptions} setDuration={setBtcDuration} />
                    </div>
                    <div className="w-full md:w-[30%] lg:pl-10 pt-16 pb-5">
                        <div className="flex justify-between ">
                            <p className="text-[25px]">{t('stake')}</p>
                            <PrimeInput
                                value={inputValuebtc}
                                setValue={setInputValuebtc}
                                validatePrime={validatePrime}
                            />
                        </div>
                        <div className="flex w-full justify-between">
                            <p className="text-[25px]">{btcduration ? btcduration : "0 Days"}</p>
                            <div className="text-2xl mt-2.5">{`${Math.round(sliderValuebtc)}%`}</div>
                        </div>
                        <WhaleSlider
                            sliderValue={sliderValuebtc}
                            setSliderValue={setSliderValuebtc}
                            getWhaleHeadSrc={getWhaleHeadSrcbtc}
                        />
                    </div>
                    <div className="w-full h-20 md:w-1/4 md:h-full opacity-50 bg-black rounded-2xl flex justify-center items-center cursor-pointer">
                        <p className="text-[35px] md:text-[30px] font-bold">{t('take')} <span className="ml-2">&#9660;</span></p>
                    </div>
                </div>
            </div>

            {/* ETH Section */}
            <div className="flex flex-wrap w-full relative mt-10">
                <img src={ethbg} className="absolute w-full h-full" alt="" />
                <div className="p-2 flex flex-wrap w-full relative z-10 md:p-0 md:justify-between">
                    <div className="my-auto pt-5 md:pt-0 ml-2 w-full md:w-[35%] lg:ml-10">
                        <div className="flex items-center">
                            <img src={eth} alt="" className="w-14 h-14 mr-4" />
                            <p className="text-[35px] md:text-[30px] font-bold flex">Ethereum
                                <sup>
                                    <button title={t('weth')}>
                                        <img src={symbol} className="ml-4" alt="" />
                                    </button>
                                </sup>
                            </p>
                        </div>
                        <DurationSelector durations={durationOptions} setDuration={setEthDuration} />

                    </div>
                    <div className="w-full md:w-[30%] lg:pl-10 pt-16 pb-5">
                        <div className="flex justify-between">
                            <p className="text-[25px] md">{t('stake')}</p>
                            <PrimeInput
                                value={inputValueeth}
                                setValue={setInputValueeth}
                                validatePrime={validatePrime}

                            />
                        </div>
                        <div className="flex w-full justify-between">
                            <p className="text-[25px] md">{ethduration ? ethduration : "0 Days"}</p>
                            <div className="text-2xl mt-2.5">{`${Math.round(sliderValueeth)}%`}</div>
                        </div>
                        <WhaleSlider
                            sliderValue={sliderValueeth}
                            setSliderValue={setSliderValueeth}
                            getWhaleHeadSrc={getWhaleHeadSrceth}
                        />
                    </div>
                    <div className="w-full h-20 md:w-1/4 md:h-full opacity-50 bg-black rounded-2xl flex justify-center items-center cursor-pointer">
                        <p className="text-[35px] md:text-[30px] font-bold">{t('take')} <span className="ml-2">&#9660;</span></p>
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <div className="flex flex-col my-10 w-full h-auto bg-black">
                <img src={bg_whale} className="w-full h-auto" alt="" />
                <p className="lg:pl-20 pl-10 mt-[-90px] lg:mt-[-200px] text-[18px] md:text-[40px] font-bold lg:text-[51px]">{t('crypto')}</p>
            </div>
            <div className="flex w-full bg-black mt-10 lg:mt-40 justify-between">
                <a href="https://linktr.ee/WHALESTRATEGY" className="w-[45%] lg:w-[45%]">
                    <img src={linktree} alt="" className="w-full h-auto cursor-pointer" />
                </a>
                <a href="https://discord.gg/xpkF6U9KJY" className="w-[45%] lg:w-[45%]">
                    <img src={discord} alt="" className="w-full h-auto cursor-pointer" />
                </a>
            </div>
            <div className="flex justify-between w-full mt-32">
                <h1 className="flex md:text-[60px] text-[30px] font-bold">{t('staking')}</h1>
                <p className="md:text-[20px] text-[13px] items-end flex">{t('risk')}</p>
            </div>
            <div className="flex flex-wrap justify-center w-full gap-7">
                {/* USDT Section */}
                <div className="flex flex-wrap w-full lg:w-[47%] relative mt-10">
                    <img src={mystake} className="absolute w-full h-full" alt="" />
                    <div className="p-2 m-2 md:m-10 w-full relative z-10 md:p-0 md:justify-between">
                        <div className="my-autow-full md:w-[35%] ">
                            <div className="flex items-center">
                                <img src={usdt} alt="" className="w-14 h-14 mr-4" />
                                <p className="text-[35px] md:text-[30px] font-bold flex">USDT</p>
                            </div>

                        </div>
                        <div className="flex mt-10 justify-between">
                            <div className="w-1/2">
                                <p>{t('total')}</p>
                                <p className="flex"><span className="text-[25px] md:text-[40px]">1045</span><span className="text-[13px] mt-3 ml-2 md:mt-6 md:ml-4" >USDT~$1045.00</span></p>
                            </div>
                            <div className="w-1/2">
                                <p>{t('available')}</p>
                                <p className="flex"><span className="text-[25px] md:text-[40px]">53</span><span className="text-[13px] mt-3 ml-2 md:mt-6 md:ml-4" >USDT~$1045.00</span></p>
                            </div>
                        </div>

                    </div>
                </div>
                {/* BTC Section */}
                <div className="flex flex-wrap w-full lg:w-[47%] relative mt-10">
                    <img src={mystake} className="absolute w-full h-full" alt="" />
                    <div className="p-2 m-2 md:m-10 w-full relative z-10 md:p-0 md:justify-between">
                        <div className="my-autow-full md:w-[35%] ">
                            <div className="flex items-center">
                                <img src={btc} alt="" className="w-14 h-14 mr-4" />
                                <p className="text-[35px] md:text-[30px] font-bold flex">Bitcoin</p>
                            </div>

                        </div>
                        <div className="flex mt-10 justify-between">
                            <div className="w-1/2">
                                <p>{t('total')}</p>
                                <p className="flex"><span className="text-[25px] md:text-[40px]">1045</span><span className="text-[13px] mt-3 ml-2 md:mt-6 md:ml-4" >BTC~BTC1045.00</span></p>
                            </div>
                            <div className="w-1/2">
                                <p>{t('available')}</p>
                                <p className="flex"><span className="text-[25px] md:text-[40px]">53</span><span className="text-[13px] mt-3 ml-2 md:mt-6 md:ml-4" >BTC~BTC1045.00</span></p>
                            </div>
                        </div>

                    </div>
                </div>
                {/* ETH Section */}
                <div className="flex flex-wrap w-full lg:w-[47%] relative mt-10">
                    <img src={mystake} className="absolute w-full h-full" alt="" />
                    <div className="p-2 m-2 md:m-10 w-full relative z-10 md:p-0 md:justify-between">
                        <div className="my-autow-full md:w-[35%] ">
                            <div className="flex items-center">
                                <img src={eth} alt="" className="w-14 h-14 mr-4" />
                                <p className="text-[35px] md:text-[30px] font-bold flex">Ethereum</p>
                            </div>

                        </div>
                        <div className="flex mt-10 justify-between">
                            <div className="w-1/2">
                                <p>{t('total')}</p>
                                <p className="flex"><span className="text-[25px] md:text-[40px]">1045</span><span className="text-[13px] mt-3 ml-2 md:mt-6 md:ml-4" >ETH~ETH1045.00</span></p>
                            </div>
                            <div className="w-1/2">
                                <p>{t('available')}</p>
                                <p className="flex"><span className="text-[25px] md:text-[40px]">53</span><span className="text-[13px] mt-3 ml-2 md:mt-6 md:ml-4" >ETH~ETH1045.00</span></p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>


            <div className="w-full h-40"></div>
        </div>
    );
}

export default Staking;
