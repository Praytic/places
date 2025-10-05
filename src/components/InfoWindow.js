import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

const InfoWindowComponent = ({ map, position, onClose, children }) => {
    const infoWindowRef = useRef(null);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        // Create content div
        const contentDiv = document.createElement('div');

        // Create InfoWindow
        infoWindowRef.current = new window.google.maps.InfoWindow({
            content: contentDiv,
            position: position,
            pixelOffset: new window.google.maps.Size(0, -30),
            disableAutoPan: false,
            maxWidth: 0
        });

        // Render React content into the div
        rootRef.current = createRoot(contentDiv);
        rootRef.current.render(children);

        // Add close listener
        infoWindowRef.current.addListener('closeclick', onClose);

        // Open the InfoWindow
        infoWindowRef.current.open(map);

        // Cleanup
        return () => {
            if (rootRef.current) {
                rootRef.current.unmount();
            }
            if (infoWindowRef.current) {
                window.google.maps.event.clearInstanceListeners(infoWindowRef.current);
                infoWindowRef.current.close();
            }
        };
    }, [map, position, onClose]);

    // Update content when children change
    useEffect(() => {
        if (rootRef.current) {
            rootRef.current.render(children);
        }
    }, [children]);

    return null;
};

export default InfoWindowComponent;
