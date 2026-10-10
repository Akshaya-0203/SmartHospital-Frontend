import React from 'react';

export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <h2 className="text-2xl font-bold text-textPrimary mb-2">{title}</h2>
      <p className="text-textSecondary max-w-md">
        This feature is currently under construction. 
        It will be connected to the backend API once the endpoints are fully available and tested.
      </p>
    </div>
  );
}
