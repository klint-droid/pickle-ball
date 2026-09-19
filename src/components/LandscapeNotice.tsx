import React from 'react';
import { Smartphone } from 'lucide-react';

export const LandscapeNotice: React.FC = () => {
  return (
    <div className="rotate-device-prompt">
      <div className="rotate-icon-wrapper">
        <Smartphone size={44} className="rotate-phone-icon" />
      </div>
      <h3>ROTATE YOUR DEVICE</h3>
      <p>Please rotate your phone or tablet to landscape mode for the court view!</p>
    </div>
  );
};
