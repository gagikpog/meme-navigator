import { useMemo } from "react";
import ImageWithAuth from "../components/ImageWithAuth";
import { IMAGE_URL } from "../config";
import { useMemes } from "../context/MemeContext"
import formatDate from "../utils/formatDate";
import { Link } from "react-router-dom";


const MS_PER_DAY = 1000 * 60 * 60 * 24;
const IMAGE_SIZE = 150;

export default function Timeline() {

    const { memes } = useMemes();

    const {items, height} = useMemo(() => {

        let top = IMAGE_SIZE;

        const data = memes.map((meme, index) => {
            const prevMeme = memes[index - 1];
            if (prevMeme) {
                const timeDiff = new Date(prevMeme.created_at) - new Date(meme.created_at);
                if (timeDiff > 0) {
                    top += Math.max(IMAGE_SIZE * 0.6, Math.min(IMAGE_SIZE * 4, timeDiff * IMAGE_SIZE / MS_PER_DAY)); // Ограничение максимального отступа
                } else {
                    top += IMAGE_SIZE; // Минимальный отступ, если время одинаковое или отрицательное
                }
            }
            return {
                ...meme,
                top,
            };
        });

        return {
            items: data,
            height: top + IMAGE_SIZE * 2,
        };
    }, [memes]);

    return (
        <div className="w-full flex h-full items-center justify-center" style={{height: `${height}px`, position: 'relative'}}>
            <div className="bg-black w-1 h-full"></div>
            { items?.map((meme, index) => {
                const left = index % 2 === 0;
                return (
                    <div
                        key={meme.fileName}
                        className={`absolute flex items-center ${left ? 'flex-row-reverse' : ''}`}
                        style={{
                            top: `${meme.top}px`,
                            left: `calc(50%)`,
                            transform: `translateX(${ left ? '-8px' : 'calc(-100% + 8px)'})`,
                        }}
                    >
                         <Link
                            to={`/meme/${meme.fileName}`}
                            title={meme.description}
                        >
                            <ImageWithAuth
                                src={`${IMAGE_URL}/${meme.fileName}`}
                                alt={meme.fileName}
                                style={{width: `${IMAGE_SIZE}px`, height: `${IMAGE_SIZE}px`}}
                                className="rounded-full object-cover border-2 border-white shadow-lg border-2 border-black"
                            />
                        </Link>

                        <svg width={IMAGE_SIZE} height={IMAGE_SIZE} className="absolute sm:hidden pointer-events-none" viewBox="0,0,250,250" style={{scale: 1.25}}>
                            <g transform="rotate(-30,125,125)">
                                <path id="textPath" fill="transparent" d="M125,10 a95,95 0 1,1 0,230" />
                                <text><textPath href="#textPath"><tspan dy=".4em">{ formatDate(meme.created_at) }</tspan></textPath></text>
                            </g>
                        </svg>

                        <div className="bg-black flex-1 min-w-0 h-0.5 text-center w-[120px] relative">
                            <div className="absolute left-0 w-full bottom-1 text-xs hidden sm:inline">
                                { formatDate(meme.created_at) }
                            </div>
                        </div>
                        <div className="w-4 h-4 shrink-0 bg-white rounded-full border-2 border-black"></div>
                    </div>
                );
            })}
        </div>
    );
}
