import React, { useRef, useEffect, useState, useCallback } from 'react';

interface MaskEditorProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
    onConfirm: (maskBase64: string) => void;
}

export const MaskEditor: React.FC<MaskEditorProps> = ({ isOpen, onClose, imageUrl, onConfirm }) => {
    const bgCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);
    const resizingRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number; } | null>(null);

    const [brushSize, setBrushSize] = useState(40);
    const [isLoading, setIsLoading] = useState(false);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [modalSize, setModalSize] = useState<{ width: string; height: string } | null>(null);

    const getCanvasContexts = useCallback(() => {
        const bgCanvas = bgCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;
        if (!bgCanvas || !drawingCanvas) return null;
        const bgCtx = bgCanvas.getContext('2d');
        const drawingCtx = drawingCanvas.getContext('2d');
        if (!bgCtx || !drawingCtx) return null;
        return { bgCanvas, bgCtx, drawingCanvas, drawingCtx };
    }, []);

    const clearDrawingCanvas = useCallback(() => {
        const contexts = getCanvasContexts();
        if (!contexts) return;
        const { drawingCanvas, drawingCtx } = contexts;
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    }, [getCanvasContexts]);

    useEffect(() => {
        if (!isOpen) {
            setModalSize(null); // Reset size on close
            return;
        }

        if (!imageUrl) return;

        const contexts = getCanvasContexts();
        const container = modalRef.current;
        if (!contexts || !container) return;

        const { bgCanvas, bgCtx, drawingCanvas } = contexts;

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;
        img.onload = () => {
            const imgAspectRatio = img.naturalWidth / img.naturalHeight;
            const availableWidth = container.clientWidth - 32; // padding
            const availableHeight = container.clientHeight - 150; // title, controls, etc.

            let canvasWidth = availableWidth;
            let canvasHeight = canvasWidth / imgAspectRatio;

            if (canvasHeight > availableHeight) {
                canvasHeight = availableHeight;
                canvasWidth = canvasHeight * imgAspectRatio;
            }

            bgCanvas.width = canvasWidth;
            bgCanvas.height = canvasHeight;
            drawingCanvas.width = canvasWidth;
            drawingCanvas.height = canvasHeight;
            
            bgCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            clearDrawingCanvas();
        };
    }, [isOpen, imageUrl, getCanvasContexts, clearDrawingCanvas, modalSize]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'b') setTool('brush');
            if (e.key.toLowerCase() === 'e') setTool('eraser');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const getMousePos = (canvas: HTMLCanvasElement, evt: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in evt) {
            clientX = (evt as TouchEvent).touches[0].clientX;
            clientY = (evt as TouchEvent).touches[0].clientY;
        } else {
            clientX = (evt as MouseEvent).clientX;
            clientY = (evt as MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) / rect.width * canvas.width,
            y: (clientY - rect.top) / rect.height * canvas.height,
        };
    };

    const draw = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDrawingRef.current || !lastPosRef.current) return;
        const contexts = getCanvasContexts();
        if (!contexts) return;
        const { drawingCanvas, drawingCtx } = contexts;
        e.preventDefault();
        
        const currentPos = getMousePos(drawingCanvas, e);
        drawingCtx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
        const brushColor = 'rgba(255, 0, 0, 0.6)';

        drawingCtx.beginPath();
        drawingCtx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        drawingCtx.lineTo(currentPos.x, currentPos.y);
        drawingCtx.strokeStyle = brushColor;
        drawingCtx.lineWidth = brushSize;
        drawingCtx.lineCap = 'round';
        drawingCtx.lineJoin = 'round';
        drawingCtx.stroke();
        
        lastPosRef.current = currentPos;
    }, [getCanvasContexts, brushSize, tool]);

    const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
        const contexts = getCanvasContexts();
        if (!contexts) return;
        const { drawingCanvas, drawingCtx } = contexts;
        e.preventDefault();

        isDrawingRef.current = true;
        const pos = getMousePos(drawingCanvas, e);
        lastPosRef.current = pos;
        
        drawingCtx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
        const brushColor = 'rgba(255, 0, 0, 0.6)';

        drawingCtx.beginPath();
        drawingCtx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
        drawingCtx.fillStyle = brushColor;
        drawingCtx.fill();
    }, [getCanvasContexts, brushSize, tool]);


    const stopDrawing = useCallback(() => {
        isDrawingRef.current = false;
        lastPosRef.current = null;
    }, []);

    const handleConfirm = () => {
        setIsLoading(true);
        const contexts = getCanvasContexts();
        if (!contexts) {
            setIsLoading(false);
            return;
        };
        const { drawingCanvas } = contexts;
        
        const drawingCtx = drawingCanvas.getContext('2d');
        if (!drawingCtx) {
            setIsLoading(false);
            return;
        }

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = drawingCanvas.width;
        maskCanvas.height = drawingCanvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        
        if (!maskCtx) {
            setIsLoading(false);
            return;
        }

        const imageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha > 0) {
                data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
            } else {
                data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
            }
            data[i + 3] = 255;
        }

        maskCtx.putImageData(imageData, 0, 0);

        const maskDataUrl = maskCanvas.toDataURL('image/png');
        const maskBase64 = maskDataUrl.split(',')[1];
        
        onConfirm(maskBase64);
        setIsLoading(false);
    };

    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (!resizingRef.current) return;
        const { startX, startY, startWidth, startHeight } = resizingRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        setModalSize({
            width: `${Math.max(450, startWidth + dx)}px`,
            height: `${Math.max(450, startHeight + dy)}px`,
        });
    }, []);

    const handleResizeEnd = useCallback(() => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
        resizingRef.current = null;
    }, [handleResizeMove]);

    const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!modalRef.current) return;
        resizingRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startWidth: modalRef.current.offsetWidth,
            startHeight: modalRef.current.offsetHeight,
        };
        window.addEventListener('mousemove', handleResizeMove);
        window.addEventListener('mouseup', handleResizeEnd);
    }, [handleResizeMove, handleResizeEnd]);
    
    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [handleResizeMove, handleResizeEnd]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
            <div 
                ref={modalRef}
                style={modalSize ? { width: modalSize.width, height: modalSize.height } : {}}
                className="bg-[#2a0000] p-4 rounded-2xl shadow-xl border-2 border-teal-500/30 w-full max-w-2xl min-h-[450px] min-w-[450px] transform transition-all flex flex-col relative" 
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4 text-white text-center flex-shrink-0">Tô vào vùng cần làm sạch</h2>
                <div className="relative w-full h-full flex items-center justify-center flex-grow my-2">
                    <canvas ref={bgCanvasRef} className="rounded-lg absolute" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    <canvas
                        ref={drawingCanvasRef}
                        className="absolute cursor-crosshair"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                        onMouseDown={(e) => startDrawing(e.nativeEvent)}
                        onMouseMove={(e) => draw(e.nativeEvent)}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={(e) => startDrawing(e.nativeEvent as unknown as TouchEvent)}
                        onTouchMove={(e) => draw(e.nativeEvent as unknown as TouchEvent)}
                        onTouchEnd={stopDrawing}
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2" title="Phím tắt: B">
                            <button onClick={() => setTool('brush')} className={`p-2 rounded-full ${tool === 'brush' ? 'bg-amber-600 ring-2 ring-amber-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                            </button>
                         </div>
                         <div className="flex items-center gap-2" title="Phím tắt: E">
                             <button onClick={() => setTool('eraser')} className={`p-2 rounded-full ${tool === 'eraser' ? 'bg-amber-600 ring-2 ring-amber-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z" clipRule="evenodd" /></svg>
                            </button>
                         </div>
                        <label htmlFor="brushSize" className="font-semibold">Cỡ bút:</label>
                        <input
                            id="brushSize"
                            type="range"
                            min="5"
                            max="80"
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                            className="w-24 sm:w-32"
                        />
                        <span className="w-8 text-center">{brushSize}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={clearDrawingCanvas} className="font-semibold bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors">
                            Xóa hết
                        </button>
                         <button onClick={onClose} className="font-semibold bg-red-800 hover:bg-red-900 text-white py-2 px-4 rounded-lg transition-colors">
                            Hủy
                        </button>
                        <button onClick={handleConfirm} disabled={isLoading} className="font-bold bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white py-2 px-6 rounded-lg shadow-md transition-all disabled:opacity-50">
                            {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                    </div>
                </div>
                <div className="resize-handle" onMouseDown={handleResizeStart}></div>
            </div>
        </div>
    );
};