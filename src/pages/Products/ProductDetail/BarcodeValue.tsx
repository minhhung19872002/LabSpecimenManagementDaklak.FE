import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeValueProps {
  value: string;
}

const BarcodeValue: React.FC<BarcodeValueProps> = ({ value }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        width: 1.2,
        height: 32,
        margin: 2,
        fontSize: 10,
        displayValue: true,
      });
    } catch {
      svgRef.current.replaceChildren();
    }
  }, [value]);

  return (
    <div style={{ maxWidth: "100%", overflowX: "auto" }}>
      <svg
        ref={svgRef}
        aria-label={`Barcode ${value}`}
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </div>
  );
};

export default BarcodeValue;
