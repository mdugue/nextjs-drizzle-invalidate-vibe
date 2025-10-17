"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const MAX_RENDER_COUNT = 100;

export default function RenderIndicator() {
  const [renderCount, setRenderCount] = useState(0);
  useEffect(() => {
    setRenderCount(() => Math.floor(Math.random() * MAX_RENDER_COUNT));
  }, []);
  return (
    <div>
      <Badge variant="secondary">R: {renderCount}</Badge>
    </div>
  );
}
