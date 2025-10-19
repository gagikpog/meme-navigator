import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

export default function DropdownMenu({
  button,
  options = [], // [{ key, name, title, icon, url, visible }]
  onSelect,
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [alignAbove, setAlignAbove] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // вычисляем положение меню
  const calculatePosition = () => {
    const btn = buttonRef.current?.getBoundingClientRect();
    if (!btn) return;

    const menuHeight = menuRef.current?.offsetHeight || 200;
    const viewportHeight = window.innerHeight;
    const showAbove = btn.bottom + menuHeight > viewportHeight && btn.top > menuHeight;

    const top = showAbove ? btn.top - menuHeight - 8 : btn.bottom + 4;
    const left = Math.min(btn.left, window.innerWidth - 220);
    setPosition({ top, left });
    setAlignAbove(showAbove);
  };

  // закрытие при клике вне, скролле, ресайзе
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleScroll = () => setOpen(false);
    const handleResize = () => setOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (open) calculatePosition();
  }, [open]);

  const handleItemClick = (item) => {
    setOpen(false);
    onSelect?.(item);
  };

  const menuItems = options.filter((item) => item.visible !== false);

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transformOrigin: alignAbove ? "bottom" : "top",
      }}
    >
      <div className="py-1">
        {menuItems.map((item) => {
          const content = (
            <div
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              title={item.title || ""} // Tooltip
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.name}
            </div>
          );

          return item.url ? (
            <Link
              key={item.key}
              to={item.url}
              onClick={() => handleItemClick(item)}
              className="block"
            >
              {content}
            </Link>
          ) : (
            <button
              key={item.key}
              onClick={() => handleItemClick(item)}
              className="w-full text-left"
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div ref={buttonRef} onClick={() => setOpen((o) => !o)}>
        {button ? (
          button
        ) : (
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none"
          >
            Меню
            <svg
              className="ml-2 -mr-1 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {open && createPortal(menuContent, document.body)}
    </>
  );
}
