import React from 'react';
import { MapView } from '../shared/types';
import { updateMapViewDisplayName } from '../services/MapViewService';
import {
  BaseDialogLayout,
  BaseManageDialogConfig,
  BaseManageDialogProps,
  useBaseManageDialog
} from './BaseManageDialog';

interface ManageViewDialogProps extends BaseManageDialogProps {
  mapView: MapView;
  onMapViewEdited?: (mapView: MapView) => void;
}

const ManageViewDialog: React.FC<ManageViewDialogProps> = ({
  mapView,
  onClose,
  onMapViewEdited
}) => {
  const [state, { setName, setError, setUpdating }] = useBaseManageDialog(mapView.name);

  const config: BaseManageDialogConfig = {
    title: 'Edit Map Name',
    initialName: mapView.name,
    canDelete: false,
    showCollaborators: false
  };

  const handleSave = async () => {
    try {
      setError(null);
      setUpdating(true);

      await updateMapViewDisplayName({
        mapId: mapView.mapId,
        collaborator: mapView.collaborator,
        name: state.name.trim()
      });

      const updatedMapView = { ...mapView, name: state.name.trim() };
      onMapViewEdited && onMapViewEdited(updatedMapView);
      onClose();
    } catch (err) {
      setError('Failed to update map name. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <BaseDialogLayout
      config={config}
      state={state}
      onNameChange={setName}
      onSave={handleSave}
      onCancel={handleCancel}
      setError={setError}
    />
  );
};

export default ManageViewDialog;
