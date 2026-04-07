import { useState, useRef, useCallback, useEffect } from "react";
import { Stage, Layer, Line } from "react-konva";
import { Download, Undo2, Redo2, Trash2 } from "lucide-react";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import type { LineCap, LineJoin } from "konva/lib/Shape";

interface LineData {
  tool: string;
  points: number[];
  color: string;
  brushSize: number;
}

const DrawingCanvas = () => {
  const [tool, setTool] = useState("pen");
  const [lines, setLines] = useState<LineData[]>([]);
  const [history, setHistory] = useState<LineData[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const isDrawing = useRef(false);
  const stageRef = useRef<Konva.Stage>(null);

  const brushTypes = [
    { name: "pen", label: "Pen", strokeWidth: 1 },
    { name: "brush", label: "Brush", strokeWidth: 1 },
    { name: "marker", label: "Marker", strokeWidth: 1.5 },
    { name: "spray", label: "Spray", strokeWidth: 0.5 },
  ];

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
  ];

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    const newLine = {
      tool,
      points: [pos?.x || 0, pos?.y || 0],
      color,
      brushSize,
    };

    const newLines = [...lines, newLine];
    setLines(newLines);

    // Update history
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newLines);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition() || { x: 0, y: 0 };
    const lastLine = lines[lines.length - 1];

    lastLine.points = lastLine.points.concat([point.x, point.y]);

    const newLines = lines.slice();
    newLines[newLines.length - 1] = lastLine;
    setLines(newLines);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleUndo = useCallback(() => {
    if (historyStep === 0) return;
    const newStep = historyStep - 1;
    setHistoryStep(newStep);
    setLines(history[newStep] || []);
  }, [history, historyStep]);

  const handleRedo = useCallback(() => {
    if (historyStep >= history.length - 1) return;
    const newStep = historyStep + 1;
    setHistoryStep(newStep);
    setLines(history[newStep]);
  }, [history, historyStep]);

  const handleClear = () => {
    if (lines.length === 0) return;
    setLines([]);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleDownload = () => {
    const uri = stageRef.current?.toDataURL() || "";
    const link = document.createElement("a");
    link.download = "my-drawing.png";
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLineProps = (line: LineData) => {
    const baseProps = {
      points: line.points,
      stroke: line.color,
      strokeWidth: line.brushSize,
      tension: 0.5,
      lineCap: "round" as LineCap,
      lineJoin: "round" as LineJoin,
    };

    switch (line.tool) {
      case "pen":
        return { ...baseProps, strokeWidth: line.brushSize };
      case "brush":
        return { ...baseProps, strokeWidth: line.brushSize * 2, opacity: 0.8 };
      case "marker":
        return { ...baseProps, strokeWidth: line.brushSize * 3, opacity: 0.6 };
      case "spray":
        return {
          ...baseProps,
          strokeWidth: line.brushSize * 0.3,
          opacity: 0.3,
        };
      default:
        return baseProps;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();

          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white shadow-md p-2 md:p-4">
        <div className="max-w-7xl mx-auto space-y-2 md:space-y-4">
          {/* Brush Types */}
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <span className="font-semibold text-gray-700">Brush:</span>
            {brushTypes.map((brush) => (
              <button
                key={brush.name}
                onClick={() => setTool(brush.name)}
                className={`px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg transition-colors ${
                  tool === brush.name
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {brush.label}
              </button>
            ))}
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <span className="font-semibold text-gray-700">Color:</span>
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-lg transition-transform hover:scale-110 ${
                  color === c ? "ring-4 ring-blue-500" : "ring-2 ring-gray-300"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 md:w-10 md:h-10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Brush Size */}
          <div className="flex items-center gap-2 md:gap-4">
            <span className="font-semibold text-gray-700">Size:</span>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-32 md:w-64"
            />
            <span className="text-gray-600 w-12 text-sm md:text-base">
              {brushSize}px
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleUndo}
              disabled={historyStep < 1}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <Undo2 size={18} />
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={historyStep >= history.length - 1}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <Redo2 size={18} />
              Redo
            </button>
            <button
              onClick={handleClear}
              disabled={lines.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm md:text-base"
            >
              <Trash2 size={18} />
              Clear
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 ml-auto text-sm md:text-base"
            >
              <Download size={18} />
              Download.
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-auto min-h-0">
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          ref={stageRef}
          className="bg-white rounded-lg shadow-2xl cursor-crosshair"
        >
          <Layer>
            {lines.map((line, i) => (
              <Line key={i} {...getLineProps(line)} />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default DrawingCanvas;
