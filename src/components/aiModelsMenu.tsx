import * as React from 'react';

interface Model {
  name: string;
  description: string;
}

interface AiModelsMenuProps {
  isOpen: boolean;
  selectedModel: string;
  onSelect: (model: string) => void;
}

const AiModelsMenu: React.FC<AiModelsMenuProps> = ({ isOpen, selectedModel, onSelect }) => {
  if (!isOpen) return null;
  const models: Model[] = [
    { name: '4o-mini', description: 'Great for low complex tasks' },
    { name: 'o1-mini', description: 'Great for medium complex tasks' },
    { name: 'DeepSeek R1', description: 'Great for complex tasks' }, // Updated from 'DeepSeek R1'
    { name: 'Gemini 2.0 Flash', description: 'Great for understanding context' },
    
  ];
  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      className="absolute top-full left-0 mt-4 w-64 py-4 bg-white border border-gray-300 shadow-lg rounded-xl z-10 font-normal"
    >
      <ul className="space-y-1">
        <li className="px-4 py-2 mx-1 text-sm text-black">
          Model
        </li>
        {models.map((model) => (
          <li
            key={model.name}
            className="flex justify-between items-center px-4 py-2 mx-1 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-100"
            onClick={() => onSelect(model.name)}
          >
            <div className="flex flex-col">
              <span className="text-sm">{model.name}</span>
              <span className="text-xs text-gray-500">{model.description}</span>
            </div>
            {selectedModel === model.name && (
              <img
                src="https://cdn-icons-png.flaticon.com/128/11340/11340853.png"
                width="18"
                height="18"
                alt="selected model icon"
                className="ml-2"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AiModelsMenu;
