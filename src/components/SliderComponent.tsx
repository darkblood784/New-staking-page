import React, { useCallback, useRef, useState, useEffect } from 'react';

interface WhaleSliderProps {
    sliderValue: number;
    setSliderValue: (value: number) => void;
    getWhaleHeadSrc: () => string;
}



const WhaleSlider: React.FC<WhaleSliderProps> = ({ sliderValue, setSliderValue, getWhaleHeadSrc }) => {
    const sliderContainerRef = useRef<HTMLDivElement>(null);
    const whaleHeadRef = useRef<HTMLImageElement>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const handleResize = () => {
        setWindowWidth(window.innerWidth);
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [isHovered, setIsHovered] = useState<boolean>(false); // State for hover effect

    // Handling the start of a drag
    const handleMouseDown = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        setIsDragging(true);
    }, []);

    // Handling the end of a drag
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Handling the dragging movement
    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (isDragging && sliderContainerRef.current) {
            const bounds = sliderContainerRef.current.getBoundingClientRect();
            const mouseX = event.clientX - bounds.left;
            const newValue = Math.max(0, Math.min(100, (mouseX / bounds.width) * 100));
            setSliderValue(newValue);
        }
    }, [isDragging, setSliderValue]);

    // Attaching and cleaning up event listeners
    useEffect(() => {
        const handleMouseUpGlobal = () => setIsDragging(false);

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUpGlobal);
        }

        return () => {
            if (isDragging) {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUpGlobal);
            }
        };
    }, [isDragging, handleMouseMove]);

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div ref={sliderContainerRef} className="slider-container relative w-full h-[80px] mb-5">

                {/* Whale Tail: Move the tail further back */}
                <img src="./whale/tail.png" alt="Whale Tail" className="absolute bottom-0 w-[50px] h-[54.5px]" />
                
                {/* Whale Body: Stretches based on sliderValue */}
                <div 
                    className="absolute bottom-0 h-[34px]" 
                    style={{
                        left: '45px',
                        width: `calc(${sliderValue}% - 90px)`,
                        backgroundImage: 'url(./whale/body.png)',
                        backgroundRepeat: 'repeat-x',
                        backgroundSize: 'contain'
                    }}
                ></div>

                {/* Whale Head: Moves based on sliderValue */}
                <img 
                    ref={whaleHeadRef} 
                    src={getWhaleHeadSrc()} 
                    alt="Whale Head" 
                    className="absolute cursor-pointer ml-10 bottom-0 top-[43px] w-[45px] h-[44px]"
                    style={{
                    left: ((windowWidth > 425) && (windowWidth < 768) && (sliderValue <= 25)) 
                        ? `calc(${sliderValue}% - 90px)` 
                        : (sliderValue <= 25 ? `0` : `calc(${sliderValue}% - 90px)`),
                    // marginLeft: windowWidth === 1024 || sliderValue < 25 ? `45px` : `0`
                    marginLeft: ((windowWidth >= 425)  && (sliderValue <= 25)) ? `` : `40px`,
                      transform: isHovered ? 'scale(1.05)' : 'scale(1.01)', // Hover effect (scaling the whale head)
                        transition: 'transform 0.1s ease'
                }} 
                    onMouseDown={handleMouseDown}
                    onMouseEnter={() => setIsHovered(true)}  // Set hover state on mouse enter
                    onMouseLeave={() => setIsHovered(false)}  // Unset hover state on mouse leave
                />
            </div>

            {/* Buttons for preset values */}
            <div className="buttons-container flex justify-between w-full">
                {[25, 50, 75, 100].map((val) => (
                    <button key={val} onClick={() => setSliderValue(val)} className="text-sm w-[20%] py-1 rounded-full transition-colors duration-200 border-2 hover:bg-white hover:text-black">
                        {val === 100 ? 'All In' : `${val}%`}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WhaleSlider;
