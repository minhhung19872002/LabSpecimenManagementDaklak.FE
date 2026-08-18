import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeValueProps {
  value: string;
  displayValue?: boolean;
}

const BarcodeValue: React.FC<BarcodeValueProps> = ({ value, displayValue = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        width: 2,
        height: 60,
        margin: 4,
        fontSize: 14,
        displayValue,
      });
    } catch {
      svgRef.current.replaceChildren();
    }
  }, [value]);

  return (
    <div className="barcode-value-wrapper" style={{ maxWidth: "100%", overflowX: "auto" }}>
      <svg
        ref={svgRef}
        aria-label={`Barcode ${value}`}
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </div>
  );
};

export default BarcodeValue;
