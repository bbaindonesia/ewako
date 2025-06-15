
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from './ui/Card';

interface ServiceWidgetProps {
  title: string;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>; // Expect an SVG-compatible ReactElement
  linkTo: string;
  description?: string;
}

export const ServiceWidget: React.FC<ServiceWidgetProps> = ({ title, icon, linkTo, description }) => {
  return (
    <Link to={linkTo} className="block group">
      <Card className="bg-gray-800 hover:bg-gray-700 transition-all duration-300 ease-in-out transform group-hover:scale-105">
        <div className="flex flex-col items-center text-center p-4">
          <div className="mb-3 text-yellow-500 group-hover:text-yellow-400 transition-colors duration-300">
            {React.cloneElement(icon, { className: "h-12 w-12" })}
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          {description && <p className="text-sm text-gray-400">{description}</p>}
        </div>
      </Card>
    </Link>
  );
};
