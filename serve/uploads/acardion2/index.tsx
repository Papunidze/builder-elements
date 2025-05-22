import React, { useState } from "react";
import "./acardion.css";

type AccordionItem = {
  title: string;
  content: string;
};

type AccordionProps = {
  items: AccordionItem[];
};

const accordionData = [
  { title: "Section 1", content: "Content for section 1" },
  { title: "Section 2", content: "Content for section 2" },
  { title: "Section 3", content: "Content for section 3" },
];

const Accordion: React.FC<AccordionProps> = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div>
      {accordionData.map((item, index) => (
        <div key={index}>
          <button
            onClick={() => toggleIndex(index)}
            style={{ width: "100%", textAlign: "left" }}
          >
            {item.title}
          </button>
          {activeIndex === index && (
            <div style={{ padding: "0.5rem 1rem", border: "1px solid #ccc" }}>
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Accordion;
