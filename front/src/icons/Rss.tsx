import { IIconProps } from "../types";

export default function IconRss({size = 24}: IIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12a8 8 0 0 1 8 8"/><path d="M4 6a14 14 0 0 1 14 14"/>
            <circle cx="5" cy="19" r="1"/>
        </svg>
    );
}