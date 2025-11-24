import React, { useRef, useEffect, useMemo, useState, useImperativeHandle, forwardRef } from 'react';

interface ImageUploaderProps {
  onFilesChange: (files: File[]) => void;
  imageFiles: File[];
  multiple?: boolean;
  maxFiles?: number;
  aspectRatioClass?: string;
  largePreview?: boolean;
  sourceImagePool?: {
      urls: string[];
      selectedIndex: number;
  } | null;
  onSourceImageSelect?: (index: number) => void;
  // FIX: Added the 't' prop to resolve type errors when passing it from App.tsx.
  t: (key: any) => string;
}


export interface ImageUploaderHandles {
  triggerUpload: () => void;
}

export const ImageUploader = forwardRef<ImageUploaderHandles, ImageUploaderProps>(({ 
    onFilesChange,
    imageFiles, 
    multiple = false, 
    maxFiles = 4, 
    aspectRatioClass = 'aspect-[3/4]',
    largePreview = false,
    sourceImagePool,
    onSourceImageSelect,
    t,
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewDimensions, setPreviewDimensions] = useState<{ [key: number]: { width: string; height: string } }>({});
  const resizingRef = useRef<{ index: number; startX: number; startY: number; startWidth: number; startHeight: number; } | null>(null);
  const imageContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageCountRef = useRef(imageFiles.length);
  imageCountRef.current = imageFiles.length;

  useImperativeHandle(ref, () => ({
    triggerUpload: () => {
      fileInputRef.current?.click();
    }
  }));

  // Reset dimensions when file list changes
  useEffect(() => {
    setPreviewDimensions({});
    imageContainerRefs.current = imageContainerRefs.current.slice(0, imageFiles.length);
  }, [imageFiles]);


  // This effect manages the object URLs for previews
  useEffect(() => {
    const urls: string[] = imageFiles.map(file => URL.createObjectURL(file));
    
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  const gridClasses = useMemo(() => {
    if (largePreview) {
        if (imageFiles.length === 1 && !multiple) {
            return 'grid-cols-1';
        }
        return 'grid-cols-1 sm:grid-cols-2';
    }
    return 'grid-cols-2 sm:grid-cols-4';
  }, [largePreview, imageFiles.length, multiple]);
  
  const handleUploaderClick = () => {
    fileInputRef.current?.click();
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    // Clear the input value to allow re-uploading the same file
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }

    if (!selectedFiles.length) {
        // User cancelled the file picker
        return;
    }
    
    if (multiple) {
      const combined = [...imageFiles, ...selectedFiles];
      onFilesChange(combined.slice(0, maxFiles));
    } else {
      onFilesChange([selectedFiles[0]]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const droppedFiles = Array.from(event.dataTransfer.files || []).filter((f: File) => f.type.startsWith('image/'));
    if (!droppedFiles.length) return;
    
    if (multiple) {
      const combined = [...imageFiles, ...droppedFiles];
      onFilesChange(combined.slice(0, maxFiles));
    } else {
      onFilesChange([droppedFiles[0]]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleRemove = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    const newFiles = imageFiles.filter((_, index) => index !== indexToRemove);
    onFilesChange(newFiles);
  };
  
  const rotateImage = (file: File): Promise<File> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error('Could not get canvas context'));
            return;
          }

          canvas.width = img.height;
          canvas.height = img.width;

          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(Math.PI / 2); // 90 degrees clockwise
          ctx.drawImage(img, -img.width / 2, -img.height / 2);

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            const rotatedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(rotatedFile);
          }, file.type);
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        }
      });
  };

  const handleRotate = async (e: React.MouseEvent, indexToRotate: number) => {
    e.stopPropagation();
    const fileToRotate = imageFiles[indexToRotate];
    if (!fileToRotate) return;

    try {
        const rotatedFile = await rotateImage(fileToRotate);
        const newFiles = [...imageFiles];
        newFiles[indexToRotate] = rotatedFile;
        onFilesChange(newFiles);
    } catch (error) {
        console.error("Failed to rotate image:", error);
    }
  };

  // --- Resize Logic ---
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;

    const { startX, startWidth, startHeight } = resizingRef.current;

    if (startHeight <= 0) {
      return;
    }

    const dx = e.clientX - startX;
    
    let newWidth = startWidth + dx;
    if (newWidth < 80) {
        newWidth = 80;
    }

    const aspectRatio = startWidth / startHeight;
    const newHeight = newWidth / aspectRatio;
    
    // FIX: A stale closure in this event handler could prevent all image
    // previews from being resized simultaneously. Using a ref (`imageCountRef`)
    // that is updated on every render ensures this handler always knows the
    // correct number of images, allowing all previews to be resized in sync.
    setPreviewDimensions(() => {
        const newDimensions: { [key: number]: { width: string; height: string } } = {};
        const numImages = imageCountRef.current;
        for (let i = 0; i < numImages; i++) {
            newDimensions[i] = {
                width: `${newWidth}px`,
                height: `${newHeight}px`,
            };
        }
        return newDimensions;
    });
  };
  
  const handleResizeEnd = () => {
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
    resizingRef.current = null;
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    const container = imageContainerRefs.current[index];
    if (!container) return;

    resizingRef.current = {
      index,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: container.offsetWidth,
      startHeight: container.offsetHeight,
    };
    
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };
  
  // Cleanup effect for resize listeners
  useEffect(() => {
    return () => {
        // Ensure listeners are removed if component unmounts during a resize
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
    }
  }, []);
  // --- End Resize Logic ---

  const uploaderBoxStyle = previewDimensions[0] ? { width: previewDimensions[0].width, height: previewDimensions[0].height } : {};

  if (imageFiles.length > 0) {
    // We have active files (either uploaded or selected from the source pool).
    // Display their previews.
    return (
        <div className="w-full">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" multiple={multiple} className="hidden" />
            <div className={`grid ${gridClasses} gap-4`}>
                {imageFiles.map((file, index) => {
                    const dimensions = previewDimensions[index];
                    const style = dimensions ? { width: dimensions.width, height: dimensions.height } : {};
                    return (
                        <div key={`${file.name}-${index}`} ref={el => { imageContainerRefs.current[index] = el; }} className={`relative group ${!dimensions ? aspectRatioClass : ''}`} style={style}>
                            <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} className="w-full h-full object-contain rounded-md" />
                            
                            {/* Always-visible remove button */}
                            <button onClick={(e) => handleRemove(e, index)} className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full p-1.5 transition-all duration-200 z-10" title="Xóa ảnh">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            </button>
                            
                            {/* Hover controls container */}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button onClick={(e) => handleRotate(e, index)} className="text-white p-2 rounded-full hover:bg-white/20 transition-colors" title="Xoay ảnh 90 độ">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>
                                </button>
                                {/* Remove button has been moved out to be always visible */}
                            </div>
                            <div className="resize-handle opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeStart(e, index)}></div>
                        </div>
                    );
                })}
                {multiple && imageFiles.length < maxFiles && (
                    <div className={`w-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center p-4 text-center hover:border-red-500 transition-colors bg-[#530303] ${!previewDimensions[0] ? aspectRatioClass : ''}`} style={uploaderBoxStyle} onDrop={handleDrop} onDragOver={handleDragOver} onClick={handleUploaderClick}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        <p className="text-xs font-semibold text-gray-400 mt-2">Thêm ảnh khác</p>
                    </div>
                )}
            </div>
        </div>
    );
  }

  // Default state: no active files. Show the uploader AND the source pool (if available).
  return (
    <div className="w-full space-y-4">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" multiple={multiple} className="hidden" />
        
        {/* Main Upload Box */}
        <div 
            className="w-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center p-4 text-center hover:border-red-500 transition-colors bg-[#530303] min-h-[160px] cursor-pointer" 
            onDrop={handleDrop} 
            onDragOver={handleDragOver} 
            onClick={handleUploaderClick}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="font-semibold text-gray-300">Nhấp hoặc kéo thả ảnh vào đây</p>
            <p className="text-xs text-gray-400 mt-1">Hỗ trợ PNG, JPG, WEBP</p>
        </div>

        {/* Source Image Pool (Optional) */}
        {sourceImagePool && sourceImagePool.urls.length > 0 && onSourceImageSelect && (
            <div>
                <h3 className="text-sm font-semibold mb-2 text-center text-amber-300">Hoặc chọn từ kết quả đã tạo</h3>
                <div className={`grid ${largePreview ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} gap-2`}>
                    {sourceImagePool.urls.map((url, index) => (
                        <div 
                            key={index} 
                            className={`relative group cursor-pointer ${aspectRatioClass} rounded-md overflow-hidden ring-2 ${sourceImagePool.selectedIndex === index ? 'ring-amber-400 scale-105' : 'ring-transparent'} hover:ring-amber-300 transition-all duration-200`}
                            onClick={() => onSourceImageSelect(index)}
                        >
                            <img src={url} alt={`Source ${index + 1}`} className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                <p className="text-white font-bold text-center text-sm">Chọn ảnh này</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
});