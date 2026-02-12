import React from 'react';
import { Card } from '@/components/ui/card';

const IframePage: React.FC = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-133px)]">
      <Card className="flex-1 rounded-none border-none !p-0">
        <iframe
          src="https://citywill.github.io/pocket-stack"
          className="w-full h-full border-none"
          title="Iframe Example"
        />
      </Card>
    </div>
  );
};

export default IframePage;
