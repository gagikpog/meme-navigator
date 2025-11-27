import { IMAGE_URL } from "../config";
import { User } from "../types";
import ImageWithAuth from "./ImageWithAuth";
import type { MouseEventHandler } from "react";

// Компонент для отображения аватара (только показ)
const AvatarDisplay = ({ user, onClick, className }: {user: User, onClick?: MouseEventHandler<HTMLDivElement>, className?: string}) => {

    const title = `${user.name} ${user.surname}`;
    return (
      <div className={`flex items-center ${className || ''}`} onClick={onClick}>
        <ImageWithAuth
            key={user.avatar + ''}
            src={user.avatar && `${IMAGE_URL}/${user.avatar}`}
            alt={`Аватар ${user.username}`}
            className="w-8 h-8 rounded-full object-cover"
            title={title}
            fallback={ (
                <div className={`w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs`} title={title}>
                    {user.name?.charAt(0).toUpperCase()}
                    {user.surname?.charAt(0).toUpperCase()}
                </div>
            )}
        />
      </div>
    );
};

export default AvatarDisplay;
