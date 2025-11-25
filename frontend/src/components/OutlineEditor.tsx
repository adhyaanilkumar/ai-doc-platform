interface OutlineEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  label: string;
}

const OutlineEditor = ({ items, onChange, placeholder, label }: OutlineEditorProps) => {
  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const removeItem = (index: number) => {
    const next = items.filter((_, idx) => idx !== index);
    onChange(next);
  };

  return (
    <div className="card">
      <h3>{label}</h3>
      {items.map((item, idx) => (
        <div
          key={`outline-${idx}`}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <input
            value={item}
            placeholder={`${placeholder} ${idx + 1}`}
            onChange={(event) => updateItem(idx, event.target.value)}
          />
          <button className="button secondary" type="button" onClick={() => removeItem(idx)}>
            Remove
          </button>
        </div>
      ))}
      <button className="button primary" type="button" style={{ marginTop: 16 }} onClick={() => onChange([...items, ""])}>
        Add {placeholder}
      </button>
    </div>
  );
};

export default OutlineEditor;

