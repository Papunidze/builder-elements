import React from "react";

interface TestProps {
  message?: string;
}

const Test: React.FC<TestProps> = ({ message = "Hello from test.tsx" }) => {
  return (
    <div className="test-container">
      <h1>{message}</h1>
    </div>
  );
};

export default Test;
