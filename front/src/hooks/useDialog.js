import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

const DialogComponent = ({
  isOpen,
  title,
  description,
  buttons,
  onClose,
  buttonOrder = ['yes', 'no', 'cancel']
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose('cancel');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose('cancel');
    }
  };

  const getButtonConfig = (type) => {
    const configs = {
      yes: {
        text: 'Да',
        className: 'bg-green-600 hover:bg-green-700 text-white',
        icon: '✅'
      },
      no: {
        text: 'Нет',
        className: 'bg-red-600 hover:bg-red-700 text-white',
        icon: '❌'
      },
      cancel: {
        text: 'Отмена',
        className: 'bg-gray-600 hover:bg-gray-700 text-white',
        icon: '🚫'
      }
    };
    return configs[type] || configs.cancel;
  };

  const renderButton = (type) => {
    const config = getButtonConfig(type);
    const buttonData = buttons[type];

    if (!buttonData) return null;

    return (
      <button
        key={type}
        onClick={() => onClose(type)}
        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
          buttonData.className || config.className
        }`}
      >
        <span>{buttonData.icon || config.icon}</span>
        <span>{buttonData.text || config.text}</span>
      </button>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>💬</span>
              {title}
            </h3>
          </div>
        )}

        {/* Описание */}
        {description && (
          <div className="px-6 py-4">
            <p className="text-gray-700 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Кнопки */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          {buttonOrder.map(renderButton)}
        </div>
      </div>
    </div>,
    document.body
  );
};

export const useDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    description: '',
    buttons: {},
    buttonOrder: ['yes', 'no', 'cancel']
  });

  const show = useCallback((config) => {
    setDialogState({
      isOpen: true,
      title: config.title || '',
      description: config.description || '',
      buttons: config.buttons || {},
      buttonOrder: config.buttonOrder || ['yes', 'no', 'cancel']
    });
  }, []);

  const showModal = useCallback((config) => {
    return new Promise((resolve) => {
      const handleClose = (result) => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        resolve(result);
      };

      setDialogState({
        isOpen: true,
        title: config.title || '',
        description: config.description || '',
        buttons: config.buttons || {},
        buttonOrder: config.buttonOrder || ['yes', 'no', 'cancel'],
        onClose: handleClose
      });
    });
  }, []);

  const close = useCallback((result = 'cancel') => {
    setDialogState(prev => {
      if (prev.onClose) {
        prev.onClose(result);
      }
      return { ...prev, isOpen: false };
    });
  }, []);

  const Dialog = useCallback(() => (
    <DialogComponent
      isOpen={dialogState.isOpen}
      title={dialogState.title}
      description={dialogState.description}
      buttons={dialogState.buttons}
      buttonOrder={dialogState.buttonOrder}
      onClose={close}
    />
  ), [dialogState.isOpen, dialogState.title, dialogState.description, dialogState.buttons, dialogState.buttonOrder, close]);

  return {
    Dialog,
    show,
    showModal,
    close
  };
};

export default useDialog;
