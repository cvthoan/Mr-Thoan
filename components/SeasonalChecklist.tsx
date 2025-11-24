import React from 'react';

interface PromptItem {
  title: string;
  description: string;
  prompt: string;
}

interface PromptSection {
  season: string;
  items: PromptItem[];
}

interface SeasonalChecklistProps {
  promptsData: PromptSection[];
  onPromptSelect: (prompt: string) => void;
  selectedPrompt?: string;
  // FIX: Added the 't' prop to resolve type errors when passing it from App.tsx.
  t: (key: any) => string;
}

export const SeasonalChecklist: React.FC<SeasonalChecklistProps> = ({ promptsData, onPromptSelect, selectedPrompt, t }) => {
  return (
    <div className="max-h-60 overflow-y-auto bg-[#100303] p-3 rounded-lg border border-gray-700 space-y-4">
        {promptsData.map((section, sectionIndex) => (
            <div key={sectionIndex}>
                <h4 className="font-bold text-cyan-300 bg-[#1d0505] p-2 rounded-md sticky top-0 z-10">{section.season}</h4>
                <div className="mt-2 space-y-2 pl-2">
                    {section.items.map((item, itemIndex) => {
                        const isSelected = item.prompt === selectedPrompt;
                        return (
                            <button
                                key={itemIndex}
                                onClick={() => onPromptSelect(item.prompt)}
                                className={`w-full text-left p-2 rounded-md transition-colors duration-200 ${
                                    isSelected 
                                    ? 'bg-amber-600 ring-2 ring-amber-400' 
                                    : 'bg-gray-800/50 hover:bg-gray-700/70'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-200'}`}>{item.title}</p>
                                        <p className={`text-xs ${isSelected ? 'text-amber-100' : 'text-gray-400'}`}>{item.description}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="ml-2 flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        ))}
    </div>
  );
};