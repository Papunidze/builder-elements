import React, { useState, useEffect } from "react";

const Button = () => {
  const [count, setCount] = useState<Number>(20);
  const handleClick = () => {
    setCount((prev) => prev + 1);
  };
  useEffect(() => {
    console.log("Work ");
  }, [count]);

  return (
    <div>
      <button
        onClick={handleClick}
        style={{
          width: "50px",
          height: "50px",
          background: "black",
          color: "red",
        }}
      >
        {count}
      </button>
    </div>
  );
};

export default Button;
