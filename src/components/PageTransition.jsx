import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const [displayClass, setDisplayClass] = useState('page-enter');
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);

  useEffect(() => {
    // Trigger exit animation
    setDisplayClass('page-leave');

    const timeoutId = setTimeout(() => {
      // Trigger enter animation after exit
      setDisplayClass('page-enter');
      prevLocationRef.current = location.pathname;
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return (
    <div className={`page-transition ${displayClass}`}>
      {children}
    </div>
  );
};

export default PageTransition;