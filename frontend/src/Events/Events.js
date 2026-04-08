import React from 'react';
import { useNavigate } from 'react-router-dom';

const Events = () => {
  const navigate = useNavigate();

  // Redirect to special-events
  React.useEffect(() => {
    navigate('/events/special-events');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Redirecting to Events...</p>
      </div>
    </div>
  );
};

export default Events;
