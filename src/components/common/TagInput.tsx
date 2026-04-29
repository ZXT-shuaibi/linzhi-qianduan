import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import styles from "./TagInput.module.css";

type TagInputProps = {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
};

const TagInput = ({ id, value, onChange, placeholder, className }: TagInputProps) => {
  const [text, setText] = useState("");

  const addTag = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    if (value.includes(next)) {
      setText("");
      return;
    }
    onChange([...value, next]);
    setText("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag(text);
    } else if (event.key === "Backspace" && text === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  const removeTag = (target: string) => {
    onChange(value.filter((item) => item !== target));
  };

  return (
    <div className={`${styles.container} ${className ?? ""}`.trim()}>
      <input
        id={id}
        className={styles.input}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "输入标签后按回车添加"}
      />
      {value.length > 0 ? (
        <div className={styles.chips}>
          {value.map((tag, index) => (
            <span className={styles.chip} key={`${tag}-${index}`}>
              <span className={styles.chipText}>{tag}</span>
              <button
                type="button"
                className={styles.remove}
                aria-label={`移除 ${tag}`}
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default TagInput;
