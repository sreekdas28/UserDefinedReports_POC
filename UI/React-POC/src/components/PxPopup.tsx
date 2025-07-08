import React, { useEffect, useRef } from 'react';
import { Align, Popup } from '@progress/kendo-react-popup';

interface PxPopupProps {
  show: boolean;
  anchor: HTMLElement | null;
  title?: string;
  children?: React.ReactNode;
  popupClassName?: string;
  onClose: () => void;
  popupClass?: string;
  anchorAlign?: Align;
  popupAlign?: Align;
}

const PxPopup: React.FC<PxPopupProps> = ({
  show,
  anchor,
  title,
  children,
  popupClassName,
  onClose,
  popupClass = 'common-popup',
  anchorAlign,
  popupAlign,
}) => {
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        anchor &&
        !anchor.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, anchor, onClose]);

  return (
    <Popup
      show={show}
      anchor={anchor}
      popupClass={popupClass}
      className={popupClassName}
      anchorAlign={anchorAlign}
      popupAlign={popupAlign}
      
      
    >
      <div ref={popupRef}>
        {title && <h4>{title}</h4>}
        <div>{children}</div>
      </div>
    </Popup>
  );
};

export default PxPopup;
 