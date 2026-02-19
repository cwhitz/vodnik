import type { LoreItem } from "../../types/generation";

type LoreManagerProps = {
  isOpen: boolean;
  onClose: () => void;
  loreItems: LoreItem[];
  setLoreItems: (items: LoreItem[]) => void;
};

export default function LoreManager({
  isOpen,
  onClose,
  loreItems,
  setLoreItems,
}: LoreManagerProps) {
  const addLoreItem = () => {
    setLoreItems([
      ...loreItems,
      { id: Date.now(), category: "character", text: "" },
    ]);
  };

  const updateLoreItem = (
    id: number,
    field: keyof LoreItem,
    value: string
  ) => {
    setLoreItems(
      loreItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteLoreItem = (id: number) => {
    setLoreItems(loreItems.filter((item) => item.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-neutral-900 p-6 rounded-xl w-2/3 max-h-[80vh] overflow-y-auto relative border border-neutral-700">
        <button
          className="absolute top-3 right-3 p-0 text-[#6a6ec3]/50 hover:text-[#6a6ec3] text-sm"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-neutral-200 text-2xl mb-6">Lore Manager</h2>

        <div className="space-y-4 mb-6">
          {loreItems.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-800 p-4 rounded-lg border border-neutral-700"
            >
              <div className="flex gap-4 mb-3">
                <select
                  value={item.category}
                  onChange={(e) =>
                    updateLoreItem(
                      item.id,
                      "category",
                      e.target.value as LoreItem["category"]
                    )
                  }
                  className="bg-neutral-700 text-neutral-200 px-3 py-2 rounded border border-neutral-600 focus:outline-none focus:border-neutral-500"
                >
                  <option value="character">Character</option>
                  <option value="setting">Setting</option>
                  <option value="plot point">Plot Point</option>
                </select>

                <button
                  onClick={() => deleteLoreItem(item.id)}
                  className="ml-auto text-red-400/50 hover:text-red-400 px-3 py-1 text-sm"
                >
                  Delete
                </button>
              </div>

              <textarea
                value={item.text}
                onChange={(e) => updateLoreItem(item.id, "text", e.target.value)}
                placeholder="Enter backstory details..."
                className="w-full h-24 p-3 bg-neutral-700 text-neutral-200 rounded border border-neutral-600 resize-none focus:outline-none focus:border-neutral-500"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={addLoreItem} className="hacker-button flex-1">
            Add Lore Item
          </button>

          <button onClick={onClose} className="hacker-button flex-1">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
