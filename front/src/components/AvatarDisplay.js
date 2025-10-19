import { IMAGE_URL } from "../config";
import ImageWithAuth from "./ImageWithAuth";

// Компонент для отображения аватара (только показ)
const AvatarDisplay = ({ user, onClick, className }) => {
    return (
      <div className={`flex items-center ${className || ''}`} onClick={onClick}>
        <ImageWithAuth
            key={user.avatar + ''}
            src={user.avatar && `${IMAGE_URL}/${user.avatar}`}
            alt={`Аватар ${user.username}`}
            className="w-8 h-8 rounded-full object-cover"
            fallback={ (
                <div className={`w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs`}>
                    {user.username.charAt(0).toUpperCase()}
                </div>
            )}
        />
      </div>
    );
};

export default AvatarDisplay;
