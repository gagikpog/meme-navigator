import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const itemsData = new Map([
  ["all", { className: "bg-gray-900", text: "Все", textShort: 'Все' }],
  ["public", { className: "bg-green-600", text: "Публичные", textShort: 'Публ.' }],
  ["private", { className: "bg-red-600", text: "Приватные", textShort: 'Прив.' }],
  ["self", { className: "bg-blue-600", text: "Мои", textShort: 'Мои' }],
  ["moderate", { className: "bg-yellow-600", text: "Модерация", textShort: 'Модер.' }],
]);

function ItemRender({changePerm, item, value}: {
  changePerm: (value: string) => void,
  item: string,
  value: string
}) {

  const currentItem = itemsData.get(item);

  return (
    <button type="button" onClick={() => changePerm(item)} className={`px-3 py-1 rounded-full ${
      item === value
        ? `${currentItem?.className} text-white`
        : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    <span className="hidden sm:inline">{currentItem?.text}</span>
    <span className="sm:hidden">{currentItem?.textShort}</span>
  </button>
  );
}

export default function usePermFilter(): [ReactElement | boolean, string, (value: string) => void] {
  const { canFilter, hasModeratorAccess } = useAuth();

  const validValues = useMemo(() => {
    if (!canFilter()) {
      return [];
    }
    const values = ["all"];

    if (hasModeratorAccess()) {
      values.push("public", "private");
    }
    values.push("self", "moderate");
    return values;
  }, [canFilter, hasModeratorAccess]);

  const normalize = useCallback(
    (val: string) => (validValues.includes(val) ? val : "all"),
    [validValues]
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const [perm, setPerm] = useState(() =>
    normalize(searchParams.get("perm") || "all")
  );

  // Keep state in sync when navigation changes query
  useEffect(() => {
    const q = normalize(searchParams.get("perm") || "all");
    if (q !== perm) setPerm(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update query preserving other params
  const changePerm = useCallback(
    (value: string) => {
      const next = normalize(value || "all");
      setPerm(next);
      const params = new URLSearchParams(searchParams);
      if (next === "all") params.delete("perm");
      else params.set("perm", next);
      setSearchParams(params);
    },
    [searchParams, setSearchParams, normalize]
  );

  const content = canFilter() && (
    <div className="mb-2 flex items-center gap-2">
      <span className="text-xs text-gray-500">Статус:</span>
      <div className="inline-flex rounded-full border bg-white p-0.5 text-xs shadow-sm">
        {
          validValues.map((item) => {
            return <ItemRender key={item} changePerm={changePerm} item={item} value={perm} />
          })
        }
      </div>
    </div>
  );

  return [content, perm, changePerm];
}
